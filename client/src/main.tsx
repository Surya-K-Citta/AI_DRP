// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/dpr-print.css';
import { i18nReady } from './i18n/config';
import { installPositiveNumbers } from './lib/positiveNumbers';
import { installLabelLinks } from './lib/a11yEnhance';

installPositiveNumbers();
installLabelLinks();

i18nReady.finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

