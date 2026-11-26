-- Generated from src/data.js by node scripts/generate-seed.mjs.
-- Safe to re-run; existing rows keep their admin edits.
insert into public.categories (id, name, name_id, sort_order, active)
values
  ('Signature Steaks', 'Signature Steaks', 'Steak Khas', 0, true),
  ('Signature Beverages', 'Signature Beverages', 'Minuman Khas', 1, true),
  ('Royal Desserts', 'Royal Desserts', 'Dessert Royal', 2, true),
  ('Chef''s Special', 'Chef''s Special', 'Spesial Koki', 3, true)
on conflict (id) do nothing;

insert into public.products (
  id, category_id, name, price, image_url, dish_type, table_index,
  chef_recommended, gluten_free, active, sort_order,
  weight, recommended_temp, provenance, provenance_id,
  description, description_id, ingredients, ingredients_id,
  flavor_profile, flavor_profile_id, pairing, pairing_id, allergens, allergens_id
)
values
  (
    'wagyu-ribeye', 'Signature Steaks', 'Japanese A5 Wagyu Ribeye', 95.00,
    null, 'wagyu', 0,
    true, true, true, 0,
    '280g', 'Medium-Rare (54°C)',
    'Miyazaki Prefecture, Japan (BMS 11–12)', 'Prefektur Miyazaki, Jepang (BMS 11–12)',
    'Snowflake-marbled Miyazaki A5 ribeye seared over 850°C Kishu Binchotan charcoal, crowned with Normandy smoked herb butter, fresh rosemary, and Maldon sea salt flakes.', 'Ribeye Miyazaki A5 dengan marbling serupa salju, dibakar di atas arang Kishu Binchotan 850°C, lalu diberi mentega herba asap Normandia, rosemary segar, dan garam laut Maldon.',
    ARRAY['Miyazaki A5 Ribeye (BMS 12)', 'Normandy Cultured Herb Butter', 'Kishu Binchotan Sear', 'Maldon Sea Salt', 'Fresh Garden Rosemary'], ARRAY['Ribeye Miyazaki A5 (BMS 12)', 'Mentega Herba Normandia', 'Bakaran Kishu Binchotan', 'Garam Laut Maldon', 'Rosemary Taman Segar'],
    'Velvety, umami-rich, buttery melt', 'Lembut, kaya umami, meleleh seperti mentega',
    'Royal Berry Sparkle (€14) or Grand Cru Pomerol', 'Royal Berry Sparkle (€14) atau Grand Cru Pomerol',
    'Dairy', 'Susy'
  ),
  (
    'royal-tomahawk', 'Signature Steaks', 'Royal Tomahawk Steak', 120.00,
    null, 'tomahawk', 1,
    true, true, true, 1,
    '950g (for 1–2 guests)', 'Medium-Rare (55°C)',
    'Black Angus Reserve, Scottish Highlands', 'Black Angus Reserve, Dataran Tinggi Skotlandia',
    'Dramatic 14-inch Frenched rib steak aged 45 days in our Himalayan pink salt chamber, served tableside with roasted bone marrow, glazed heirloom carrots, and aged Bordelaise.', 'Steak iga 14 inci yang dipotong dramatis, diasamkan 45 hari dalam ruangan garam merah muda Himalaya, disajikan di meja dengan sumsum tulang panggang, wortel heirloom glasir, dan saus Bordelaise tua.',
    ARRAY['45-Day Dry-Aged Ribeye on Bone', 'Roasted Bone Marrow', 'Heirloom Baby Carrots', 'Shallot Bordelaise Jus', 'Fresh Rosemary'], ARRAY['Ribeye 45 Hari dengan Tulang', 'Sumsum Tulang Panggang', 'Wortel Kecil Heirloom', 'Jus Bordelaise Bawang Merah', 'Rosemary Segar'],
    'Deep nutty crust, bold beef essence, smoky', 'Kerak kacang yang dalam, esensi daging sapi yang kuat, berasap',
    'Golden Passion (€12) or Left Bank Bordeaux', 'Golden Passion (€12) atau Bordeaux Left Bank',
    'Dairy, Sulphites', 'Susy, Sulfit'
  ),
  (
    'classic-filet', 'Signature Steaks', 'Classic Filet Mignon', 68.00,
    null, 'filet', 2,
    false, true, true, 2,
    '240g', 'Medium-Rare (54°C)',
    'Charolais Heritage Farms, France', 'Peternakan Heritage Charolais, Prancis',
    'Center-cut Charolais beef tenderloin renowned for effortless tenderness, accompanied by silky pommes purée, charred cipollini onion, and green Kampot peppercorn cognac reduction.', 'Tenderloin Charolais potongan tengah yang terkenal sangat empuk, disajikan dengan pommes purée sutra, bawang cipollini hangus, dan reduction cognac merica Kampot hijau.',
    ARRAY['Center-Cut Charolais Tenderloin', 'Silky Pommes Purée', 'Green Kampot Peppercorn Jus', 'Charred Cipollini Onion', 'Thyme Infusion'], ARRAY['Tenderloin Charolais Potongan Tengah', 'Pommes Purée Sutra', 'Jus Merica Kampot Hijau', 'Bawang Cipollini Hangus', 'Infusi Thyme'],
    'Refined, silky tenderness, warm peppercorn', 'Halus, empuk seperti sutra, merica hangat',
    'Lemon Royale (€10) or Burgundy Pinot Noir', 'Lemon Royale (€10) atau Burgundy Pinot Noir',
    'Dairy, Sulphites', 'Susy, Sulfit'
  ),
  (
    'black-truffle-tenderloin', 'Signature Steaks', 'Black Truffle Tenderloin', 78.00,
    null, 'truffle', 3,
    true, true, true, 3,
    '250g', 'Medium-Rare (54°C)',
    'Limousin Reserve & Périgord Truffle', 'Reserve Limousin & Truffle Périgord',
    'Prime tenderloin crowned with shaved Périgord black winter truffle, foie gras emulsion, wild morel jus, and a delicate whisper of 24-karat edible gold leaf.', 'Tenderloin utama ditaburi truffle hitam musim dingin Périgord, emulsi foie gras, jus morel liar, dan bisikan daun emas 24 karat yang dapat dimakan.',
    ARRAY['Limousin Beef Tenderloin', 'Périgord Black Winter Truffle', '24k Edible Gold Leaf', 'Wild Morel Reduction', 'Roasted Shallot Glaze'], ARRAY['Tenderloin Sapi Limousin', 'Truffle Hitam Musim Dingin Périgord', 'Daun Emas 24k yang Dapat Dimakan', 'Reduction Morel Liar', 'Glasir Bawang Merah Panggang'],
    'Earthy, aromatic, decadent forest notes', 'Bumi, aromatik, aroma hutan yang mewah',
    'Emerald Matcha Latte (€11) or Aged Barolo', 'Emerald Matcha Latte (€11) atau Barolo Tua',
    'Dairy, Sulphites', 'Susy, Sulfit'
  ),
  (
    'royal-berry-sparkle', 'Signature Beverages', 'Royal Berry Sparkle', 14.00,
    null, 'berry_drink', 4,
    false, true, true, 4,
    '220ml crystal goblet', 'Chilled (4°C)',
    'Luxembourg Ardennes Berries & Crémant Essence', 'Buah Beri Ardennes Luksemburg & Esens Crémant',
    'Effervescent ruby botanical aperitif crafted from crushed Ardennes blackberries, wild raspberries, hibiscus reduction, and dealcoholized Luxembourgish sparkling cuvée.', 'Aperitif botanis ruby bergelembung dari blackberry Ardennes yang dihancurkan, raspberry liar, reduction hibiscus, dan cuvée bersoda Luksemburg tanpa alkohol.',
    ARRAY['Ardennes Blackberries & Raspberries', 'Hibiscus Petal Infusion', 'Botanical Sparkling Cuvée', 'Fresh Garden Mint', '24k Gold Rim Dust'], ARRAY['Blackberry & Raspberry Ardennes', 'Infusi Kelopak Hibiscus', 'Cuvée Botanis Bergelembung', 'Daun Mint Taman Segar', 'Debu Emas 24k di Bibir Gelas'],
    'Crisp, ruby tartness, floral effervescence', 'Segar, asam ruby, busa bunga',
    'Palate cleanser with the Japanese A5 Wagyu Ribeye', 'Penyegar langit-langit untuk Japanese A5 Wagyu Ribeye',
    'None (alcohol-free)', 'Tidak ada (tanpa alkohol)'
  ),
  (
    'golden-passion', 'Signature Beverages', 'Golden Passion', 12.00,
    null, 'drink', null,
    false, true, true, 5,
    '240ml coupe', 'Chilled (5°C)',
    'Madagascar Vanilla & Exotic Passionfruit', 'Vanili Madagaskar & Markisa Eksotis',
    'Sunlit passionfruit nectar shaken with Madagascar bourbon vanilla bean, cold-pressed Meyer lemon, ginger blossom mist, and shimmering champagne-gold dust.', 'Nektar markisa yang cerah dikocok dengan polong vanili Bourbon Madagaskar, lemon Meyer dingin, semprotan bunga jahe, dan debu emas sampanye berkilau.',
    ARRAY['Fresh Passionfruit Pulp', 'Madagascar Vanilla Bean', 'Meyer Lemon Juice', 'Ginger Blossom Mist', 'Sparkling Spring Water'], ARRAY['Pulp Markisa Segar', 'Polong Vanili Madagaskar', 'Jus Lemon Meyer', 'Semprotan Bunga Jahe', 'Air Soda Sprinkle'],
    'Vibrant tropical acid, warm vanilla finish', 'Asam tropis yang cerah, akhir vanili hangat',
    'Complements the Royal Tomahawk Steak and Crème Brûlée', 'Melengkapi Royal Tomahawk Steak dan Crème Brûlée',
    'None (alcohol-free)', 'Tidak ada (tanpa alkohol)'
  ),
  (
    'emerald-matcha-latte', 'Signature Beverages', 'Emerald Matcha Latte', 11.00,
    null, 'drink', null,
    false, true, true, 6,
    '200ml porcelain vessel', 'Velvet warm (62°C) or iced',
    'Uji, Kyoto, Japan', 'Uji, Kyoto, Jepang',
    'Stone-ground first-harvest Uji ceremonial matcha whisked to micro-foam perfection with organic oat or Hokkaido milk and a touch of white acacia honey.', 'Matcha upacara Uji penggilingan batu dikocok hingga micro-foam sempurna dengan oat organik atau susu Hokkaido dan sentuhan madu akasia putih.',
    ARRAY['Uji Ceremonial Grade Matcha', 'Organic Oat or Hokkaido Milk', 'Luxembourg Acacia Honey', 'Bamboo Chasen Micro-Foam'], ARRAY['Matcha Upacara Kelas Satu Uji', 'Oat Organik atau Susu Hokkaido', 'Madu Akasia Luksemburg', 'Micro-Foam Bambu Chasen'],
    'Silky umami, vegetal sweetness, calm finish', 'Umami sutra, manis sayur, akhir yang tenang',
    'Pairs with the Raspberry Pistachio Royale', 'Pasangan untuk Raspberry Pistachio Royale',
    'Optional dairy (oat available)', 'Susy opsional (oat tersedia)'
  ),
  (
    'lemon-royale', 'Signature Beverages', 'Lemon Royale', 10.00,
    null, 'drink', null,
    false, true, true, 7,
    '250ml highball', 'Ice-chilled (3°C)',
    'Amalfi Coast Lemons & Moselle Thyme', 'Lemon Pesisir Amalfi & Thyme Moselle',
    'Hand-pressed Amalfi lemon elixir infused with wild Moselle lemon thyme, white verbena cordial, and crystal-clear artisanal tonic.', 'Eliksir lemon Amalfi yang diperas dengan tangan, diinfusi thyme lemon Moselle liar, cordial verbena putih, dan tonik artisan yang bening.',
    ARRAY['Amalfi Coast Lemon Zest & Juice', 'Moselle Lemon Thyme', 'White Verbena Cordial', 'Artisanal Botanical Tonic'], ARRAY['Kulit & Jus Lemon Amalfi', 'Thyme Lemon Moselle', 'Cordial Verbena Putih', 'Tonik Botanis Artisan'],
    'Zesty citrus, herbaceous, refreshingly dry', 'Jeruk menyegarkan, herba, kering menyegarkan',
    'Classic accompaniment to the Classic Filet Mignon', 'Pendamping klasik Classic Filet Mignon',
    'None (alcohol-free)', 'Tidak ada (tanpa alkohol)'
  ),
  (
    'midnight-chocolate-fondant', 'Royal Desserts', 'Midnight Chocolate Fondant', 18.00,
    null, 'fondant', 5,
    true, false, true, 8,
    '190g, baked to order', 'Warm molten core',
    'Valrhona Guanaja & Madagascar Vanilla', 'Valrhona Guanaja & Vanili Madagaskar',
    'Warm dark Valrhona 72% chocolate cake revealing a molten velvet ganache core, paired with Madagascar vanilla bean gelato, raspberry coulis, and 24k gold leaf.', 'Kue cokelat hitam Valrhona 72% hangat dengan inti ganache cair, gelato vanili Madagaskar, coulis raspberry, dan daun emas 24k.',
    ARRAY['Valrhona Guanaja 72% Dark Chocolate', 'Madagascar Vanilla Bean Gelato', 'Fresh Raspberry Coulis', 'Cocoa Nib Tuile', '24k Edible Gold Leaf'], ARRAY['Cokelat Hitam Valrhona Guanaja 72%', 'Gelato Polong Vanili Madagaskar', 'Coulis Raspberry Segar', 'Tuile Biji Kakao', 'Daun Emas 24k yang Dapat Dimakan'],
    'Intense bittersweet cocoa, warm and cold contrast', 'Cokelat pahit-manis pekat, kontras hangat–dingin',
    'Emerald Matcha Latte (€11) or Vintage Tawny Port', 'Emerald Matcha Latte (€11) atau Port Tawny Vintage',
    'Dairy, Eggs, Gluten', 'Susy, Telur, Gluten'
  ),
  (
    'parisian-creme-brulee', 'Royal Desserts', 'Parisian Crème Brûlée', 15.00,
    null, 'brulee', null,
    false, true, true, 9,
    '180g porcelain dish', 'Caramelized crust, chilled custard',
    'Tahitian Vanilla & Normandy Cream', 'Vanili Tahiti & Krim Normandia',
    'Silky double-vanilla bean custard infused with Tahitian and Bourbon vanilla pods, torched tableside to a glass-like amber demerara sugar crust with fresh berries.', 'Custard vanili ganda yang sutra dengan polong vanili Tahiti dan Bourbon, dibakar di meja menjadi kerak gula demerara amber seperti kaca, dengan buah beri segar.',
    ARRAY['Normandy Double Cream', 'Tahitian & Bourbon Vanilla Pods', 'Free-Range Organic Egg Yolks', 'Torched Amber Demerara Crust'], ARRAY['Krim Ganda Normandia', 'Polong Vanili Tahiti & Bourbon', 'Kuning Telur Organik Kampung', 'Kerak Demerara Amber yang Dibakar'],
    'Caramelized crunch, floral vanilla custard', 'Kerak karamel renyah, custard vanili bunga',
    'Golden Passion (€12) or Sauternes', 'Golden Passion (€12) atau Sauternes',
    'Dairy, Eggs', 'Susy, Telur'
  ),
  (
    'raspberry-pistachio-royale', 'Royal Desserts', 'Raspberry Pistachio Royale', 17.00,
    null, 'pistachio', 6,
    false, false, true, 10,
    '175g entremet', 'Chilled (6°C)',
    'Bronte DOP Pistachios & Ardennes Raspberries', 'Pistachio DOP Bronte & Raspberry Ardennes',
    'Velvety Sicilian Bronte pistachio mousseline layered over crisp almond dacquoise, bright raspberry confit heart, glazed with emerald mirror sheen and gold leaf.', 'Mousseline pistachio Bronte Sisilia yang lembut di atas dacquoise almond renyah, inti confit raspberry cerah, dilapisi kilau zamrud dan daun emas.',
    ARRAY['Sicilian Bronte DOP Pistachio Paste', 'Ardennes Raspberry Confit', 'Almond Dacquoise Sponge', 'White Chocolate Velvet', '24k Gold Leaf'], ARRAY['Pasta Pistachio DOP Bronte Sisilia', 'Confit Raspberry Ardennes', 'Spons Dacquoise Almond', 'Velvet Cokelat Putih', 'Daun Emas 24k'],
    'Roasted nutty depth, bright berry tartness', 'Kacang panggang yang dalam, asam buah beri cerah',
    'Royal Berry Sparkle (€14)', 'Royal Berry Sparkle (€14)',
    'Tree nuts (pistachio, almond), Dairy, Eggs', 'Kacang pohon (pistachio, almond), Susy, Telur'
  ),
  (
    'golden-mille-feuille', 'Royal Desserts', 'Golden Mille-Feuille', 16.00,
    null, 'dessert', null,
    false, false, true, 11,
    '170g layered pastry', 'Crisp and chilled',
    'Isigny Butter Puff & Diplomat Cream', 'Puff Mentega Isigny & Krim Diplomat',
    'A thousand caramelized layers of Isigny butter puff pastry interleaved with airy vanilla-tonka diplomat cream and salted butterscotch drizzle.', 'Seribu lapisan pastry puff mentega Isigny yang dikaramelkan, diisi krim diplomat vanili-tonka yang ringan dan sirup butterscotch mentega asin.',
    ARRAY['Caramelized Isigny Puff Pastry', 'Vanilla-Tonka Diplomat Cream', 'Salted Normandy Butterscotch', 'Toasted Hazelnut Praline'], ARRAY['Pastry Puff Isigny yang Dikaramelkan', 'Krim Diplomat Vanili-Tonka', 'Butterscotch Mentega Asin Normandia', 'Praline Hazelnut Panggang'],
    'Shattering crisp pastry, aromatic tonka cream', 'Pastry renyah pecah, krim tonka aromatik',
    'Lemon Royale (€10) or Espresso', 'Lemon Royale (€10) atau Espresso',
    'Gluten, Dairy, Eggs, Tree nuts', 'Gluten, Susy, Telur, Kacang pohon'
  ),
  (
    'the-royal-experience', 'Chef''s Special', 'The Royal Experience', 145.00,
    null, 'royal_experience', 7,
    true, false, true, 12,
    '5-course tasting, per person', 'Orchestrated service',
    'Curated by Executive Chef Laurent Beaumont', 'Diracik oleh Executive Chef Laurent Beaumont',
    'Our flagship five-course degustation: Complimentary Chef’s Amuse-Bouche, Japanese Wagyu tasting portion, Parmesan Truffle Risotto, Royal Berry Sparkle, and Midnight Chocolate Fondant.', 'Degustasi unggulan lima hidangan: Amuse-Bouche dari koki, porsi mencicipi Wagyu Jepang, Risotto Parmesan Truffle, Royal Berry Sparkle, dan Midnight Chocolate Fondant.',
    ARRAY['Complimentary Chef''s Amuse-Bouche', 'Japanese Wagyu Tasting Portion', 'Parmesan Truffle Risotto', 'Royal Berry Sparkle', 'Midnight Chocolate Fondant'], ARRAY['Amuse-Bouche Koki', 'Porsi Mencicipi Wagyu Jepang', 'Risotto Parmesan Truffle', 'Royal Berry Sparkle', 'Midnight Chocolate Fondant'],
    'A complete five-course progression', 'Progresi lengkap lima hidangan',
    'Includes Royal Berry Sparkle; optional sommelier flight (+€65)', 'Termasuk Royal Berry Sparkle; flight sommelier opsional (+€65)',
    'Dairy, Eggs, Gluten (vegetarian risotto adaptation available)', 'Susy, Telur, Gluten (adaptasi risotto vegetarian tersedia)'
  )
on conflict (id) do nothing;
