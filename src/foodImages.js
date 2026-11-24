// Lightweight, shared dish imagery. No textures, no WebGL — just a few
// remote photos reused across the menu, concierge cards and hero showcase.
const FOOD_IMAGES = [
  'photo-1546833999-b9f581a1996d',
  'photo-1544025162-d76694265947',
  'photo-1600891964599-f61ba0e24092',
  'photo-1558030006-450675393462'
];

export function imageFor(dish, index = 0) {
  const imageIndex = dish?.dishType === 'tomahawk'
    ? 3
    : dish?.dishType === 'filet'
      ? 2
      : index % FOOD_IMAGES.length;
  return `https://images.unsplash.com/${FOOD_IMAGES[imageIndex]}?auto=format&fit=crop&w=700&q=80`;
}
