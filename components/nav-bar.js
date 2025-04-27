import { signOut } from '../services/auth-service.js';

class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this.shadowRoot.querySelector('#dashboard-link')
      ?.addEventListener('click', () => this.navigateTo('dashboard'));
      
    this.shadowRoot.querySelector('#settings-link')
      ?.addEventListener('click', () => this.navigateTo('settings'));
      
    this.shadowRoot.querySelector('#logout-btn')
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
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin-bottom: 1rem;
        }
        nav {
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-weight: 700;
          font-size: 1.25rem;
          color: #4f46e5;
        }
        .nav-links {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-evenly;
          padding: 0.75rem 0;
          background-color: white;
          border-top: 1px solid #e5e7eb;
          z-index: 10;
        }
        .nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          color: #6b7280;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .nav-link.active {
          color: #4f46e5;
        }
        .nav-link svg {
          width: 1.5rem;
          height: 1.5rem;
          margin-bottom: 0.25rem;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          cursor: pointer;
        }
        .logout-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        @media (prefers-color-scheme: dark) {
          nav {
            background-color: #1f2937;
            border-bottom-color: #374151;
          }
          .nav-links {
            background-color: #1f2937;
            border-top-color: #374151;
          }
          .nav-link {
            color: #9ca3af;
          }
          .nav-link.active {
            color: #818cf8;
          }
          .logout-btn {
            color: #9ca3af;
          }
        }
      </style>
      
      <nav>
        <div class="container">
          <div class="logo">Calorie Tracker</div>
          <button id="logout-btn" class="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Вийти
          </button>
        </div>
      </nav>
      
      <div class="nav-links">
        <div id="dashboard-link" class="nav-link ${currentPath === '/dashboard' ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Головна
        </div>
        
        <div id="settings-link" class="nav-link ${currentPath === '/settings' ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Налаштування
        </div>
      </div>
    `;
  }
}

customElements.define('nav-bar', NavBar);