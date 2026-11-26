// Small zero-dependency proxy for the browser concierge.
// It keeps the DeepSeek API key on the server and normalises the response the
// React app expects: { text, recommendedIds }.
//
//   npm run server        # http://localhost:8787
//   npm run dev           # in a second terminal
//
// Configure DEEPSEEK_API_KEY (and optionally DEEPSEEK_MODEL / PORT) in .env.

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizeHours, localizeMenu, localizeRestaurant, MENU_DATA, RESTAURANT } from './src/data.js';
import { convertFromEur, formatPrice } from './src/currency.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const contents = fs.readFileSync(file, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

loadEnv(path.join(ROOT, '.env'));

const PORT = Number(process.env.PORT) || 8787;
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim().replace(/\/+$/, '');
// Some gateways (e.g. Netra.sh) give the full completions endpoint in BASE_URL,
// while the native DeepSeek base URL needs "/chat/completions" appended.
const COMPLETIONS_URL = /\/chat\/completions$/i.test(BASE_URL)
  ? BASE_URL
  : `${BASE_URL}/chat/completions`;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

// Payment credentials stay on this server. Never expose MIDTRANS_SERVER_KEY
// through a VITE_/API_ prefix — Vite inlines those into the public bundle.
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = (process.env.VITE_MIDTRANS_CLIENT_KEY || process.env.MIDTRANS_CLIENT_KEY || '').trim();
const MIDTRANS_API = (process.env.MIDTRANS_API_URL || 'https://api.sandbox.midtrans.com').trim().replace(/\/+$/, '');
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const paymentEnabled = Boolean(MIDTRANS_SERVER_KEY && MIDTRANS_CLIENT_KEY);
const midtransAuth = () => `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')}`;

// The browser reads the editable catalogue from Supabase; the server must use
// the same rows when building the concierge prompt and when verifying payment
// amounts. Falls back to the built-in data.js menu when Supabase is absent.
const CATALOG_TTL_MS = 30_000;
const DEFAULT_CATALOG = { profile: RESTAURANT, categories: null, products: MENU_DATA };
let catalogCache = { at: 0, data: DEFAULT_CATALOG };

const text = (value) => value == null ? '' : String(value);
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const bool = (value) => value === true || value === 'true' || value === 1;

function normalizeServerRow(row) {
  return {
    id: text(row.id),
    category: row.category_id || row.category,
    name: text(row.name || row.id),
    price: Number(row.price) || 0,
    dishType: text(row.dish_type || row.dishType),
    weight: text(row.weight),
    recommendedTemp: text(row.recommended_temp || row.recommendedTemp),
    provenance: text(row.provenance),
    provenanceId: text(row.provenance_id || row.provenanceId),
    description: text(row.description),
    descriptionId: text(row.description_id || row.descriptionId),
    ingredients: list(row.ingredients),
    ingredientsId: list(row.ingredients_id || row.ingredientsId),
    flavorProfile: text(row.flavor_profile || row.flavorProfile),
    flavorProfileId: text(row.flavor_profile_id || row.flavorProfileId),
    pairing: text(row.pairing),
    pairingId: text(row.pairing_id || row.pairingId),
    allergens: text(row.allergens),
    allergensId: text(row.allergens_id || row.allergensId),
    chefRecommended: bool(row.chef_recommended || row.chefRecommended),
    glutenFree: bool(row.gluten_free || row.glutenFree)
  };
}

function normalizeServerProfile(row) {
  return {
    ...RESTAURANT,
    ...row,
    tagline: text(row.tagline || RESTAURANT.tagline),
    taglineId: text(row.tagline_id || row.taglineId || RESTAURANT.taglineId),
    dressCode: text(row.dress_code || row.dressCode || RESTAURANT.dressCode),
    dressCodeId: text(row.dress_code_id || row.dressCodeId || RESTAURANT.dressCodeId)
  };
}

async function supabaseSelect(table, query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) throw new Error(`${table}: ${response.status}`);
  return response.json();
}

