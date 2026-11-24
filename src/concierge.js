import { formatPrice } from './currency.js';
import { MENU_DATA, RESTAURANT, localizeHours, localizeRestaurant } from './data.js';

// Optional live replies. Point this at YOUR server proxy (see README / .env.example).
// A provider key must never be shipped to the browser.
const PROXY_URL = (import.meta.env.VITE_CONCIERGE_PROXY_URL || '').trim();
export const isLive = /^https?:\/\//i.test(PROXY_URL);

const REPLIES = {
  diet: {
    ids: ['the-royal-experience', 'royal-berry-sparkle'],
    en: () => 'Chef Laurent Beaumont prepares an Aged Parmesan & Périgord Black Truffle Risotto for vegetarian guests on request. The Signature Steaks and Beverages are naturally gluten-free. Please add any allergy to your reservation notes.',
    id: () => 'Koki Laurent Beaumont menyiapkan Risotto Parmesan Tua & Truffle Hitam Périgord untuk tamu vegetarian sesuai permintaan. Steak dan Minuman Khas secara alami bebas gluten. Mohon cantumkan alergi Anda pada catatan reservasi.'
  },
  dessert: {
    ids: ['midnight-chocolate-fondant', 'parisian-creme-brulee', 'raspberry-pistachio-royale'],
    en: (fmt) => `Our signature finale is the Midnight Chocolate Fondant (${fmt(18)}) with 72% Valrhona and gold leaf. The Parisian Crème Brûlée (${fmt(15)}) and the Raspberry Pistachio Royale (${fmt(17)}) are close behind.`,
    id: (fmt) => `Penutup khas kami adalah Midnight Chocolate Fondant (${fmt(18)}) dengan Valrhona 72% dan daun emas. Parisian Crème Brûlée (${fmt(15)}) dan Raspberry Pistachio Royale (${fmt(17)}) menyusul dekat.`
  },
  drinks: {
    ids: ['royal-berry-sparkle', 'golden-passion', 'emerald-matcha-latte'],
    en: (fmt) => `Our zero-proof pairings are the Royal Berry Sparkle (${fmt(14)}), Golden Passion (${fmt(12)}), Emerald Matcha Latte (${fmt(11)}) and Lemon Royale (${fmt(10)}).`,
    id: (fmt) => `Padanan tanpa alkohol kami: Royal Berry Sparkle (${fmt(14)}), Golden Passion (${fmt(12)}), Emerald Matcha Latte (${fmt(11)}), dan Lemon Royale (${fmt(10)}).`
  },
  visit: {
    ids: ['the-royal-experience'],
    en: () => `We are at ${RESTAURANT.address}. Open Tue–Fri 18:00–23:30, Sat 12:00–15:00 and 18:00–00:00, Sun 18:00–22:30; closed Mondays. You can request a table in the reservation section, including the Salon Privé Royal for 8–16 guests.`,
    id: () => `Kami berada di ${RESTAURANT.address}. Buka Sel–Jum 18.00–23.30, Sab 12.00–15.00 dan 18.00–00.00, Min 18.00–22.30; tutup Senin. Anda dapat memesan meja di bagian reservasi, termasuk Salon Privé Royal untuk 8–16 tamu.`
  },
  steak: {
    ids: ['wagyu-ribeye', 'royal-tomahawk', 'black-truffle-tenderloin'],
    en: (fmt) => `For an unforgettable evening I suggest the Japanese A5 Wagyu Ribeye (${fmt(95)}), seared over Binchotan charcoal, or the Royal Tomahawk Steak (${fmt(120)}), aged 45 days in Himalayan salt.`,
    id: (fmt) => `Untuk malam yang tak terlupakan saya sarankan Japanese A5 Wagyu Ribeye (${fmt(95)}), dibakar di atas arang Binchotan, atau Royal Tomahawk Steak (${fmt(120)}), dimaturasi 45 hari dalam garam Himalaya.`
  },
  about: {
    ids: ['the-royal-experience', 'wagyu-ribeye', 'royal-berry-sparkle'],
    en: (fmt) => `Welcome to ÉTOILE ROYALE in Luxembourg City. Explore our dry-aged Signature Steaks, the five-course Royal Experience (${fmt(145)} per person), or ask me about pairings, hours and dietary needs.`,
    id: (fmt) => `Selamat datang di ÉTOILE ROYALE di Kota Luksemburg. Jelajahi Steak Khas maturasi kering kami, The Royal Experience lima hidangan (${fmt(145)} per orang), atau tanyakan pada saya tentang padanan, jam buka, dan kebutuhan diet.`
  }
};

