import { signOut } from '../services/auth-service.js';

class NavBar extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['user'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.querySelector('#dashboard-link')
      ?.addEventListener('click', () => this.navigateTo('dashboard'));

    this.querySelector('#settings-link')
      ?.addEventListener('click', () => this.navigateTo('settings'));

    this.querySelector('#logout-btn')
      ?.addEventListener('click', this.handleLogout.bind(this));
  }

  navigateTo(route) {
    window.dispatchEvent(new CustomEvent('route-change', {
      detail: { route }
    }));
  }

  async handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  get user() {
    return this.getAttribute('user');
  }

  render() {
    const currentPath = window.location.pathname;

    this.innerHTML = `
      <div class="w-full mb-4">
        <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
          <div class="flex justify-between items-center">
            <div class="font-bold text-xl text-primary-600 dark:text-primary-400">Calorie Tracker</div>
            <button id="logout-btn" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Вийти
            </button>
          </div>
        </nav>
        
        <div class="fixed bottom-0 left-0 right-0 flex justify-evenly py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
          <div id="dashboard-link" class="flex flex-col items-center p-2 text-xs cursor-pointer ${currentPath === '/dashboard' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Головна
          </div>
          
          <div id="settings-link" class="flex flex-col items-center p-2 text-xs cursor-pointer ${currentPath === '/settings' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Налаштування
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('nav-bar', NavBar);