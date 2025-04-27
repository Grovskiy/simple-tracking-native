import { getCurrentUser, onAuthStateChange } from '../services/auth-service.js';
import { subscribeToRealTimeUpdates } from '../services/db-service.js';

class AppRoot extends HTMLElement {
  constructor() {
    super();
    this.user = null;
    this.loading = true;
    this.route = 'login';
    this.unsubAuth = null;
    this.unsubRealTime = null;

    this.attachShadow({ mode: 'open' });
    this.render();
  }

  async connectedCallback() {
    if (window.location.hash && window.location.hash.includes('access_token')) {
      this.loading = true;
      this.render();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const { data: { user } } = await getCurrentUser();
      this.user = user;
      this.route = user ? 'dashboard' : 'login';

      if (user && window.location.hash) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }

      if (user) {
        this.unsubRealTime = subscribeToRealTimeUpdates(user.id, {
          onProductsChange: () => window.dispatchEvent(new CustomEvent('products-updated')),
          onEntriesChange: () => window.dispatchEvent(new CustomEvent('entries-updated')),
          onGoalsChange: () => window.dispatchEvent(new CustomEvent('goals-updated')),
        });
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    } finally {
      this.loading = false;
      this.render();
    }

    this.unsubAuth = onAuthStateChange(({ event, session }) => {
      console.log('Auth state changed:', event, session?.user?.email);
      this.user = session?.user || null;

      if (event === 'SIGNED_IN') {
        console.log('User signed in, redirecting to dashboard');
        this.route = 'dashboard';
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        this.route = 'login';
      }

      this.render();
    });

    window.addEventListener('route-change', (e) => {
      this.route = e.detail.route;
      this.render();
    });
  }

  disconnectedCallback() {
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubRealTime) this.unsubRealTime();
    window.removeEventListener('route-change', this.handleRouteChange);
  }

  navigateTo(route) {
    this.route = route;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
        }
        .container {
          max-width: 32rem;
          margin: 0 auto;
          padding: 1rem;
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .loading-ring {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 6px solid #e5e7eb;
          border-radius: 50%;
          border-top-color: #4f46e5;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      
      <div class="container">
        ${this.loading
        ? `<div class="loading"><div class="loading-ring"></div></div>`
        : this.renderContent()}
      </div>
    `;

    if (this.user && this.user.id) {
      window.appState = window.appState || {};
      window.appState.user_id = this.user.id;
      console.log('User ID встановлено в глобальний стан:', this.user.id);
    }
  }

  // ВАЖЛИВО: Метод має бути всередині класу
  renderContent() {
    switch (this.route) {
      case 'login':
        return `<auth-page></auth-page>`;
      case 'dashboard':
        return `
          <nav-bar user="${this.user?.email}"></nav-bar>
          <calorie-tracker user-id="${this.user?.id}"></calorie-tracker>
        `;
      case 'settings':
        return `
          <nav-bar user="${this.user?.email}"></nav-bar>
          <settings-page user-id="${this.user?.id}"></settings-page>
        `;
      default:
        return `<div>404 Not Found</div>`;
    }
  }
}

customElements.define('app-root', AppRoot);

import './auth-page.js';
import './nav-bar.js';
import './calorie-tracker.js';
import './settings-page.js';
