import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/hanken-grotesk';
import './styles.css';
import App from './App.jsx';
import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { CartProvider } from './lib/cart.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
