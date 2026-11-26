import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { formatEuroText, formatPrice } from './currency.js';

export const LANGUAGES = [
  { code: 'ID', label: 'Bahasa Indonesia', short: 'ID' },
  { code: 'EN', label: 'English', short: 'EN' }
];
export const CURRENCY_OPTIONS = [
  { code: 'IDR', label: 'Rupiah', short: 'Rp' },
  { code: 'USD', label: 'US Dollar', short: '$' }
];
export const DEFAULT_LANG = 'ID';
export const DEFAULT_CURRENCY = 'IDR';

const STRINGS = {
  EN: {
    // Header / navigation
    skipToContent: 'Skip to content',
    navRestaurant: 'Restaurant', navTable: 'The Table', navMenu: 'Menu',
    navVisit: 'Visit', navReservations: 'Reservations',
    light: 'Light', dark: 'Dark', lightTheme: 'Light theme', darkTheme: 'Dark theme',
    concierge: 'Concierge', reserve: 'Reserve', close: 'Close', menuButton: 'Menu',
    language: 'Language', currency: 'Currency',
    langIndonesian: 'Bahasa Indonesia', langEnglish: 'English',
    currencyRupiah: 'Rupiah', currencyDollar: 'US Dollar',

    // Hero
    heroEyebrow: 'BINCHOTAN • DRY-AGED • LUXEMBOURG',
    heroTitleA: 'A little fire.', heroTitleB: 'A lot of', heroTitleEm: 'character.',
    heroLede: 'Miyazaki A5, 45-day dry-age and the theatre of live fire in the heart of Ville Haute.',
    reserveTable: 'Reserve a table', viewMenu: 'View the menu',
    teaserTitle: 'Meet your AI sommelier', teaserSub: 'Tell us what you love. Find your perfect cut.',

    // Spotlight / lightweight showcase
    showcaseAria: 'Featured dishes',
    portion: 'Portion', preparation: 'Preparation', pairing: 'Pairing',
    bookWithDish: 'Book with this dish', askConcierge: 'Ask the concierge',
    askAboutPrefix: 'Tell me about', askAboutSuffix: 'its flavour profile and the best pairing.',

    // Menu section
    cutBookEyebrow: 'THE ÉTOILE CUT BOOK', turnUpHeat: 'Turn up the heat.',
    selections: 'selections', allPricesIn: 'all prices in',
    all: 'All', chefsChoice: "Chef's choice", glutenFree: 'Gluten-free',
    searchMenu: 'Search the menu', searchPlaceholder: 'Search Wagyu, truffle…',

    // Visit
    salonTitle: 'Salon Privé Royal',
    salonLedePrefix: 'Eight to sixteen guests, in complete privacy at',
    salonLedeSuffix: 'Executive Chef Laurent Beaumont writes a bespoke five-course menu, with a dedicated sommelier.',
    requestSalon: 'Request the Salon Privé',
    openingHours: 'Opening hours', dressCode: 'Dress code', questions: 'Questions',
    reserveYourTable: 'Reserve your table',
    reserveLede: 'Tell us when and how many. We confirm every request personally.',
    footerHours: 'Tue–Fri 18:00–23:30 · Sat 12:00–15:00 & 18:00–00:00 · Sun 18:00–22:30 · Closed Mondays',

    // Concierge
    launchSommelier: '✦ Ask the Sommelier',
    greeting: "Bonsoir. I'm your ÉTOILE ROYALE sommelier. Tell me what you love—rich and buttery, lean and tender, or bold and smoky—and I'll find your cut, doneness and perfect pairing.",
    quick1: 'I love a rich, buttery steak', quick2: 'Pair a cut with a bold red',
    quick3: 'Build me a full steak dinner', quick4: 'I prefer something lean and tender',
    placeholder: 'Tell us what you crave: rich, lean, smoky…',
    chatTitle: 'Your night, well done.', chefTable: "CHEF’S TABLE", bestAt: 'BEST AT',
    explore: 'Explore', addToReservation: 'Add to reservation',
    typing: 'Reading your palate and finding the right pour…',
    errorSuffix: 'Showing a menu-based answer instead.', send: 'Send',
    messageLabel: 'Message to the concierge',
    providerLive: 'LIVE AI · tailored to your palate',
    providerHouseError: 'HOUSE MODE · local menu guide',
    providerConnecting: 'Connecting to your restaurant AI',
    providerHouseIdle: 'HOUSE MODE · connect your AI endpoint',
    aiTooLong: 'The AI sommelier took too long to reply.',
    serviceUnavailable: 'The concierge service could not be reached. Run npm run dev (proxy + site) and check DEEPSEEK_API_KEY.',
    micUnsupported: 'This browser does not support the microphone.',
    voiceConnecting: 'Connecting to Deepgram…',
    voiceRecording: 'Recording… press mic to stop.',
    voiceTranscribing: 'Waiting for the final transcript…',
    voiceNotHeard: 'No speech detected. Move closer to the mic and try again.',
    micPermissionDenied: 'Microphone permission denied or unavailable.',
    deepgramConnectFailed: 'Could not connect to Deepgram. Check the Deepgram API key and internet.',
    deepgramDisconnected: 'Deepgram connection lost. Recognized text is in the input.',
    deepgramKeyPrompt: 'Paste your Deepgram API key (for voice input):',

    // Toasts
    toastAddedReservation: 'added to your reservation request.',

    // Accounts, cart & checkout
    account: 'Account', signIn: 'Sign in', signOut: 'Sign out', adminBadge: 'ADMIN',
    authTitle: 'Welcome back.',
    authSubtitle: 'Sign in to save bookings and see your orders. Ordering from the menu stays open to everyone.',
    signInToBook: 'Sign in to book your table',
    authRequiredBookingBody: 'Bookings are a long-term arrangement, so we keep them tied to an account. Ordering food never requires an account.',
    signInTab: 'Sign in', signUpTab: 'Create account', createAccount: 'Create account',
    password: 'Password', or: 'or', authFillRequired: 'Please complete every field.',
    authInvalid: 'That email and password did not match.',
    authConfirm: 'Please confirm your email before signing in.',
    authExists: 'An account with this email already exists.',
    authWeakPassword: 'Use a longer password (at least 6 characters).',
    authUnavailable: 'Email login needs Supabase configuration. Use a demo account below for now.',
    authGeneric: 'Could not sign in. Please try again.',
    checkYourEmail: 'Check your inbox to confirm your email, then sign in.',
    demoAccounts: 'DEMO ACCOUNTS (THIS BROWSER)',
    continueAsMember: 'Continue as member', continueAsAdmin: 'Continue as admin',
    demoNote: 'Demo accounts live only in this browser and show how member/admin access works.',
    continueAsGuest: 'Continue as guest',
    guestCheckoutNote: 'Guests can add dishes to the cart and pay without signing in.',
    signedInAs: 'Signed in as', roleMember: 'Member', roleAdmin: 'Admin',
    yourOrder: 'YOUR ORDER', cartTitle: 'Your cart', closeCart: 'Close cart',
    cartEmpty: 'Your cart is empty', cartEmptyBody: 'Add a cut from the menu — no account needed.',
    browseMenu: 'Explore the menu', addToCart: 'Add to cart', addedToCart: 'added to your cart.',
    remove: 'Remove', quantity: 'Quantity', decrease: 'Decrease quantity', increase: 'Increase quantity',
    subtotal: 'Subtotal', cartCurrencyNote: 'Prices follow your chosen currency; Midtrans settles in Rupiah.',
    checkout: 'Checkout', continueShopping: 'Continue shopping', clearCart: 'Clear cart',
    secureCheckout: 'SANDBOX CHECKOUT', checkoutTitle: 'Almost at the fire.',
    checkoutSubtitle: 'Review your order and pay securely. No account required.',
    contactDetails: 'Contact details', orderNotes: 'Notes for the kitchen',
    orderNotesPlaceholder: 'Allergies, steak doneness…',
    checkoutFillRequired: 'Please add your name, email and phone number.',
    orderSummary: 'Order summary', total: 'Total',
    paymentNote: 'Payments are processed in IDR through Midtrans Sandbox.',
    demoPaymentNote: 'Midtrans keys are not configured here. This demo will mark the order as “demo paid” without a real charge.',
    payWithMidtrans: 'Pay with Midtrans', runDemoPayment: 'Run sandbox demo payment',
    processing: 'Processing…', paymentFailed: 'Payment was not completed. Please try again.',
    backToCart: 'Back to cart', done: 'Done', orderPlaced: 'ORDER RECEIVED',
    orderRef: 'Order reference', status: 'Status',
    paidTitle: 'Payment confirmed.', paidNote: 'Your sandbox payment was verified. A receipt is available in the Midtrans dashboard.',
    pendingTitle: 'Payment pending.', pendingNote: 'Complete the payment in Midtrans to confirm your order.',
    demoPaidTitle: 'Demo payment complete.',
    demoPaidNote: 'No real charge was made. This order is marked as demo paid for the prototype.',
    adminTitle: 'Orders & bookings', adminSubtitle: 'Signed in as', ordersTab: 'Orders',
    bookingsTab: 'Bookings', refresh: 'Refresh', revenue: 'Revenue (IDR)',
    paidOrders: 'Paid orders', pendingOrders: 'Pending', bookingRequests: 'Booking requests',
    noOrders: 'No orders yet.', noBookings: 'No booking requests yet.',

    // Admin console
    dashboard: 'Dashboard', categories: 'Categories', products: 'Products',
    profileSettings: 'Restaurant profile', adminGateBody: 'Sign in with an admin account to manage orders, bookings and the menu.',
    adminGateReason: 'Sign in as an admin to open the dashboard.', backToSite: 'Back to site',
    loading: 'Loading…', storageSource: 'Data source', demoData: 'Demo data',
    overviewEyebrow: 'SERVICE OVERVIEW', dashboardLede: 'A quiet, complete view of service and the carte.',
    recentOrders: 'Recent orders', recentBookings: 'Recent bookings', viewAll: 'View all',
    quickActions: 'Quick actions', newProduct: 'New product', newCategory: 'New category',
    editProfile: 'Edit profile', editCategory: 'Edit category', editProduct: 'Edit product',
    categoryId: 'Category ID', categoryName: 'Name (EN)', categoryNameId: 'Name (ID)',
    sortOrder: 'Sort order', active: 'Active', inactive: 'Inactive', edit: 'Edit',
    save: 'Save', cancel: 'Cancel', deleteConfirm: 'Delete this?', deleted: 'Deleted.', saved: 'Saved.',
    category: 'Category', priceEur: 'Price (EUR)', imageUrl: 'Image URL', dishType: 'Dish type',
    description: 'Description (EN)', descriptionId: 'Description (ID)', weight: 'Weight / portion',
    provenance: 'Provenance',
    onePerLine: 'one per line', imagePreviewNote: 'Preview uses the current photo. Set an image URL to replace it.',
    productName: 'Product name', productId: 'Product ID', autoGenerated: 'auto-generated',
    profileLede: 'These details appear on the landing page, reservations and concierge replies.',
    restaurantName: 'Restaurant name', tagline: 'Tagline (EN)', taglineId: 'Tagline (ID)',
    address: 'Address', heroImage: 'Hero image URL', dressCodeId: 'Dress code (ID)',
    saveChanges: 'Save changes',
    bookingLoginTitle: 'Booking needs an account',
    bookingLoginBody: 'Sign in to send your table request. You can still order food as a guest.',
    bookingSaved: 'Your booking request was saved. We will confirm by email.',

    // Menu flipbook
    tastingNotes: 'Tasting notes', addToBooking: 'Add to booking',
    noCuts: 'No cuts match those filters.', clearFilters: 'Clear filters',
    previous: 'Previous', next: 'Next', carte: 'CARTE',
    swipeHint: 'Swipe, use the page corners, or navigate the carte.',

    // Dish modal
    ingredients: 'Ingredients', flavour: 'Flavour', allergens: 'Allergens',

    // Reservation form
    errorRequired: 'Please add your name, email, phone number and a date.',
    errorClosedMonday: 'ÉTOILE ROYALE is closed on Mondays. Please choose Tuesday to Sunday.',
    errorPastDate: 'Please choose today or a later date.',
    reservationRequest: 'Reservation request',
    name: 'Name', email: 'Email', phone: 'Phone', date: 'Date', party: 'Party',
    seating: 'Seating', dishOfInterest: 'Dish of interest', notes: 'Notes', none: 'None',
    pickService: 'PICK YOUR SERVICE', chooseSeating: 'Choose a seating',
    confirmedPersonally: 'Requests confirmed personally',
    longLunch: 'Long lunch', saturdayHours: 'Saturday · 12:00–15:00',
    firelightDinner: 'Firelight dinner', dinnerHours: 'Tue–Sun · 18:00 onwards',
    tableMood: 'Table mood', grillSide: 'Grill-side', velvetBooth: 'Velvet booth', grandSalon: 'Grand salon',
    fullName: 'Full name', yourName: 'Your Name',
    dateLabel: 'Date (closed Mondays)', seatingTime: 'Seating time', closedMondays: 'Closed on Mondays',
    partySize: 'Party size', seatingLabel: 'Seating',
    allergiesRequests: 'Allergies and special requests',
    allergiesPlaceholder: 'Allergies, vegetarian risotto, steak doneness…',
    prepareEmail: 'Prepare reservation email',
    emailNote: 'This opens your email app with the request written out. The restaurant confirms by reply; nothing is booked until then.',
    yourRequest: 'Your request', guest: 'Guest', notEntered: 'Not yet entered',
    when: 'When', chooseDate: 'Choose a date', closedSummary: 'closed', dish: 'Dish',
    preparedNoteA: 'Your email app should now be open with the request ready to send. If nothing opened, write to',
    preparedNoteB: 'or call',

    // Landing page
    lpNavStory: 'Our story', lpNavMenu: 'The menu', lpNavVisit: 'Visit',
    lpEyebrow: 'BINCHOTAN · DRY-AGED · LUXEMBOURG CITY',
    lpHeadlineA: 'Where fire', lpHeadlineB: 'becomes', lpHeadlineC: 'flavour.',
    lpSubhead: 'Miyazaki A5 Wagyu. 45-day dry-aged Tomahawk. A five-course tasting that unfolds like a performance, 26 Rue Notre-Dame, Luxembourg.',
    lpEnter: 'Enter the restaurant', lpDiscover: 'Discover more', lpScroll: 'Scroll',
    stat1: 'Miyazaki Wagyu Grade', stat2: 'Days Dry-Aged', stat3: 'Binchotan Sear Temp', stat4: 'Luxembourg Rating',
    quoteAria: 'Press quotes', storyEyebrow: 'OUR STORY',
    storyTitleA: 'A kitchen built on', storyTitleB: 'obsession.',
    storyBodyA: 'Executive Chef Laurent Beaumont spent three years in Hokkaido studying the art of binchotan fire before opening Étoile Royale in the heart of Ville Haute. Every decision — from the Himalayan salt dry-age chamber to the custom charcoal grate angle — exists to serve one idea: the most honest, most intense expression of a great cut of beef.',
    storyBodyB: 'The room is intimate by design. 36 seats, candlelit marble, and a sommelier who treats your glass with the same care your steak receives over the coals.',
    seeFullMenu: 'See the full menu', chefImageAlt: 'Chef tending to steaks over binchotan charcoal',
    estLabel: 'Est. Luxembourg, 2019',
    featuresEyebrow: 'THE ÉTOILE DIFFERENCE', featuresTitle: 'Every detail, deliberate.',
    feature1Title: 'Live Binchotan Fire', feature1Desc: 'Every steak finishes over Kishu Binchotan charcoal at 850°C — the same wood charcoal used in Kyoto’s finest yakitori.',
    feature2Title: 'AI Sommelier', feature2Desc: 'Describe what you love — bold, buttery, smoky — and your personal concierge curates the perfect cut, temperature and wine pairing.',
    feature3Title: 'Himalayan Salt Chamber', feature3Desc: 'Our 45-day dry-age room is lined with Himalayan pink salt bricks, drawing moisture from the air to concentrate every ounce of flavour.',
    feature4Title: 'Single-Origin Provenance', feature4Desc: 'Miyazaki Prefecture A5 Wagyu, Scottish Highlands Black Angus, and Charolais Heritage from France — named, traced, and tasted.',
    menuTeaserEyebrow: 'THE CUT BOOK', menuTitleA: 'Eight cuts.', menuTitleB: 'One obsession.',
    menuBodyA: 'From a silky Charolais Filet Mignon at €68 to the showstopping Royal Tomahawk at €120 — every cut is dry-aged in-house and accompanied by house-made sauces, seasonal sides and a thoughtfully chosen wine pairing.',
    menuBodyB: 'The Royal Experience (€145) brings everything to the table in five deliberate courses, orchestrated by Chef Beaumont personally.',
    exploreMenu: 'Explore the interactive menu',
    menuNote: 'Browse the cuts · tap each dish · ask the AI sommelier',
    tagChef: "Chef's favourite", tagDry: '45-day dry-aged', tagGold: '24k gold leaf', tagFive: '5-course tasting',
    findUs: 'FIND US', lpVisitTitle: 'Luxembourg City',
    reserveTitle: 'Reserve your table',
    reserveBody: 'Every reservation is confirmed personally. For the Salon Privé Royal (8–16 guests), our sommelier composes a bespoke menu.',
    reserveNow: 'Reserve now →', dressCodeNote: 'Dress code: Smart Elegant',
    footerRights: '© 2025 Étoile Royale. All rights reserved.'
  },

  ID: {
    // Header / navigation
    skipToContent: 'Lewati ke konten',
    navRestaurant: 'Restoran', navTable: 'Meja', navMenu: 'Menu',
    navVisit: 'Kunjungi', navReservations: 'Reservasi',
    light: 'Terang', dark: 'Gelap', lightTheme: 'Tema terang', darkTheme: 'Tema gelap',
    concierge: 'Concierge', reserve: 'Pesan', close: 'Tutup', menuButton: 'Menu',
    language: 'Bahasa', currency: 'Mata uang',
    langIndonesian: 'Bahasa Indonesia', langEnglish: 'English',
    currencyRupiah: 'Rupiah', currencyDollar: 'Dolar AS',

    // Hero
    heroEyebrow: 'BINCHOTAN • MATURASI KERING • LUKSEMBURG',
    heroTitleA: 'Sedikit api.', heroTitleB: 'Banyak', heroTitleEm: 'karakter.',
    heroLede: 'Miyazaki A5, maturasi kering 45 hari, dan teatrik api langsung di jantung Ville Haute.',
    reserveTable: 'Pesan meja', viewMenu: 'Lihat menu',
    teaserTitle: 'Temui sommelier AI Anda', teaserSub: 'Ceritakan selera Anda. Temukan potongan daging yang tepat.',

    // Spotlight / lightweight showcase
    showcaseAria: 'Hidangan unggulan',
    portion: 'Porsi', preparation: 'Penyiapan', pairing: 'Padanan',
    bookWithDish: 'Pesan dengan hidangan ini', askConcierge: 'Tanya concierge',
    askAboutPrefix: 'Ceritakan tentang', askAboutSuffix: 'profil rasanya dan padanan terbaiknya.',

    // Menu section
    cutBookEyebrow: 'BUKU POTONGAN ÉTOILE', turnUpHeat: 'Nyalakan apinya.',
    selections: 'pilihan', allPricesIn: 'semua harga dalam',
    all: 'Semua', chefsChoice: 'Pilihan koki', glutenFree: 'Bebas gluten',
    searchMenu: 'Cari di menu', searchPlaceholder: 'Cari Wagyu, truffle…',

    // Visit
    salonTitle: 'Salon Privé Royal',
    salonLedePrefix: 'Delapan hingga enam belas tamu, sepenuhnya pribadi di',
    salonLedeSuffix: 'Executive Chef Laurent Beaumont menyusun menu khusus lima hidangan dengan sommelier tersendiri.',
    requestSalon: 'Minta Salon Privé',
    openingHours: 'Jam buka', dressCode: 'Aturan berpakaian', questions: 'Pertanyaan',
    reserveYourTable: 'Pesan meja Anda',
    reserveLede: 'Beritahu kami kapan dan berapa orang. Setiap permintaan kami konfirmasi langsung.',
    footerHours: 'Sel–Jum 18.00–23.30 · Sab 12.00–15.00 & 18.00–00.00 · Min 18.00–22.30 · Tutup Senin',

    // Concierge
    launchSommelier: '✦ Tanya Sommelier',
    greeting: 'Selamat malam. Saya sommelier ÉTOILE ROYALE Anda. Ceritakan selera Anda—kaya dan bermentega, tanpa lemak dan empuk, atau berani dan berasap—dan saya akan menemukan potongan, tingkat kematangan, dan padanan yang sempurna.',
    quick1: 'Saya suka steak yang kaya dan bermentega', quick2: 'Padankan potongan dengan merah yang berani',
    quick3: 'Susun makan malam steak lengkap untuk saya', quick4: 'Saya lebih suka yang tanpa lemak dan empuk',
    placeholder: 'Ceritakan keinginan Anda: kaya, tanpa lemak, berasap…',
    chatTitle: 'Malam Anda, sempurna.', chefTable: 'MEJA KOKI', bestAt: 'SAJI PADA',
    explore: 'Jelajahi', addToReservation: 'Tambah ke reservasi',
    typing: 'Membaca selera Anda dan mencari padanan yang tepat…',
    errorSuffix: 'Menampilkan jawaban berbasis menu.', send: 'Kirim',
    messageLabel: 'Pesan untuk concierge',
    providerLive: 'AI LANGSUNG · disesuaikan dengan selera Anda',
    providerHouseError: 'MODE RUMAH · panduan menu lokal',
    providerConnecting: 'Menghubungkan ke AI restoran Anda',
    providerHouseIdle: 'MODE RUMAH · hubungkan endpoint AI Anda',
    aiTooLong: 'Sommelier AI terlalu lama menjawab.',
    serviceUnavailable: 'Layanan concierge tidak dapat dihubungi. Jalankan npm run dev (proxy + situs) dan cek DEEPSEEK_API_KEY.',
    micUnsupported: 'Browser ini tidak mendukung mikrofon.',
    voiceConnecting: 'Menyambungkan ke Deepgram…',
    voiceRecording: 'Merekam… tekan mic untuk berhenti.',
    voiceTranscribing: 'Menunggu teks terakhir…',
    voiceNotHeard: 'Suara tidak terdengar jelas. Dekatkan mikrofon, lalu coba lagi.',
    micPermissionDenied: 'Izin mikrofon ditolak atau mikrofon tidak tersedia.',
    deepgramConnectFailed: 'Gagal tersambung ke Deepgram. Periksa API key Deepgram dan koneksi internet.',
    deepgramDisconnected: 'Sambungan ke Deepgram terputus. Teks yang sudah terdengar ada di kolom pertanyaan.',
    deepgramKeyPrompt: 'Tempel API key Deepgram (untuk input suara):',

    // Toasts
    toastAddedReservation: 'ditambahkan ke permintaan reservasi Anda.',

    // Akun, keranjang & checkout
    account: 'Akun', signIn: 'Masuk', signOut: 'Keluar', adminBadge: 'ADMIN',
    authTitle: 'Selamat datang kembali.',
    authSubtitle: 'Masuk untuk menyimpan reservasi dan melihat pesanan. Memesan dari menu tetap terbuka untuk semua.',
    signInToBook: 'Masuk untuk memesan meja',
    authRequiredBookingBody: 'Reservasi adalah kesepakatan jangka panjang, sehingga harus terikat dengan akun. Memesan makanan tidak memerlukan akun.',
    signInTab: 'Masuk', signUpTab: 'Buat akun', createAccount: 'Buat akun',
    password: 'Kata sandi', or: 'atau', authFillRequired: 'Mohon lengkapi semua kolom.',
    authInvalid: 'Email dan kata sandi tidak cocok.',
    authConfirm: 'Mohon konfirmasi email Anda sebelum masuk.',
    authExists: 'Akun dengan email ini sudah ada.',
    authWeakPassword: 'Gunakan kata sandi lebih panjang (minimal 6 karakter).',
    authUnavailable: 'Login email memerlukan konfigurasi Supabase. Untuk sementara, gunakan akun demo di bawah.',
    authGeneric: 'Gagal masuk. Mohon coba lagi.',
    checkYourEmail: 'Cek kotak masuk untuk mengonfirmasi email, lalu masuk.',
    demoAccounts: 'AKUN DEMO (BROWSER INI)',
    continueAsMember: 'Lanjut sebagai anggota', continueAsAdmin: 'Lanjut sebagai admin',
    demoNote: 'Akun demo hanya ada di browser ini dan menunjukkan akses anggota/admin.',
    continueAsGuest: 'Lanjut sebagai tamu',
    guestCheckoutNote: 'Tamu dapat menambah hidangan ke keranjang dan membayar tanpa masuk.',
    signedInAs: 'Masuk sebagai', roleMember: 'Anggota', roleAdmin: 'Admin',
    yourOrder: 'PESANAN ANDA', cartTitle: 'Keranjang Anda', closeCart: 'Tutup keranjang',
    cartEmpty: 'Keranjang Anda kosong', cartEmptyBody: 'Tambahkan potongan dari menu — tanpa perlu akun.',
    browseMenu: 'Jelajahi menu', addToCart: 'Tambah ke keranjang', addedToCart: 'ditambahkan ke keranjang Anda.',
    remove: 'Hapus', quantity: 'Jumlah', decrease: 'Kurangi jumlah', increase: 'Tambah jumlah',
    subtotal: 'Subtotal', cartCurrencyNote: 'Harga mengikuti mata uang pilihan Anda; Midtrans menagih dalam Rupiah.',
    checkout: 'Checkout', continueShopping: 'Belanja lagi', clearCart: 'Kosongkan keranjang',
    secureCheckout: 'CHECKOUT SANDBOX', checkoutTitle: 'Hampir sampai di api.',
    checkoutSubtitle: 'Periksa pesanan dan bayar dengan aman. Akun tidak diperlukan.',
    contactDetails: 'Data kontak', orderNotes: 'Catatan untuk dapur',
    orderNotesPlaceholder: 'Alergi, kematangan steak…',
    checkoutFillRequired: 'Mohon isi nama, email, dan nomor telepon.',
    orderSummary: 'Ringkasan pesanan', total: 'Total',
    paymentNote: 'Pembayaran diproses dalam IDR melalui Midtrans Sandbox.',
    demoPaymentNote: 'Kunci Midtrans belum diatur. Demo ini akan menandai pesanan sebagai “demo dibayar” tanpa tagihan nyata.',
    payWithMidtrans: 'Bayar dengan Midtrans', runDemoPayment: 'Jalankan pembayaran demo sandbox',
    processing: 'Memproses…', paymentFailed: 'Pembayaran belum selesai. Mohon coba lagi.',
    backToCart: 'Kembali ke keranjang', done: 'Selesai', orderPlaced: 'PESANAN DITERIMA',
    orderRef: 'Nomor pesanan', status: 'Status',
    paidTitle: 'Pembayaran dikonfirmasi.', paidNote: 'Pembayaran sandbox Anda terverifikasi. Struk tersedia di dashboard Midtrans.',
    pendingTitle: 'Pembayaran tertunda.', pendingNote: 'Selesaikan pembayaran di Midtrans untuk mengonfirmasi pesanan.',
    demoPaidTitle: 'Pembayaran demo selesai.',
    demoPaidNote: 'Tidak ada tagihan nyata. Pesanan ini ditandai sebagai demo dibayar untuk prototipe.',
    adminTitle: 'Pesanan & reservasi', adminSubtitle: 'Masuk sebagai', ordersTab: 'Pesanan',
    bookingsTab: 'Reservasi', refresh: 'Muat ulang', revenue: 'Pendapatan (IDR)',
    paidOrders: 'Pesanan dibayar', pendingOrders: 'Tertunda', bookingRequests: 'Permintaan reservasi',
    noOrders: 'Belum ada pesanan.', noBookings: 'Belum ada permintaan reservasi.',

    // Konsol admin
    dashboard: 'Dasbor', categories: 'Kategori', products: 'Produk',
    profileSettings: 'Profil restoran', adminGateBody: 'Masuk dengan akun admin untuk mengelola pesanan, reservasi, dan menu.',
    adminGateReason: 'Masuk sebagai admin untuk membuka dasbor.', backToSite: 'Kembali ke situs',
    loading: 'Memuat…', storageSource: 'Sumber data', demoData: 'Data demo',
    overviewEyebrow: 'RINGKASAN LAYANAN', dashboardLede: 'Tampilan layanan dan menu yang lengkap dan tenang.',
    recentOrders: 'Pesanan terbaru', recentBookings: 'Reservasi terbaru', viewAll: 'Lihat semua',
    quickActions: 'Aksi cepat', newProduct: 'Produk baru', newCategory: 'Kategori baru',
    editProfile: 'Edit profil', editCategory: 'Edit kategori', editProduct: 'Edit produk',
    categoryId: 'ID kategori', categoryName: 'Nama (EN)', categoryNameId: 'Nama (ID)',
    sortOrder: 'Urutan', active: 'Aktif', inactive: 'Nonaktif', edit: 'Ubah',
    save: 'Simpan', cancel: 'Batal', deleteConfirm: 'Hapus ini?', deleted: 'Terhapus.', saved: 'Tersimpan.',
    category: 'Kategori', priceEur: 'Harga (EUR)', imageUrl: 'URL gambar', dishType: 'Jenis hidangan',
    description: 'Deskripsi (EN)', descriptionId: 'Deskripsi (ID)', weight: 'Berat / porsi',
    provenance: 'Asal usul',
    onePerLine: 'satu per baris', imagePreviewNote: 'Pratinjau memakai foto saat ini. Isi URL gambar untuk menggantinya.',
    productName: 'Nama produk', productId: 'ID produk', autoGenerated: 'dibuat otomatis',
    profileLede: 'Detail ini tampil di halaman utama, reservasi, dan balasan concierge.',
    restaurantName: 'Nama restoran', tagline: 'Tagline (EN)', taglineId: 'Tagline (ID)',
    address: 'Alamat', heroImage: 'URL gambar hero', dressCodeId: 'Aturan berpakaian (ID)',
    saveChanges: 'Simpan perubahan',
    bookingLoginTitle: 'Reservasi memerlukan akun',
    bookingLoginBody: 'Masuk untuk mengirim permintaan meja. Anda tetap bisa memesan makanan sebagai tamu.',
    bookingSaved: 'Permintaan reservasi tersimpan. Kami akan mengonfirmasi lewat email.',

    // Menu flipbook
    tastingNotes: 'Catatan rasa', addToBooking: 'Tambah ke pemesanan',
    noCuts: 'Tidak ada potongan yang cocok dengan filter ini.', clearFilters: 'Hapus filter',
    previous: 'Sebelumnya', next: 'Berikutnya', carte: 'MENU',
    swipeHint: 'Geser, gunakan sudut halaman, atau jelajahi carte.',

    // Dish modal
    ingredients: 'Bahan', flavour: 'Rasa', allergens: 'Alergen',

    // Reservation form
    errorRequired: 'Mohon isi nama, email, nomor telepon, dan tanggal.',
    errorClosedMonday: 'ÉTOILE ROYALE tutup pada hari Senin. Mohon pilih Selasa hingga Minggu.',
    errorPastDate: 'Mohon pilih hari ini atau tanggal setelahnya.',
    reservationRequest: 'Permintaan reservasi',
    name: 'Nama', email: 'Email', phone: 'Telepon', date: 'Tanggal', party: 'Jumlah tamu',
    seating: 'Tempat duduk', dishOfInterest: 'Hidangan yang diminati', notes: 'Catatan', none: 'Tidak ada',
    pickService: 'PILIH WAKTU LAYANAN', chooseSeating: 'Pilih tempat duduk',
    confirmedPersonally: 'Permintaan dikonfirmasi langsung',
    longLunch: 'Makan siang panjang', saturdayHours: 'Sabtu · 12.00–15.00',
    firelightDinner: 'Makan malam bercahaya api', dinnerHours: 'Sel–Min · mulai 18.00',
    tableMood: 'Suasana meja', grillSide: 'Sisi panggangan', velvetBooth: 'Bangsal beludru', grandSalon: 'Salon utama',
    fullName: 'Nama lengkap', yourName: 'Nama Anda',
    dateLabel: 'Tanggal (tutup Senin)', seatingTime: 'Waktu duduk', closedMondays: 'Tutup Senin',
    partySize: 'Jumlah tamu', seatingLabel: 'Tempat duduk',
    allergiesRequests: 'Alergi dan permintaan khusus',
    allergiesPlaceholder: 'Alergi, risotto vegetarian, kematangan steak…',
    prepareEmail: 'Siapkan email reservasi',
    emailNote: 'Ini membuka aplikasi email Anda dengan permintaan yang sudah ditulis. Restoran mengonfirmasi lewat balasan; belum ada yang dipesan sampai saat itu.',
    yourRequest: 'Permintaan Anda', guest: 'Tamu', notEntered: 'Belum diisi',
    when: 'Kapan', chooseDate: 'Pilih tanggal', closedSummary: 'tutup', dish: 'Hidangan',
    preparedNoteA: 'Aplikasi email Anda sekarang seharusnya terbuka dengan permintaan siap dikirim. Jika tidak ada yang terbuka, tulis ke',
    preparedNoteB: 'atau telepon',

    // Landing page
    lpNavStory: 'Kisah kami', lpNavMenu: 'Menunya', lpNavVisit: 'Kunjungi',
    lpEyebrow: 'BINCHOTAN · MATURASI KERING · KOTA LUKSEMBURG',
    lpHeadlineA: 'Di mana api', lpHeadlineB: 'menjadi', lpHeadlineC: 'cita rasa.',
    lpSubhead: 'Wagyu Miyazaki A5. Tomahawk maturasi kering 45 hari. Lima hidangan yang terbentang seperti pertunjukan, 26 Rue Notre-Dame, Luksemburg.',
    lpEnter: 'Masuki restoran', lpDiscover: 'Jelajahi lagi', lpScroll: 'Gulir',
    stat1: 'Mutu Wagyu Miyazaki', stat2: 'Hari Maturasi Kering', stat3: 'Suhu Bakaran Binchotan', stat4: 'Peringkat Luksemburg',
    quoteAria: 'Kutipan pers', storyEyebrow: 'KISAH KAMI',
    storyTitleA: 'Dapur yang dibangun di atas', storyTitleB: 'obsesi.',
    storyBodyA: 'Executive Chef Laurent Beaumont menghabiskan tiga tahun di Hokkaido mempelajari seni api binchotan sebelum membuka Étoile Royale di jantung Ville Haute. Setiap keputusan — dari ruang maturasi garam Himalaya hingga sudut panggangan arang khusus — ada untuk satu gagasan: ekspresi paling jujur dan paling intens dari potongan daging sapi yang luar biasa.',
    storyBodyB: 'Ruangnya sengaja dibuat intim. 36 kursi, marmer bercahaya lilin, dan sommelier yang merawat gelas Anda dengan perhatian yang sama seperti steak Anda di atas bara.',
    seeFullMenu: 'Lihat menu lengkap', chefImageAlt: 'Koki merawat steak di atas arang binchotan',
    estLabel: 'Didirikan di Luksemburg, 2019',
    featuresEyebrow: 'PERBEDAAN ÉTOILE', featuresTitle: 'Setiap detail, disengaja.',
    feature1Title: 'Api Binchotan Langsung', feature1Desc: 'Setiap steak diselesaikan di atas arang Kishu Binchotan bersuhu 850°C — arang kayu yang sama dengan yakitori terbaik di Kyoto.',
    feature2Title: 'Sommelier AI', feature2Desc: 'Jelaskan selera Anda — berani, bermentega, berasap — dan concierge pribadi Anda memilih potongan, suhu, dan padanan anggur yang tepat.',
    feature3Title: 'Ruang Garam Himalaya', feature3Desc: 'Ruang maturasi kering 45 hari kami dilapisi bata garam merah muda Himalaya, menarik kelembapan dari udara untuk memusatkan setiap cita rasa.',
    feature4Title: 'Asal Usul Tunggal', feature4Desc: 'Wagyu A5 Prefektur Miyazaki, Black Angus Dataran Tinggi Skotlandia, dan Charolais Heritage dari Prancis — disebut, dilacak, dan dicicipi.',
    menuTeaserEyebrow: 'BUKU POTONGAN', menuTitleA: 'Delapan potongan.', menuTitleB: 'Satu obsesi.',
    menuBodyA: 'Dari Filet Mignon Charolais yang lembut seharga €68 hingga Royal Tomahawk yang menggemparkan seharga €120 — setiap potongan dimaturasi di rumah dan disajikan dengan saus buatan sendiri, lauk musiman, dan padanan anggur yang dipilih cermat.',
    menuBodyB: 'The Royal Experience (€145) menghadirkan semuanya di meja dalam lima hidangan yang disengaja, diorkestrasi langsung oleh Chef Beaumont.',
    exploreMenu: 'Jelajahi menu interaktif',
    menuNote: 'Jelajahi potongan · ketuk setiap hidangan · tanya sommelier AI',
    tagChef: 'Favorit koki', tagDry: 'Maturasi 45 hari', tagGold: 'Daun emas 24k', tagFive: 'Lima hidangan',
    findUs: 'TEMUKAN KAMI', lpVisitTitle: 'Kota Luksemburg',
    reserveTitle: 'Pesan meja Anda',
    reserveBody: 'Setiap reservasi dikonfirmasi langsung. Untuk Salon Privé Royal (8–16 tamu), sommelier kami menyusun menu khusus.',
    reserveNow: 'Pesan sekarang →', dressCodeNote: 'Aturan berpakaian: Smart Elegant',
    footerRights: '© 2025 Étoile Royale. Seluruh hak dilindungi.'
  }
};

