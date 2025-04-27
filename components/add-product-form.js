import { addProduct } from '../services/db-service.js';
import { generateId } from '../utils/helpers.js';

class AddProductForm extends HTMLElement {
  constructor() {
    super();
    this.productName = '';
    this.caloriesValue = '';

    // Зв'язуємо методи для використання як колбеки
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNameInput = this.handleNameInput.bind(this);
    this.handleCaloriesInput = this.handleCaloriesInput.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    // Видаляємо обробники подій при видаленні компонента
    this.removeEventListeners();
  }

  setupEventListeners() {
    // Спочатку видаляємо всі поточні обробники
    this.removeEventListeners();

    // Потім додаємо нові
    const nameInput = this.querySelector('#product-name');
    if (nameInput) {
      nameInput.addEventListener('input', this.handleNameInput);
      // Встановлюємо поточне значення
      nameInput.value = this.productName;
    }

    const caloriesInput = this.querySelector('#product-calories');
    if (caloriesInput) {
      caloriesInput.addEventListener('input', this.handleCaloriesInput);
      // Встановлюємо поточне значення
      caloriesInput.value = this.caloriesValue;
    }

    const form = this.querySelector('#product-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }
  }

  removeEventListeners() {
    const nameInput = this.querySelector('#product-name');
    if (nameInput) {
      nameInput.removeEventListener('input', this.handleNameInput);
    }

    const caloriesInput = this.querySelector('#product-calories');
    if (caloriesInput) {
      caloriesInput.removeEventListener('input', this.handleCaloriesInput);
    }

    const form = this.querySelector('#product-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }
  }

  handleNameInput(e) {
    this.productName = e.target.value;
  }

  handleCaloriesInput(e) {
    this.caloriesValue = e.target.value;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.productName || !this.caloriesValue) return;

    try {
      // Спроба отримати user_id з кількох джерел
      let user_id;

      // 1. Спочатку з компонента settings-page
      const settingsPage = document.querySelector('settings-page');
      if (settingsPage) {
        user_id = settingsPage.getAttribute('user-id');
      }

      // 2. Якщо немає, використовуємо глобальний стан
      if (!user_id || user_id === 'undefined' || user_id === 'null') {
        if (window.appState && window.appState.user_id) {
          user_id = window.appState.user_id;
          console.log('add-product-form: використовуємо user_id з глобального стану');
        }
      }

      // Перевірка, що user_id існує
      if (!user_id) {
        console.error('Cannot add product: user_id is not available');
        alert('Помилка: Не вдалося додати продукт. Спробуйте перезавантажити сторінку.');
        return;
      }

      const newProduct = {
        id: generateId(),
        user_id,
        name: this.productName,
        caloriesPer100g: parseInt(this.caloriesValue),
        createdAt: new Date().toISOString()
      };

      console.log('Спроба додати продукт:', newProduct);

      await addProduct(newProduct);
      console.log('Продукт успішно додано!');

      // Reset form
      this.productName = '';
      this.caloriesValue = '';
      this.render();
      this.setupEventListeners();

      // Надсилаємо подію на батьківський компонент з більш детальним ім'ям
      // та включаємо дані продукту, щоб батьківський компонент міг їх використати
      this.dispatchEvent(new CustomEvent('product-form-submit', {
        bubbles: true,
        composed: true,
        detail: {
          name: newProduct.name,
          caloriesPer100g: newProduct.caloriesPer100g
        }
      }));
    } catch (error) {
      console.error('Error adding product:', error);
      alert(`Помилка при додаванні продукту: ${error.message}`);
    }
  }

  render() {
    this.innerHTML = `
      <div class="mb-4">
        <h3 class="text-base font-semibold mb-3">Додати новий продукт</h3>
        <form id="product-form" class="flex gap-2">
          <div class="flex-1">
            <label class="block mb-1 text-sm text-gray-700 dark:text-gray-300" for="product-name">Назва продукту</label>
            <input 
              class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
              type="text" 
              id="product-name" 
              placeholder="Цільнозерновий хліб" 
              value="${this.productName}"
              required
            >
          </div>
          
          <div class="w-32">
            <label class="block mb-1 text-sm text-gray-700 dark:text-gray-300" for="product-calories">Ккал на 100г</label>
            <input 
              class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
              type="number" 
              id="product-calories" 
              placeholder="244" 
              value="${this.caloriesValue}"
              min="1"
              required
            >
          </div>
          
          <button type="submit" class="self-end bg-primary-600 hover:bg-primary-700 text-white rounded-md p-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </form>
      </div>
    `;
  }
}

customElements.define('add-product-form', AddProductForm);