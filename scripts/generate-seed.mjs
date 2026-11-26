// Generates supabase/seed_catalog.sql from the built-in menu in src/data.js.
// Run: node scripts/generate-seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, CATEGORIES_ID, MENU_DATA } from '../src/data.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const text = (value) => value == null ? 'null' : `'${String(value).replace(/'/g, "''")}'`;
const arr = (value) => `ARRAY[${(Array.isArray(value) ? value : []).map(text).join(', ')}]`;
const bool = (value) => value ? 'true' : 'false';

const categoryRows = CATEGORIES.map((id, i) => `  (${text(id)}, ${text(id)}, ${text(CATEGORIES_ID[i])}, ${i}, true)`).join(',\n');

const productRows = MENU_DATA.map((dish, i) => `  (
    ${text(dish.id)}, ${text(dish.category)}, ${text(dish.name)}, ${Number(dish.price).toFixed(2)},
    null, ${text(dish.dishType)}, ${dish.tableIndex == null ? 'null' : Number(dish.tableIndex)},
    ${bool(dish.chefRecommended)}, ${bool(dish.glutenFree)}, true, ${i},
    ${text(dish.weight)}, ${text(dish.recommendedTemp)},
    ${text(dish.provenance)}, ${text(dish.provenanceId)},
    ${text(dish.description)}, ${text(dish.descriptionId)},
    ${arr(dish.ingredients)}, ${arr(dish.ingredientsId)},
    ${text(dish.flavorProfile)}, ${text(dish.flavorProfileId)},
    ${text(dish.pairing)}, ${text(dish.pairingId)},
    ${text(dish.allergens)}, ${text(dish.allergensId)}
  )`).join(',\n');

const sql = `-- Generated from src/data.js by node scripts/generate-seed.mjs.
-- Safe to re-run; existing rows keep their admin edits.
insert into public.categories (id, name, name_id, sort_order, active)
values
${categoryRows}
on conflict (id) do nothing;

insert into public.products (
  id, category_id, name, price, image_url, dish_type, table_index,
  chef_recommended, gluten_free, active, sort_order,
  weight, recommended_temp, provenance, provenance_id,
  description, description_id, ingredients, ingredients_id,
  flavor_profile, flavor_profile_id, pairing, pairing_id, allergens, allergens_id
)
values
${productRows}
on conflict (id) do nothing;
`;

fs.writeFileSync(path.join(ROOT, 'supabase', 'seed_catalog.sql'), sql, 'utf8');
console.log('Wrote supabase/seed_catalog.sql');
