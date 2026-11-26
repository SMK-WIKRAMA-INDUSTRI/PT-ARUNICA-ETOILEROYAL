import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import { imageFallbackUrl, imageFor } from '../foodImages.js';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { fetchAdminBookings, fetchAdminOrders, readLocalBookings, readLocalOrders } from '../lib/orders.js';
import { navigate } from '../lib/router.js';
import { useTheme } from '../hooks.js';

const STATUS_LABEL = {
  pending: 'Pending', paid: 'Paid', 'demo-paid': 'Demo paid', failed: 'Failed',
  served: 'Served', cancelled: 'Cancelled', requested: 'Requested',
  confirmed: 'Confirmed', declined: 'Declined'
};

const rupiah = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`;

function mergeLocal(remote, local, key) {
  const byKey = new Map(remote.map((row) => [row[key], row]));
  for (const row of local) {
    const existing = byKey.get(row[key]);
    if (!existing || (row.status !== 'pending' && existing.status === 'pending')) byKey.set(row[key], row);
  }
  return [...byKey.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

const splitList = (value) => String(value || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean);
const slug = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

const blankCategory = { id: '', name: '', nameId: '', sortOrder: 0, active: true };
const blankProduct = {
  id: '', category: '', name: '', price: 0, imageUrl: '', dishType: '', tableIndex: null,
  chefRecommended: false, glutenFree: false, active: true, sortOrder: 0,
  weight: '', recommendedTemp: '', provenance: '', provenanceId: '',
  description: '', descriptionId: '', ingredients: [], ingredientsId: [],
  flavorProfile: '', flavorProfileId: '', pairing: '', pairingId: '', allergens: '', allergensId: ''
};

export default function AdminApp() {
  const { t, fmt, lang } = useI18n();
  const { user, isAdmin, ready: authReady, signOut } = useAuth();
  const catalog = useCatalog();
  const {
    profile, categories, products, source, syncError, ready: catalogReady,
    saveProfile, saveCategory, deleteCategory, saveProduct, deleteProduct,
    localizeDish, makeId
  } = catalog;
  const [theme, toggleTheme] = useTheme();

  const [section, setSection] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [categoryDraft, setCategoryDraft] = useState(blankCategory);
  const [productDraft, setProductDraft] = useState(blankProduct);
  const [profileDraft, setProfileDraft] = useState(profile);

  useEffect(() => { setProfileDraft(profile); }, [profile]);

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3600);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([fetchAdminOrders(), fetchAdminBookings()]).then(([remoteOrders, remoteBookings]) => {
      setOrders(mergeLocal(remoteOrders.status === 'fulfilled' ? remoteOrders.value : [], readLocalOrders(), 'orderRef'));
      setBookings(mergeLocal(remoteBookings.status === 'fulfilled' ? remoteBookings.value : [], readLocalBookings(), 'bookingRef'));
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const paidOrders = orders.filter((order) => ['paid', 'demo-paid', 'served'].includes(order.status));
  const revenue = paidOrders.reduce((sum, order) => sum + (Number(order.subtotalIdr) || 0), 0);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;

  const navItems = useMemo(() => [
    { id: 'overview', label: t('dashboard'), icon: '▦' },
    { id: 'orders', label: t('ordersTab'), icon: '▤' },
    { id: 'bookings', label: t('bookingsTab'), icon: '◫' },
    { id: 'categories', label: t('categories'), icon: '◈' },
    { id: 'products', label: t('products'), icon: '◇' },
    { id: 'settings', label: t('profileSettings'), icon: '⚙' }
  ], [t]);

  const setProductField = (key, value) => setProductDraft((current) => ({ ...current, [key]: value }));

  const openNewCategory = () => setCategoryDraft({
    ...blankCategory,
    sortOrder: categories.length,
    nameId: ''
  });

  const openNewProduct = () => setProductDraft({
    ...blankProduct,
    category: categories[0]?.id || '',
    sortOrder: products.length
  });

  const submitProfile = async (event) => {
    event.preventDefault();
    try {
      await saveProfile(profileDraft);
      notify(t('saved'));
    } catch (error) { notify(error.message); }
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    try {
      await saveCategory(categoryDraft);
      notify(t('saved'));
      openNewCategory();
    } catch (error) { notify(error.message); }
  };

  const removeCategory = async (row) => {
    if (!window.confirm(`${t('deleteConfirm')} ${row.name}?`)) return;
    try {
      await deleteCategory(row.id);
      if (categoryDraft.id === row.id) openNewCategory();
      notify(t('deleted'));
    } catch (error) { notify(error.message); }
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    try {
      const id = productDraft.id || makeId(productDraft.name, products);
      await saveProduct({ ...productDraft, id });
      notify(t('saved'));
      openNewProduct();
    } catch (error) { notify(error.message); }
  };

  const removeProduct = async (row) => {
    if (!window.confirm(`${t('deleteConfirm')} ${row.name}?`)) return;
    try {
      await deleteProduct(row.id);
      if (productDraft.id === row.id) openNewProduct();
      notify(t('deleted'));
    } catch (error) { notify(error.message); }
  };

  if (!authReady || !catalogReady) {
    return <div className="admin-loading">{t('loading')}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <p className="hero-eyebrow">{t('adminBadge')} · ÉTOILE ROYALE</p>
          <h1>{t('adminTitle')}</h1>
          <p className="modal-copy">{t('adminGateBody')}</p>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={() => setAuthOpen(true)}>{t('signIn')}</button>
            <button type="button" className="btn btn-quiet" onClick={() => navigate('site')}>{t('backToSite')}</button>
          </div>
        </div>
        <AuthModal open={authOpen} reason={t('adminGateReason')} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const renderOrders = (limit) => {
    const rows = limit ? orders.slice(0, limit) : orders;
    return (
      <div className="admin-list">
        {rows.length ? rows.map((order) => (
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
        )) : <p className="admin-empty">{t('noOrders')}</p>}
      </div>
    );
  };

  const renderBookings = (limit) => {
    const rows = limit ? bookings.slice(0, limit) : bookings;
    return (
      <div className="admin-list">
        {rows.length ? rows.map((booking) => (
          <article className="admin-row" key={booking.bookingRef}>
            <div className="admin-row-main">
              <b>{booking.guestName}</b>
              <span className="meta">{booking.guestEmail} · {booking.guestPhone}</span>
              <span className="meta">{booking.bookingDate} · {booking.bookingTime} · {booking.guests}</span>
              <span className="meta">{booking.seating}{booking.dishId ? ` · ${localizeDish({ id: booking.dishId, name: booking.dishId }, lang).name}` : ''}</span>
            </div>
            <div className="admin-row-side">
              <span className={`status-badge status-${booking.status || 'requested'}`}>{STATUS_LABEL[booking.status] || 'Requested'}</span>
            </div>
          </article>
        )) : <p className="admin-empty">{t('noBookings')}</p>}
      </div>
    );
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">✦</span>
          <span>
            <b>{profile.name}</b>
            <small>{t('adminBadge')} · {t('dashboard')}</small>
          </span>
        </div>
        <nav aria-label={t('dashboard')} className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? 'is-active' : ''}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => { setSection(item.id); setMobileNavOpen(false); }}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span className="meta">{t('signedInAs')}<br /><b>{user?.email}</b></span>
          <button type="button" className="btn btn-quiet btn-sm btn-wide" onClick={navigateSite}>{t('backToSite')}</button>
          <button type="button" className="btn btn-quiet btn-sm btn-wide" onClick={async () => { await signOut(); navigate('site'); }}>{t('signOut')}</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="btn btn-quiet btn-sm admin-menu-toggle" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? t('close') : t('menuButton')}
          </button>
          <div className="admin-topbar-title">
            <span className="hero-eyebrow">{t('adminBadge')} CONSOLE</span>
            <b>{navItems.find((item) => item.id === section)?.label}</b>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-source" title={t('storageSource')}>{source === 'supabase' ? 'Supabase' : source === 'demo' ? t('demoData') : 'Local'}</span>
            <button type="button" className="btn btn-quiet btn-sm" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
              {theme === 'dark' ? t('light') : t('dark')}
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={load}>{loading ? '…' : `↻ ${t('refresh')}`}</button>
          </div>
        </header>

        <main className="admin-content">
          {syncError && <p className="notice admin-notice">{syncError}</p>}

          {section === 'overview' && (
            <>
              <div className="admin-page-head">
                <div>
                  <p className="hero-eyebrow">{t('overviewEyebrow')}</p>
                  <h1 className="h2">{t('dashboard')}</h1>
                  <p className="lede">{t('dashboardLede')}</p>
                </div>
              </div>
              <div className="admin-stat-grid">
                <div className="admin-stat"><span>{t('revenue')}</span><b>{rupiah(revenue)}</b></div>
                <div className="admin-stat"><span>{t('paidOrders')}</span><b>{paidOrders.length}</b></div>
                <div className="admin-stat"><span>{t('pendingOrders')}</span><b>{pendingOrders}</b></div>
                <div className="admin-stat"><span>{t('bookingRequests')}</span><b>{bookings.length}</b></div>
                <div className="admin-stat"><span>{t('products')}</span><b>{products.length}</b></div>
                <div className="admin-stat"><span>{t('categories')}</span><b>{categories.length}</b></div>
              </div>
              <div className="admin-columns">
                <section className="admin-card">
                  <div className="admin-card-head"><h2>{t('recentOrders')}</h2><button type="button" className="link-button" onClick={() => setSection('orders')}>{t('viewAll')} →</button></div>
                  {renderOrders(3)}
                </section>
                <section className="admin-card">
                  <div className="admin-card-head"><h2>{t('recentBookings')}</h2><button type="button" className="link-button" onClick={() => setSection('bookings')}>{t('viewAll')} →</button></div>
                  {renderBookings(3)}
                </section>
              </div>
              <div className="admin-card">
                <h2>{t('quickActions')}</h2>
                <div className="actions">
                  <button type="button" className="btn btn-primary" onClick={() => setSection('products')}>+ {t('newProduct')}</button>
                  <button type="button" className="btn btn-quiet" onClick={() => setSection('categories')}>+ {t('newCategory')}</button>
                  <button type="button" className="btn btn-quiet" onClick={() => setSection('settings')}>{t('editProfile')}</button>
                </div>
              </div>
            </>
          )}

          {section === 'orders' && (
            <section className="admin-card">
              <div className="admin-card-head"><h1 className="h2">{t('ordersTab')}</h1><button type="button" className="btn btn-quiet btn-sm" onClick={load}>{t('refresh')}</button></div>
              {renderOrders()}
            </section>
          )}

          {section === 'bookings' && (
            <section className="admin-card">
              <div className="admin-card-head"><h1 className="h2">{t('bookingsTab')}</h1><button type="button" className="btn btn-quiet btn-sm" onClick={load}>{t('refresh')}</button></div>
              {renderBookings()}
            </section>
          )}

          {section === 'categories' && (
            <div className="admin-split">
              <section className="admin-card">
                <div className="admin-card-head"><h1 className="h2">{t('categories')}</h1><button type="button" className="btn btn-primary btn-sm" onClick={openNewCategory}>+ {t('newCategory')}</button></div>
                <div className="admin-table">
                  {categories.map((row) => (
                    <div className="admin-table-row" key={row.id}>
                      <div>
                        <b>{row.name}</b>
                        <span className="meta">{row.nameId || '—'} · {row.id}</span>
                      </div>
                      <span className={`status-badge ${row.active ? 'status-paid' : 'status-cancelled'}`}>{row.active ? t('active') : t('inactive')}</span>
                      <div className="admin-row-actions">
                        <button type="button" className="link-button" onClick={() => setCategoryDraft(row)}>{t('edit')}</button>
                        <button type="button" className="link-button danger" onClick={() => removeCategory(row)}>{t('remove')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>{categoryDraft.id ? t('editCategory') : t('newCategory')}</h2>
                <form className="admin-form" onSubmit={submitCategory}>
                  <label className="field"><span>{t('categoryId')}</span>
                    <input value={categoryDraft.id} disabled={Boolean(categoryDraft.id)} onChange={(e) => setCategoryDraft({ ...categoryDraft, id: slug(e.target.value) })} required />
                  </label>
                  <label className="field"><span>{t('categoryName')}</span>
                    <input value={categoryDraft.name} onChange={(e) => {
                      const name = e.target.value;
                      setCategoryDraft((current) => ({ ...current, name, id: current.id || slug(name) }));
                    }} required />
                  </label>
                  <label className="field"><span>{t('categoryNameId')}</span>
                    <input value={categoryDraft.nameId} onChange={(e) => setCategoryDraft({ ...categoryDraft, nameId: e.target.value })} />
                  </label>
                  <label className="field"><span>{t('sortOrder')}</span>
                    <input type="number" value={categoryDraft.sortOrder} onChange={(e) => setCategoryDraft({ ...categoryDraft, sortOrder: Number(e.target.value) })} />
                  </label>
                  <label className="check-field"><input type="checkbox" checked={categoryDraft.active} onChange={(e) => setCategoryDraft({ ...categoryDraft, active: e.target.checked })} /> {t('active')}</label>
                  <div className="actions">
                    <button type="submit" className="btn btn-primary">{t('save')}</button>
                    <button type="button" className="btn btn-quiet" onClick={openNewCategory}>{t('cancel')}</button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {section === 'products' && (
            <div className="admin-split wide">
              <section className="admin-card">
                <div className="admin-card-head"><h1 className="h2">{t('products')}</h1><button type="button" className="btn btn-primary btn-sm" onClick={openNewProduct}>+ {t('newProduct')}</button></div>
                <div className="admin-table">
                  {products.map((row, index) => (
                    <div className="admin-table-row" key={row.id}>
                      <img
                        className="admin-thumb"
                        src={imageFor(row, index)}
                        alt="" width="72" height="56" loading="lazy"
                        onError={(event) => { event.currentTarget.src = imageFallbackUrl(); }}
                      />
                      <div>
                        <b>{row.name}</b>
                        <span className="meta">{row.id} · {categories.find((c) => c.id === row.category)?.name || row.category}</span>
                      </div>
                      <b className="admin-price">{fmt(row.price)}</b>
                      <span className={`status-badge ${row.active ? 'status-paid' : 'status-cancelled'}`}>{row.active ? t('active') : t('inactive')}</span>
                      <div className="admin-row-actions">
                        <button type="button" className="link-button" onClick={() => setProductDraft(row)}>{t('edit')}</button>
                        <button type="button" className="link-button danger" onClick={() => removeProduct(row)}>{t('remove')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>{productDraft.id ? t('editProduct') : t('newProduct')}</h2>
                <form className="admin-form" onSubmit={submitProduct}>
                  <div className="admin-form-grid">
                    <label className="field"><span>{t('productName')}</span>
                      <input value={productDraft.name} onChange={(e) => setProductField('name', e.target.value)} required />
                    </label>
                    <label className="field"><span>{t('productId')}</span>
                      <input value={productDraft.id} disabled={Boolean(productDraft.id)} placeholder={t('autoGenerated')} onChange={(e) => setProductField('id', slug(e.target.value))} />
                    </label>
                    <label className="field"><span>{t('category')}</span>
                      <select value={productDraft.category} onChange={(e) => setProductField('category', e.target.value)} required>
                        <option value="">—</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </label>
                    <label className="field"><span>{t('priceEur')}</span>
                      <input type="number" min="0" step="0.01" value={productDraft.price} onChange={(e) => setProductField('price', Number(e.target.value))} required />
                    </label>
                    <label className="field admin-span-2"><span>{t('imageUrl')}</span>
                      <input value={productDraft.imageUrl} placeholder="https://…" onChange={(e) => setProductField('imageUrl', e.target.value)} />
                    </label>
                    <label className="field"><span>{t('dishType')}</span>
                      <input value={productDraft.dishType} placeholder="wagyu, tomahawk…" onChange={(e) => setProductField('dishType', e.target.value)} />
                    </label>
                    <label className="field"><span>{t('sortOrder')}</span>
                      <input type="number" value={productDraft.sortOrder} onChange={(e) => setProductField('sortOrder', Number(e.target.value))} />
                    </label>
                    <label className="field admin-span-2"><span>{t('description')}</span>
                      <textarea rows="2" value={productDraft.description} onChange={(e) => setProductField('description', e.target.value)} />
                    </label>
                    <label className="field admin-span-2"><span>{t('descriptionId')}</span>
                      <textarea rows="2" value={productDraft.descriptionId} onChange={(e) => setProductField('descriptionId', e.target.value)} />
                    </label>
                    <label className="field"><span>{t('weight')}</span><input value={productDraft.weight} onChange={(e) => setProductField('weight', e.target.value)} /></label>
                    <label className="field"><span>{t('preparation')}</span><input value={productDraft.recommendedTemp} onChange={(e) => setProductField('recommendedTemp', e.target.value)} /></label>
                    <label className="field admin-span-2"><span>{t('provenance')}</span><input value={productDraft.provenance} onChange={(e) => setProductField('provenance', e.target.value)} /></label>
                    <label className="field admin-span-2"><span>{t('ingredients')} ({t('onePerLine')})</span>
                      <textarea rows="3" value={productDraft.ingredients.join('\n')} onChange={(e) => setProductField('ingredients', splitList(e.target.value))} />
                    </label>
                    <label className="check-field"><input type="checkbox" checked={productDraft.chefRecommended} onChange={(e) => setProductField('chefRecommended', e.target.checked)} /> {t('chefsChoice')}</label>
                    <label className="check-field"><input type="checkbox" checked={productDraft.glutenFree} onChange={(e) => setProductField('glutenFree', e.target.checked)} /> {t('glutenFree')}</label>
                    <label className="check-field"><input type="checkbox" checked={productDraft.active} onChange={(e) => setProductField('active', e.target.checked)} /> {t('active')}</label>
                  </div>
                  <div className="admin-preview">
                    <img
                      src={imageFor(productDraft, products.length)}
                      alt="" width="240" height="150"
                      onError={(event) => { event.currentTarget.src = imageFallbackUrl(); }}
                    />
                    <span className="meta">{t('imagePreviewNote')}</span>
                  </div>
                  <div className="actions">
                    <button type="submit" className="btn btn-primary">{t('save')}</button>
                    <button type="button" className="btn btn-quiet" onClick={openNewProduct}>{t('cancel')}</button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {section === 'settings' && (
            <section className="admin-card admin-settings">
              <div className="admin-card-head">
                <div><h1 className="h2">{t('profileSettings')}</h1><p className="lede">{t('profileLede')}</p></div>
                <span className="admin-source">{source === 'supabase' ? 'Supabase' : source === 'demo' ? t('demoData') : 'Local'}</span>
              </div>
              <form className="admin-form" onSubmit={submitProfile}>
                <div className="admin-form-grid">
                  <label className="field"><span>{t('restaurantName')}</span><input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} required /></label>
                  <label className="field"><span>{t('email')}</span><input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })} /></label>
                  <label className="field admin-span-2"><span>{t('tagline')}</span><input value={profileDraft.tagline} onChange={(e) => setProfileDraft({ ...profileDraft, tagline: e.target.value })} /></label>
                  <label className="field admin-span-2"><span>{t('taglineId')}</span><input value={profileDraft.taglineId} onChange={(e) => setProfileDraft({ ...profileDraft, taglineId: e.target.value })} /></label>
                  <label className="field admin-span-2"><span>{t('address')}</span><input value={profileDraft.address} onChange={(e) => setProfileDraft({ ...profileDraft, address: e.target.value })} /></label>
                  <label className="field"><span>{t('phone')}</span><input value={profileDraft.phone} onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })} /></label>
                  <label className="field"><span>{t('heroImage')}</span><input value={profileDraft.heroImage} placeholder="https://…" onChange={(e) => setProfileDraft({ ...profileDraft, heroImage: e.target.value })} /></label>
                  <label className="field admin-span-2"><span>{t('dressCode')}</span><textarea rows="2" value={profileDraft.dressCode} onChange={(e) => setProfileDraft({ ...profileDraft, dressCode: e.target.value })} /></label>
                  <label className="field admin-span-2"><span>{t('dressCodeId')}</span><textarea rows="2" value={profileDraft.dressCodeId} onChange={(e) => setProfileDraft({ ...profileDraft, dressCodeId: e.target.value })} /></label>
                </div>
                <div className="actions"><button type="submit" className="btn btn-primary">{t('saveChanges')}</button></div>
              </form>
            </section>
          )}
        </main>
      </div>

      {toast && <div className="toast admin-toast" role="status">{toast}</div>}
    </div>
  );
}

function navigateSite() {
  navigate('site');
}
