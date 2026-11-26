import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES, MENU_DATA, localizeCategories, localizeFaq, localizeHours, localizeMenu,
  localizeRestaurant
} from './data.js';
import { getServiceStatus } from './hours.js';
import { askConcierge, groundedReply, isLive } from './concierge.js';
import { ensureChatSession, loadChatMessages, saveChatMessage } from './lib/chatStore.js';
import { isSupabaseConfigured } from './lib/supabase.js';
import { imageFor } from './foodImages.js';
import { useTheme } from './hooks.js';
import { CURRENCY_OPTIONS, LANGUAGES, useI18n } from './i18n.jsx';
import Concierge from './Concierge.jsx';
import DishModal from './DishModal.jsx';
import MenuFlipbook from './MenuFlipbook.jsx';
import Reservation from './Reservation.jsx';
import LandingPage from './LandingPage.jsx';

export default function App() {
  const { lang, setLang, currency, setCurrency, t, fmt } = useI18n();

  const scrollToApp = () => {
    document.getElementById('restaurant-app')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('table');
  const [status, setStatus] = useState(() => getServiceStatus());

  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [menuPage, setMenuPage] = useState(0);

  const [category, setCategory] = useState('All');
  const [chefOnly, setChefOnly] = useState(false);
  const [glutenFreeOnly, setGlutenFreeOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [modalDish, setModalDish] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '19:30',
    guests: '2 Guests', seating: 'Le Grand Salon', dishId: 'wagyu-ribeye', notes: ''
  });

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: t('greeting'), recommendedIds: ['wagyu-ribeye', 'the-royal-experience'] }]);
  const [typing, setTyping] = useState(false);
  const sessionIdRef = useRef(null);
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
    { id: 'menu', label: t('navMenu') },
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
      { rootMargin: '-40% 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [NAV]);

  useEffect(() => {
    setMessages((prev) => prev.map((message, index) => (
      index === 0 && message.role === 'assistant' ? { ...message, content: t('greeting') } : message
    )));
  }, [t]);

  // Restore chat session from Supabase on first mount.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const sid = await ensureChatSession(lang, currency);
        if (cancelled || !sid) return;
        sessionIdRef.current = sid;
        const loaded = await loadChatMessages(sid);
        if (cancelled) return;
        if (loaded && loaded.length) setMessages(loaded);
      } catch (e) {
        console.error('Failed to restore chat session', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    document.getElementById(id)?.scrollIntoView();
  };

  const reserveWith = (dish) => {
    setModalDish(null);
    setForm((f) => ({ ...f, dishId: dish.id }));
    goTo('reservations');
    showToast(`${dish.name} ${t('toastAddedReservation')}`);
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
      const sid = sessionIdRef.current;
      if (sid) saveChatMessage(sid, { role: 'user', content: clean, lang, currency });
      const push = (r) => {
        setProvider(r.provider);
        setMessages((prev) => [...prev, { role: 'assistant', content: r.text, recommendedIds: r.recommendedIds }]);
        if (sid) saveChatMessage(sid, { role: 'assistant', content: r.text, recommendedIds: r.recommendedIds, provider: r.provider, lang, currency });
      };
      try {
        push(await askConcierge({ messages: next, lang, currency, signal: controller.signal }));
      } catch (err) {
        const raw = err?.message || '';
        const message = err.name === 'AbortError' || raw === 'Failed to fetch'
          ? (err.name === 'AbortError' ? t('aiTooLong') : t('serviceUnavailable'))
          : raw;
        setChatError(message);
        const gr = groundedReply(clean, lang, currency);
        push(gr);
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

  return (
    <>
      <LandingPage onEnter={scrollToApp} />

      <div id="restaurant-app">
        <a href="#table" className="skip-link">{t('skipToContent')}</a>

        <header className="site-header">
          <div className="container header-inner">
            <a href="#table" className="brand" aria-label={`${restaurant.name}, Luxembourg City`}>
              <span className="brand-name">{restaurant.name}</span>
              <span className="brand-place">Luxembourg City</span>
            </a>

            <nav aria-label="Primary" className="nav-desktop">
              {NAV.slice(1).map((n) => (
                <a key={n.id} href={`#${n.id}`} aria-current={activeSection === n.id ? 'location' : undefined}>
                  {n.label}
                </a>
              ))}
            </nav>

            <div className="header-actions">
              {languageControls('hide-sm')}
              <button type="button" className="btn btn-quiet btn-sm hide-sm" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
                {theme === 'dark' ? t('light') : t('dark')}
              </button>
              <button type="button" className="btn btn-quiet btn-sm hide-sm" onClick={() => setChatOpen(true)}>
                {t('concierge')}
              </button>
              <a href="#reservations" className="btn btn-primary btn-sm hide-sm">{t('reserve')}</a>
              <button type="button" className="btn btn-quiet btn-sm show-sm" aria-expanded={navOpen} aria-controls="mobile-nav" onClick={() => setNavOpen(!navOpen)}>
                {navOpen ? t('close') : t('menuButton')}
              </button>
            </div>
          </div>

          {navOpen && (
            <nav id="mobile-nav" aria-label="Mobile" className="nav-mobile">
              {NAV.slice(1).map((n) => (
                <a key={n.id} href={`#${n.id}`} onClick={() => setNavOpen(false)} aria-current={activeSection === n.id ? 'location' : undefined}>
                  {n.label}
                </a>
              ))}
              <div className="nav-mobile-controls">
                {languageControls('')}
              </div>
              <button type="button" className="btn" onClick={() => { setNavOpen(false); setChatOpen(true); }}>{t('concierge')}</button>
              <button type="button" className="btn" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
                {theme === 'dark' ? t('lightTheme') : t('darkTheme')}
              </button>
            </nav>
          )}
        </header>

        <main id="main">
          <section id="table" className="section hero">
            <div className="container">
              <div className="hero-top">
                <div>
                  <p className="hero-eyebrow">{t('heroEyebrow')}</p>
                  <h1 className="display">{t('heroTitleA')}<br />{t('heroTitleB')} <em>{t('heroTitleEm')}</em></h1>
                </div>
                <div className="hero-side">
                  <p className="lede">
                    {restaurant.tagline} {t('heroLede')}
                  </p>
                  <p className="status">
                    <span className={`status-dot ${status.open ? 'is-open' : ''}`} aria-hidden="true" />
                    <span>{status.label}</span>
                    <span className="status-sep">·</span>
                    <span>{restaurant.address}</span>
                  </p>
                  <div className="actions">
                    <a href="#reservations" className="btn btn-primary btn-pill">{t('reserveTable')}</a>
                    <a href="#menu" className="btn">{t('viewMenu')}</a>
                  </div>
                  <button type="button" className="sommelier-teaser" onClick={() => setChatOpen(true)}>
                    <span className="sommelier-teaser-mark" aria-hidden="true">✦</span>
                    <span><b>{t('teaserTitle')}</b><small>{t('teaserSub')}</small></span>
                    <span className="sommelier-teaser-arrow" aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>

              <div className="hero-main">
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
                        <span>{fmt(dish.price)}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <article className="spotlight" aria-label={t('showcaseAria')}>
                  <p className="meta">{spotlight.category}</p>
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
                  <div className="actions">
                    <button type="button" className="btn btn-primary" onClick={() => reserveWith(spotlight)}>{t('bookWithDish')}</button>
                    <button type="button" className="btn" onClick={() => askAbout(spotlight)}>{t('askConcierge')}</button>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section id="menu" className="section section-alt">
            <div className="container">
              <header className="section-head">
                <div>
                  <p className="hero-eyebrow">{t('cutBookEyebrow')}</p>
                  <h2 className="h2">{t('turnUpHeat')}</h2>
                </div>
                <p className="meta">{filteredMenu.length} {t('selections')} · {t('allPricesIn')} {currency}</p>
              </header>

              <div className="filters">
                <div className="filter-group" role="group" aria-label="Category">
                  {categoryOptions.map((c) => (
                    <button key={c.value} type="button" className="btn btn-quiet btn-sm" aria-pressed={category === c.value} onClick={() => setCategory(c.value)}>
                      {c.value === 'All' ? `${t('all')} ${MENU_DATA.length}` : c.label}
                    </button>
                  ))}
                </div>
                <div className="filter-group">
                  <button type="button" className="btn btn-quiet btn-sm" aria-pressed={chefOnly} onClick={() => setChefOnly(!chefOnly)}>
                    {t('chefsChoice')}
                  </button>
                  <button type="button" className="btn btn-quiet btn-sm" aria-pressed={glutenFreeOnly} onClick={() => setGlutenFreeOnly(!glutenFreeOnly)}>
                    {t('glutenFree')}
                  </button>
                  <label htmlFor="menu-search" className="sr-only">{t('searchMenu')}</label>
                  <input id="menu-search" type="search" className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} />
                </div>
              </div>

              <MenuFlipbook
                items={filteredMenu}
                page={menuPage}
                onPage={setMenuPage}
                onDetails={setModalDish}
                onReserve={reserveWith}
                onClearFilters={resetFilters}
                fmt={fmt}
              />
            </div>
          </section>

          <section id="visit" className="section">
            <div className="container visit-grid">
              <div className="visit-text">
                <h2 className="h2">{t('salonTitle')}</h2>
                <p className="lede-dark">
                  {t('salonLedePrefix')} {restaurant.address.split(',')[0]}. {t('salonLedeSuffix')}
                </p>
                <button type="button" className="btn btn-primary" onClick={() => { setForm((f) => ({ ...f, guests: '8–16 Guests (Salon Privé Royal)', seating: 'Salon Privé Royal' })); goTo('reservations'); }}>
                  {t('requestSalon')}
                </button>

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
                      <button type="button" className="faq-q" aria-expanded={openFaq === i} aria-controls={`faq-${i}`} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
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

          <section id="reservations" className="section section-alt">
            <div className="container">
              <header className="section-head stack">
                <h2 className="h2">{t('reserveYourTable')}</h2>
                <p className="lede-dark">{t('reserveLede')}</p>
              </header>
              <Reservation form={form} setForm={setForm} lang={lang} currency={currency} />
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <div>
              <p className="brand-name">{restaurant.name}</p>
              <p>{restaurant.address}</p>
              <p>
                <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`}>{restaurant.phone}</a> · <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
              </p>
            </div>
            <p className="meta">{t('footerHours')}</p>
          </div>
        </footer>
      </div>

      <DishModal dish={modalDish} onClose={() => setModalDish(null)} onReserve={reserveWith} />

      {!chatOpen && (
        <button type="button" className="launcher btn btn-primary" onClick={() => setChatOpen(true)}>
          {t('launchSommelier')}
        </button>
      )}
      {chatOpen && <button type="button" className="concierge-backdrop" aria-label={t('close')} onClick={() => setChatOpen(false)} />}
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
        onAppendMessage={(role, content) => {
          setMessages((prev) => [...prev, { role, content }]);
          const sid = sessionIdRef.current;
          if (sid) saveChatMessage(sid, { role, content, lang, currency });
        }}
        onPickDish={setModalDish}
        onAddDish={reserveWith}
      />

      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </>
  );
}
