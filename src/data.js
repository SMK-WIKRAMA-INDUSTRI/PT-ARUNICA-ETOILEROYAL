import { formatEuroText } from './currency.js';

export const RESTAURANT = {
  name: 'ÉTOILE ROYALE',
  tagline: 'Where Exceptional Taste Meets Royal Elegance.',
  taglineId: 'Di Mana Rasa Luar Biasa Bertemu Keanggunan Kerajaan.',
  address: '26 Rue Notre-Dame, L-2240 Luxembourg City',
  phone: '+352 27 86 44 10',
  email: 'concierge@etoileroyale.lu',
  dressCode:
    'Smart Elegant. Tailored evening attire is appreciated; sportswear and beachwear are politely declined.',
  dressCodeId:
    'Smart Elegant. Pakaian malam yang rapi sangat dihargai; pakaian olahraga dan pakaian pantai dengan sopan ditolak.'
};

export const HOURS = [
  ['Tuesday to Friday', '18:00 – 23:30'],
  ['Saturday', '12:00 – 15:00 & 18:00 – 00:00'],
  ['Sunday', '18:00 – 22:30'],
  ['Monday', 'Closed for private cellar curation']
];

export const HOURS_ID = [
  ['Selasa – Jumat', '18.00 – 23.30'],
  ['Sabtu', '12.00 – 15.00 & 18.00 – 00.00'],
  ['Minggu', '18.00 – 22.30'],
  ['Senin', 'Tutup untuk kurasi ruang bawah tanah pribadi']
];

export const CATEGORIES = ['Signature Steaks', 'Signature Beverages', 'Royal Desserts', "Chef's Special"];
export const CATEGORIES_ID = ['Steak Khas', 'Minuman Khas', 'Dessert Royal', 'Spesial Koki'];

