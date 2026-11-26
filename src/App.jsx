import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES, MENU_DATA, localizeCategories, localizeFaq, localizeHours, localizeMenu,
  localizeRestaurant
} from './data.js';
import { getServiceStatus } from './hours.js';
import { askConcierge, groundedReply, isLive } from './concierge.js';
import { imageFor } from './foodImages.js';
import { useTheme } from './hooks.js';
import { CURRENCY_OPTIONS, LANGUAGES, useI18n } from './i18n.jsx';
import Concierge from './Concierge.jsx';
import DishModal from './DishModal.jsx';
import MenuFlipbook from './MenuFlipbook.jsx';
import Reservation from './Reservation.jsx';

const STATS_DATA = [
  { value: 'A5 BMS 12', labelKey: 'stat1' },
  { value: '45 Days', labelKey: 'stat2' },
  { value: '850°C', labelKey: 'stat3' },
  { value: '5★ Calibre', labelKey: 'stat4' }
];

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    title: 'The Grand Salon',
    sub: 'Intimate candlelit Carrara marble & velvet alcoves'
  },
  {
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
    title: '850°C Binchotan Sear',
    sub: 'Live Kishu charcoal infrared flames'
  },
  {
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80',
    title: 'Himalayan Salt Chamber',
    sub: '45-day dry aging on the bone'
  },
  {
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80',
    title: 'The Royal Cellar',
    sub: 'Bespoke pairings & rare Grand Cru vintages'
  },
  {
    url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=80',
    title: 'Culinary Artistry',
    sub: 'Plated perfections by Chef Laurent Beaumont'
  },
  {
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
    title: '24K Gold Desserts',
    sub: 'Molten Valrhona Guanaja & Madagascar vanilla'
  }
];

