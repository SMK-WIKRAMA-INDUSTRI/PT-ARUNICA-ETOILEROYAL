import { useEffect, useRef, useState } from 'react';
import { useI18n } from './i18n.jsx';

const STAT_VALUES = ['A5', '45', '850°C', '5★'];
const STAT_KEYS = ['stat1', 'stat2', 'stat3', 'stat4'];
const FEATURE_ICONS = ['🔥', '✦', '🏔', '🌿'];
const FEATURE_TITLE_KEYS = ['feature1Title', 'feature2Title', 'feature3Title', 'feature4Title'];
const FEATURE_DESC_KEYS = ['feature1Desc', 'feature2Desc', 'feature3Desc', 'feature4Desc'];

export default function LandingPage({ onEnter }) {
  const { t, fmt, isId } = useI18n();
  const heroRef = useRef(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const stats = STAT_KEYS.map((key, i) => ({ value: STAT_VALUES[i], label: t(key) }));
  const features = FEATURE_TITLE_KEYS.map((key, i) => ({
    icon: FEATURE_ICONS[i], title: t(key), desc: t(FEATURE_DESC_KEYS[i])
  }));
  const quotes = [
    { text: 'The most memorable steak I have eaten outside of Japan.', author: 'Le Fooding Luxembourg, 2024' },
    { text: 'An obsessively curated experience from amuse-bouche to gold-dusted fondant.', author: 'Gault & Millau, 2024' },
    { text: 'Étoile Royale treats fire as an art form.', author: 'The Luxembourg Times' }
  ];
  const dishes = [
    { name: 'Japanese A5 Wagyu Ribeye', price: 95, tagKey: 'tagChef' },
    { name: 'Royal Tomahawk Steak', price: 120, tagKey: 'tagDry' },
    { name: 'Black Truffle Tenderloin', price: 78, tagKey: 'tagGold' },
    { name: 'The Royal Experience', price: 145, tagKey: 'tagFive' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx((i) => (i + 1) % quotes.length), 5000);
    return () => clearInterval(id);
  }, [quotes.length]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.setProperty('--parallax', `${window.scrollY * 0.4}px`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`landing ${loaded ? 'landing--visible' : ''}`}>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef} aria-label="Welcome to Étoile Royale">
        <div className="lp-hero-overlay" aria-hidden="true" />
        <div className="lp-hero-grain" aria-hidden="true" />

        <header className="lp-nav container">
          <div className="lp-brand">
            <span className="lp-brand-star" aria-hidden="true">✦</span>
            <span>ÉTOILE ROYALE</span>
          </div>
          <nav className="lp-nav-links" aria-label="Quick links">
            <a href="#lp-story">{t('lpNavStory')}</a>
            <a href="#lp-menu">{t('lpNavMenu')}</a>
            <a href="#lp-visit">{t('lpNavVisit')}</a>
          </nav>
        </header>

        <div className="lp-hero-content container">
          <p className="lp-eyebrow">{t('lpEyebrow')}</p>
          <h1 className="lp-headline">
            {t('lpHeadlineA')}<br />
            <em>{t('lpHeadlineB')}</em><br />
            {t('lpHeadlineC')}
          </h1>
          <p className="lp-subhead">{t('lpSubhead')}</p>
          <div className="lp-hero-actions">
            <button type="button" className="lp-btn lp-btn-primary lp-btn-enter" onClick={onEnter}>
              {t('lpEnter')}
              <span className="lp-btn-arrow" aria-hidden="true">→</span>
            </button>
            <a href="#lp-story" className="lp-btn lp-btn-ghost">{t('lpDiscover')}</a>
          </div>
        </div>

        <div className="lp-stats" aria-label="Restaurant highlights">
          {stats.map(({ value, label }) => (
            <div key={label} className="lp-stat">
              <span className="lp-stat-value">{value}</span>
              <span className="lp-stat-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="lp-scroll-hint" aria-hidden="true">
          <span>{t('lpScroll')}</span>
          <span className="lp-scroll-line" />
        </div>
      </section>

      {/* ── QUOTE ROTATOR ─────────────────────────────────── */}
      <section className="lp-quote-band" aria-label={t('quoteAria')}>
        <div className="container">
          <div className="lp-quote-wrap">
            {quotes.map((q, i) => (
              <blockquote
                key={q.author}
                className={`lp-quote ${i === quoteIdx ? 'lp-quote--active' : ''}`}
                aria-hidden={i !== quoteIdx}
              >
                <p>&ldquo;{q.text}&rdquo;</p>
                <footer>— {q.author}</footer>
              </blockquote>
            ))}
          </div>
          <div className="lp-quote-dots" aria-hidden="true">
            {quotes.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`lp-qdot ${i === quoteIdx ? 'lp-qdot--active' : ''}`}
                onClick={() => setQuoteIdx(i)}
                aria-label={`Quote ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ─────────────────────────────────────────── */}
      <section id="lp-story" className="lp-story container" aria-labelledby="story-heading">
        <div className="lp-story-text">
          <p className="lp-section-eyebrow">{t('storyEyebrow')}</p>
          <h2 id="story-heading" className="lp-h2">
            {t('storyTitleA')}<br />{t('storyTitleB')}
          </h2>
          <p className="lp-body">{t('storyBodyA')}</p>
          <p className="lp-body">{t('storyBodyB')}</p>
          <button type="button" className="lp-btn lp-btn-primary" onClick={onEnter}>
            {t('seeFullMenu')}
          </button>
        </div>
        <div className="lp-story-image" aria-hidden="true">
          <div className="lp-img-frame">
            <img
              src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80"
              alt={t('chefImageAlt')}
              loading="lazy"
              width="900"
              height="600"
            />
            <div className="lp-img-badge">
              <span className="lp-img-badge-star">✦</span>
              <span>{t('estLabel')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section className="lp-features-band" aria-labelledby="features-heading">
        <div className="container">
          <div className="lp-features-head">
            <p className="lp-section-eyebrow">{t('featuresEyebrow')}</p>
            <h2 id="features-heading" className="lp-h2">{t('featuresTitle')}</h2>
          </div>
          <ul className="lp-features-grid" role="list">
            {features.map(({ icon, title, desc }) => (
              <li key={title} className="lp-feature-card">
                <span className="lp-feature-icon" aria-hidden="true">{icon}</span>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── MENU TEASER ───────────────────────────────────── */}
      <section id="lp-menu" className="lp-menu-teaser container" aria-labelledby="menu-heading">
        <div className="lp-menu-teaser-text">
          <p className="lp-section-eyebrow">{t('menuTeaserEyebrow')}</p>
          <h2 id="menu-heading" className="lp-h2">
            {t('menuTitleA')}<br />{t('menuTitleB')}
          </h2>
          <p className="lp-body">{t('menuBodyA')}</p>
          <p className="lp-body">{t('menuBodyB')}</p>
          <div className="lp-menu-teaser-actions">
            <button type="button" className="lp-btn lp-btn-primary" onClick={onEnter}>
              {t('exploreMenu')}
            </button>
            <span className="lp-menu-teaser-note">{t('menuNote')}</span>
          </div>
        </div>
        <div className="lp-menu-dishes" aria-hidden="true">
          {dishes.map(({ name, price, tagKey }) => (
            <button key={name} type="button" className="lp-dish-row" onClick={onEnter}>
              <div>
                <span className="lp-dish-name">{name}</span>
                <span className="lp-dish-tag">{t(tagKey)}</span>
              </div>
              <span className="lp-dish-price">{fmt(price)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── VISIT ─────────────────────────────────────────── */}
      <section id="lp-visit" className="lp-visit-band" aria-labelledby="visit-heading">
        <div className="container lp-visit-inner">
          <div className="lp-visit-info">
            <p className="lp-section-eyebrow">{t('findUs')}</p>
            <h2 id="visit-heading" className="lp-h2">{t('lpVisitTitle')}</h2>
            <address className="lp-address">
              26 Rue Notre-Dame<br />
              L-2240 Luxembourg City<br />
              <a href="tel:+35227864410">+352 27 86 44 10</a><br />
              <a href="mailto:concierge@etoileroyale.lu">concierge@etoileroyale.lu</a>
            </address>
            <dl className="lp-hours">
              <div><dt>{isId ? 'Sel – Jum' : 'Tue – Fri'}</dt><dd>18:00 – 23:30</dd></div>
              <div><dt>{isId ? 'Sabtu' : 'Saturday'}</dt><dd>12:00 – 15:00 &amp; 18:00 – 00:00</dd></div>
              <div><dt>{isId ? 'Minggu' : 'Sunday'}</dt><dd>18:00 – 22:30</dd></div>
              <div><dt>{isId ? 'Senin' : 'Monday'}</dt><dd>{t('closedMondays')}</dd></div>
            </dl>
          </div>
          <div className="lp-visit-cta">
            <div className="lp-cta-card">
              <span className="lp-cta-star" aria-hidden="true">✦</span>
              <h3 className="lp-cta-title">{t('reserveTitle')}</h3>
              <p className="lp-cta-body">{t('reserveBody')}</p>
              <button type="button" className="lp-btn lp-btn-primary lp-btn-wide" onClick={onEnter}>
                {t('reserveNow')}
              </button>
              <p className="lp-cta-note">{t('dressCodeNote')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="container lp-footer-inner">
          <div>
            <p className="lp-brand-name-footer">ÉTOILE ROYALE</p>
            <p className="lp-footer-meta">26 Rue Notre-Dame, L-2240 Luxembourg City</p>
          </div>
          <div className="lp-footer-right">
            <button type="button" className="lp-btn lp-btn-ghost lp-btn-sm" onClick={onEnter}>
              {t('lpEnter')} →
            </button>
            <p className="lp-footer-meta">{t('footerRights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
