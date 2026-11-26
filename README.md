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
| `MIDTRANS_SERVER_KEY` | Server key **sandbox** Midtrans. Hanya dibaca `server.mjs`; jangan pernah memakai prefix `VITE_` / `API_`. |
| `VITE_MIDTRANS_CLIENT_KEY` | Client key sandbox Midtrans (publik) untuk Snap popup di browser. |
| `VITE_PAYMENT_PROXY_URL` | URL proxy pembayaran, default `http://localhost:8787`. |
| `MIDTRANS_API_URL` | Endpoint Midtrans; default `https://api.sandbox.midtrans.com`. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Opsional, server-only. Memungkinkan webhook Midtrans memperbarui status pesanan di Supabase. |

`.env` dibaca oleh proxy Node dan Vite. File tersebut sudah diabaikan Git. Untuk perubahan kode atau kredensial, jangan menempelkan nilai rahasia ke tiket publik, dokumentasi, atau source control.

## Concierge AI

Proxy di `server.mjs` mengirim permintaan ke endpoint yang ditentukan oleh `DEEPSEEK_BASE_URL`, menggunakan `DEEPSEEK_MODEL`, dan mengembalikan teks serta rekomendasi menu. Untuk DeepSeek native, base URL default ditambah path `/chat/completions`; URL lengkap endpoint kompatibel dapat digunakan langsung.

Request browser menggunakan `POST` dengan body `{ "lang", "currency", "messages": [{ "role", "content" }] }`; respons berisi `{ "text", "recommendedIds" }`. Bahasa adalah `ID` atau `EN`; mata uang yang didukung `IDR`, `USD`, atau `EUR`.

Saat development, pertahankan `VITE_CONCIERGE_PROXY_URL=http://localhost:8787/concierge`. Untuk produksi, deploy proxy Node secara terpisah, atur `VITE_CONCIERGE_PROXY_URL` ke URL publik proxy, dan batasi `CORS_ORIGIN` ke origin situs. Jangan mengandalkan proxy development untuk hosting produksi.

Jika API key pernah dimasukkan ke variabel `VITE_` atau terpaket ke build publik sebelumnya, rotasi key tersebut dari dashboard penyedia.

## Akun, keranjang, dan checkout

- **Tamu boleh memesan.** Tambah hidangan ke keranjang dari menu, spotlight, atau modal hidangan, lalu checkout tanpa akun. Harga ditampilkan sesuai pilihan IDR/USD; Midtrans menagih dalam Rupiah.
- **Reservasi butuh akun.** Karena bersifat jangka panjang, permintaan meja hanya dikirim oleh anggota yang sudah masuk. Form tetap dapat diisi untuk melihat validasi; tombol kirim akan membuka dialog masuk jika belum login.
- **Login:** jalankan `supabase/schema.sql` di SQL Editor, lalu daftar atau masuk lewat tombol **Sign in** di header. Untuk menjadikan akun admin:

  ```sql
  update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'email-anda@domain.com');
  ```

- **Akun demo:** dialog masuk menyediakan **Continue as member** dan **Continue as admin**. Akun ini hanya tersimpan di browser (`localStorage`) dan sengaja diberi label demo; berguna mencoba alur sebelum Supabase dikonfigurasi. Panel admin menampilkan pesanan dan permintaan reservasi dari browser ini (atau dari Supabase jika admin masuk dengan akun nyata).
- **Pembayaran:** isi `MIDTRANS_SERVER_KEY` dan `VITE_MIDTRANS_CLIENT_KEY` dengan kunci sandbox untuk memakai Snap popup. `npm run dev` sudah menjalankan proxy di port 8787 yang membuat Snap token dan memverifikasi status transaksi. Webhook `/midtrans/notification` tersedia untuk deployment (verifikasi signature SHA512); untuk percobaan lokal, tombol sukses di Snap memanggil `/midtrans/confirm`.
- **Tanpa kunci Midtrans:** checkout otomatis memakai **sandbox demo** — tidak ada tagihan nyata, pesanan ditandai `demo-paid`, dan UI menyebut hal ini secara eksplisit.

Untuk menerima webhook Midtrans, proxy harus dapat diakses publik (HTTPS). Midtrans tidak dapat mengirim notifikasi ke `localhost`.

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
| `src/lib/auth.jsx`, `src/lib/cart.jsx`, `src/lib/orders.js`, `src/lib/payment.js` | Autentikasi + peran, keranjang, pesanan/reservasi, dan klien pembayaran. |
| `src/components/` | Dialog masuk, keranjang, checkout, dan panel admin. |
| `server.mjs` | Proxy Node.js untuk concierge dan Midtrans sandbox. |
| `supabase/schema.sql` | Skema chat, profil/admin, pesanan, dan reservasi beserta RLS. |
| `DESIGN.md` | Catatan sistem desain. |

## Sebelum peluncuran

Pastikan alamat, jam buka, kontak, harga, menu, informasi alergen, dan klaim diet benar serta telah diverifikasi PT ARUNICA. Formulir reservasi saat ini membuka email; hubungkan ke sistem reservasi resmi sebelum menerima booking. Tambahkan halaman syarat layanan dan privasi sebelum mengumpulkan data tamu secara luas.
