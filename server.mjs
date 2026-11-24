// Small zero-dependency proxy for the browser concierge.
// It keeps the DeepSeek API key on the server and normalises the response the
// React app expects: { text, recommendedIds }.
//
//   npm run server        # http://localhost:8787
//   npm run dev           # in a second terminal
//
// Configure DEEPSEEK_API_KEY (and optionally DEEPSEEK_MODEL / PORT) in .env.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizeHours, localizeMenu, localizeRestaurant } from './src/data.js';
import { formatPrice } from './src/currency.js';

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

function buildSystemPrompt(lang, currency) {
  const id = lang === 'ID';
  const menu = localizeMenu(lang, currency).map((dish) => (
    `${dish.id}: ${dish.name}, ${formatPrice(dish.price, currency)}, ${dish.weight}; ${dish.flavorProfile}; ${dish.recommendedTemp}; pairing: ${dish.pairing}; allergens: ${dish.allergens}.`
  )).join('\n');
  const hours = localizeHours(lang).map(([day, time]) => `${day}: ${time}`).join('; ');
  const restaurant = localizeRestaurant(lang);
  const example = formatPrice(95, currency);

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
        { role: 'system', content: buildSystemPrompt(lang, currency) },
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

  const validIds = new Set(localizeMenu().map((dish) => dish.id));
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
    send(res, 200, { ok: true, model: MODEL, hasKey: Boolean(API_KEY) });
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

  send(res, 404, { error: 'Not found. POST to /concierge.' });
});

server.listen(PORT, () => {
  console.log(`ÉTOILE concierge proxy listening on http://localhost:${PORT}`);
  console.log(API_KEY ? `DeepSeek key loaded · model: ${MODEL}` : 'Warning: DEEPSEEK_API_KEY is missing (local menu guide will be used).');
});