export const MENU_DATA = [
  {
    id: 'wagyu-ribeye', name: 'Japanese A5 Wagyu Ribeye', category: 'Signature Steaks', price: 95,
    weight: '280g', recommendedTemp: 'Medium-Rare (54°C)', provenance: 'Miyazaki Prefecture, Japan (BMS 11–12)',
    chefRecommended: true, glutenFree: true, tableIndex: 0, dishType: 'wagyu',
    description: 'Snowflake-marbled Miyazaki A5 ribeye seared over 850°C Kishu Binchotan charcoal, crowned with Normandy smoked herb butter, fresh rosemary, and Maldon sea salt flakes.',
    ingredients: ['Miyazaki A5 Ribeye (BMS 12)', 'Normandy Cultured Herb Butter', 'Kishu Binchotan Sear', 'Maldon Sea Salt', 'Fresh Garden Rosemary'],
    flavorProfile: 'Velvety, umami-rich, buttery melt',
    pairing: 'Royal Berry Sparkle (€14) or Grand Cru Pomerol', allergens: 'Dairy',
    descriptionId: 'Ribeye Miyazaki A5 dengan marbling serupa salju, dibakar di atas arang Kishu Binchotan 850°C, lalu diberi mentega herba asap Normandia, rosemary segar, dan garam laut Maldon.',
    flavorProfileId: 'Lembut, kaya umami, meleleh seperti mentega',
    provenanceId: 'Prefektur Miyazaki, Jepang (BMS 11–12)',
    pairingId: 'Royal Berry Sparkle (€14) atau Grand Cru Pomerol', allergensId: 'Susy',
    ingredientsId: ['Ribeye Miyazaki A5 (BMS 12)', 'Mentega Herba Normandia', 'Bakaran Kishu Binchotan', 'Garam Laut Maldon', 'Rosemary Taman Segar']
  },
  {
    id: 'royal-tomahawk', name: 'Royal Tomahawk Steak', category: 'Signature Steaks', price: 120,
    weight: '950g (for 1–2 guests)', recommendedTemp: 'Medium-Rare (55°C)', provenance: 'Black Angus Reserve, Scottish Highlands',
    chefRecommended: true, glutenFree: true, tableIndex: 1, dishType: 'tomahawk',
    description: 'Dramatic 14-inch Frenched rib steak aged 45 days in our Himalayan pink salt chamber, served tableside with roasted bone marrow, glazed heirloom carrots, and aged Bordelaise.',
    ingredients: ['45-Day Dry-Aged Ribeye on Bone', 'Roasted Bone Marrow', 'Heirloom Baby Carrots', 'Shallot Bordelaise Jus', 'Fresh Rosemary'],
    flavorProfile: 'Deep nutty crust, bold beef essence, smoky',
    pairing: 'Golden Passion (€12) or Left Bank Bordeaux', allergens: 'Dairy, Sulphites',
    descriptionId: 'Steak iga 14 inci yang dipotong dramatis, diasamkan 45 hari dalam ruangan garam merah muda Himalaya, disajikan di meja dengan sumsum tulang panggang, wortel heirloom glasir, dan saus Bordelaise tua.',
    flavorProfileId: 'Kerak kacang yang dalam, esensi daging sapi yang kuat, berasap',
    provenanceId: 'Black Angus Reserve, Dataran Tinggi Skotlandia',
    pairingId: 'Golden Passion (€12) atau Bordeaux Left Bank', allergensId: 'Susy, Sulfit',
    ingredientsId: ['Ribeye 45 Hari dengan Tulang', 'Sumsum Tulang Panggang', 'Wortel Kecil Heirloom', 'Jus Bordelaise Bawang Merah', 'Rosemary Segar']
  },
  {
    id: 'classic-filet', name: 'Classic Filet Mignon', category: 'Signature Steaks', price: 68,
    weight: '240g', recommendedTemp: 'Medium-Rare (54°C)', provenance: 'Charolais Heritage Farms, France',
    chefRecommended: false, glutenFree: true, tableIndex: 2, dishType: 'filet',
    description: 'Center-cut Charolais beef tenderloin renowned for effortless tenderness, accompanied by silky pommes purée, charred cipollini onion, and green Kampot peppercorn cognac reduction.',
    ingredients: ['Center-Cut Charolais Tenderloin', 'Silky Pommes Purée', 'Green Kampot Peppercorn Jus', 'Charred Cipollini Onion', 'Thyme Infusion'],
    flavorProfile: 'Refined, silky tenderness, warm peppercorn',
    pairing: 'Lemon Royale (€10) or Burgundy Pinot Noir', allergens: 'Dairy, Sulphites',
    descriptionId: 'Tenderloin Charolais potongan tengah yang terkenal sangat empuk, disajikan dengan pommes purée sutra, bawang cipollini hangus, dan reduction cognac merica Kampot hijau.',
    flavorProfileId: 'Halus, empuk seperti sutra, merica hangat',
    provenanceId: 'Peternakan Heritage Charolais, Prancis',
    pairingId: 'Lemon Royale (€10) atau Burgundy Pinot Noir', allergensId: 'Susy, Sulfit',
    ingredientsId: ['Tenderloin Charolais Potongan Tengah', 'Pommes Purée Sutra', 'Jus Merica Kampot Hijau', 'Bawang Cipollini Hangus', 'Infusi Thyme']
  },
  {
    id: 'black-truffle-tenderloin', name: 'Black Truffle Tenderloin', category: 'Signature Steaks', price: 78,
    weight: '250g', recommendedTemp: 'Medium-Rare (54°C)', provenance: 'Limousin Reserve & Périgord Truffle',
    chefRecommended: true, glutenFree: true, tableIndex: 3, dishType: 'truffle',
    description: 'Prime tenderloin crowned with shaved Périgord black winter truffle, foie gras emulsion, wild morel jus, and a delicate whisper of 24-karat edible gold leaf.',
    ingredients: ['Limousin Beef Tenderloin', 'Périgord Black Winter Truffle', '24k Edible Gold Leaf', 'Wild Morel Reduction', 'Roasted Shallot Glaze'],
    flavorProfile: 'Earthy, aromatic, decadent forest notes',
    pairing: 'Emerald Matcha Latte (€11) or Aged Barolo', allergens: 'Dairy, Sulphites',
    descriptionId: 'Tenderloin utama ditaburi truffle hitam musim dingin Périgord, emulsi foie gras, jus morel liar, dan bisikan daun emas 24 karat yang dapat dimakan.',
    flavorProfileId: 'Bumi, aromatik, aroma hutan yang mewah',
    provenanceId: 'Reserve Limousin & Truffle Périgord',
    pairingId: 'Emerald Matcha Latte (€11) atau Barolo Tua', allergensId: 'Susy, Sulfit',
    ingredientsId: ['Tenderloin Sapi Limousin', 'Truffle Hitam Musim Dingin Périgord', 'Daun Emas 24k yang Dapat Dimakan', 'Reduction Morel Liar', 'Glasir Bawang Merah Panggang']
  },
  {
    id: 'royal-berry-sparkle', name: 'Royal Berry Sparkle', category: 'Signature Beverages', price: 14,
    weight: '220ml crystal goblet', recommendedTemp: 'Chilled (4°C)', provenance: 'Luxembourg Ardennes Berries & Crémant Essence',
    chefRecommended: false, glutenFree: true, tableIndex: 4, dishType: 'berry_drink',
    description: 'Effervescent ruby botanical aperitif crafted from crushed Ardennes blackberries, wild raspberries, hibiscus reduction, and dealcoholized Luxembourgish sparkling cuvée.',
    ingredients: ['Ardennes Blackberries & Raspberries', 'Hibiscus Petal Infusion', 'Botanical Sparkling Cuvée', 'Fresh Garden Mint', '24k Gold Rim Dust'],
    flavorProfile: 'Crisp, ruby tartness, floral effervescence',
    pairing: 'Palate cleanser with the Japanese A5 Wagyu Ribeye', allergens: 'None (alcohol-free)',
    descriptionId: 'Aperitif botanis ruby bergelembung dari blackberry Ardennes yang dihancurkan, raspberry liar, reduction hibiscus, dan cuvée bersoda Luksemburg tanpa alkohol.',
    flavorProfileId: 'Segar, asam ruby, busa bunga',
    provenanceId: 'Buah Beri Ardennes Luksemburg & Esens Crémant',
    pairingId: 'Penyegar langit-langit untuk Japanese A5 Wagyu Ribeye', allergensId: 'Tidak ada (tanpa alkohol)',
    ingredientsId: ['Blackberry & Raspberry Ardennes', 'Infusi Kelopak Hibiscus', 'Cuvée Botanis Bergelembung', 'Daun Mint Taman Segar', 'Debu Emas 24k di Bibir Gelas']
  },
  {
    id: 'golden-passion', name: 'Golden Passion', category: 'Signature Beverages', price: 12,
    weight: '240ml coupe', recommendedTemp: 'Chilled (5°C)', provenance: 'Madagascar Vanilla & Exotic Passionfruit',
    chefRecommended: false, glutenFree: true, tableIndex: null, dishType: 'drink',
    description: 'Sunlit passionfruit nectar shaken with Madagascar bourbon vanilla bean, cold-pressed Meyer lemon, ginger blossom mist, and shimmering champagne-gold dust.',
    ingredients: ['Fresh Passionfruit Pulp', 'Madagascar Vanilla Bean', 'Meyer Lemon Juice', 'Ginger Blossom Mist', 'Sparkling Spring Water'],
    flavorProfile: 'Vibrant tropical acid, warm vanilla finish',
    pairing: 'Complements the Royal Tomahawk Steak and Crème Brûlée', allergens: 'None (alcohol-free)',
    descriptionId: 'Nektar markisa yang cerah dikocok dengan polong vanili Bourbon Madagaskar, lemon Meyer dingin, semprotan bunga jahe, dan debu emas sampanye berkilau.',
    flavorProfileId: 'Asam tropis yang cerah, akhir vanili hangat',
    provenanceId: 'Vanili Madagaskar & Markisa Eksotis',
    pairingId: 'Melengkapi Royal Tomahawk Steak dan Crème Brûlée', allergensId: 'Tidak ada (tanpa alkohol)',
    ingredientsId: ['Pulp Markisa Segar', 'Polong Vanili Madagaskar', 'Jus Lemon Meyer', 'Semprotan Bunga Jahe', 'Air Soda Sprinkle']
  },
  {
    id: 'emerald-matcha-latte', name: 'Emerald Matcha Latte', category: 'Signature Beverages', price: 11,
    weight: '200ml porcelain vessel', recommendedTemp: 'Velvet warm (62°C) or iced', provenance: 'Uji, Kyoto, Japan',
    chefRecommended: false, glutenFree: true, tableIndex: null, dishType: 'drink',
    description: 'Stone-ground first-harvest Uji ceremonial matcha whisked to micro-foam perfection with organic oat or Hokkaido milk and a touch of white acacia honey.',
    ingredients: ['Uji Ceremonial Grade Matcha', 'Organic Oat or Hokkaido Milk', 'Luxembourg Acacia Honey', 'Bamboo Chasen Micro-Foam'],
    flavorProfile: 'Silky umami, vegetal sweetness, calm finish',
    pairing: 'Pairs with the Raspberry Pistachio Royale', allergens: 'Optional dairy (oat available)',
    descriptionId: 'Matcha upacara Uji penggilingan batu dikocok hingga micro-foam sempurna dengan oat organik atau susu Hokkaido dan sentuhan madu akasia putih.',
    flavorProfileId: 'Umami sutra, manis sayur, akhir yang tenang',
    provenanceId: 'Uji, Kyoto, Jepang',
    pairingId: 'Pasangan untuk Raspberry Pistachio Royale', allergensId: 'Susy opsional (oat tersedia)',
    ingredientsId: ['Matcha Upacara Kelas Satu Uji', 'Oat Organik atau Susu Hokkaido', 'Madu Akasia Luksemburg', 'Micro-Foam Bambu Chasen']
  },
  {
    id: 'lemon-royale', name: 'Lemon Royale', category: 'Signature Beverages', price: 10,
    weight: '250ml highball', recommendedTemp: 'Ice-chilled (3°C)', provenance: 'Amalfi Coast Lemons & Moselle Thyme',
    chefRecommended: false, glutenFree: true, tableIndex: null, dishType: 'drink',
    description: 'Hand-pressed Amalfi lemon elixir infused with wild Moselle lemon thyme, white verbena cordial, and crystal-clear artisanal tonic.',
    ingredients: ['Amalfi Coast Lemon Zest & Juice', 'Moselle Lemon Thyme', 'White Verbena Cordial', 'Artisanal Botanical Tonic'],
    flavorProfile: 'Zesty citrus, herbaceous, refreshingly dry',
    pairing: 'Classic accompaniment to the Classic Filet Mignon', allergens: 'None (alcohol-free)',
    descriptionId: 'Eliksir lemon Amalfi yang diperas dengan tangan, diinfusi thyme lemon Moselle liar, cordial verbena putih, dan tonik artisan yang bening.',
    flavorProfileId: 'Jeruk menyegarkan, herba, kering menyegarkan',
    provenanceId: 'Lemon Pesisir Amalfi & Thyme Moselle',
    pairingId: 'Pendamping klasik Classic Filet Mignon', allergensId: 'Tidak ada (tanpa alkohol)',
    ingredientsId: ['Kulit & Jus Lemon Amalfi', 'Thyme Lemon Moselle', 'Cordial Verbena Putih', 'Tonik Botanis Artisan']
  },
  {
    id: 'midnight-chocolate-fondant', name: 'Midnight Chocolate Fondant', category: 'Royal Desserts', price: 18,
    weight: '190g, baked to order', recommendedTemp: 'Warm molten core', provenance: 'Valrhona Guanaja & Madagascar Vanilla',
    chefRecommended: true, glutenFree: false, tableIndex: 5, dishType: 'fondant',
    description: 'Warm dark Valrhona 72% chocolate cake revealing a molten velvet ganache core, paired with Madagascar vanilla bean gelato, raspberry coulis, and 24k gold leaf.',
    ingredients: ['Valrhona Guanaja 72% Dark Chocolate', 'Madagascar Vanilla Bean Gelato', 'Fresh Raspberry Coulis', 'Cocoa Nib Tuile', '24k Edible Gold Leaf'],
    flavorProfile: 'Intense bittersweet cocoa, warm and cold contrast',
    pairing: 'Emerald Matcha Latte (€11) or Vintage Tawny Port', allergens: 'Dairy, Eggs, Gluten',
    descriptionId: 'Kue cokelat hitam Valrhona 72% hangat dengan inti ganache cair, gelato vanili Madagaskar, coulis raspberry, dan daun emas 24k.',
    flavorProfileId: 'Cokelat pahit-manis pekat, kontras hangat–dingin',
    provenanceId: 'Valrhona Guanaja & Vanili Madagaskar',
    pairingId: 'Emerald Matcha Latte (€11) atau Port Tawny Vintage', allergensId: 'Susy, Telur, Gluten',
    ingredientsId: ['Cokelat Hitam Valrhona Guanaja 72%', 'Gelato Polong Vanili Madagaskar', 'Coulis Raspberry Segar', 'Tuile Biji Kakao', 'Daun Emas 24k yang Dapat Dimakan']
  },
  {
    id: 'parisian-creme-brulee', name: 'Parisian Crème Brûlée', category: 'Royal Desserts', price: 15,
    weight: '180g porcelain dish', recommendedTemp: 'Caramelized crust, chilled custard', provenance: 'Tahitian Vanilla & Normandy Cream',
    chefRecommended: false, glutenFree: true, tableIndex: null, dishType: 'brulee',
    description: 'Silky double-vanilla bean custard infused with Tahitian and Bourbon vanilla pods, torched tableside to a glass-like amber demerara sugar crust with fresh berries.',
    ingredients: ['Normandy Double Cream', 'Tahitian & Bourbon Vanilla Pods', 'Free-Range Organic Egg Yolks', 'Torched Amber Demerara Crust'],
    flavorProfile: 'Caramelized crunch, floral vanilla custard',
    pairing: 'Golden Passion (€12) or Sauternes', allergens: 'Dairy, Eggs',
    descriptionId: 'Custard vanili ganda yang sutra dengan polong vanili Tahiti dan Bourbon, dibakar di meja menjadi kerak gula demerara amber seperti kaca, dengan buah beri segar.',
    flavorProfileId: 'Kerak karamel renyah, custard vanili bunga',
    provenanceId: 'Vanili Tahiti & Krim Normandia',
    pairingId: 'Golden Passion (€12) atau Sauternes', allergensId: 'Susy, Telur',
    ingredientsId: ['Krim Ganda Normandia', 'Polong Vanili Tahiti & Bourbon', 'Kuning Telur Organik Kampung', 'Kerak Demerara Amber yang Dibakar']
  },
  {
    id: 'raspberry-pistachio-royale', name: 'Raspberry Pistachio Royale', category: 'Royal Desserts', price: 17,
    weight: '175g entremet', recommendedTemp: 'Chilled (6°C)', provenance: 'Bronte DOP Pistachios & Ardennes Raspberries',
    chefRecommended: false, glutenFree: false, tableIndex: 6, dishType: 'pistachio',
    description: 'Velvety Sicilian Bronte pistachio mousseline layered over crisp almond dacquoise, bright raspberry confit heart, glazed with emerald mirror sheen and gold leaf.',
    ingredients: ['Sicilian Bronte DOP Pistachio Paste', 'Ardennes Raspberry Confit', 'Almond Dacquoise Sponge', 'White Chocolate Velvet', '24k Gold Leaf'],
    flavorProfile: 'Roasted nutty depth, bright berry tartness',
    pairing: 'Royal Berry Sparkle (€14)', allergens: 'Tree nuts (pistachio, almond), Dairy, Eggs',
    descriptionId: 'Mousseline pistachio Bronte Sisilia yang lembut di atas dacquoise almond renyah, inti confit raspberry cerah, dilapisi kilau zamrud dan daun emas.',
    flavorProfileId: 'Kacang panggang yang dalam, asam buah beri cerah',
    provenanceId: 'Pistachio DOP Bronte & Raspberry Ardennes',
    pairingId: 'Royal Berry Sparkle (€14)', allergensId: 'Kacang pohon (pistachio, almond), Susy, Telur',
    ingredientsId: ['Pasta Pistachio DOP Bronte Sisilia', 'Confit Raspberry Ardennes', 'Spons Dacquoise Almond', 'Velvet Cokelat Putih', 'Daun Emas 24k']
  },
  {
    id: 'golden-mille-feuille', name: 'Golden Mille-Feuille', category: 'Royal Desserts', price: 16,
    weight: '170g layered pastry', recommendedTemp: 'Crisp and chilled', provenance: 'Isigny Butter Puff & Diplomat Cream',
    chefRecommended: false, glutenFree: false, tableIndex: null, dishType: 'dessert',
    description: 'A thousand caramelized layers of Isigny butter puff pastry interleaved with airy vanilla-tonka diplomat cream and salted butterscotch drizzle.',
    ingredients: ['Caramelized Isigny Puff Pastry', 'Vanilla-Tonka Diplomat Cream', 'Salted Normandy Butterscotch', 'Toasted Hazelnut Praline'],
    flavorProfile: 'Shattering crisp pastry, aromatic tonka cream',
    pairing: 'Lemon Royale (€10) or Espresso', allergens: 'Gluten, Dairy, Eggs, Tree nuts',
    descriptionId: 'Seribu lapisan pastry puff mentega Isigny yang dikaramelkan, diisi krim diplomat vanili-tonka yang ringan dan sirup butterscotch mentega asin.',
    flavorProfileId: 'Pastry renyah pecah, krim tonka aromatik',
    provenanceId: 'Puff Mentega Isigny & Krim Diplomat',
    pairingId: 'Lemon Royale (€10) atau Espresso', allergensId: 'Gluten, Susy, Telur, Kacang pohon',
    ingredientsId: ['Pastry Puff Isigny yang Dikaramelkan', 'Krim Diplomat Vanili-Tonka', 'Butterscotch Mentega Asin Normandia', 'Praline Hazelnut Panggang']
  },
  {
    id: 'the-royal-experience', name: 'The Royal Experience', category: "Chef's Special", price: 145,
    weight: '5-course tasting, per person', recommendedTemp: 'Orchestrated service', provenance: 'Curated by Executive Chef Laurent Beaumont',
    chefRecommended: true, glutenFree: false, tableIndex: 7, dishType: 'royal_experience',
    description: 'Our flagship five-course degustation: Complimentary Chef’s Amuse-Bouche, Japanese Wagyu tasting portion, Parmesan Truffle Risotto, Royal Berry Sparkle, and Midnight Chocolate Fondant.',
    ingredients: ["Complimentary Chef's Amuse-Bouche", 'Japanese Wagyu Tasting Portion', 'Parmesan Truffle Risotto', 'Royal Berry Sparkle', 'Midnight Chocolate Fondant'],
    flavorProfile: 'A complete five-course progression',
    pairing: 'Includes Royal Berry Sparkle; optional sommelier flight (+€65)',
    allergens: 'Dairy, Eggs, Gluten (vegetarian risotto adaptation available)',
    descriptionId: 'Degustasi unggulan lima hidangan: Amuse-Bouche dari koki, porsi mencicipi Wagyu Jepang, Risotto Parmesan Truffle, Royal Berry Sparkle, dan Midnight Chocolate Fondant.',
    flavorProfileId: 'Progresi lengkap lima hidangan',
    provenanceId: 'Diracik oleh Executive Chef Laurent Beaumont',
    pairingId: 'Termasuk Royal Berry Sparkle; flight sommelier opsional (+€65)',
    allergensId: 'Susy, Telur, Gluten (adaptasi risotto vegetarian tersedia)',
    ingredientsId: ["Amuse-Bouche Koki", 'Porsi Mencicipi Wagyu Jepang', 'Risotto Parmesan Truffle', 'Royal Berry Sparkle', 'Midnight Chocolate Fondant']
  }
];

