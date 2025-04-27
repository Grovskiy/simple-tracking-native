class SearchProducts extends HTMLElement {
  constructor() {
    super();
    this.searchValue = '';
    this.handleSearch = this.handleSearch.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.initialized = false;
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue && this.initialized) {
      this.searchValue = newValue || '';
      // Оновлюємо тільки значення поля, не перемальовуючи весь компонент
      const searchInput = this.querySelector('#product-search');
      if (searchInput && document.activeElement !== searchInput) {
        searchInput.value = this.searchValue;
      }
      this.updateClearButtonVisibility();
    }
  }

  connectedCallback() {
    if (!this.initialized) {
      this.render();
      this.setupEventListeners();
      this.initialized = true;
    }
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  setupEventListeners() {
    const searchInput = this.querySelector('#product-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch);
      searchInput.value = this.searchValue || '';
    }

    const clearButton = this.querySelector('#clear-search');
    if (clearButton) {
      clearButton.addEventListener('click', this.handleClear);
    }
  }

  removeEventListeners() {
    const searchInput = this.querySelector('#product-search');
    if (searchInput) {
      searchInput.removeEventListener('input', this.handleSearch);
    }

    const clearButton = this.querySelector('#clear-search');
    if (clearButton) {
      clearButton.removeEventListener('click', this.handleClear);
    }
  }

  handleSearch(e) {
    const newValue = e.target.value;
    if (this.searchValue !== newValue) {
      this.searchValue = newValue;

      // Оновлюємо атрибут без повторного рендерингу
      this.setAttribute('value', newValue);

      // Оновлюємо видимість кнопки очищення
      this.updateClearButtonVisibility();

      // Генеруємо подію для батьківського компонента
      this.dispatchEvent(new CustomEvent('product-search', {
        bubbles: true,
        composed: true,
        detail: {
          searchValue: newValue
        }
      }));
    }
  }

  handleClear() {
    const searchInput = this.querySelector('#product-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
      // Імітуємо подію input
      searchInput.dispatchEvent(new Event('input'));
    }
  }

  updateClearButtonVisibility() {
    const clearButtonContainer = this.querySelector('#clear-search-container');
    if (clearButtonContainer) {
      if (this.searchValue && this.searchValue.length > 0) {
        clearButtonContainer.classList.remove('hidden');
      } else {
        clearButtonContainer.classList.add('hidden');
      }
    }
  }

  render() {
    this.innerHTML = `
      <div class="mb-3 search-container">
        <div class="relative">
          <input 
            id="product-search" 
            type="text" 
            placeholder="Пошук продуктів..."
            class="w-full p-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
            value="${this.searchValue || ''}"
          >
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div id="clear-search-container" class="${this.searchValue ? '' : 'hidden'}">
            <button 
              id="clear-search" 
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('search-products', SearchProducts);