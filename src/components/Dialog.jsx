import { useRef } from 'react';
import { useDialog } from '../hooks.js';
import { useI18n } from '../i18n.jsx';

export default function Dialog({ open, onClose, titleId, className = '', children }) {
  const { t } = useI18n();
  const ref = useRef(null);
  useDialog({ open: Boolean(open), onClose, containerRef: ref, trap: true });
  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal app-dialog ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label={t('close')}>×</button>
        {children}
      </div>
    </div>
  );
}
