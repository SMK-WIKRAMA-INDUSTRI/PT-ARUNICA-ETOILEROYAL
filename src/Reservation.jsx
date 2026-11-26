import { useMemo, useState, useEffect } from 'react';
import { MENU_DATA, RESTAURANT, localizeDish } from './data.js';
import { useI18n } from './i18n.jsx';
import { pushBookingToSupabase, saveLocalBooking } from './lib/orders.js';

const SALON = 'Salon Privé Royal';
const BIG_PARTY = '8–16 Guests (Salon Privé Royal)';
const GUESTS = ['1 Guest', '2 Guests', '3 Guests', '4 Guests', '6 Guests', BIG_PARTY];
const SEATING = ['Le Grand Salon', 'Velvet Royal Alcove', 'Binchotan Hearth Counter', SALON];
const CHIP_SEATS = ['Binchotan Hearth Counter', 'Velvet Royal Alcove', 'Le Grand Salon'];

const GUESTS_ID = ['1 Tamu', '2 Tamu', '3 Tamu', '4 Tamu', '6 Tamu', '8–16 Tamu (Salon Privé Royal)'];
const SEATING_ID = ['Le Grand Salon', 'Alcove Royal Beludru', 'Counter Perapian Binchotan', SALON];
const CHIP_LABELS_EN = ['Grill-side', 'Velvet booth', 'Grand salon'];
const CHIP_LABELS_ID = ['Sisi panggangan', 'Bangsal beludru', 'Salon utama'];

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function timesFor(date) {
  if (!date) return ['12:00', '13:30', '18:00', '19:30', '20:30', '21:30', '22:30'];
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 1) return [];
  if (day === 0) return ['18:00', '19:30', '20:30', '21:30'];
  if (day === 6) return ['12:00', '13:30', '18:00', '19:30', '21:00', '22:30'];
  return ['18:00', '19:30', '20:30', '21:30', '22:30'];
}

