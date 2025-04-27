import { getProducts, addEntry } from '../services/db-service.js';
import { generateId, getTodayDate } from '../utils/helpers.js';

class AddMealEntry extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this.shadowRoot.querySelector('#close-modal')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    this.shadowRoot.querySelector('#modal-backdrop')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    this.shadowRoot.querySelector('#product-select')?.addEventListener('change', (e) => {
      this.selectedProductId = e.target.value;
    });

    this.shadowRoot.querySelector('#grams-input')?.addEventListener('input', (e) => {
      this.grams = e.target.value;
    });

    this.shadowRoot.querySelector('#add-meal-form')?.addEventListener('submit', (e) => {
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
      this.shadowRoot.innerHTML = '';
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal {
          background-color: white;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 28rem;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
        }
        .close-btn svg {
          width: 1.5rem;
          height: 1.5rem;
        }
        .modal-body {
          padding: 1rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }
        select, input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background-color: white;
          font-size: 1rem;
        }
        .submit-btn {
          display: block;
          width: 100%;
          padding: 0.75rem;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .submit-btn:hover {
          background-color: #4338ca;
        }
        .loading {
          text-align: center;
          padding: 1rem;
          color: #6b7280;
        }
        
        @media (prefers-color-scheme: dark) {
          .modal {
            background-color: #1f2937;
          }
          .modal-header {
            border-bottom-color: #374151;
          }
          label {
            color: #e5e7eb;
          }
          select, input {
            background-color: #374151;
            border-color: #4b5563;
            color: #e5e7eb;
          }
        }
      </style>
      
      <div id="modal-backdrop" class="modal-backdrop">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <div class="modal-title">Додати спожиту їжу</div>
            <button id="close-modal" class="close-btn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            ${this.loading ?
        `<div class="loading">Завантаження продуктів...</div>` :
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
        <div class="form-group">
          <label for="product-select">Виберіть продукт</label>
          <select id="product-select" required>
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
        
        <div class="form-group">
          <label for="grams-input">Кількість (грам)</label>
          <input 
            type="number" 
            id="grams-input" 
            placeholder="100" 
            value="${this.grams}"
            min="1" 
            required
          >
        </div>
        
        <button type="submit" class="submit-btn">Додати</button>
      </form>
    `;
  }
}

customElements.define('add-meal-entry', AddMealEntry);