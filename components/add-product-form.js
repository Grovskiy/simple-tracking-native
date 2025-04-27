import { addProduct } from '../services/db-service.js';
import { generateId } from '../utils/helpers.js';

class AddProductForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.productName = '';
    this.caloriesValue = '';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.querySelector('#product-name')?.addEventListener('input', (e) => {
      this.productName = e.target.value;
    });

    this.shadowRoot.querySelector('#product-calories')?.addEventListener('input', (e) => {
      this.caloriesValue = e.target.value;
    });

    this.shadowRoot.querySelector('#product-form')?.addEventListener('submit', this.handleSubmit.bind(this));
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

      // Notify parent component
      this.dispatchEvent(new CustomEvent('product-added', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error adding product:', error);
      alert(`Помилка при додаванні продукту: ${error.message}`);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 1rem;
        }
        h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        form {
          display: flex;
          gap: 0.5rem;
        }
        .form-group {
          flex: 1;
        }
        .calories-group {
          width: 8rem;
        }
        label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          color: #374151;
        }
        input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        button {
          align-self: flex-end;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        button:hover {
          background-color: #4338ca;
        }
        button svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        @media (prefers-color-scheme: dark) {
          label {
            color: #e5e7eb;
          }
          input {
            background-color: #374151;
            border-color: #4b5563;
            color: #e5e7eb;
          }
        }
      </style>
      
      <h3>Додати новий продукт</h3>
      <form id="product-form">
        <div class="form-group">
          <label for="product-name">Назва продукту</label>
          <input 
            type="text" 
            id="product-name" 
            placeholder="Цільнозерновий хліб" 
            value="${this.productName}"
            required
          >
        </div>
        
        <div class="form-group calories-group">
          <label for="product-calories">Ккал на 100г</label>
          <input 
            type="number" 
            id="product-calories" 
            placeholder="244" 
            value="${this.caloriesValue}"
            min="1"
            required
          >
        </div>
        
        <button type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </form>
    `;
  }
}

customElements.define('add-product-form', AddProductForm);