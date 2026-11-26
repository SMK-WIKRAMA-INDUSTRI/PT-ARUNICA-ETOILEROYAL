import { useEffect, useState } from 'react';
import { localizeDish } from '../data.js';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useCart } from '../lib/cart.jsx';
import { buildOrder, pushOrderToSupabase, saveLocalOrder, updateLocalOrder } from '../lib/orders.js';
import { confirmPayment, createPayment, getPaymentConfig, loadSnap } from '../lib/payment.js';
import Dialog from './Dialog.jsx';

export default function Checkout({ open, onClose, onOrderComplete }) {
  const { t, fmt, lang, currency } = useI18n();
  const { user } = useAuth();
  const { lines, subtotalEur, clear } = useCart();
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [notes, setNotes] = useState('');
  const [config, setConfig] = useState({ available: false, enabled: false, clientKey: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSuccess(null);
    getPaymentConfig().then(setConfig);
    setCustomer((current) => ({
      name: current.name || user?.full_name || '',
      email: current.email || user?.email || '',
      phone: current.phone || ''
    }));
  }, [open, user?.full_name, user?.email]);

  const setField = (key) => (event) => setCustomer((current) => ({ ...current, [key]: event.target.value }));

  const record = (order, patch) => {
    const updated = { ...order, ...patch };
    saveLocalOrder(updated);
    setSuccess(updated);
    clear();
    onOrderComplete?.(updated);
  };

  const pay = async () => {
    setError('');
    if (!lines.length) { setError(t('cartEmpty')); return; }
    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) {
      setError(t('checkoutFillRequired'));
      return;
    }
    setBusy(true);
    try {
      const order = buildOrder({ customer, lines, displayCurrency: currency, user, note: notes });
      saveLocalOrder(order);
      await pushOrderToSupabase(order);

      if (!config.enabled) {
        // Sandbox simulation: no keys, no external call. Clearly labelled as demo.
        await confirmPayment(order.orderRef).catch(() => ({ demo: true }));
        record(order, { status: 'demo-paid', paymentProvider: 'midtrans-demo', midtransOrderId: `DEMO-${order.orderRef}` });
        return;
      }

      const payment = await createPayment({
        orderRef: order.orderRef,
        items: order.items.map(({ id, qty }) => ({ id, qty })),
        amountIdr: order.subtotalIdr,
        customer
      });
      updateLocalOrder(order.orderRef, { midtransOrderId: payment.orderId });
      const snap = await loadSnap(payment.clientKey || config.clientKey);

      setBusy(false);
      snap.pay(payment.snapToken, {
        onSuccess: async (result) => {
          let status = 'paid';
          try {
            const verified = await confirmPayment(order.orderRef);
            if (verified.verified === false && verified.status === 'pending') status = 'pending';
          } catch { /* Snap success still counts for the demo session */ }
          record(order, { status, midtransOrderId: result?.order_id || payment.orderId, paymentResult: result?.transaction_status || 'settlement' });
        },
        onPending: (result) => record(order, { status: 'pending', midtransOrderId: result?.order_id || payment.orderId }),
        onError: (result) => {
          updateLocalOrder(order.orderRef, { status: 'failed', midtransOrderId: result?.order_id || payment.orderId });
          setError(t('paymentFailed'));
        },
        onClose: () => setBusy(false)
      });
      return;
    } catch (err) {
      setError(err?.message || t('paymentFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} titleId="checkout-title" className="checkout-dialog">
      {success ? (
        <div className="checkout-success">
          <span className="success-mark" aria-hidden="true">✓</span>
          <p className="hero-eyebrow">{t('orderPlaced')}</p>
          <h2 id="checkout-title" className="dialog-title">
            {success.status === 'demo-paid' ? t('demoPaidTitle') : success.status === 'paid' ? t('paidTitle') : t('pendingTitle')}
          </h2>
          <p className="modal-copy">
            {success.status === 'demo-paid' ? t('demoPaidNote') : success.status === 'paid' ? t('paidNote') : t('pendingNote')}
          </p>
          <dl className="facts success-facts">
            <div><dt>{t('orderRef')}</dt><dd><code>{success.orderRef}</code></dd></div>
            <div><dt>{t('total')}</dt><dd>{fmt(success.totalEur ?? success.subtotalIdr / 17500)}</dd></div>
            <div><dt>{t('status')}</dt><dd>{success.status}</dd></div>
          </dl>
          <button type="button" className="btn btn-primary btn-wide btn-pill" onClick={onClose}>{t('done')}</button>
        </div>
      ) : (
        <>
          <p className="hero-eyebrow">{t('secureCheckout')}</p>
          <h2 id="checkout-title" className="dialog-title">{t('checkoutTitle')}</h2>
          <p className="modal-copy">{t('checkoutSubtitle')}</p>

          <h3 className="checkout-section-title">{t('contactDetails')}</h3>
          <div className="checkout-fields">
            <div className="field">
              <label htmlFor="co-name">{t('fullName')}</label>
              <input id="co-name" autoComplete="name" value={customer.name} onChange={setField('name')} placeholder={t('yourName')} />
            </div>
            <div className="field">
              <label htmlFor="co-email">{t('email')}</label>
              <input id="co-email" type="email" autoComplete="email" value={customer.email} onChange={setField('email')} placeholder="email@example.com" />
            </div>
            <div className="field">
              <label htmlFor="co-phone">{t('phone')}</label>
              <input id="co-phone" type="tel" autoComplete="tel" value={customer.phone} onChange={setField('phone')} placeholder="+62 …" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="co-notes">{t('orderNotes')}</label>
            <textarea id="co-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('orderNotesPlaceholder')} />
          </div>

          <h3 className="checkout-section-title">{t('orderSummary')}</h3>
          <div className="checkout-lines">
            {lines.map((line) => {
              const dish = localizeDish(line.dish, lang, currency);
              return (
                <div className="checkout-line" key={line.id}>
                  <span>{dish.name} <small>× {line.qty}</small></span>
                  <b>{fmt(line.unitPriceEur * line.qty)}</b>
                </div>
              );
            })}
          </div>
          <div className="checkout-total"><span>{t('total')}</span><strong>{fmt(subtotalEur)}</strong></div>
          <p className="meta">{t('paymentNote')}</p>

          {!config.enabled && <p className="notice">{t('demoPaymentNote')}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="button" className="btn btn-primary btn-wide btn-pill checkout-pay" onClick={pay} disabled={busy || !lines.length}>
            {busy ? t('processing') : config.enabled ? t('payWithMidtrans') : t('runDemoPayment')}
          </button>
          <button type="button" className="btn btn-quiet btn-wide" onClick={onClose}>{t('backToCart')}</button>
        </>
      )}
    </Dialog>
  );
}
