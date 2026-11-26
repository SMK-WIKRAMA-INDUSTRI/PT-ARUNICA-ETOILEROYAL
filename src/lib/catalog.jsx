import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES, CATEGORIES_ID, MENU_DATA, RESTAURANT,
  localizeDish as localizeDishBase, localizeMenu as localizeMenuBase,
  localizeRestaurant as localizeRestaurantBase
} from '../data.js';
import { useAuth } from './auth.jsx';
import { isSupabaseConfigured, supabase } from './supabase.js';

const KEYS = {
  profile: 'etoile.catalog.profile',
  categories: 'etoile.catalog.categories',
  products: 'etoile.catalog.products'
};

const DEFAULT_PROFILE = {
  id: 'main',
  name: RESTAURANT.name,
  tagline: RESTAURANT.tagline,
  taglineId: RESTAURANT.taglineId,
  address: RESTAURANT.address,
  phone: RESTAURANT.phone,
  email: RESTAURANT.email,
  dressCode: RESTAURANT.dressCode,
  dressCodeId: RESTAURANT.dressCodeId,
  heroImage: ''
};

const DEFAULT_CATEGORIES = CATEGORIES.map((id, index) => ({
  id, name: id, nameId: CATEGORIES_ID[index] || '', sortOrder: index, active: true
}));

const DEFAULT_PRODUCTS = MENU_DATA.map((dish, index) => ({
  ...dish,
  imageUrl: '',
  chefRecommended: Boolean(dish.chefRecommended),
  glutenFree: Boolean(dish.glutenFree),
  active: true,
  sortOrder: index,
  ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
  ingredientsId: Array.isArray(dish.ingredientsId) ? dish.ingredientsId : []
}));

function readLocal(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (value == null) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

const asText = (value) => value == null ? '' : String(value);
const asArray = (value) => Array.isArray(value) ? value.filter((item) => item !== '' && item != null) : [];
const asBool = (value) => value === true || value === 'true' || value === 1;

function normalizeCategory(row) {
  return {
    id: asText(row.id),
    name: asText(row.name || row.id),
    nameId: asText(row.name_id ?? row.nameId),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0) || 0,
    active: row.active !== false
  };
}

function normalizeProduct(row) {
  return {
    id: asText(row.id),
    category: asText(row.category_id ?? row.category),
    name: asText(row.name || row.id),
    price: Number(row.price) || 0,
    imageUrl: asText(row.image_url ?? row.imageUrl),
    dishType: asText(row.dish_type ?? row.dishType),
    tableIndex: row.table_index === undefined ? (row.tableIndex ?? null) : row.tableIndex,
    chefRecommended: asBool(row.chef_recommended ?? row.chefRecommended),
    glutenFree: asBool(row.gluten_free ?? row.glutenFree),
    active: row.active !== false,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0) || 0,
    weight: asText(row.weight),
    recommendedTemp: asText(row.recommended_temp ?? row.recommendedTemp),
    provenance: asText(row.provenance),
    provenanceId: asText(row.provenance_id ?? row.provenanceId),
    description: asText(row.description),
    descriptionId: asText(row.description_id ?? row.descriptionId),
    ingredients: asArray(row.ingredients),
    ingredientsId: asArray(row.ingredients_id ?? row.ingredientsId),
    flavorProfile: asText(row.flavor_profile ?? row.flavorProfile),
    flavorProfileId: asText(row.flavor_profile_id ?? row.flavorProfileId),
    pairing: asText(row.pairing),
    pairingId: asText(row.pairing_id ?? row.pairingId),
    allergens: asText(row.allergens),
    allergensId: asText(row.allergens_id ?? row.allergensId)
  };
}

function normalizeProfile(row) {
  return {
    ...DEFAULT_PROFILE,
    ...row,
    id: 'main',
    taglineId: asText(row?.tagline_id ?? row?.taglineId),
    dressCode: asText(row?.dress_code ?? row?.dressCode),
    dressCodeId: asText(row?.dress_code_id ?? row?.dressCodeId),
    heroImage: asText(row?.hero_image ?? row?.heroImage)
  };
}