export default function Reservation({ form, setForm, lang, currency, user, onRequireLogin }) {
  const { t, fmt, isId } = useI18n();
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState(false);
  const [period, setPeriod] = useState('dinner');
  const today = useMemo(localToday, []);
  const times = useMemo(() => timesFor(form.date), [form.date]);
  const closed = form.date && times.length === 0;
  const availableTimes = times.filter((time) => period === 'lunch' ? time < '16:00' : time >= '16:00');
  const dish = localizeDish(MENU_DATA.find((m) => m.id === form.dishId) || MENU_DATA[0], lang, currency);

  useEffect(() => {
    if (period === 'lunch' && form.date && new Date(`${form.date}T12:00:00`).getDay() !== 6) {
      setPeriod('dinner');
      return;
    }
    if (availableTimes.length && !availableTimes.includes(form.time)) {
      setForm((f) => ({ ...f, time: availableTimes.includes('19:30') ? '19:30' : availableTimes[0] }));
    }
  }, [availableTimes, form.date, form.time, period, setForm]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setGuests = (e) => {
    const guests = e.target.value;
    setForm({ ...form, guests, seating: guests === BIG_PARTY ? SALON : form.seating === SALON ? SEATING[0] : form.seating });
  };
  const setSeating = (e) => {
    const seating = e.target.value;
    setForm({ ...form, seating, guests: seating === SALON ? BIG_PARTY : form.guests === BIG_PARTY ? '2 Guests' : form.guests });
  };

  const guestLabel = (value) => {
    const index = GUESTS.indexOf(value);
    return index < 0 ? value : (isId ? GUESTS_ID[index] : GUESTS[index]);
  };
  const seatingLabel = (value) => {
    const index = SEATING.indexOf(value);
    return index < 0 ? value : (isId ? SEATING_ID[index] : SEATING[index]);
  };

  const submit = (e) => {
    e.preventDefault();
    setPrepared(false);
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.date) {
      setError(t('errorRequired'));
      return;
    }
    if (closed) {
      setError(t('errorClosedMonday'));
      return;
    }
    if (form.date < today) {
      setError(t('errorPastDate'));
      return;
    }
    // Booking is a long-term commitment: members only. Food orders stay guest-friendly.
    if (!user) {
      setError(t('bookingLoginBody'));
      onRequireLogin?.('booking');
      return;
    }
    setError('');
    const booking = {
      bookingRef: `BK-${Date.now().toString(36).toUpperCase()}`,
      guestName: form.name.trim(),
      guestEmail: form.email.trim(),
      guestPhone: form.phone.trim(),
      bookingDate: form.date,
      bookingTime: form.time,
      guests: guestLabel(form.guests),
      seating: seatingLabel(form.seating),
      dishId: dish.id,
      notes: form.notes.trim(),
      status: 'requested',
      createdAt: new Date().toISOString()
    };
    saveLocalBooking(booking);
    pushBookingToSupabase(booking, user);
    const body = [
      t('reservationRequest'),
      '',
      `${t('name')}: ${form.name}`,
      `${t('email')}: ${form.email}`,
      `${t('phone')}: ${form.phone}`,
      `${t('date')}: ${form.date} ${form.time}`,
      `${t('party')}: ${guestLabel(form.guests)}`,
      `${t('seating')}: ${seatingLabel(form.seating)}`,
      `${t('dishOfInterest')}: ${dish.name} (${fmt(dish.price)})`,
      `${t('notes')}: ${form.notes || t('none')}`
    ].join('\n');
    window.location.href = `mailto:${RESTAURANT.email}?subject=${encodeURIComponent(t('reservationRequest'))}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  };

  return (
    <div className="res-grid">
      <form onSubmit={submit} className="res-form" noValidate>
        {!user && (
          <div className="booking-gate">
            <div>
              <b>{t('bookingLoginTitle')}</b>
              <p>{t('bookingLoginBody')}</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onRequireLogin?.('booking')}>{t('signInToBook')}</button>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="schedule-picker">
          <div className="schedule-heading">
            <div><p className="hero-eyebrow">{t('pickService')}</p><h3>{t('chooseSeating')}</h3></div>
            <span className="schedule-note">{t('confirmedPersonally')}</span>
          </div>
          <div className="schedule-cards">
            <button type="button" className="schedule-card" aria-pressed={period === 'lunch'} disabled={Boolean(closed) || Boolean(form.date && new Date(`${form.date}T12:00:00`).getDay() !== 6)} onClick={() => { setPeriod('lunch'); if (times.includes('12:00')) setForm((f) => ({ ...f, time: '12:00' })); }}>
              <span className="schedule-symbol">☀</span><strong>{t('longLunch')}</strong><span>{t('saturdayHours')}</span>
            </button>
            <button type="button" className="schedule-card" aria-pressed={period === 'dinner'} disabled={Boolean(closed)} onClick={() => { setPeriod('dinner'); setForm((f) => ({ ...f, time: times.includes('19:30') ? '19:30' : times.find((time) => time >= '16:00') || '18:00' })); }}>
              <span className="schedule-symbol">✦</span><strong>{t('firelightDinner')}</strong><span>{t('dinnerHours')}</span>
            </button>
          </div>
          <div className="seating-choice">
            <span>{t('tableMood')}</span>
            {CHIP_SEATS.map((seat, index) => (
              <button key={seat} type="button" className="seat-chip" aria-pressed={form.seating === seat} onClick={() => setForm((current) => ({ ...current, seating: seat, guests: current.guests === BIG_PARTY ? '2 Guests' : current.guests }))}>
                {isId ? CHIP_LABELS_ID[index] : CHIP_LABELS_EN[index]}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="r-name">{t('fullName')}</label>
            <input id="r-name" type="text" autoComplete="name" value={form.name} onChange={set('name')} placeholder={t('yourName')} required />
          </div>
          <div className="field">
            <label htmlFor="r-email">{t('email')}</label>
            <input id="r-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="email@example.com" required />
          </div>
        </div>

        <div className="field-row three">
          <div className="field">
            <label htmlFor="r-phone">{t('phone')}</label>
            <input id="r-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+352 …" required />
          </div>
          <div className="field">
            <label htmlFor="r-date">{t('dateLabel')}</label>
            <input id="r-date" type="date" min={today} value={form.date} onChange={set('date')} required />
          </div>
          <div className="field">
            <label htmlFor="r-time">{t('seatingTime')}</label>
            <select id="r-time" value={form.time} onChange={set('time')} disabled={closed}>
              {closed ? <option>{t('closedMondays')}</option> : availableTimes.map((time) => <option key={time}>{time}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="r-guests">{t('partySize')}</label>
            <select id="r-guests" value={form.guests} onChange={setGuests}>
              {GUESTS.map((value, index) => <option key={value} value={value}>{isId ? GUESTS_ID[index] : value}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="r-seat">{t('seatingLabel')}</label>
            <select id="r-seat" value={form.seating} onChange={setSeating}>
              {SEATING.map((value, index) => <option key={value} value={value}>{isId ? SEATING_ID[index] : value}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="r-dish">{t('dishOfInterest')}</label>
          <select id="r-dish" value={form.dishId} onChange={set('dishId')}>
            {MENU_DATA.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}, {fmt(d.price)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="r-notes">{t('allergiesRequests')}</label>
          <textarea id="r-notes" rows={3} value={form.notes} onChange={set('notes')} placeholder={t('allergiesPlaceholder')} />
        </div>

        <button type="submit" className="btn btn-primary btn-wide">
          {t('prepareEmail')}
        </button>
        <p className="meta">{t('emailNote')}</p>
      </form>

      <aside className="res-summary" aria-label="Reservation summary">
        <h3 className="summary-title">{t('yourRequest')}</h3>
        <dl className="facts">
          <div><dt>{t('guest')}</dt><dd>{form.name || t('notEntered')}</dd></div>
          <div><dt>{t('when')}</dt><dd>{form.date ? `${form.date}, ${closed ? t('closedSummary') : form.time}` : t('chooseDate')}</dd></div>
          <div><dt>{t('party')}</dt><dd>{guestLabel(form.guests)}, {seatingLabel(form.seating)}</dd></div>
          <div><dt>{t('dish')}</dt><dd>{dish.name} ({fmt(dish.price)})</dd></div>
        </dl>
        {prepared && (
          <p className="notice" role="status">
            {t('bookingSaved')} {t('preparedNoteA')}{' '}
            <a href={`mailto:${RESTAURANT.email}`}>{RESTAURANT.email}</a> {t('preparedNoteB')} {RESTAURANT.phone}.
          </p>
        )}
      </aside>
    </div>
  );
}
