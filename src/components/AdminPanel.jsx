import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { fetchAdminBookings, fetchAdminOrders, readLocalBookings, readLocalOrders } from '../lib/orders.js';
import Dialog from './Dialog.jsx';

const STATUS_LABEL = {
  pending: 'Pending', paid: 'Paid', 'demo-paid': 'Demo paid', failed: 'Failed',
  served: 'Served', cancelled: 'Cancelled', requested: 'Requested'
};

function rupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`;
}

function mergeLocal(remote, local, key) {
  const byKey = new Map(remote.map((row) => [row[key], row]));
  for (const row of local) {
    const existing = byKey.get(row[key]);
    if (!existing || (row.status !== 'pending' && existing.status === 'pending')) byKey.set(row[key], row);
  }
  return [...byKey.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export default function AdminPanel({ open, onClose }) {
  const { t } = useI18n();
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const localOrders = readLocalOrders();
    const localBookings = readLocalBookings();
    Promise.allSettled([fetchAdminOrders(), fetchAdminBookings()]).then(([remoteOrders, remoteBookings]) => {
      setOrders(mergeLocal(remoteOrders.status === 'fulfilled' ? remoteOrders.value : [], localOrders, 'orderRef'));
      setBookings(mergeLocal(remoteBookings.status === 'fulfilled' ? remoteBookings.value : [], localBookings, 'bookingRef'));
      setLoading(false);
    });
  };

  useEffect(() => { if (open && isAdmin) load(); }, [open, isAdmin]);

  if (!open || !isAdmin) return null;
  const processed = orders.filter((order) => ['paid', 'demo-paid', 'served'].includes(order.status));
  const revenue = processed.reduce((sum, order) => sum + (Number(order.subtotalIdr) || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} titleId="admin-title" className="admin-dialog">
      <p className="hero-eyebrow">{t('adminBadge')}</p>
      <h2 id="admin-title" className="dialog-title">{t('adminTitle')}</h2>
      <p className="modal-copy">{t('adminSubtitle')} {user?.email}</p>

      <div className="admin-stats">
        <div><span>{t('revenue')}</span><b>{rupiah(revenue)}</b></div>
        <div><span>{t('paidOrders')}</span><b>{processed.length}</b></div>
        <div><span>{t('pendingOrders')}</span><b>{orders.filter((order) => order.status === 'pending').length}</b></div>
        <div><span>{t('bookingRequests')}</span><b>{bookings.length}</b></div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label={t('adminTitle')}>
        <button type="button" role="tab" aria-selected={tab === 'orders'} className={tab === 'orders' ? 'is-active' : ''} onClick={() => setTab('orders')}>{t('ordersTab')}</button>
        <button type="button" role="tab" aria-selected={tab === 'bookings'} className={tab === 'bookings' ? 'is-active' : ''} onClick={() => setTab('bookings')}>{t('bookingsTab')}</button>
        <button type="button" className="admin-refresh" onClick={load}>{loading ? '…' : '↻'} {t('refresh')}</button>
      </div>

      <div className="admin-list">
        {tab === 'orders' && (orders.length ? orders.map((order) => (
          <article className="admin-row" key={order.orderRef}>
            <div className="admin-row-main">
              <b>{order.orderRef}</b>
              <span className="meta">{order.customerName} · {order.customerEmail}</span>
              <span className="meta">{new Date(order.createdAt).toLocaleString()}</span>
              <span className="meta">{(order.items || []).map((item) => `${item.qty}× ${item.name}`).join(', ')}</span>
            </div>
            <div className="admin-row-side">
              <b>{rupiah(order.subtotalIdr)}</b>
              <span className={`status-badge status-${String(order.status).replace(/[^a-z]/g, '')}`}>{STATUS_LABEL[order.status] || order.status}</span>
            </div>
          </article>
        )) : <p className="admin-empty">{t('noOrders')}</p>)}

        {tab === 'bookings' && (bookings.length ? bookings.map((booking) => (
          <article className="admin-row" key={booking.bookingRef}>
            <div className="admin-row-main">
              <b>{booking.guestName}</b>
              <span className="meta">{booking.guestEmail} · {booking.guestPhone}</span>
              <span className="meta">{booking.bookingDate} · {booking.bookingTime} · {booking.guests}</span>
              <span className="meta">{booking.seating}{booking.dishId ? ` · ${booking.dishId}` : ''}</span>
            </div>
            <div className="admin-row-side">
              <span className={`status-badge status-${booking.status || 'requested'}`}>{STATUS_LABEL[booking.status] || 'Requested'}</span>
            </div>
          </article>
        )) : <p className="admin-empty">{t('noBookings')}</p>)}
      </div>

      <button type="button" className="btn btn-quiet btn-wide" onClick={onClose}>{t('close')}</button>
    </Dialog>
  );
}