const has = (q, words) => words.some((w) => q.includes(w));

export function groundedReply(text, lang = 'EN', currency = 'IDR') {
  const q = String(text || '').toLowerCase();
  let key = 'about';
  if (has(q, ['vegetar', 'vegan', 'allerg', 'alerg', 'gluten', 'végétar'])) key = 'diet';
  else if (has(q, ['dessert', 'sweet', 'chocolate', 'cokelat', 'brûlée', 'brulee', 'pistachio', 'manis', 'penutup'])) key = 'dessert';
  else if (has(q, ['drink', 'beverage', 'minum', 'sparkle', 'matcha', 'pairing', 'padanan', 'boisson', 'getränk'])) key = 'drinks';
  else if (has(q, ['reserv', 'pesan', 'book', 'hour', 'jam', 'buka', 'open', 'location', 'alamat', 'lokasi', 'visit', 'kunjung', 'horaire'])) key = 'visit';
  else if (has(q, ['steak', 'wagyu', 'tomahawk', 'filet', 'truffle', 'recommend', 'rekomendasi', 'saran', 'menu', 'carte', 'pair', 'cut', 'potongan', 'rich', 'lean', 'tender', 'empuk', 'dinner', 'makan malam'])) key = 'steak';
  const r = REPLIES[key];
  const id = lang === 'ID';
  return {
    text: (id ? r.id : r.en)((eur) => formatPrice(eur, currency)),
    recommendedIds: r.ids,
    provider: 'grounded'
  };
}

// Kept for proxies that still expect a system message in the request body.
// Our own server proxy (server.mjs) builds a trusted prompt and ignores this.
export function buildSystemContext(lang = 'EN', currency = 'IDR') {
  const id = lang === 'ID';
  const restaurant = localizeRestaurant(lang);
  const hours = localizeHours(lang);
  const menu = MENU_DATA.map((dish) => (
    `${dish.id}: ${dish.name}, ${formatPrice(dish.price, currency)}, ${dish.weight}; ${dish.flavorProfile}; ${dish.recommendedTemp}; pairing: ${dish.pairing}; allergens: ${dish.allergens}.`
  )).join('\n');
  return [
    id
      ? `Kamu adalah sommelier steak yang hangat dan ramah di ÉTOILE ROYALE, Kota Luksemburg. Balas HANYA dalam Bahasa Indonesia. Saat menyebut harga, gunakan format ${currency} (misalnya ${formatPrice(95, currency)}) dan jangan pernah memakai simbol €.`
      : `You are ÉTOILE ROYALE's warm, polished AI steak sommelier in Luxembourg City. Reply ONLY in English. When you mention a price, write it in ${currency} (e.g. ${formatPrice(95, currency)}) and never use the € symbol.`,
    'Only recommend items and facts in the menu below; never invent availability, ingredients, prices or allergen guarantees.',
    'Reservation requests are not confirmed until the restaurant replies. Return concise prose and up to three exact recommendedIds from the menu.',
    `Restaurant: ${restaurant.name}, ${restaurant.address}.`,
    `Hours: ${hours.map(([day, time]) => `${day}: ${time}`).join('; ')}.`,
    `Menu:\n${menu}`
  ].join('\n');
}

export async function askConcierge({ messages, lang = 'EN', currency = 'IDR', signal, systemSuffix = '' }) {
  const systemContent = systemSuffix
    ? `${buildSystemContext(lang, currency)}\n\n${systemSuffix}`
    : buildSystemContext(lang, currency);
  if (!isLive) return groundedReply(messages[messages.length - 1]?.content, lang, currency);

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      lang,
      currency,
      messages: [
        { role: 'system', content: systemContent },
        ...messages
          .filter(({ role }) => role === 'user' || role === 'assistant')
          .slice(-8)
          .map(({ role, content }) => ({ role, content }))
      ]
    })
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || '';
    } catch { /* non-JSON error body */ }
    throw new Error(detail || `The concierge service answered with status ${res.status}.`);
  }

  const data = await res.json();
  if (!data || typeof data.text !== 'string' || !data.text.trim()) {
    throw new Error('The concierge service returned an empty reply.');
  }
  const recommendedIds = Array.isArray(data.recommendedIds)
    ? [...new Set(data.recommendedIds.filter((id) => MENU_DATA.some((dish) => dish.id === id)))].slice(0, 3)
    : [];
  return { text: data.text.trim(), recommendedIds, provider: 'live' };
}
