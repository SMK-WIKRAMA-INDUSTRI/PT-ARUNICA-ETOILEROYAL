import { useRef } from 'react';
import { useI18n } from './i18n.jsx';
import { useDialog } from './hooks.js';

export default function DishModal({ dish, onClose, onReserve, onAdd }) {
  const { t, fmt } = useI18n();
  const ref = useRef(null);
  const closeRef = useRef(null);
  useDialog({ open: Boolean(dish), onClose, containerRef: ref, initialRef: closeRef, trap: true });
  if (!dish) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="dish-title" className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <p className="meta">{dish.category}</p>
          <button ref={closeRef} type="button" className="btn btn-quiet btn-sm" onClick={onClose}>
            {t('close')}
          </button>
        </div>
        <div className="row-head">
          <h3 id="dish-title" className="modal-title">{dish.name}</h3>
          <span className="price">{fmt(dish.price)}</span>
        </div>
        <p className="meta">{dish.provenance}</p>
        <p className="modal-copy">{dish.description}</p>

        <h4 className="label">{t('ingredients')}</h4>
        <ul className="ingredients">
          {dish.ingredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>

        <dl className="facts">
          <div><dt>{t('flavour')}</dt><dd>{dish.flavorProfile}</dd></div>
          <div><dt>{t('pairing')}</dt><dd>{dish.pairing}</dd></div>
          <div><dt>{t('allergens')}</dt><dd>{dish.allergens}</dd></div>
        </dl>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => onAdd(dish)}>
            {t('addToCart')} · {fmt(dish.price)}
          </button>
          <button type="button" className="btn" onClick={() => onReserve(dish)}>
            {t('bookWithDish')}
          </button>
        </div>
      </div>
    </div>
  );
}