const I18nContext = createContext(null);

function readStored(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => readStored('etoile.lang', DEFAULT_LANG));
  const [currency, setCurrencyState] = useState(() => readStored('etoile.currency', DEFAULT_CURRENCY));

  const activeLang = lang === 'ID' || lang === 'EN' ? lang : DEFAULT_LANG;
  const activeCurrency = currency === 'IDR' || currency === 'USD' ? currency : DEFAULT_CURRENCY;

  const setLang = (next) => {
    if (next !== 'ID' && next !== 'EN') return;
    setLangState(next);
    try { window.localStorage.setItem('etoile.lang', next); } catch { /* ignore */ }
  };
  const setCurrency = (next) => {
    if (next !== 'IDR' && next !== 'USD') return;
    setCurrencyState(next);
    try { window.localStorage.setItem('etoile.currency', next); } catch { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.lang = activeLang === 'ID' ? 'id' : 'en';
  }, [activeLang]);

  const value = useMemo(() => ({
    lang: activeLang,
    setLang,
    isId: activeLang === 'ID',
    currency: activeCurrency,
    setCurrency,
    t: (key) => formatEuroText(STRINGS[activeLang]?.[key] ?? STRINGS.EN[key] ?? key, activeCurrency),
    fmt: (eur) => formatPrice(eur, activeCurrency)
  }), [activeLang, activeCurrency]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>.');
  return context;
}
