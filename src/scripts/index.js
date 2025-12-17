// CSS imports
import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';

import App from './pages/app';
import { registerServiceWorker } from './utils/serviceWorker/serviceWorkerFunc';

document.addEventListener('DOMContentLoaded', async () => {
  // Register service worker terlebih dahulu
  await registerServiceWorker();
  
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});