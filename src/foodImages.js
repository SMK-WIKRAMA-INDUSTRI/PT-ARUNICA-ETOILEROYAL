// High-resolution dish & ambiance imagery mapped to dish types and categories
const DISH_IMAGE_MAP = {
  'wagyu-ribeye': 'photo-1546833999-b9f581a1996d', // Sizzling Wagyu Ribeye with herb butter
  'royal-tomahawk': 'photo-1558030006-450675393462', // Dramatic bone-in Tomahawk
  'classic-filet': 'photo-1600891964599-f61ba0e24092', // Tenderloin Filet Mignon
  'black-truffle-tenderloin': 'photo-1544025162-d76694265947', // Truffle-crowned tenderloin
  'royal-berry-sparkle': 'photo-1551024709-8f23befc6f87', // Sparkling ruby berry cocktail
  'golden-passion': 'photo-1514362545857-3bc16c4c7d1b', // Golden passionfruit coupe
  'emerald-matcha-latte': 'photo-1536256263959-770b48d82b0a', // Ceremonial green matcha latte
  'lemon-royale': 'photo-1536935338788-846bb9981813', // Refreshing botanical lemon highball
  'midnight-chocolate-fondant': 'photo-1606313564200-e75d5e30476c', // Molten chocolate lava cake with gold
  'parisian-creme-brulee': 'photo-1509440159596-0249088772ff', // Torched caramel creme brulee
  'raspberry-pistachio-royale': 'photo-1579372786545-d24232daf58c', // Emerald pistachio entremet with berries
  'golden-mille-feuille': 'photo-1587314168485-3236d6710814', // Flaky golden mille-feuille
  'the-royal-experience': 'photo-1547592180-85f173990554' // Michelin-calibre 5-course tasting
};

const FALLBACK_IMAGES = [
  'photo-1546833999-b9f581a1996d',
  'photo-1544025162-d76694265947',
  'photo-1600891964599-f61ba0e24092',
  'photo-1558030006-450675393462'
];

export function imageFor(dish, index = 0) {
  if (dish?.id && DISH_IMAGE_MAP[dish.id]) {
    return `https://images.unsplash.com/${DISH_IMAGE_MAP[dish.id]}?auto=format&fit=crop&w=800&q=85`;
  }
  const fallbackIndex = dish?.dishType === 'tomahawk'
    ? 3
    : dish?.dishType === 'filet'
      ? 2
      : index % FALLBACK_IMAGES.length;
  return `https://images.unsplash.com/${FALLBACK_IMAGES[fallbackIndex]}?auto=format&fit=crop&w=800&q=85`;
}