export const FAQ_ITEMS = [
  {
    q: 'Do you offer vegetarian or allergy-friendly options?',
    a: 'Yes. Executive Chef Laurent Beaumont prepares an Aged Parmesan & Périgord Black Truffle Risotto for vegetarian guests on request. The four Signature Steaks and the Signature Beverages are naturally gluten-free. Please list any allergy in your reservation notes.',
    qId: 'Apakah Anda menyediakan pilihan vegetarian atau ramah alergi?',
    aId: 'Ya. Executive Chef Laurent Beaumont menyiapkan Risotto Parmesan Tua & Truffle Hitam Périgord untuk tamu vegetarian sesuai permintaan. Keempat Steak Khas dan Minuman Khas secara alami bebas gluten. Mohon cantumkan alergi apa pun pada catatan reservasi Anda.'
  },
  {
    q: 'What is the dress code?',
    a: 'Smart Elegant. Tailored trousers, collared shirts, blazers and evening attire are welcome; athletic wear and beachwear are politely declined.',
    qId: 'Apa aturan berpakaiannya?',
    aId: 'Smart Elegant. Celana rapi, kemeja berkrah, blazer, dan pakaian malam dipersilakan; pakaian olahraga dan pakaian pantai dengan sopan ditolak.'
  },
  {
    q: 'How do we book the Salon Privé Royal for 8 to 16 guests?',
    a: 'Choose “Salon Privé Royal” in the reservation form below, or ask the concierge to help plan a custom menu with dedicated sommelier service.',
    qId: 'Bagaimana cara memesan Salon Privé Royal untuk 8 hingga 16 tamu?',
    aId: 'Pilih “Salon Privé Royal” pada formulir reservasi di bawah, atau minta concierge membantu merancang menu khusus dengan layanan sommelier tersendiri.'
  },
  {
    q: 'When are you open?',
    a: 'Tuesday to Friday 18:00–23:30, Saturday 12:00–15:00 and 18:00–00:00, Sunday 18:00–22:30. Closed on Mondays.',
    qId: 'Kapan jam buka Anda?',
    aId: 'Selasa hingga Jumat 18.00–23.30, Sabtu 12.00–15.00 dan 18.00–00.00, Minggu 18.00–22.30. Tutup pada hari Senin.'
  }
];

