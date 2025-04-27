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
    this.render();
  }

  async connectedCallback() {
    // Обробляємо URL callback після авторизації (містить токен доступу)
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
      this.loading = true;
      this.render();

      // Вичікуємо трохи, щоб Supabase мав час обробити токен і оновити сесію
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Очищуємо URL без перезавантаження сторінки
      if (window.history && window.history.replaceState) {
        // Визначаємо базовий шлях
        const basePath = '/simple-tracking-native';
        window.history.replaceState(null, document.title, basePath);
      }
    }

    try {
      const { data: { user } } = await getCurrentUser();
      this.user = user;

      if (user) {
        this.route = 'dashboard';
        console.log('Користувач авторизований, відображаємо dashboard');

        this.unsubRealTime = subscribeToRealTimeUpdates(user.id, {
          onProductsChange: () => window.dispatchEvent(new CustomEvent('products-updated')),
          onEntriesChange: () => window.dispatchEvent(new CustomEvent('entries-updated')),
          onGoalsChange: () => window.dispatchEvent(new CustomEvent('goals-updated')),
        });
      } else {
        this.route = 'login';
        console.log('Користувач не авторизований, відображаємо login');
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      this.route = 'login';
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
    if (this.loading) {
      this.innerHTML = `
        <div class="max-w-xl mx-auto p-4">
          <div class="flex justify-center items-center min-h-screen">
            <div class="w-12 h-12 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        </div>
      `;
    } else {
      this.innerHTML = `
        <div class="max-w-xl mx-auto p-4">
          ${this.renderContent()}
        </div>
      `;
    }

    if (this.user && this.user.id) {
      window.appState = window.appState || {};
      window.appState.user_id = this.user.id;
      console.log('User ID встановлено в глобальний стан:', this.user.id);
    }
  }

  renderContent() {
    switch (this.route) {
      case 'login':
        return `<auth-page></auth-page>`;
      case 'dashboard':
        return `
          <nav-bar user="${this.user?.email || ''}"></nav-bar>
          <calorie-tracker user-id="${this.user?.id || ''}"></calorie-tracker>
        `;
      case 'settings':
        return `
          <nav-bar user="${this.user?.email || ''}"></nav-bar>
          <settings-page user-id="${this.user?.id || ''}"></settings-page>
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
import './search-products.js';