const nullable = (value) => asText(value) || null;
const categoryPayload = (row) => ({
  id: row.id,
  name: row.name,
  name_id: nullable(row.nameId),
  sort_order: row.sortOrder,
  active: row.active
});
const productPayload = (row) => ({
  id: row.id,
  category_id: nullable(row.category),
  name: row.name,
  price: Number(row.price) || 0,
  image_url: nullable(row.imageUrl),
  dish_type: nullable(row.dishType),
  table_index: row.tableIndex == null ? null : Number(row.tableIndex),
  chef_recommended: Boolean(row.chefRecommended),
  gluten_free: Boolean(row.glutenFree),
  active: Boolean(row.active),
  sort_order: row.sortOrder,
  weight: nullable(row.weight),
  recommended_temp: nullable(row.recommendedTemp),
  provenance: nullable(row.provenance),
  provenance_id: nullable(row.provenanceId),
  description: nullable(row.description),
  description_id: nullable(row.descriptionId),
  ingredients: row.ingredients,
  ingredients_id: row.ingredientsId,
  flavor_profile: nullable(row.flavorProfile),
  flavor_profile_id: nullable(row.flavorProfileId),
  pairing: nullable(row.pairing),
  pairing_id: nullable(row.pairingId),
  allergens: nullable(row.allergens),
  allergens_id: nullable(row.allergensId)
});
const profilePayload = (row) => ({
  id: 'main',
  name: row.name,
  tagline: nullable(row.tagline),
  tagline_id: nullable(row.taglineId),
  address: nullable(row.address),
  phone: nullable(row.phone),
  email: nullable(row.email),
  dress_code: nullable(row.dressCode),
  dress_code_id: nullable(row.dressCodeId),
  hero_image: nullable(row.heroImage),
  updated_at: new Date().toISOString()
});

