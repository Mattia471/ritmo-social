import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './tropical.css';
import { App } from './App';

// In an installed iOS web app, `black-translucent` draws the page behind
// the system clock / Dynamic Island. Mark this mode before React paints so
// the safe-area rules apply immediately, without shifting the Safari tab.
const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  || (/iPad|iPhone|iPod/.test(window.navigator.userAgent)
    && window.matchMedia('(display-mode: standalone)').matches);
if (iosStandalone) document.documentElement.classList.add('ritmo-ios-standalone');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
);
