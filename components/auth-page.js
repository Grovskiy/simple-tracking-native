import { signInWithGoogle } from '../services/auth-service.js';

class AuthPage extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  connectedCallback() {
    this.querySelector('#google-login-btn')
      .addEventListener('click', this.handleGoogleLogin.bind(this));
  }

  disconnectedCallback() {
    this.querySelector('#google-login-btn')
      .removeEventListener('click', this.handleGoogleLogin);
  }

  async handleGoogleLogin() {
    try {
      this.querySelector('#google-login-btn').disabled = true;
      this.querySelector('#login-spinner').classList.remove('hidden');
      this.querySelector('#login-text').classList.add('hidden');

      // Додаємо повідомлення про перенаправлення
      this.querySelector('#status-message').textContent =
        'Перенаправлення на Google...';

      await signInWithGoogle();
      // Тут не треба нічого робити після signInWithGoogle, тому що
      // браузер буде перенаправлено на сторінку Google для авторизації
    } catch (error) {
      console.error('Login failed:', error);
      this.querySelector('#error-message').textContent =
        'Помилка входу. Спробуйте ще раз.';
      this.querySelector('#login-spinner').classList.add('hidden');
      this.querySelector('#login-text').classList.remove('hidden');
      this.querySelector('#google-login-btn').disabled = false;
    }
  }

  render() {
    this.innerHTML = `
      <div class="flex min-h-[80vh] items-center justify-center">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h1 class="mb-4 text-center text-2xl font-semibold text-gray-900 dark:text-white">
            Ласкаво просимо
          </h1>
          <p class="mb-6 text-center text-gray-600 dark:text-gray-300">
            Увійдіть, щоб відстежувати ваші калорії
          </p>
          
          <div id="error-message" class="mb-4 text-center text-red-500"></div>
          <div id="status-message" class="mb-4 text-center text-indigo-500"></div>
          
          <button id="google-login-btn" class="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            <div id="login-spinner" class="h-[18px] w-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin hidden"></div>
            <span id="login-text">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Увійти через Google
            </span>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('auth-page', AuthPage);