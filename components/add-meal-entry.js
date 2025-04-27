import { getProducts, addEntry } from '../services/db-service.js';
import { generateId, getTodayDate } from '../utils/helpers.js';

class AddMealEntry extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.loading = true;
    this.isOpen = false;
    this.selectedProductId = '';
    this.grams = '';
  }

  connectedCallback() {
    this.render();
    this.loadProducts();
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
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  setupEventListeners() {
    this.querySelector('#close-modal')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    this.querySelector('#product-select')?.addEventListener('change', (e) => {
      this.selectedProductId = e.target.value;
    });

    this.querySelector('#grams-input')?.addEventListener('input', (e) => {
      this.grams = e.target.value;
    });

    this.querySelector('#add-meal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  async handleSubmit() {
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

    this.setupEventListeners();
  }

  renderForm() {
    return `
      <form id="add-meal-form">
        <div class="mb-4">
          <label for="product-select" class="block mb-2 font-medium text-gray-700 dark:text-gray-300">Виберіть продукт</label>
          <select 
            id="product-select" 
            class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          >
            <option value="" disabled ${!this.selectedProductId ? 'selected' : ''}>
              Виберіть продукт
            </option>
            ${this.products.map(product => `
              <option value="${product.id}" ${this.selectedProductId === product.id ? 'selected' : ''}>
                ${product.name} (${product.caloriesPer100g} ккал/100г)
              </option>
            `).join('')}
          </select>
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
          class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium"
        >
          Додати
        </button>
      </form>
    `;
  }
}

customElements.define('add-meal-entry', AddMealEntry);