# ÉTOILE ROYALE

React + Vite site for a modern steakhouse in Luxembourg City: a lightweight featured-dish showcase, an image-first swipeable paper menu, a reservation request form, and a bilingual (Indonesia / English) steak and pairing guide with Rupiah / US Dollar prices. The UI uses no 3D/WebGL, so it stays fast on phones.

## Run it

```bash
npm install
npm run dev        # proxy (8787) + site (5173) together
npm run build      # production build in dist/
npm run preview
npm run test:e2e   # Playwright desktop + mobile interaction checks
```

Node 18+ required. `npm run dev` starts both the Vite site and the DeepSeek proxy, so the concierge can reach its endpoint. If the proxy is down or the key is invalid, the chat shows a short message and answers from the local menu guide instead of a raw "Failed to fetch". To run only the proxy, use `npm run server`.

### Language & currency

The header has an `ID / EN` toggle and an `Rp / $` toggle (also in the mobile menu). Everything — landing page, showcase, menu, reservation form and concierge — follows those two settings. Prices are stored in EUR in `src/data.js` and converted at display time (`src/currency.js`); copying the values there is the only place you need to update a price.

Playwright runs the app on port 4173 and uses its Chromium browser. Install it once with `npx playwright install chromium`.

## Project layout

| File | Purpose |
| --- | --- |
| `src/data.js` | Restaurant facts, hours, all 13 menu items, FAQ. Edit content here. |
| `src/hours.js` | Opening schedule (Luxembourg time) that drives the live "Open now" line. Keep in sync with `HOURS` in `data.js`. |
| `src/foodImages.js` | Shared dish photos for the showcase and concierge recommendation cards. |
| `src/MenuFlipbook.jsx` | Image-first paper carte with desktop controls and swipe gestures. |
| `src/Reservation.jsx` | Booking request form. |
| `src/Concierge.jsx`, `src/concierge.js` | Chat panel and reply logic. |
| `src/i18n.jsx`, `src/currency.js` | Translations, language/currency state and price formatting. |
| `server.mjs` | Zero-dependency DeepSeek proxy (keeps the API key off the browser). |
| `src/styles.css`, `DESIGN.md` | Design tokens and the reasoning behind them. |

## Concierge / DeepSeek

The old setup put an API key in `VITE_CONCIERGE_PROXY_URL`. Because that value is not a URL, `fetch()` requested a relative path and the browser got a **404**. It is fixed by separating the two concerns:

* `.env` now stores `DEEPSEEK_API_KEY` (server-only) and `VITE_CONCIERGE_PROXY_URL` (just a URL).
* `server.mjs` posts to the URL from `DEEPSEEK_BASE_URL` using `DEEPSEEK_MODEL` and returns `{ text, recommendedIds }`. Both native DeepSeek (`https://api.deepseek.com`) and OpenAI-compatible gateways such as Netra.sh (`https://api.netra.sh/v1/chat/completions`) work — a full `/chat/completions` URL is used as-is, a bare base URL gets the path appended.
* If the proxy is down or the key is invalid, the browser shows a short message and answers from the local menu guide — no more dead 404.

Start it with `npm run server` and keep `VITE_CONCIERGE_PROXY_URL=http://localhost:8787/concierge` during development. For production, host `server.mjs` somewhere reachable and set `VITE_CONCIERGE_PROXY_URL` to that public URL; set `CORS_ORIGIN` to your site origin as well.

Contract: `POST { lang, currency, messages: [{ role, content }] }` → `{ text, recommendedIds? }`. `lang` is `ID` or `EN`, `currency` is `IDR` or `USD`, and `recommendedIds` must be menu IDs from `src/data.js`. The browser aborts requests after 20 seconds.

> Security: the key that used to be in `VITE_CONCIERGE_PROXY_URL` may have been embedded in a previous browser bundle. Rotate it in your DeepSeek dashboard before going live.

## Before you launch

- All restaurant details (address, phone, email, chef, dishes, prices, allergens) came from the original draft. Replace anything that is not real, and have the kitchen verify the allergen and gluten-free claims.
- The reservation form opens an email to `concierge@etoileroyale.lu`. Swap `submit` in `Reservation.jsx` for your booking system when you have one.
- Add Terms and Privacy pages before collecting guest details at scale.
