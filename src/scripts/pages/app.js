import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { tokenService } from "../utils/tokenService/tokenService";
import { isCurrentPushSubscriptionAvailable, subscribe, unsubscribe } from '../utils/notification/notificationHelper';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  #setupAuthUI() {
    const loginMenu = document.getElementById("loginUser");
    const logoutMenu = document.getElementById("logoutUser");
    if (tokenService.isAuthenticated()) {
      loginMenu.classList.add("Gone");
      logoutMenu.classList.remove("Gone");
    } else {
      loginMenu.classList.remove("Gone");
      logoutMenu.classList.add("Gone");
    }
    // attach event logout
    const logoutBtn = logoutMenu.querySelector("a");
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        tokenService.clearAuthData();
        loginMenu.classList.remove("Gone");
        logoutMenu.classList.add("Gone");
        window.location.hash = "/login";
      };
    }
  }

  // Method untuk setup tombol notifikasi
  async #setupNotificationButtons() {
    const subscribeButton = document.getElementById('subscribe-button');
    const unsubscribeButton = document.getElementById('unsubscribe-button');

    if (subscribeButton) {
      subscribeButton.addEventListener('click', async () => {
        console.log("Subscribe button clicked");
        await subscribe();
        // Update UI setelah subscribe
        await this.#updateNotificationButtonsState();
      });
    }

    if (unsubscribeButton) {
      unsubscribeButton.addEventListener('click', async () => {
        console.log("Unsubscribe button clicked");
        await unsubscribe();
        // Update UI setelah unsubscribe
        await this.#updateNotificationButtonsState();
      });
    }

    // Update state tombol saat pertama kali load
    await this.#updateNotificationButtonsState();
  }

  // Method untuk update state tombol berdasarkan subscription status
  async #updateNotificationButtonsState() {
    const subscribeButton = document.getElementById('subscribe-button');
    const unsubscribeButton = document.getElementById('unsubscribe-button');
    const unsupported = !(typeof Notification !== 'undefined' && 'serviceWorker' in navigator);

    if (subscribeButton && unsubscribeButton) {
      if (unsupported || Notification.permission === 'denied') {
        subscribeButton.style.display = 'inline-block';
        subscribeButton.disabled = true;
        subscribeButton.textContent = 'Push tidak didukung / ditolak';
        unsubscribeButton.style.display = 'none';
        unsubscribeButton.disabled = true;
        return;
      }

      const isSubscribed = await isCurrentPushSubscriptionAvailable();
      
      if (isSubscribed) {
        subscribeButton.style.display = 'none';
        subscribeButton.disabled = true;
        unsubscribeButton.style.display = 'inline-block';
        unsubscribeButton.disabled = false;
      } else {
        subscribeButton.style.display = 'inline-block';
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'Aktifkan Push';
        unsubscribeButton.style.display = 'none';
        unsubscribeButton.disabled = true;
      }
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    const renderContent = async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#setupAuthUI();
      // Setup tombol notifikasi setelah page di-render
      await this.#setupNotificationButtons();
    };

    if (document.startViewTransition) {
      // Use View Transition API for smoother SPA navigation
      const transition = document.startViewTransition(() => renderContent());
      await transition?.finished;
      return;
    }

    await renderContent();
  }
}

export default App;