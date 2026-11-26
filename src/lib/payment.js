// Browser-side client for the payment endpoints in server.mjs. The Midtrans
// server key never reaches this file: only the public client key is returned.

function proxyBase() {
  const explicit = (import.meta.env.VITE_PAYMENT_PROXY_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const concierge = (import.meta.env.VITE_CONCIERGE_PROXY_URL || '').trim();
  if (concierge) {
    try { return new URL(concierge, window.location.origin).origin; } catch { /* fall through */ }
  }
  return 'http://localhost:8787';
}

async function call(path, body, timeout = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${proxyBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Payment service error (${response.status}).`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPaymentConfig() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${proxyBase()}/midtrans/config`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return { available: true, enabled: false, mode: 'demo' };
    const data = await response.json();
    return { available: true, ...data };
  } catch {
    return { available: false, enabled: false, mode: 'demo' };
  }
}

export function createPayment(payload) {
  return call('/midtrans/token', payload);
}

export function confirmPayment(orderRef) {
  return call('/midtrans/confirm', { orderRef });
}

export function loadSnap(clientKey) {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve(window.snap);
    const existing = document.getElementById('midtrans-snap-js');
    if (existing) {
      existing.addEventListener('load', () => window.snap ? resolve(window.snap) : reject(new Error('Snap failed to load.')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Snap failed to load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = 'midtrans-snap-js';
    script.src = 'https://api.sandbox.midtrans.com/snap/v2/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    script.onload = () => window.snap ? resolve(window.snap) : reject(new Error('Snap failed to load.'));
    script.onerror = () => reject(new Error('Snap failed to load. Check your internet connection.'));
    document.head.appendChild(script);
  });
}
