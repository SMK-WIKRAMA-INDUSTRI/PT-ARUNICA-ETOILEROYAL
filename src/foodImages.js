// One shared image resolver so the hero, carte, concierge, cart and admin all
// crop photos the same way. Admins can set imageUrl per product; the built-in
// photos remain the fallback for the seeded menu.
const FALLBACK_IDS = [
  'photo-1546833999-b9f581a1996d',
  'photo-1544025162-d76694265947',
  'photo-1600891964599-f61ba0e24092',
  'photo-1558030006-450675393462',
  'photo-1547592180-85f173990554',
  'photo-1551024506-0bccd828d307'
];

const photo = (id, width = 700) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export function imageFallbackUrl() {
  return photo(FALLBACK_IDS[1]);
}

export function imageFor(dish, index = 0, width = 700) {
  const custom = dish?.imageUrl || dish?.image_url;
  if (custom && /^(https?:|data:|\/)/i.test(custom)) return custom;

  const type = String(dish?.dishType || dish?.dish_type || '');
  let imageIndex = Math.abs(Number(index) || 0) % FALLBACK_IDS.length;
  if (type === 'tomahawk') imageIndex = 1;
  else if (type === 'filet') imageIndex = 2;
  else if (type === 'fondant' || type === 'pistachio') imageIndex = 5;
  return photo(FALLBACK_IDS[imageIndex], width);
}