async function refreshCatalog() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return DEFAULT_CATALOG;
  if (Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.data;
  try {
    const [profileRows, categoryRows, productRows] = await Promise.all([
      supabaseSelect('restaurant_profile', 'id=eq.main&select=*'),
      supabaseSelect('categories', 'active=eq.true&select=*&order=sort_order.asc'),
      supabaseSelect('products', 'active=eq.true&select=*&order=sort_order.asc')
    ]);
    catalogCache = {
      at: Date.now(),
      data: {
        profile: profileRows[0] ? normalizeServerProfile(profileRows[0]) : RESTAURANT,
        categories: Array.isArray(categoryRows) && categoryRows.length
          ? categoryRows.map((row) => ({ id: row.id, name: text(row.name), nameId: text(row.name_id || row.nameId) }))
          : null,
        products: Array.isArray(productRows) && productRows.length
          ? productRows.map(normalizeServerRow)
          : MENU_DATA
      }
    };
  } catch (error) {
    console.error('[catalog] using built-in menu:', error.message);
    catalogCache = { at: Date.now(), data: DEFAULT_CATALOG };
  }
  return catalogCache.data;
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function buildSystemPrompt(lang, currency, catalog = DEFAULT_CATALOG) {
  const id = lang === 'ID';
  const menu = localizeMenu(lang, currency, catalog.products, catalog.categories).map((dish) => (
    `${dish.id}: ${dish.name}, ${formatPrice(dish.price, currency)}, ${dish.weight}; ${dish.flavorProfile}; ${dish.recommendedTemp}; pairing: ${dish.pairing}; allergens: ${dish.allergens}.`
  )).join('\n');
  const hours = localizeHours(lang).map(([day, time]) => `${day}: ${time}`).join('; ');
  const restaurant = localizeRestaurant(lang, catalog.profile);
  const example = formatPrice(catalog.products[0]?.price || 95, currency);

  return [
    id
      ? `Kamu adalah sommelier steak ÉTOILE ROYALE yang hangat dan sopan di Kota Luksemburg. Balas HANYA dalam Bahasa Indonesia yang alami dan ringkas.`
      : `You are ÉTOILE ROYALE's warm, polished steak sommelier in Luxembourg City. Reply ONLY in natural, concise English.`,
    id
      ? `Saat menyebut harga, selalu tulis dalam ${currency} seperti ${example}. Jangan pernah memakai simbol € dan jangan mengarang harga.`
      : `When you mention a price, always write it in ${currency} like ${example}. Never use the € symbol and never invent prices.`,
    'Only recommend items and facts from the menu below. Never invent availability, ingredients, allergens or guarantees.',
    'Reservation requests are not confirmed until the restaurant replies. Ask at most one short follow-up when preferences are unclear.',
    id
      ? 'Balas dengan objek JSON yang valid, persis: {"text":"jawaban Anda di sini","recommendedIds":["id1","id2"]}. Gunakan maksimal tiga ID menu yang persis dari daftar di bawah. Jangan sertakan teks di luar JSON.'
      : 'Reply with a valid JSON object, exactly: {"text":"your answer here","recommendedIds":["id1","id2"]}. Use at most three exact menu IDs from the list below. Do not include text outside the JSON.',
    `Restaurant: ${restaurant.name}, ${restaurant.address}.`,
    `Hours: ${hours}.`,
    `Menu:\n${menu}`
  ].join('\n');
}

function extractIds(value, validIds) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => validIds.has(id)))].slice(0, 3);
}

async function handleConcierge(req, res) {
  if (!API_KEY) {
    send(res, 503, { error: 'DEEPSEEK_API_KEY is not configured on the server.' });
    return;
  }

  const body = await readBody(req);
  const lang = body?.lang === 'ID' ? 'ID' : 'EN';
  const currency = ['IDR', 'USD', 'EUR'].includes(body?.currency) ? body.currency : 'IDR';
  const conversation = Array.isArray(body?.messages) ? body.messages : [];
  const usable = conversation
    .filter((message) => (message?.role === 'user' || message?.role === 'assistant')
      && typeof message?.content === 'string' && message.content.trim())
    .slice(-8)
    .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));

  if (!usable.length) {
    send(res, 400, { error: 'No conversation messages were provided.' });
    return;
  }

  const catalog = await refreshCatalog();

  const upstream = await fetch(COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      temperature: 0.7,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(lang, currency, catalog) },
        ...usable
      ]
    })
  });

  const raw = await upstream.text();
  let payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { /* handled below */ }

  if (!upstream.ok) {
    const providerMessage = payload?.error?.message || raw.slice(0, 200) || 'unknown provider error';
    const friendly = upstream.status === 401 || upstream.status === 403
      ? `The AI provider rejected the API key. Check DEEPSEEK_API_KEY in .env (${providerMessage}).`
      : upstream.status === 404
        ? `The AI endpoint was not found. Check DEEPSEEK_BASE_URL (currently ${COMPLETIONS_URL}).`
        : upstream.status === 429
          ? 'The AI provider is rate-limiting requests. Please try again shortly.'
          : `AI request failed (${upstream.status}): ${providerMessage}`;
    console.error('[concierge] upstream error', upstream.status, providerMessage);
    send(res, 502, { error: friendly });
    return;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    send(res, 502, { error: 'DeepSeek returned an empty reply.' });
    return;
  }

  const validIds = new Set(catalog.products.map((dish) => dish.id));
  let text = content.trim();
  let recommendedIds = [];
  try {
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    if (typeof parsed?.text === 'string' && parsed.text.trim()) text = parsed.text.trim();
    if (parsed?.recommendedIds) recommendedIds = extractIds(parsed.recommendedIds, validIds);
  } catch {
    // Plain-text fallback: still safe, just without recommendation cards.
    text = text.replace(/recommendedIds\s*:\s*\[[^\]]*\]/i, '').trim();
  }

  send(res, 200, { text, recommendedIds, provider: 'live' });
}

