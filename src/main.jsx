import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/hanken-grotesk';
import './styles.css';
import App from './App.jsx';
import AdminApp from './admin/AdminApp.jsx';
import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { CartProvider } from './lib/cart.jsx';
import { CatalogProvider } from './lib/catalog.jsx';
import { useRoute } from './lib/router.js';

function Root() {
  const route = useRoute();
  return route === 'admin' ? <AdminApp /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <Root />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
