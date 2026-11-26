import { useEffect, useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../lib/auth.jsx';
import { useI18n } from '../i18n.jsx';
import Dialog from './Dialog.jsx';

function friendlyError(message, t) {
  const raw = String(message || '');
  if (raw === 'authUnavailable') return t('authUnavailable');
  if (/invalid login credentials/i.test(raw)) return t('authInvalid');
  if (/email not confirmed/i.test(raw)) return t('authConfirm');
  if (/already registered|already exists/i.test(raw)) return t('authExists');
  if (/password/i.test(raw) && /short|weak/i.test(raw)) return t('authWeakPassword');
  return raw || t('authGeneric');
}

export default function AuthModal({ open, onClose, reason = '', onAuthenticated }) {
  const { t } = useI18n();
  const { signIn, signUp, signInDemo, canUseEmailAuth } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setError(''); setInfo(''); }
  }, [open, mode]);

  const finish = () => {
    onAuthenticated?.();
    onClose();
  };

  const enterDemo = (role) => {
    signInDemo(role);
    finish();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password || (mode === 'signup' && !fullName.trim())) {
      setError(t('authFillRequired'));
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const data = await signUp(email, password, fullName);
        if (!data?.session) { setInfo(t('checkYourEmail')); return; }
      } else {
        await signIn(email, password);
      }
      finish();
    } catch (err) {
      setError(friendlyError(err?.message, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} titleId="auth-title" className="auth-dialog">
      <p className="hero-eyebrow">{t('account')}</p>
      <h2 id="auth-title" className="dialog-title">{reason === 'booking' ? t('signInToBook') : t('authTitle')}</h2>
      <p className="modal-copy">{reason === 'booking' ? t('authRequiredBookingBody') : t('authSubtitle')}</p>

      {canUseEmailAuth && (
        <>
          <div className="auth-tabs" role="tablist" aria-label={t('account')}>
            <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-active' : ''} onClick={() => setMode('signin')}>{t('signInTab')}</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>{t('signUpTab')}</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="auth-name">{t('fullName')}</label>
                <input id="auth-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={t('yourName')} />
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">{t('email')}</label>
              <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" />
            </div>
            <div className="field">
              <label htmlFor="auth-password">{t('password')}</label>
              <input id="auth-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {info && <p className="notice" role="status">{info}</p>}
            <button type="submit" className="btn btn-primary btn-wide" disabled={busy}>
              {busy ? t('processing') : mode === 'signup' ? t('createAccount') : t('signIn')}
            </button>
          </form>
          <div className="auth-divider"><span>{t('or')}</span></div>
        </>
      )}

      <div className="demo-accounts">
        <p className="label">{t('demoAccounts')}</p>
        <button type="button" className="demo-account" onClick={() => enterDemo('member')}>
          <span className="demo-avatar">✦</span>
          <span><b>{t('continueAsMember')}</b><small>{DEMO_ACCOUNTS.member.email}</small></span>
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="demo-account" onClick={() => enterDemo('admin')}>
          <span className="demo-avatar demo-avatar-admin">✧</span>
          <span><b>{t('continueAsAdmin')}</b><small>{DEMO_ACCOUNTS.admin.email}</small></span>
          <span aria-hidden="true">→</span>
        </button>
        <p className="meta">{t('demoNote')}</p>
      </div>

      <button type="button" className="btn btn-quiet btn-wide" onClick={onClose}>{t('continueAsGuest')}</button>
      <p className="meta">{t('guestCheckoutNote')}</p>
    </Dialog>
  );
}