// ── Midtrans sandbox payment proxy ──────────────────────────────────────────

function validOrderRef(value) {
  const ref = String(value || '');
  return /^[A-Za-z0-9-]{6,64}$/.test(ref) ? ref : null;
}

function pricedItems(input, products = MENU_DATA) {
  if (!Array.isArray(input) || !input.length || input.length > 20) {
    throw new Error('Choose between 1 and 20 menu items.');
  }
  const menu = new Map(products.map((dish) => [dish.id, dish]));
  return input.map((entry) => {
    const dish = menu.get(entry?.id);
    const qty = Number(entry?.qty);
    if (!dish || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new Error('One or more cart items are invalid. Please refresh the menu.');
    }
    return {
      id: dish.id,
      name: dish.name,
      qty,
      price: convertFromEur(dish.price, 'IDR')
    };
  });
}

async function updateSupabaseOrder(orderRef, status, extra = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?order_ref=eq.${encodeURIComponent(orderRef)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          status,
          midtrans_order_id: extra.transactionId || null,
          updated_at: new Date().toISOString()
        })
      }
    );
    return response.ok;
  } catch (error) {
    console.error('[midtrans] could not sync order status to Supabase', error.message);
    return false;
  }
}

function handlePaymentConfig(_req, res) {
  send(res, 200, {
    enabled: paymentEnabled,
    clientKey: MIDTRANS_CLIENT_KEY,
    mode: 'sandbox',
    hasServerKey: Boolean(MIDTRANS_SERVER_KEY)
  });
}

