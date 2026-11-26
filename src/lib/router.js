import { useEffect, useState } from 'react';

const rawBase = import.meta.env.BASE_URL || '/';
export const BASE_PATH = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
export const ADMIN_PATH = `${BASE_PATH}/admin`;

function currentRoute() {
  if (typeof window === 'undefined') return 'site';
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === ADMIN_PATH || window.location.hash === '#/admin') return 'admin';
  return 'site';
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const sync = () => setRoute(currentRoute());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  return route;
}

export function navigate(path) {
  if (typeof window === 'undefined') return;
  const next = path === 'admin' ? `${ADMIN_PATH}${window.location.search}` : `${BASE_PATH || '/'}${window.location.search}`;
  window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
