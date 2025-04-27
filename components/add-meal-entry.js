import { getProducts, addEntry } from '../services/db-service.js';
import { generateId, getTodayDate } from '../utils/helpers.js';

class AddMealEntry extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.filteredProducts = [];
    this.loading = true;
    this.isOpen = false;
    this.selectedProductId = '';
    this.grams = '';
    this.searchQuery = '';

    // Зв'язуємо методи для використання як колбеки
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleProductSelect = this.handleProductSelect.bind(this);
    this.handleGramsInput = this.handleGramsInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleProductSearch = this.handleProductSearch.bind(this);
  }

  connectedCallback() {
    this.render();
    this.loadProducts();
  }

  disconnectedCallback() {
    // Видаляємо всі обробники подій при видаленні компонента
    this.removeEventListeners();
    this.removeEventListener('product-search', this.handleProductSearch);
  }

  async loadProducts() {
    try {
      let user_id = document.querySelector('calorie-tracker')?.getAttribute('user-id');
      if (!user_id || user_id === 'undefined' || user_id === 'null') {
        if (window.appState && window.appState.user_id) {
          user_id = window.appState.user_id;
          console.log('add-meal-entry: використовуємо user_id з глобального стану');
        }
      }

      this.products = await getProducts(user_id);
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  handleProductSearch(e) {
    const { searchValue } = e.detail;
    this.searchQuery = searchValue;
    this.filterProducts();
    // Оновлюємо тільки список продуктів, а не весь компонент
    this.updateProductsList();
  }

  filterProducts() {
    if (!this.searchQuery) {
      this.filteredProducts = [...this.products];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.caloriesPer100g.toString().includes(query)
    );
  }

  updateProductsList() {
    const productSelectContainer = this.querySelector('.product-select-container');
    if (productSelectContainer) {
      productSelectContainer.innerHTML = this.renderProductSelectOptions();
    }
  }

  renderProductSelectOptions() {
    if (this.filteredProducts.length === 0) {
      return `
        <div class="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-300 mb-4">
          ${this.searchQuery
          ? 'За вашим запитом продуктів не знайдено. Спробуйте змінити пошук або додайте новий продукт.'
          : 'У вас ще немає продуктів. Додайте їх у розділі "Мої продукти".'}
        </div>
      `;
    }

    return `
      <select 
        id="product-select" 
        class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        required
      >
        <option value="" disabled ${!this.selectedProductId ? 'selected' : ''}>
          Виберіть продукт
        </option>
        ${this.filteredProducts.map(product => `
          <option value="${product.id}" ${this.selectedProductId === product.id ? 'selected' : ''}>
            ${product.name} (${product.caloriesPer100g} ккал/100г)
          </option>
        `).join('')}
      </select>
    `;
  }

  // Метод для видалення всіх обробників подій
  removeEventListeners() {
    const closeBtn = this.querySelector('#close-modal');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.handleCloseModal);
    }

    const productSelect = this.querySelector('#product-select');
    if (productSelect) {
      productSelect.removeEventListener('change', this.handleProductSelect);
    }

    const gramsInput = this.querySelector('#grams-input');
    if (gramsInput) {
      gramsInput.removeEventListener('input', this.handleGramsInput);
    }

    const form = this.querySelector('#add-meal-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }
  }

  setupEventListeners() {
    // Спочатку видаляємо всі обробники подій
    this.removeEventListeners();

    // Додаємо обробник події для пошуку
    this.addEventListener('product-search', this.handleProductSearch);

    // Тепер додаємо нові
    const closeBtn = this.querySelector('#close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', this.handleCloseModal);
    }

    const productSelect = this.querySelector('#product-select');
    if (productSelect) {
      productSelect.addEventListener('change', this.handleProductSelect);
      // Встановлюємо поточне значення
      if (this.selectedProductId) {
        productSelect.value = this.selectedProductId;
      }
    }

    const gramsInput = this.querySelector('#grams-input');
    if (gramsInput) {
      gramsInput.addEventListener('input', this.handleGramsInput);
      // Встановлюємо поточне значення
      gramsInput.value = this.grams;
    }

    const form = this.querySelector('#add-meal-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }
  }

  handleCloseModal() {
    this.isOpen = false;
    this.render();
  }

  handleProductSelect(e) {
    this.selectedProductId = e.target.value;
  }

  handleGramsInput(e) {
    this.grams = e.target.value;
  }

  async handleSubmit(e) {
    e.preventDefault();

    try {
      if (!this.selectedProductId || !this.grams) {
        return;
      }

      const product = this.products.find(p => p.id === this.selectedProductId);
      if (!product) return;

      // Отримуємо user_id з різних джерел
      let user_id;
      const calorieTracker = document.querySelector('calorie-tracker');

      // 1. Спочатку з компонента calorie-tracker
      if (calorieTracker) {
        user_id = calorieTracker.getAttribute('user-id');
      }

      // 2. Якщо немає, використовуємо глобальний стан
      if (!user_id || user_id === 'undefined' || user_id === 'null') {
        if (window.appState && window.appState.user_id) {
          user_id = window.appState.user_id;
          console.log('add-meal-entry: використовуємо user_id з глобального стану');
        }
      }

      // Перевірка наявності user_id
      if (!user_id) {
        console.error('Cannot add entry: user_id is not available');
        alert('Помилка: Не вдалося додати прийом їжі. Спробуйте перезавантажити сторінку.');
        return;
      }

      const selectedDate = calorieTracker ? calorieTracker.selectedDate : getTodayDate();

      const caloriesValue = Math.round((product.caloriesPer100g * parseInt(this.grams)) / 100);

      const entryData = {
        id: generateId(),
        user_id,
        productId: product.id,
        productName: product.name,
        grams: parseInt(this.grams),
        calories: caloriesValue,
        date: selectedDate,
        createdAt: new Date().toISOString()
      };

      console.log('Спроба додати прийом їжі:', entryData);

      await addEntry(entryData);
      console.log('Прийом їжі успішно додано!');

      window.dispatchEvent(new CustomEvent('entries-updated'));

      // Close modal and reset form
      this.isOpen = false;
      this.selectedProductId = '';
      this.grams = '';
      this.searchQuery = '';
      this.render();
    } catch (error) {
      console.error('Error adding entry:', error);
      alert(`Помилка при додаванні прийому їжі: ${error.message}`);
    }
  }

  render() {
    if (!this.isOpen) {
      this.innerHTML = '';
      return;
    }

    this.innerHTML = `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg w-[90%] max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
          <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="text-lg font-semibold">Додати спожиту їжу</div>
            <button id="close-modal" class="bg-transparent border-none cursor-pointer text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-4">
            ${this.loading ?
        `<div class="text-center py-4 text-gray-500 dark:text-gray-400">Завантаження продуктів...</div>` :
        this.renderForm()}
          </div>
        </div>
      </div>
    `;

    // Налаштовуємо обробники подій лише якщо не в режимі завантаження
    if (!this.loading) {
      this.setupEventListeners();
    }
  }

  renderForm() {
    return `
      <form id="add-meal-form">
        <search-products value="${this.searchQuery}"></search-products>
        
        <div class="mb-4">
          <label for="product-select" class="block mb-2 font-medium text-gray-700 dark:text-gray-300">Виберіть продукт</label>
          <div class="product-select-container">
            ${this.renderProductSelectOptions()}
          </div>
        </div>
        
        <div class="mb-4">
          <label for="grams-input" class="block mb-2 font-medium text-gray-700 dark:text-gray-300">Кількість (грам)</label>
          <input 
            type="number" 
            id="grams-input" 
            placeholder="100" 
            value="${this.grams}"
            min="1" 
            required
            class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
        </div>
        
        <button 
          type="submit" 
          class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium ${this.filteredProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
          ${this.filteredProducts.length === 0 ? 'disabled' : ''}
        >
          Додати
        </button>
      </form>
    `;
  }
}

customElements.define('add-meal-entry', AddMealEntry);

// Import search component
import './search-products.js';