function slug(value) {
  return asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
}

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState(() => normalizeProfile(readLocal(KEYS.profile, DEFAULT_PROFILE)));
  const [categories, setCategories] = useState(() => {
    const value = readLocal(KEYS.categories, DEFAULT_CATEGORIES);
    return Array.isArray(value) ? value.map(normalizeCategory) : DEFAULT_CATEGORIES;
  });
  const [products, setProducts] = useState(() => {
    const value = readLocal(KEYS.products, DEFAULT_PRODUCTS);
    return Array.isArray(value) ? value.map(normalizeProduct) : DEFAULT_PRODUCTS;
  });
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [source, setSource] = useState(isSupabaseConfigured ? 'local' : 'demo');
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured || !supabase) { setReady(true); return undefined; }

    Promise.allSettled([
      supabase.from('restaurant_profile').select('*').eq('id', 'main').maybeSingle(),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').order('sort_order', { ascending: true })
    ]).then(([profileResult, categoryResult, productResult]) => {
      if (!active) return;
      let synced = false;
      if (profileResult.status === 'fulfilled' && !profileResult.value.error && profileResult.value.data) {
        const next = normalizeProfile(profileResult.value.data);
        setProfile(next); writeLocal(KEYS.profile, next); synced = true;
      }
      if (categoryResult.status === 'fulfilled' && !categoryResult.value.error && categoryResult.value.data?.length) {
        const next = categoryResult.value.data.map(normalizeCategory);
        setCategories(next); writeLocal(KEYS.categories, next); synced = true;
      }
      if (productResult.status === 'fulfilled' && !productResult.value.error && productResult.value.data?.length) {
        const next = productResult.value.data.map(normalizeProduct);
        setProducts(next); writeLocal(KEYS.products, next); synced = true;
      }
      if (synced) setSource('supabase');
      else setSyncError('Supabase content is empty. Run supabase/seed_catalog.sql to load the built-in menu.');
      setReady(true);
    });

    return () => { active = false; };
  }, []);

  const requireAdmin = useCallback(() => {
    if (!isAdmin) throw new Error('Admin access required.');
  }, [isAdmin]);

  const remember = useCallback((error) => {
    if (error?.message) setSyncError(error.message);
  }, []);

  const saveProfile = useCallback(async (patch) => {
    requireAdmin();
    const next = normalizeProfile({ ...profile, ...patch, id: 'main' });
    setProfile(next); writeLocal(KEYS.profile, next);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('restaurant_profile').upsert(profilePayload(next));
      if (error) remember(error); else setSyncError('');
    }
    return next;
  }, [profile, requireAdmin, remember]);

  const saveCategory = useCallback(async (row) => {
    requireAdmin();
    const next = normalizeCategory(row);
    if (!next.id || !next.name.trim()) throw new Error('Category id and name are required.');
    const current = categories.some((item) => item.id === next.id) ? categories.map((item) => item.id === next.id ? next : item) : [...categories, next];
    setCategories(current); writeLocal(KEYS.categories, current);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('categories').upsert(categoryPayload(next));
      if (error) remember(error); else setSyncError('');
    }
    return next;
  }, [categories, requireAdmin, remember]);

  const deleteCategory = useCallback(async (id) => {
    requireAdmin();
    if (products.some((item) => item.category === id)) {
      throw new Error('This category still has products. Move or delete them first.');
    }
    const current = categories.filter((item) => item.id !== id);
    setCategories(current); writeLocal(KEYS.categories, current);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) remember(error); else setSyncError('');
    }
  }, [categories, products, requireAdmin, remember]);

  const saveProduct = useCallback(async (row) => {
    requireAdmin();
    const next = normalizeProduct(row);
    if (!next.id || !next.name.trim()) throw new Error('Product id and name are required.');
    if (!next.category) throw new Error('Choose a category.');
    const current = products.some((item) => item.id === next.id)
      ? products.map((item) => item.id === next.id ? next : item)
      : [...products, next];
    setProducts(current); writeLocal(KEYS.products, current);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').upsert(productPayload(next));
      if (error) remember(error); else setSyncError('');
    }
    return next;
  }, [products, requireAdmin, remember]);

  const deleteProduct = useCallback(async (id) => {
    requireAdmin();
    const current = products.filter((item) => item.id !== id);
    setProducts(current); writeLocal(KEYS.products, current);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) remember(error); else setSyncError('');
    }
  }, [products, requireAdmin, remember]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories]
  );
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [products]
  );
  const activeProducts = useMemo(() => sortedProducts.filter((item) => item.active), [sortedProducts]);

  const localizeDish = useCallback(
    (dish, lang = 'EN', currency = 'IDR') => localizeDishBase(dish, lang, currency, sortedCategories),
    [sortedCategories]
  );
  const localizeMenu = useCallback(
    (lang = 'EN', currency = 'IDR', list = activeProducts) => localizeMenuBase(lang, currency, list, sortedCategories),
    [activeProducts, sortedCategories]
  );
  const localizeRestaurant = useCallback(
    (lang = 'EN') => localizeRestaurantBase(lang, profile),
    [profile]
  );
  const categoryOptions = useCallback((lang = 'EN') => sortedCategories
    .filter((item) => item.active)
    .map((item) => ({ value: item.id, label: lang === 'ID' ? (item.nameId || item.name) : item.name })),
  [sortedCategories]);

  const value = useMemo(() => ({
    profile, categories: sortedCategories, products: sortedProducts, activeProducts,
    ready, source, syncError,
    saveProfile, saveCategory, deleteCategory, saveProduct, deleteProduct,
    localizeDish, localizeMenu, localizeRestaurant, categoryOptions,
    makeId: (name, list) => {
      const base = slug(name);
      let id = base;
      let suffix = 2;
      while (list.some((item) => item.id === id)) id = `${base}-${suffix++}`;
      return id;
    }
  }), [
    profile, sortedCategories, sortedProducts, activeProducts, ready, source, syncError,
    saveProfile, saveCategory, deleteCategory, saveProduct, deleteProduct,
    localizeDish, localizeMenu, localizeRestaurant, categoryOptions
  ]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>.');
  return context;
}
