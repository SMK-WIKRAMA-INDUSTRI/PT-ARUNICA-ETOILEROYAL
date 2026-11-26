-- Supabase schema for ÉTOILE ROYALE chat sessions, accounts, orders and bookings
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every object uses IF NOT EXISTS / DROP POLICY IF EXISTS.

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  lang text not null default 'EN',
  currency text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  recommended_ids text[] default '{}',
  provider text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx
  on public.chat_messages(session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "users own sessions" on public.chat_sessions;
create policy "users own sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users own messages" on public.chat_messages;
create policy "users own messages"
  on public.chat_messages for all
  using (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_sessions_touch on public.chat_sessions;
create trigger chat_sessions_touch
  before update on public.chat_sessions
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- Accounts and roles
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER avoids an RLS recursion when an admin reads other profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

drop policy if exists "profiles: read self or admin" on public.profiles;
create policy "profiles: read self or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Every new auth user (including anonymous chat users) gets a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'guest'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Promote a real account to admin after signing up:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@etoileroyale.lu');
-- Guests can order without an account; bookings (a long-term arrangement) require one.


-- ─────────────────────────────────────────────────────────────────────────────
-- Orders (guest checkout is allowed: user_id is nullable)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal_idr integer not null default 0,
  display_currency text not null default 'IDR',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'demo-paid', 'failed', 'served', 'cancelled')),
  payment_provider text not null default 'midtrans',
  midtrans_order_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
alter table public.orders enable row level security;

drop policy if exists "orders: members create own" on public.orders;
create policy "orders: members create own"
  on public.orders for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "orders: guests create" on public.orders;
create policy "orders: guests create"
  on public.orders for insert to anon
  with check (user_id is null);

drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- Bookings (signed-in members only)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  booking_date date not null,
  booking_time text not null,
  guests text not null,
  seating text not null,
  dish_id text,
  notes text,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
alter table public.bookings enable row level security;

drop policy if exists "bookings: members create own" on public.bookings;
create policy "bookings: members create own"
  on public.bookings for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "bookings: read own or admin" on public.bookings;
create policy "bookings: read own or admin"
  on public.bookings for select to authenticated
  using (user_id = auth.uid() or public.is_admin());


-- Optional: let the Node proxy (server.mjs) write payment statuses on webhook.
-- Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server only (never VITE_).


-- ─────────────────────────────────────────────────────────────────────────────
-- Editable site content: restaurant profile, categories and products
-- Run supabase/seed_catalog.sql once after this schema to copy the built-in
-- menu into Supabase. Guests can read active rows; only admins can write.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.restaurant_profile (
  id text primary key default 'main',
  name text not null,
  tagline text,
  tagline_id text,
  address text,
  phone text,
  email text,
  dress_code text,
  dress_code_id text,
  hero_image text,
  updated_at timestamptz not null default now()
);

insert into public.restaurant_profile (id, name, tagline, tagline_id, address, phone, email, dress_code, dress_code_id)
values ('main', 'ÉTOILE ROYALE', 'Where Exceptional Taste Meets Royal Elegance.',
        'Di Mana Rasa Luar Biasa Bertemu Keanggunan Kerajaan.',
        '26 Rue Notre-Dame, L-2240 Luxembourg City', '+352 27 86 44 10',
        'concierge@etoileroyale.lu',
        'Smart Elegant. Tailored evening attire is appreciated; sportswear and beachwear are politely declined.',
        'Smart Elegant. Pakaian malam yang rapi sangat dihargai; pakaian olahraga dan pakaian pantai dengan sopan ditolak.')
on conflict (id) do nothing;

alter table public.restaurant_profile enable row level security;
drop policy if exists "profile: public read" on public.restaurant_profile;
create policy "profile: public read" on public.restaurant_profile for select using (true);
drop policy if exists "profile: admin write" on public.restaurant_profile;
create policy "profile: admin write" on public.restaurant_profile for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop trigger if exists restaurant_profile_touch on public.restaurant_profile;
create trigger restaurant_profile_touch before update on public.restaurant_profile
  for each row execute function public.touch_updated_at();


create table if not exists public.categories (
  id text primary key,
  name text not null,
  name_id text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories for select
  using (active or public.is_admin());
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();


create table if not exists public.products (
  id text primary key,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  price numeric(10, 2) not null default 0,
  image_url text,
  dish_type text,
  table_index integer,
  chef_recommended boolean not null default false,
  gluten_free boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  weight text,
  recommended_temp text,
  provenance text,
  provenance_id text,
  description text,
  description_id text,
  ingredients text[] not null default '{}',
  ingredients_id text[] not null default '{}',
  flavor_profile text,
  flavor_profile_id text,
  pairing text,
  pairing_id text,
  allergens text,
  allergens_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id, sort_order);
alter table public.products enable row level security;
drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products for select
  using (active or public.is_admin());
drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