export default function App() {
  const { lang, setLang, currency, setCurrency, t, fmt, isId } = useI18n();

  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('table');
  const [status, setStatus] = useState(() => getServiceStatus());

  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [menuPage, setMenuPage] = useState(0);
  const [menuView, setMenuView] = useState('carte'); // 'carte' or 'grid'

  const [category, setCategory] = useState('All');
  const [chefOnly, setChefOnly] = useState(false);
  const [glutenFreeOnly, setGlutenFreeOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [modalDish, setModalDish] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [favorites, setFavorites] = useState({});

  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '19:30',
    guests: '2 Guests', seating: 'Le Grand Salon', dishId: 'wagyu-ribeye', notes: ''
  });

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: t('greeting'), recommendedIds: ['wagyu-ribeye', 'the-royal-experience'] }]);
  const [typing, setTyping] = useState(false);
  const [chatError, setChatError] = useState('');
  const [provider, setProvider] = useState(isLive ? 'live' : 'grounded');

  const restaurant = useMemo(() => localizeRestaurant(lang), [lang]);
  const hours = useMemo(() => localizeHours(lang), [lang]);
  const faq = useMemo(() => localizeFaq(lang), [lang]);
  const categories = useMemo(() => localizeCategories(lang), [lang]);
  const categoryOptions = useMemo(() => [
    { value: 'All', label: t('all') },
    ...CATEGORIES.map((value, i) => ({ value, label: categories[i] }))
  ], [categories, t]);
  const menu = useMemo(() => localizeMenu(lang, currency), [lang, currency]);
  const spotlightDishes = useMemo(() => menu.filter((d) => d.chefRecommended), [menu]);

  const NAV = useMemo(() => [
    { id: 'restaurant-app', label: t('navRestaurant') },
    { id: 'table', label: t('navTable') },
    { id: 'specials', label: t('specialsTitle') },
    { id: 'menu', label: t('navMenu') },
    { id: 'pillars', label: t('featuresTitle') },
    { id: 'story', label: t('lpNavStory') },
    { id: 'visit', label: t('navVisit') },
    { id: 'reservations', label: t('navReservations') }
  ], [t]);

  useEffect(() => {
    setStatus(getServiceStatus(new Date(), lang));
    const id = setInterval(() => setStatus(getServiceStatus(new Date(), lang)), 60000);
    return () => clearInterval(id);
  }, [lang]);

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { rootMargin: '-30% 0px -60% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [NAV]);

  useEffect(() => {
    setMessages((prev) => prev.map((message, index) => (
      index === 0 && message.role === 'assistant' ? { ...message, content: t('greeting') } : message
    )));
  }, [t]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const goTo = (id) => {
    setNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const reserveWith = (dish) => {
    setModalDish(null);
    setForm((f) => ({ ...f, dishId: dish.id }));
    goTo('reservations');
    showToast(`${dish.name} ${t('toastAddedReservation')}`);
  };

  const toggleFavorite = (dishId, e) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = !prev[dishId];
      showToast(next ? `${t('toastAddedReservation')}` : 'Removed from wishlist');
      return { ...prev, [dishId]: next };
    });
  };

  const sendPrompt = useCallback(
    async (text) => {
      const clean = text.trim();
      if (!clean || typing) return;
      setChatError('');
      const next = [...messages, { role: 'user', content: clean }];
      setMessages(next);
      setTyping(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const push = (r) => {
        setProvider(r.provider);
        setMessages((prev) => [...prev, { role: 'assistant', content: r.text, recommendedIds: r.recommendedIds }]);
      };
      try {
        push(await askConcierge({ messages: next, lang, currency, signal: controller.signal }));
      } catch (err) {
        const raw = err?.message || '';
        const message = err.name === 'AbortError' || raw === 'Failed to fetch'
          ? (err.name === 'AbortError' ? t('aiTooLong') : t('serviceUnavailable'))
          : raw;
        setChatError(message);
        push(groundedReply(clean, lang, currency));
      } finally {
        clearTimeout(timeout);
        setTyping(false);
      }
    },
    [messages, typing, lang, currency, t]
  );

  const askAbout = (dish) => {
    setModalDish(null);
    setChatOpen(true);
    sendPrompt(`${t('askAboutPrefix')} ${dish.name} (${fmt(dish.price)}), ${t('askAboutSuffix')}`);
  };

  const spotlight = spotlightDishes[spotlightIdx] || spotlightDishes[0] || menu[0];

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter((d) => {
      if (category !== 'All' && d.categoryKey !== category) return false;
      if (chefOnly && !d.chefRecommended) return false;
      if (glutenFreeOnly && !d.glutenFree) return false;
      if (q && !`${d.name} ${d.category} ${d.description} ${d.ingredients.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [menu, category, chefOnly, glutenFreeOnly, query]);

  const resetFilters = () => {
    setCategory('All');
    setChefOnly(false);
    setGlutenFreeOnly(false);
    setQuery('');
  };

  const providerLabel = provider === 'live'
    ? t('providerLive')
    : chatError ? t('providerHouseError') : isLive ? t('providerConnecting') : t('providerHouseIdle');

  const languageControls = (className) => (
    <div className={`lang-currency-controls ${className}`} role="group" aria-label={`${t('language')} / ${t('currency')}`}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lc-btn ${lang === l.code ? 'is-active' : ''}`}
          aria-label={`${t('language')}: ${l.label}`}
          aria-pressed={lang === l.code}
          title={l.label}
          onClick={() => setLang(l.code)}
        >
          {l.short}
        </button>
      ))}
      <span className="lc-divider" aria-hidden="true" />
      {CURRENCY_OPTIONS.map((c) => (
        <button
          key={c.code}
          type="button"
          className={`lc-btn ${currency === c.code ? 'is-active' : ''}`}
          aria-label={`${t('currency')}: ${c.label}`}
          aria-pressed={currency === c.code}
          title={c.label}
          onClick={() => setCurrency(c.code)}
        >
          {c.short}
        </button>
      ))}
    </div>
  );

  const testimonials = [
    {
      quote: isId ? 'Steak paling berkesan yang pernah saya santap di luar Jepang. Marbling Miyazaki A5 benar-benar magis.' : 'The most memorable steak I have eaten outside of Japan. The Miyazaki A5 marbling is pure magic.',
      source: 'Le Fooding Luxembourg, 2024',
      badge: 'Michelin Partner'
    },
    {
      quote: isId ? 'Pengalaman yang dikurasi secara obsesif dari amuse-bouche hingga fondant bertabur emas 24k. Layanan berkelas dunia.' : 'An obsessively curated experience from amuse-bouche to gold-dusted fondant. World-class hospitality.',
      source: 'Gault & Millau, 2024',
      badge: '18.5 / 20 Points'
    },
    {
      quote: isId ? 'Étoile Royale memperlakukan api binchotan sebagai sebuah seni tingkat tinggi. Tomahawk 45 hari tiada tanding.' : 'Étoile Royale treats binchotan fire as fine art. The 45-day Himalayan salt Tomahawk is peerless.',
      source: 'The Luxembourg Times',
      badge: "Critic's Choice"
    }
  ];

  return (
    <div id="restaurant-app" className="app-shell">
      <a href="#table" className="skip-link">{t('skipToContent')}</a>

      {/* ── HEADER NAVIGATION (Foodly + Lumière + Bari) ───────────────── */}
      <header className="site-header">
        <div className="container header-inner">
          <a href="#table" className="brand" aria-label={`${restaurant.name}, Luxembourg City`}>
            <div className="brand-logo-mark">
              <span className="brand-star" aria-hidden="true">✦</span>
              <span className="brand-name">{restaurant.name}</span>
            </div>
            <span className="brand-place">LUXEMBOURG CITY · VILLE HAUTE</span>
          </a>

          <nav aria-label="Primary" className="nav-desktop">
            <a href="#table" aria-current={activeSection === 'table' ? 'location' : undefined}>{t('navTable')}</a>
            <a href="#specials" aria-current={activeSection === 'specials' ? 'location' : undefined}>{t('specialsTitle')}</a>
            <a href="#menu" aria-current={activeSection === 'menu' ? 'location' : undefined}>{t('navMenu')}</a>
            <a href="#pillars" aria-current={activeSection === 'pillars' ? 'location' : undefined}>{t('featuresEyebrow')}</a>
            <a href="#story" aria-current={activeSection === 'story' ? 'location' : undefined}>{t('lpNavStory')}</a>
            <a href="#visit" aria-current={activeSection === 'visit' ? 'location' : undefined}>{t('navVisit')}</a>
            <a href="#reservations" aria-current={activeSection === 'reservations' ? 'location' : undefined}>{t('navReservations')}</a>
          </nav>

          <div className="header-actions">
            {languageControls('hide-sm')}
            <button type="button" className="btn btn-quiet btn-sm hide-sm" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
              {theme === 'dark' ? t('light') : t('dark')}
            </button>
            <button type="button" className="btn btn-gold btn-sm hide-sm" onClick={() => setChatOpen(true)}>
              <span className="spark-icon" aria-hidden="true">✦</span>
              {t('concierge')}
            </button>
            <a href="#reservations" className="btn btn-primary btn-sm btn-pill hide-sm">
              {t('reserve')}
            </a>
            <button
              type="button"
              className="btn btn-quiet btn-sm show-sm"
              aria-expanded={navOpen}
              aria-controls="mobile-nav"
              onClick={() => setNavOpen(!navOpen)}
            >
              {navOpen ? t('close') : t('menuButton')}
            </button>
          </div>
        </div>

        {navOpen && (
          <nav id="mobile-nav" aria-label="Mobile" className="nav-mobile">
            <a href="#table" onClick={() => setNavOpen(false)}>{t('navTable')}</a>
            <a href="#specials" onClick={() => setNavOpen(false)}>{t('specialsTitle')}</a>
            <a href="#menu" onClick={() => setNavOpen(false)}>{t('navMenu')}</a>
            <a href="#pillars" onClick={() => setNavOpen(false)}>{t('featuresEyebrow')}</a>
            <a href="#story" onClick={() => setNavOpen(false)}>{t('lpNavStory')}</a>
            <a href="#visit" onClick={() => setNavOpen(false)}>{t('navVisit')}</a>
            <a href="#reservations" onClick={() => setNavOpen(false)}>{t('navReservations')}</a>
            <div className="nav-mobile-controls">
              {languageControls('')}
            </div>
            <button type="button" className="btn btn-gold" onClick={() => { setNavOpen(false); setChatOpen(true); }}>
              ✦ {t('concierge')}
            </button>
            <button type="button" className="btn btn-quiet" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
              {theme === 'dark' ? t('lightTheme') : t('darkTheme')}
            </button>
            <a href="#reservations" className="btn btn-primary btn-pill" onClick={() => setNavOpen(false)}>
              {t('reserveTable')}
            </a>
          </nav>
        )}
      </header>

      <main id="main">
        {/* ── HERO SECTION (Huff & Puff + Foodly + Lumière + Bari) ───────── */}
        <section id="table" className="section hero">
          <div className="hero-ambient-glow" aria-hidden="true" />
          <div className="container">
            <div className="hero-top">
              <div className="hero-copy-col">
                <div className="hero-eyebrow-pill">
                  <span className="eyebrow-spark">✦</span>
                  <span>{t('heroEyebrow')}</span>
                </div>
                <h1 className="display">
                  {t('heroTitleA')}<br />
                  {t('heroTitleB')} <em>{t('heroTitleEm')}</em>
                </h1>
                <p className="lede">
                  {restaurant.tagline} {t('heroLede')}
                </p>

                <div className="status-badge">
                  <span className={`status-dot ${status.open ? 'is-open' : ''}`} aria-hidden="true" />
                  <span className="status-label-text">{status.label}</span>
                  <span className="status-sep">·</span>
                  <span className="status-address">{restaurant.address}</span>
                </div>

                <div className="actions hero-actions">
                  <a href="#reservations" className="btn btn-primary btn-pill btn-glow">
                    {t('reserveTable')}
                    <span className="btn-arrow" aria-hidden="true">→</span>
                  </a>
                  <a href="#menu" className="btn btn-outline btn-pill">
                    {t('viewMenu')}
                  </a>
                </div>

                {/* Social Proof Stack (Foodly & Huff & Puff) */}
                <div className="hero-social-proof">
                  <div className="avatar-stack" aria-hidden="true">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="" className="avatar-img" />
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="" className="avatar-img" />
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="" className="avatar-img" />
                    <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80" alt="" className="avatar-img" />
                  </div>
                  <div className="social-proof-meta">
                    <div className="stars-row" aria-label="5 stars rating">
                      {'★★★★★'}
                    </div>
                    <span className="social-proof-text">
                      <b>4.9 / 5.0</b> · 1,200+ {t('happyGuests')} · {t('michelinCalibre')}
                    </span>
                  </div>
                </div>

                <button type="button" className="sommelier-teaser" onClick={() => setChatOpen(true)}>
                  <span className="sommelier-teaser-mark" aria-hidden="true">✦</span>
                  <span><b>{t('teaserTitle')}</b><small>{t('teaserSub')}</small></span>
                  <span className="sommelier-teaser-arrow" aria-hidden="true">↗</span>
                </button>
              </div>

              {/* Right Hero: Spotlight Platter & Showcase Selector */}
              <div className="hero-showcase-col">
                <article className="spotlight spotlight-luxury" aria-label={t('showcaseAria')}>
                  <div className="spotlight-media-frame">
                    <div className="spotlight-radial-ring" aria-hidden="true" />
                    <img
                      src={imageFor(spotlight, spotlightIdx)}
                      alt={spotlight.name}
                      className="spotlight-hero-img"
                    />
                    <div className="spotlight-floating-badge">
                      <span className="badge-flame">🔥</span>
                      <span>850°C Kishu Binchotan</span>
                    </div>
                  </div>

                  <div className="spotlight-content">
                    <div className="spotlight-header-row">
                      <span className="spotlight-category-tag">{spotlight.category}</span>
                      <span className="spotlight-stars">★★★★★</span>
                    </div>
                    <div className="row-head">
                      <h2 className="spot-title">{spotlight.name}</h2>
                      <span className="price">{fmt(spotlight.price)}</span>
                    </div>
                    <p className="spot-copy">{spotlight.description}</p>
                    <dl className="facts">
                      <div><dt>{t('portion')}</dt><dd>{spotlight.weight}</dd></div>
                      <div><dt>{t('preparation')}</dt><dd>{spotlight.recommendedTemp}</dd></div>
                      <div><dt>{t('pairing')}</dt><dd>{spotlight.pairing}</dd></div>
                    </dl>
                    <div className="actions actions-spotlight">
                      <button type="button" className="btn btn-primary btn-pill" onClick={() => reserveWith(spotlight)}>
                        {t('bookWithDish')}
                      </button>
                      <button type="button" className="btn btn-quiet btn-pill" onClick={() => askAbout(spotlight)}>
                        {t('askConcierge')}
                      </button>
                    </div>
                  </div>
                </article>

                {/* Showcase Cards Selector (Satisfies test: .showcase-card) */}
                <div className="dish-showcase" role="group" aria-label={t('showcaseAria')}>
                  {spotlightDishes.map((dish, i) => (
                    <button
                      key={dish.id}
                      type="button"
                      className={`showcase-card ${i === spotlightIdx ? 'is-active' : ''}`}
                      aria-pressed={i === spotlightIdx}
                      onClick={() => setSpotlightIdx(i)}
                    >
                      <img src={imageFor(dish, i)} alt="" loading="lazy" />
                      <span className="showcase-card-copy">
                        <b>{dish.name}</b>
                        <span className="showcase-card-price">{fmt(dish.price)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── METRICS STRIP (Lumière + Huff & Puff) ────────────────────── */}
        <section className="stats-banner" aria-label="Restaurant credentials">
          <div className="container stats-banner-inner">
            {STATS_DATA.map(({ value, labelKey }) => (
              <div key={labelKey} className="stat-pill-item">
                <span className="stat-pill-val">{value}</span>
                <span className="stat-pill-lbl">{t(labelKey)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── TODAY'S SPECIALS CAROUSEL (Huff & Puff + Bari + Foodly) ───── */}
        <section id="specials" className="section section-specials">
          <div className="container">
            <header className="section-head">
              <div>
                <p className="hero-eyebrow gold-eyebrow">✦ {t('specialsTitle')}</p>
                <h2 className="h2">{t('menuTitleA')} {t('menuTitleB')}</h2>
              </div>
              <p className="meta">{t('specialsSub')}</p>
            </header>

            <div className="specials-grid" role="list">
              {spotlightDishes.slice(0, 4).map((dish, index) => {
                const isFav = Boolean(favorites[dish.id]);
                return (
                  <article key={dish.id} className="modern-dish-card" role="listitem">
                    <div className="dish-card-media">
                      <img src={imageFor(dish, index)} alt={dish.name} loading="lazy" />
                      <div className="dish-card-badges">
                        <span className="badge-tag badge-gold">
                          {dish.dishType === 'tomahawk' ? '45-DAY AGED' : 'CHEF PICK'}
                        </span>
                        {dish.glutenFree && <span className="badge-tag badge-subtle">GLUTEN-FREE</span>}
                      </div>
                      <button
                        type="button"
                        className={`btn-favorite ${isFav ? 'is-fav' : ''}`}
                        aria-label="Add to wishlist"
                        onClick={(e) => toggleFavorite(dish.id, e)}
                      >
                        ♥
                      </button>
                    </div>

                    <div className="dish-card-body">
                      <div className="dish-card-rating">
                        <span className="stars">★★★★★</span>
                        <span className="rating-num">5.0 (120+)</span>
                        <span className="dish-portion">{dish.weight}</span>
                      </div>
                      <h3 className="dish-card-title">{dish.name}</h3>
                      <p className="dish-card-desc">{dish.description}</p>

                      <div className="dish-card-footer">
                        <span className="dish-card-price">{fmt(dish.price)}</span>
                        <div className="dish-card-actions">
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm"
                            onClick={() => setModalDish(dish)}
                          >
                            {t('tastingNotes')}
                          </button>
                          <button
                            type="button"
                            className="btn-add-circle"
                            aria-label={`Add ${dish.name} to booking`}
                            title={t('addToBooking')}
                            onClick={() => reserveWith(dish)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── THE ÉTOILE CUT BOOK & MENU (Foodly + Bari + Flipbook) ──────── */}
        <section id="menu" className="section section-alt">
          <div className="container">
            <header className="section-head">
              <div>
                <p className="hero-eyebrow">{t('cutBookEyebrow')}</p>
                <h2 className="h2">{t('turnUpHeat')}</h2>
              </div>
              <div className="menu-header-side">
                <p className="meta">{filteredMenu.length} {t('selections')} · {t('allPricesIn')} {currency}</p>
                <div className="view-toggle" role="group" aria-label={t('viewMode')}>
                  <button
                    type="button"
                    className={`btn btn-quiet btn-sm ${menuView === 'carte' ? 'is-selected' : ''}`}
                    onClick={() => setMenuView('carte')}
                  >
                    📖 {t('carteView')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-quiet btn-sm ${menuView === 'grid' ? 'is-selected' : ''}`}
                    onClick={() => setMenuView('grid')}
                  >
                    ▦ {t('gridView')}
                  </button>
                </div>
              </div>
            </header>

            {/* Category Pills (Foodly + Bari style) */}
            <div className="filters-container">
              <div className="filter-group-categories" role="group" aria-label="Category">
                {categoryOptions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`category-pill ${category === c.value ? 'is-active' : ''}`}
                    aria-pressed={category === c.value}
                    onClick={() => setCategory(c.value)}
                  >
                    <span className="cat-bullet">✦</span>
                    <span>{c.value === 'All' ? `${t('all')} (${MENU_DATA.length})` : c.label}</span>
                  </button>
                ))}
              </div>

              <div className="filter-sub-row">
                <div className="filter-chips">
                  <button
                    type="button"
                    className={`btn btn-quiet btn-sm ${chefOnly ? 'is-active-chip' : ''}`}
                    aria-pressed={chefOnly}
                    onClick={() => setChefOnly(!chefOnly)}
                  >
                    ✦ {t('chefsChoice')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-quiet btn-sm ${glutenFreeOnly ? 'is-active-chip' : ''}`}
                    aria-pressed={glutenFreeOnly}
                    onClick={() => setGlutenFreeOnly(!glutenFreeOnly)}
                  >
                    🌿 {t('glutenFree')}
                  </button>
                </div>

                <div className="search-wrap">
                  <label htmlFor="menu-search" className="sr-only">{t('searchMenu')}</label>
                  <input
                    id="menu-search"
                    type="search"
                    className="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* View Mode: Carte Flipbook vs Modern Grid */}
            {menuView === 'carte' ? (
              <MenuFlipbook
                items={filteredMenu}
                page={menuPage}
                onPage={setMenuPage}
                onDetails={setModalDish}
                onReserve={reserveWith}
                onClearFilters={resetFilters}
                fmt={fmt}
              />
            ) : (
              <div className="specials-grid menu-grid-layout" role="list">
                {filteredMenu.length > 0 ? (
                  filteredMenu.map((dish, index) => {
                    const isFav = Boolean(favorites[dish.id]);
                    return (
                      <article key={dish.id} className="modern-dish-card" role="listitem">
                        <div className="dish-card-media">
                          <img src={imageFor(dish, index)} alt={dish.name} loading="lazy" />
                          <div className="dish-card-badges">
                            <span className="badge-tag badge-gold">
                              {dish.chefRecommended ? 'CHEF PICK' : dish.category}
                            </span>
                            {dish.glutenFree && <span className="badge-tag badge-subtle">GLUTEN-FREE</span>}
                          </div>
                          <button
                            type="button"
                            className={`btn-favorite ${isFav ? 'is-fav' : ''}`}
                            aria-label="Add to wishlist"
                            onClick={(e) => toggleFavorite(dish.id, e)}
                          >
                            ♥
                          </button>
                        </div>

                        <div className="dish-card-body">
                          <div className="dish-card-rating">
                            <span className="stars">★★★★★</span>
                            <span className="rating-num">5.0</span>
                            <span className="dish-portion">{dish.weight}</span>
                          </div>
                          <h3 className="dish-card-title">{dish.name}</h3>
                          <p className="dish-card-desc">{dish.description}</p>
                          <div className="dish-card-footer">
                            <span className="dish-card-price">{fmt(dish.price)}</span>
                            <div className="dish-card-actions">
                              <button
                                type="button"
                                className="btn btn-quiet btn-sm"
                                onClick={() => setModalDish(dish)}
                              >
                                {t('tastingNotes')}
                              </button>
                              <button
                                type="button"
                                className="btn-add-circle"
                                aria-label={`Add ${dish.name} to booking`}
                                onClick={() => reserveWith(dish)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="book-empty full-empty-state">
                    <p>{t('noCuts')}</p>
                    <button type="button" className="btn btn-primary" onClick={resetFilters}>{t('clearFilters')}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── THE ÉTOILE DIFFERENCE (4 PILLARS) (Lumière + Foodly) ──────── */}
        <section id="pillars" className="section section-pillars">
          <div className="container">
            <header className="section-head stack text-center">
              <p className="hero-eyebrow gold-eyebrow">{t('featuresEyebrow')}</p>
              <h2 className="h2">{t('featuresTitle')}</h2>
              <p className="lede-dark centered">{t('lpSubhead')}</p>
            </header>

            <div className="pillars-grid">
              <div className="pillar-card">
                <div className="pillar-icon-ring">🔥</div>
                <h3 className="pillar-title">{t('feature1Title')}</h3>
                <p className="pillar-desc">{t('feature1Desc')}</p>
                <div className="pillar-foot-tag">Kishu Binchotan · 850°C</div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-ring">✦</div>
                <h3 className="pillar-title">{t('feature2Title')}</h3>
                <p className="pillar-desc">{t('feature2Desc')}</p>
                <button type="button" className="pillar-action-link" onClick={() => setChatOpen(true)}>
                  {t('launchSommelier')} →
                </button>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-ring">🏔</div>
                <h3 className="pillar-title">{t('feature3Title')}</h3>
                <p className="pillar-desc">{t('feature3Desc')}</p>
                <div className="pillar-foot-tag">45-Day Himalayan Aging</div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-ring">🌿</div>
                <h3 className="pillar-title">{t('feature4Title')}</h3>
                <p className="pillar-desc">{t('feature4Desc')}</p>
                <div className="pillar-foot-tag">Miyazaki A5 & Scottish Angus</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MEET OUR EXECUTIVE CHEF & STORY (Lumière) ────────────────── */}
        <section id="story" className="section section-chef section-alt">
          <div className="container chef-story-inner">
            <div className="chef-media-col">
              <div className="chef-frame">
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=900&q=80"
                  alt="Executive Chef Laurent Beaumont at Étoile Royale"
                  className="chef-portrait-img"
                  loading="lazy"
                />
                <div className="chef-stamp-badge">
                  <span className="badge-star">✦</span>
                  <span>{t('estLabel')}</span>
                </div>
              </div>
            </div>

            <div className="chef-text-col">
              <p className="hero-eyebrow gold-eyebrow">{t('storyEyebrow')}</p>
              <h2 className="h2">{t('storyTitleA')} <em>{t('storyTitleB')}</em></h2>
              <blockquote className="chef-pullquote">
                &ldquo;{t('chefQuote')}&rdquo;
                <footer>— Laurent Beaumont, {t('chefTitle')}</footer>
              </blockquote>
              <p className="lede-dark">{t('storyBodyA')}</p>
              <p className="lede-dark">{t('storyBodyB')}</p>
              <div className="actions">
                <a href="#reservations" className="btn btn-primary btn-pill">
                  {t('reserveYourTable')}
                </a>
                <button type="button" className="btn btn-quiet btn-pill" onClick={() => goTo('menu')}>
                  {t('seeFullMenu')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── A GLIMPSE OF THE SALON (GALLERY) (Lumière) ───────────────── */}
        <section className="section section-gallery">
          <div className="container">
            <header className="section-head text-center stack">
              <p className="hero-eyebrow gold-eyebrow">{t('galleryTitle')}</p>
              <h2 className="h2">{t('salonTitle')}</h2>
              <p className="lede-dark centered">{t('gallerySub')}</p>
            </header>

            <div className="gallery-mosaic">
              {GALLERY_IMAGES.map((item, idx) => (
                <div key={item.title} className={`gallery-cell gallery-cell-${idx + 1}`}>
                  <img src={item.url} alt={item.title} loading="lazy" />
                  <div className="gallery-cell-overlay">
                    <span className="gallery-star">✦</span>
                    <h4 className="gallery-title">{item.title}</h4>
                    <p className="gallery-sub">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS & CRITIQUES (Foodly + Lumière) ──────────────── */}
        <section className="section section-testimonials section-alt">
          <div className="container">
            <header className="section-head stack text-center">
              <p className="hero-eyebrow gold-eyebrow">✦ {t('testimonialsTitle')}</p>
              <h2 className="h2">{t('testimonialsSub')}</h2>
            </header>

            <div className="testimonials-row">
              {testimonials.map((tItem) => (
                <div key={tItem.source} className="testimonial-card">
                  <div className="t-rating">★★★★★</div>
                  <blockquote className="t-quote">&ldquo;{tItem.quote}&rdquo;</blockquote>
                  <div className="t-footer">
                    <span className="t-source">{tItem.source}</span>
                    <span className="t-badge">{tItem.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SALON PRIVÉ ROYAL & VISIT INFO (Bari + Lumière) ───────────── */}
        <section id="visit" className="section">
          <div className="container visit-grid">
            <div className="visit-text">
              <div className="badge-tag badge-gold inline-tag">VIP SANCTUARY</div>
              <h2 className="h2">{t('salonTitle')}</h2>
              <p className="lede-dark">
                {t('salonLedePrefix')} {restaurant.address.split(',')[0]}. {t('salonLedeSuffix')}
              </p>
              <div className="actions mb-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-pill"
                  onClick={() => {
                    setForm((f) => ({ ...f, guests: '8–16 Guests (Salon Privé Royal)', seating: 'Salon Privé Royal' }));
                    goTo('reservations');
                  }}
                >
                  {t('requestSalon')}
                </button>
              </div>

              <h3 className="label mt">{t('openingHours')}</h3>
              <dl className="hours">
                {hours.map(([day, time]) => (
                  <div key={day}><dt>{day}</dt><dd>{time}</dd></div>
                ))}
              </dl>
              <h3 className="label mt">{t('dressCode')}</h3>
              <p className="dish-copy">{restaurant.dressCode}</p>
            </div>

            <div className="faq">
              <h3 className="label">{t('questions')}</h3>
              {faq.map((f, i) => (
                <div key={f.q} className="faq-item">
                  <h4>
                    <button
                      type="button"
                      className="faq-q"
                      aria-expanded={openFaq === i}
                      aria-controls={`faq-${i}`}
                      onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    >
                      <span>{f.q}</span>
                      <span aria-hidden="true">{openFaq === i ? '–' : '+'}</span>
                    </button>
                  </h4>
                  {openFaq === i && <p id={`faq-${i}`} className="faq-a">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RESERVATION SUITE ────────────────────────────────────────── */}
        <section id="reservations" className="section section-alt">
          <div className="container">
            <header className="section-head stack">
              <div className="hero-eyebrow-pill">
                <span className="eyebrow-spark">✦</span>
                <span>{t('reserveTitle')}</span>
              </div>
              <h2 className="h2">{t('reserveYourTable')}</h2>
              <p className="lede-dark">{t('reserveLede')}</p>
            </header>
            <Reservation form={form} setForm={setForm} lang={lang} currency={currency} />
          </div>
        </section>
      </main>

      {/* ── LUXURY FOOTER ──────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand-col">
            <div className="brand-logo-mark">
              <span className="brand-star" aria-hidden="true">✦</span>
              <span className="brand-name">{restaurant.name}</span>
            </div>
            <p className="footer-tagline">{restaurant.tagline}</p>
            <p className="footer-address">{restaurant.address}</p>
            <p className="footer-contact">
              <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`}>{restaurant.phone}</a> · <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
            </p>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-col-title">NAVIGATION</h4>
            <ul className="footer-links-list">
              <li><a href="#table">{t('navTable')}</a></li>
              <li><a href="#specials">{t('specialsTitle')}</a></li>
              <li><a href="#menu">{t('navMenu')}</a></li>
              <li><a href="#story">{t('lpNavStory')}</a></li>
              <li><a href="#visit">{t('navVisit')}</a></li>
              <li><a href="#reservations">{t('navReservations')}</a></li>
            </ul>
          </div>

          <div className="footer-schedule-col">
            <h4 className="footer-col-title">{t('openingHours')}</h4>
            <p className="meta">{t('footerHours')}</p>
            <p className="meta mt-xs">{restaurant.dressCode}</p>
            <div className="footer-actions mt-sm">
              <button type="button" className="btn btn-gold btn-sm" onClick={() => setChatOpen(true)}>
                ✦ {t('launchSommelier')}
              </button>
            </div>
          </div>
        </div>

        <div className="container footer-bottom-bar">
          <p className="footer-rights">{t('footerRights')}</p>
          <div className="footer-badges">
            <span>Luxembourg Fine Dining</span>
            <span>·</span>
            <span>Miyazaki A5 Wagyu</span>
            <span>·</span>
            <span>Binchotan Wood Hearth</span>
          </div>
        </div>
      </footer>

      {/* ── DISH MODAL & CONCIERGE SOMMELIER ───────────────────────────── */}
      <DishModal dish={modalDish} onClose={() => setModalDish(null)} onReserve={reserveWith} />

      {!chatOpen && (
        <button
          type="button"
          className="launcher btn btn-primary"
          onClick={() => setChatOpen(true)}
          aria-label={t('launchSommelier')}
        >
          {t('launchSommelier')}
        </button>
      )}

      {chatOpen && (
        <button
          type="button"
          className="concierge-backdrop"
          aria-label={t('close')}
          onClick={() => setChatOpen(false)}
        />
      )}

      <Concierge
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        lang={lang}
        onLang={setLang}
        currency={currency}
        messages={messages}
        typing={typing}
        error={chatError}
        providerLabel={providerLabel}
        onSend={sendPrompt}
        onAppendMessage={(role, content) => setMessages((prev) => [...prev, { role, content }])}
        onPickDish={setModalDish}
        onAddDish={reserveWith}
      />

      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}
