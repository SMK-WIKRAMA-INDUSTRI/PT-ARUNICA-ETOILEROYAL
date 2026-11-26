import { useRef } from 'react';
import { localizeDish } from '../data.js';
import { imageFor } from '../foodImages.js';
import { useI18n } from '../i18n.jsx';
import { useCart } from '../lib/cart.jsx';
import { useDialog } from '../hooks.js';

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { t, fmt, lang, currency } = useI18n();
  const { lines, count, subtotalEur, setQuantity, removeItem, clear } = useCart();
  const ref = useRef(null);
  useDialog({ open, onClose, containerRef: ref, trap: true });
  if (!open) return null;

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label={t('closeCart')} onClick={onClose} />
      <aside ref={ref} tabIndex={-1} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="drawer-head">
          <div>
            <p className="hero-eyebrow">{t('yourOrder')}</p>
            <h2 id="cart-title" className="dialog-title">{t('cartTitle')} <span className="count-pill">{count}</span></h2>
          </div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>{t('close')}</button>
        </header>

        {lines.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-mark" aria-hidden="true">✦</span>
            <h3>{t('cartEmpty')}</h3>
            <p className="modal-copy">{t('cartEmptyBody')}</p>
            <button type="button" className="btn btn-primary" onClick={() => { onClose(); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {t('browseMenu')}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map((line, index) => {
                const dish = localizeDish(line.dish, lang, currency);
                return (
                  <article className="cart-line" key={line.id}>
                    <img src={imageFor(line.dish, index)} alt="" loading="lazy" />
                    <div className="cart-line-body">
                      <div className="cart-line-title">
                        <h3>{dish.name}</h3>
                        <b>{fmt(line.unitPriceEur * line.qty)}</b>
                      </div>
                      <p className="meta">{dish.category} · {fmt(line.unitPriceEur)}</p>
                      <div className="cart-line-actions">
                        <div className="qty-control" role="group" aria-label={`${t('quantity')} ${dish.name}`}>
                          <button type="button" onClick={() => setQuantity(line.id, line.qty - 1)} disabled={line.qty <= 1} aria-label={t('decrease')}>−</button>
                          <span aria-live="polite">{line.qty}</span>
                          <button type="button" onClick={() => setQuantity(line.id, line.qty + 1)} disabled={line.qty >= 20} aria-label={t('increase')}>+</button>
                        </div>
                        <button type="button" className="link-button" onClick={() => removeItem(line.id)}>{t('remove')}</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="cart-footer">
              <div className="cart-total">
                <span>{t('subtotal')} <small>({count})</small></span>
                <strong>{fmt(subtotalEur)}</strong>
              </div>
              <p className="meta">{t('cartCurrencyNote')}</p>
              <button type="button" className="btn btn-primary btn-wide btn-pill" onClick={() => { onClose(); onCheckout(); }}>
                {t('checkout')} →
              </button>
              <div className="cart-footer-links">
                <button type="button" className="link-button" onClick={() => { onClose(); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}>{t('continueShopping')}</button>
                <button type="button" className="link-button" onClick={clear}>{t('clearCart')}</button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
