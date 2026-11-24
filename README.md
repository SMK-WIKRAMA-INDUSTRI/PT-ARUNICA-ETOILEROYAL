# ETOILEROYAL

Website restoran steak ÉTOILEROYAL milik **PT ARUNICA**. Aplikasi dibangun dengan React dan Vite, dengan menu interaktif, formulir permintaan reservasi, dukungan Bahasa Indonesia/Inggris, pilihan mata uang, dan concierge berbasis AI.

## Persyaratan

- Node.js 18 atau lebih baru
- npm (terpasang bersama Node.js)

Periksa instalasi dengan `node --version` dan `npm --version`.

## Menjalankan proyek

1. Buka terminal di folder proyek.
2. Siapkan konfigurasi lokal:

   ```bash
   cp .env.example .env
   ```

   Windows PowerShell: `Copy-Item .env.example .env`.
3. Isi `.env` sesuai kebutuhan. Untuk pengalaman lengkap, masukkan `DEEPSEEK_API_KEY`. Jangan bagikan atau commit file `.env`.
4. Pasang dependensi dan jalankan aplikasi:

   ```bash
   npm install
   npm run dev
   ```

5. Buka URL yang tampil pada terminal, biasanya `http://localhost:5173`.

`npm run dev` menjalankan proxy concierge sekaligus server Vite. Concierge dapat tetap menampilkan panduan menu lokal jika API key belum diatur atau layanan AI tidak tersedia.

## Perintah npm

| Perintah | Kegunaan |
| --- | --- |
| `npm install` | Memasang dependensi proyek. Untuk instalasi reproduktif di CI, gunakan `npm ci`. |
| `npm run dev` | Menjalankan proxy concierge dan situs untuk development. |
| `npm run server` | Menjalankan proxy concierge saja (default `http://localhost:8787`). |
| `npm run build` | Membuat build produksi ke folder `dist/`. |
| `npm run preview` | Meninjau build produksi secara lokal setelah `npm run build`. |
| `npm run test:e2e` | Menjalankan tes end-to-end Playwright untuk desktop dan mobile. |
| `npm run deploy` | Build dan deploy folder `dist/` melalui `gh-pages`; perlu konfigurasi repository GitHub yang sesuai. |

Untuk menjalankan tes pertama kali, pasang browser Chromium Playwright:

```bash
npx playwright install chromium
npm run test:e2e
```

## Konfigurasi environment

| Variabel | Fungsi |
| --- | --- |
| `DEEPSEEK_API_KEY` | API key untuk proxy AI. Hanya dibaca server; jangan beri prefix `VITE_`. |
| `DEEPSEEK_BASE_URL` | Base URL DeepSeek atau URL lengkap endpoint kompatibel OpenAI. Default aplikasi: `https://api.deepseek.com`. |
| `DEEPSEEK_MODEL` | Nama model; default `deepseek-chat`. |
| `PORT` | Port proxy server; default `8787`. |
| `VITE_CONCIERGE_PROXY_URL` | URL proxy yang dipanggil situs. Development: `http://localhost:8787/concierge`. |
| `API_DIAGRAM_VOICE` | Kunci untuk input suara Deepgram. Vite memasukkan variabel berprefix `API_` ke bundle browser, jadi nilainya dapat dilihat pengguna situs. Jangan taruh kredensial server atau key berizin luas di sini; kosongkan jika fitur suara tidak dipakai. |
| `CORS_ORIGIN` | Origin situs yang diizinkan oleh proxy saat deployment, misalnya `https://contoh.com`. Secara default proxy memakai `*`; atur eksplisit untuk produksi. |

`.env` dibaca oleh proxy Node dan Vite. File tersebut sudah diabaikan Git. Untuk perubahan kode atau kredensial, jangan menempelkan nilai rahasia ke tiket publik, dokumentasi, atau source control.

## Concierge AI

Proxy di `server.mjs` mengirim permintaan ke endpoint yang ditentukan oleh `DEEPSEEK_BASE_URL`, menggunakan `DEEPSEEK_MODEL`, dan mengembalikan teks serta rekomendasi menu. Untuk DeepSeek native, base URL default ditambah path `/chat/completions`; URL lengkap endpoint kompatibel dapat digunakan langsung.

Request browser menggunakan `POST` dengan body `{ "lang", "currency", "messages": [{ "role", "content" }] }`; respons berisi `{ "text", "recommendedIds" }`. Bahasa adalah `ID` atau `EN`; mata uang yang didukung `IDR`, `USD`, atau `EUR`.

Saat development, pertahankan `VITE_CONCIERGE_PROXY_URL=http://localhost:8787/concierge`. Untuk produksi, deploy proxy Node secara terpisah, atur `VITE_CONCIERGE_PROXY_URL` ke URL publik proxy, dan batasi `CORS_ORIGIN` ke origin situs. Jangan mengandalkan proxy development untuk hosting produksi.

Jika API key pernah dimasukkan ke variabel `VITE_` atau terpaket ke build publik sebelumnya, rotasi key tersebut dari dashboard penyedia.

## Struktur proyek

| Lokasi | Isi |
| --- | --- |
| `src/data.js` | Data restoran, jam buka, menu, dan FAQ. |
| `src/hours.js` | Jadwal operasional yang digunakan indikator “buka sekarang”. |
| `src/foodImages.js` | Foto hidangan untuk menu dan rekomendasi concierge. |
| `src/MenuFlipbook.jsx` | Menu digital dengan kontrol dan gestur swipe. |
| `src/Reservation.jsx` | Formulir permintaan reservasi. |
| `src/Concierge.jsx`, `src/concierge.js` | Panel chat dan logika concierge. |
| `src/i18n.jsx`, `src/currency.js` | Terjemahan, bahasa, mata uang, dan format harga. |
| `server.mjs` | Proxy concierge Node.js. |
| `DESIGN.md` | Catatan sistem desain. |

## Sebelum peluncuran

Pastikan alamat, jam buka, kontak, harga, menu, informasi alergen, dan klaim diet benar serta telah diverifikasi PT ARUNICA. Formulir reservasi saat ini membuka email; hubungkan ke sistem reservasi resmi sebelum menerima booking. Tambahkan halaman syarat layanan dan privasi sebelum mengumpulkan data tamu secara luas.