const pick = (dish, field, lang, currency) => {
  const idKey = `${field}Id`;
  let value = lang === 'ID' && dish[idKey] !== undefined ? dish[idKey] : dish[field];
  if (typeof value === 'string') value = formatEuroText(value, currency);
  return value;
};

// Returns a dish with every guest-facing field in the chosen language and
// currency. Names stay untouched because they are proper menu names.
export function localizeDish(dish, lang = 'EN', currency = 'IDR') {
  if (!dish) return dish;
  return {
    ...dish,
    categoryKey: dish.category,
    category: lang === 'ID'
      ? (CATEGORIES_ID[CATEGORIES.indexOf(dish.category)] || dish.category)
      : dish.category,
    description: pick(dish, 'description', lang, currency),
    provenance: pick(dish, 'provenance', lang, currency),
    flavorProfile: pick(dish, 'flavorProfile', lang, currency),
    pairing: pick(dish, 'pairing', lang, currency),
    allergens: pick(dish, 'allergens', lang, currency),
    weight: pick(dish, 'weight', lang, currency),
    recommendedTemp: pick(dish, 'recommendedTemp', lang, currency),
    ingredients: lang === 'ID' && dish.ingredientsId ? dish.ingredientsId : dish.ingredients
  };
}

export function localizeMenu(lang = 'EN', currency = 'IDR') {
  return MENU_DATA.map((dish) => localizeDish(dish, lang, currency));
}

export function localizeCategories(lang = 'EN') {
  return lang === 'ID' ? CATEGORIES_ID : CATEGORIES;
}

export function localizeHours(lang = 'EN') {
  return lang === 'ID' ? HOURS_ID : HOURS;
}

export function localizeFaq(lang = 'EN') {
  return FAQ_ITEMS.map((item) => ({
    q: lang === 'ID' ? item.qId : item.q,
    a: lang === 'ID' ? item.aId : item.a
  }));
}

export function localizeRestaurant(lang = 'EN') {
  return {
    ...RESTAURANT,
    tagline: lang === 'ID' ? RESTAURANT.taglineId : RESTAURANT.tagline,
    dressCode: lang === 'ID' ? RESTAURANT.dressCodeId : RESTAURANT.dressCode
  };
}
