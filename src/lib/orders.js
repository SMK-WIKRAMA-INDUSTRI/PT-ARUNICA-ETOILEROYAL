import { MENU_DATA } from '../data.js';
import { convertFromEur } from '../currency.js';
import { isSupabaseConfigured, supabase } from './supabase.js';

const ORDERS_KEY = 'etoile.orders';
const BOOKINGS_KEY = 'etoile.bookings';

function read(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  return value;
}

export function makeOrderRef(date = new Date()) {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ER-${stamp}-${suffix}`;
}

export function priceItems(lines) {
  return lines.map((line) => {
    const dish = MENU_DATA.find((entry) => entry.id === line.id);
    return {
      id: line.id,
      name: dish?.name || line.id,
      qty: line.qty,
      unitPriceEur: dish?.price || 0,
      unitPriceIdr: convertFromEur(dish?.price || 0, 'IDR')
    };
  });
}

export function buildOrder({ customer, lines, displayCurrency, user, note = '' }) {
  const items = priceItems(lines);
  return {
    orderRef: makeOrderRef(),
    customerName: customer.name.trim(),
    customerEmail: customer.email.trim(),
    customerPhone: customer.phone.trim(),
    userId: user?.isDemo ? null : (user?.id || null),
    userEmail: user?.email || null,
    items,
    subtotalIdr: items.reduce((sum, item) => sum + item.unitPriceIdr * item.qty, 0),
    totalEur: items.reduce((sum, item) => sum + item.unitPriceEur * item.qty, 0),
    displayCurrency,
    status: 'pending',
    paymentProvider: 'midtrans',
    midtransOrderId: null,
    notes: note.trim(),
    createdAt: new Date().toISOString()
  };
}

export function readLocalOrders() {
  return read(ORDERS_KEY).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function saveLocalOrder(order) {
  const current = read(ORDERS_KEY).filter((entry) => entry.orderRef !== order.orderRef);
  return write(ORDERS_KEY, [order, ...current]);
}

export function updateLocalOrder(orderRef, patch) {
  const next = read(ORDERS_KEY).map((order) => order.orderRef === orderRef ? { ...order, ...patch } : order);
  write(ORDERS_KEY, next);
  return next.find((order) => order.orderRef === orderRef) || null;
}

// Supabase is optional: guest checkout and the sandbox demo work without it.
export async function pushOrderToSupabase(order) {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from('orders').insert({
    order_ref: order.orderRef,
    user_id: order.userId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    items: order.items,
    subtotal_idr: order.subtotalIdr,
    display_currency: order.displayCurrency,
    status: order.status,
    payment_provider: order.paymentProvider,
    midtrans_order_id: order.midtransOrderId,
    notes: order.notes || null
  });
  if (error) {
    // The local copy still works; log once so setup issues are visible.
    console.warn('Order was not mirrored to Supabase:', error.message);
    return false;
  }
  return true;
}

export async function fetchAdminOrders() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('orders')
    .select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map((row) => ({
    orderRef: row.order_ref,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    items: row.items || [],
    subtotalIdr: row.subtotal_idr,
    displayCurrency: row.display_currency,
    status: row.status,
    paymentProvider: row.payment_provider,
    notes: row.notes,
    createdAt: row.created_at
  }));
}

export function readLocalBookings() {
  return read(BOOKINGS_KEY).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function saveLocalBooking(booking) {
  const current = read(BOOKINGS_KEY).filter((entry) => entry.bookingRef !== booking.bookingRef);
  return write(BOOKINGS_KEY, [booking, ...current]);
}

export async function pushBookingToSupabase(booking, user) {
  if (!isSupabaseConfigured || !supabase || !user || user.isDemo) return false;
  const { error } = await supabase.from('bookings').insert({
    user_id: user.id,
    guest_name: booking.guestName,
    guest_email: booking.guestEmail,
    guest_phone: booking.guestPhone,
    booking_date: booking.bookingDate,
    booking_time: booking.bookingTime,
    guests: booking.guests,
    seating: booking.seating,
    dish_id: booking.dishId,
    notes: booking.notes || null
  });
  if (error) {
    console.warn('Booking was not saved to Supabase:', error.message);
    return false;
  }
  return true;
}

export async function fetchAdminBookings() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('bookings')
    .select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map((row) => ({
    bookingRef: row.id?.slice(0, 8)?.toUpperCase() || 'BOOKING',
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    guests: row.guests,
    seating: row.seating,
    dishId: row.dish_id,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at
  }));
}