async function handlePaymentToken(req, res) {
  const body = await readBody(req);
  const orderRef = validOrderRef(body?.orderRef);
  if (!orderRef) {
    send(res, 400, { error: 'A valid order reference is required.' });
    return;
  }

  const catalog = await refreshCatalog();
  const items = pricedItems(body?.items, catalog.products);
  const grossAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (body?.amountIdr != null && Number(body.amountIdr) !== grossAmount) {
    send(res, 400, { error: 'The order amount did not match the menu. Please try again.' });
    return;
  }

  const customer = {
    name: String(body?.customer?.name || '').trim().slice(0, 100),
    email: String(body?.customer?.email || '').trim().slice(0, 160),
    phone: String(body?.customer?.phone || '').trim().slice(0, 30)
  };
  if (!customer.name || !customer.email || !customer.phone) {
    send(res, 400, { error: 'Name, email and phone number are required.' });
    return;
  }

  if (!MIDTRANS_SERVER_KEY) {
    // Sandbox demo without credentials: the browser marks the order demo-paid.
    send(res, 200, {
      demo: true,
      orderId: `DEMO-${orderRef}`,
      grossAmount,
      clientKey: MIDTRANS_CLIENT_KEY
    });
    return;
  }

  const upstream = await fetch(`${MIDTRANS_API}/v2/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: midtransAuth()
    },
    body: JSON.stringify({
      payment_type: 'credit_card',
      transaction_details: { order_id: orderRef, gross_amount: grossAmount },
      credit_card: { secure: true },
      customer_details: { first_name: customer.name, email: customer.email, phone: customer.phone },
      item_details: items.map((item) => ({ id: item.id, name: item.name, price: item.price, quantity: item.qty }))
    })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data?.token) {
    const detail = data?.error_messages?.[0] || data?.error?.message || `Midtrans returned ${upstream.status}`;
    console.error('[midtrans] charge failed', upstream.status, detail);
    send(res, 502, { error: `Midtrans sandbox could not create a payment: ${detail}` });
    return;
  }

  send(res, 200, {
    snapToken: data.token,
    redirectUrl: data.redirect_url,
    orderId: orderRef,
    grossAmount,
    clientKey: MIDTRANS_CLIENT_KEY
  });
}

async function handlePaymentConfirm(req, res) {
  const body = await readBody(req);
  const orderRef = validOrderRef(body?.orderRef);
  if (!orderRef) {
    send(res, 400, { error: 'A valid order reference is required.' });
    return;
  }
  if (!MIDTRANS_SERVER_KEY) {
    send(res, 200, { demo: true, status: 'demo-paid', verified: false, orderId: `DEMO-${orderRef}` });
    return;
  }

  const upstream = await fetch(`${MIDTRANS_API}/v2/${encodeURIComponent(orderRef)}/status`, {
    headers: { Accept: 'application/json', Authorization: midtransAuth() }
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    send(res, 502, { error: `Midtrans status check failed (${upstream.status}).` });
    return;
  }

  const status = data.transaction_status || 'pending';
  const verified = ['settlement', 'capture'].includes(status);
  if (verified) await updateSupabaseOrder(orderRef, 'paid', { transactionId: data.transaction_id });
  send(res, 200, {
    orderId: orderRef,
    status,
    verified,
    transactionId: data.transaction_id || null,
    grossAmount: Number(data.gross_amount) || 0,
    fraudStatus: data.fraud_status || null
  });
}

async function handlePaymentNotification(req, res) {
  if (!MIDTRANS_SERVER_KEY) {
    send(res, 503, { error: 'Midtrans server key is not configured.' });
    return;
  }
  const body = await readBody(req);
  const signature = crypto.createHash('sha512')
    .update(`${body?.order_id || ''}${body?.status_code || ''}${body?.gross_amount || ''}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');
  if (signature !== String(body?.signature_key || '').toLowerCase()) {
    send(res, 403, { error: 'Invalid Midtrans signature.' });
    return;
  }

  const transaction = body.transaction_status;
  const status = ['settlement', 'capture'].includes(transaction) ? 'paid'
    : ['deny', 'cancel', 'expire'].includes(transaction) ? 'failed' : 'pending';
  await updateSupabaseOrder(body.order_id, status, { transactionId: body.transaction_id });
  send(res, 200, { ok: true, status });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    send(res, 200, {
      ok: true,
      model: MODEL,
      hasKey: Boolean(API_KEY),
      midtrans: paymentEnabled ? 'sandbox' : 'demo'
    });
    return;
  }

  if (req.method === 'GET' && (req.url === '/midtrans/config' || req.url === '/midtrans/config/')) {
    handlePaymentConfig(req, res);
    return;
  }

  const paymentRoute = req.method === 'POST'
    ? {
        '/midtrans/token': handlePaymentToken,
        '/midtrans/token/': handlePaymentToken,
        '/midtrans/confirm': handlePaymentConfirm,
        '/midtrans/confirm/': handlePaymentConfirm,
        '/midtrans/notification': handlePaymentNotification,
        '/midtrans/notification/': handlePaymentNotification
      }[req.url]
    : null;
  if (paymentRoute) {
    try {
      await paymentRoute(req, res);
    } catch (error) {
      console.error('[midtrans]', error);
      if (!res.headersSent) send(res, 500, { error: error.message || 'Unexpected payment error.' });
    }
    return;
  }

  if (req.method === 'POST' && (req.url === '/concierge' || req.url === '/concierge/')) {
    try {
      await handleConcierge(req, res);
    } catch (error) {
      console.error('[concierge]', error);
      if (!res.headersSent) send(res, 500, { error: error.message || 'Unexpected proxy error.' });
    }
    return;
  }

  send(res, 404, { error: 'Not found. Try POST /concierge or POST /midtrans/token.' });
});

server.listen(PORT, () => {
  console.log(`ÉTOILE concierge + payment proxy listening on http://localhost:${PORT}`);
  console.log(API_KEY ? `DeepSeek key loaded · model: ${MODEL}` : 'Warning: DEEPSEEK_API_KEY is missing (local menu guide will be used).');
  console.log(paymentEnabled
    ? 'Midtrans sandbox enabled (Snap checkout).'
    : 'Midtrans keys missing — checkout will run the clearly labelled sandbox demo.');
});
