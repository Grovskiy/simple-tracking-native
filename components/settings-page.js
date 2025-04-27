import { getProducts, addProduct, deleteProduct } from '../services/db-service.js';
import { getCalorieGoalHistory, setCalorieGoal } from '../services/db-service.js';
import { formatDate, generateId } from '../utils/helpers.js';

class SettingsPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.products = [];
    this.calorieGoal = null;
    this.goalHistory = [];
    this.loading = true;
    this.activeTab = 'products';
    this.productName = '';
    this.caloriesValue = '';
    this.goalValue = '';
    this.productToDelete = null;
    this.showDeleteModal = false;
  }

  static get observedAttributes() {
    return ['user-id'];
  }

  async connectedCallback() {
    this.render();
    await this.loadData();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.loadData();
  }

  get user_id() {
    // Спочатку пробуємо отримати з атрибута
    const attributeId = this.getAttribute('user-id');

    // Якщо атрибут встановлено і не пустий, використовуємо його
    if (attributeId && attributeId !== 'undefined' && attributeId !== 'null') {
      return attributeId;
    }

    // Інакше використовуємо глобальний стан
    if (window.appState && window.appState.user_id) {
      console.log('settings-page: використовуємо user_id з глобального стану');
      return window.appState.user_id;
    }

    console.warn('settings-page: user_id не знайдено');
    return null;
  }

  async loadData() {
    if (!this.user_id) return;

    this.loading = true;
    this.render();

    try {
      // Load products and goals history in parallel
      const [products, goalData] = await Promise.all([
        getProducts(this.user_id),
        getCalorieGoalHistory(this.user_id)
      ]);

      this.products = products;

      if (goalData.history.length > 0) {
        this.calorieGoal = goalData.current;
        this.goalHistory = goalData.history;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
      this.render();
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Tab switching
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
        this.setupEventListeners();
      });
    });

    // Add product form
    this.shadowRoot.querySelector('#product-form')?.addEventListener('submit', this.handleAddProduct.bind(this));
    this.shadowRoot.querySelector('#product-name')?.addEventListener('input', (e) => {
      this.productName = e.target.value;
    });
    this.shadowRoot.querySelector('#product-calories')?.addEventListener('input', (e) => {
      this.caloriesValue = e.target.value;
    });

    // Goal setting form
    this.shadowRoot.querySelector('#goal-form')?.addEventListener('submit', this.handleSetGoal.bind(this));
    this.shadowRoot.querySelector('#goal-value')?.addEventListener('input', (e) => {
      this.goalValue = e.target.value;
    });

    // Delete buttons
    this.shadowRoot.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.closest('.product-item').dataset.id;
        const product = this.products.find(p => p.id === productId);
        if (product) {
          this.productToDelete = product;
          this.showDeleteModal = true;
          this.render();
          this.setupDeleteModalListeners();
        }
      });
    });
  }

  setupDeleteModalListeners() {
    this.shadowRoot.querySelector('#cancel-delete')?.addEventListener('click', () => {
      this.showDeleteModal = false;
      this.productToDelete = null;
      this.render();
      this.setupEventListeners();
    });

    this.shadowRoot.querySelector('#confirm-delete')?.addEventListener('click', async () => {
      if (this.productToDelete) {
        try {
          await deleteProduct(this.productToDelete.id);
          this.products = this.products.filter(p => p.id !== this.productToDelete.id);
        } catch (error) {
          console.error('Error deleting product:', error);
        } finally {
          this.showDeleteModal = false;
          this.productToDelete = null;
          this.render();
          this.setupEventListeners();
        }
      }
    });

    this.shadowRoot.querySelector('#delete-modal-backdrop')?.addEventListener('click', () => {
      this.showDeleteModal = false;
      this.productToDelete = null;
      this.render();
      this.setupEventListeners();
    });
  }

  async handleAddProduct(e) {
    e.preventDefault();

    if (!this.productName || !this.caloriesValue) return;

    const newProduct = {
      id: generateId(),
      user_id: this.user_id,
      name: this.productName,
      caloriesPer100g: parseInt(this.caloriesValue),
      createdAt: new Date().toISOString()
    };

    try {
      await addProduct(newProduct);
      this.products.unshift(newProduct);
      this.productName = '';
      this.caloriesValue = '';
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  }

  async handleSetGoal(e) {
    e.preventDefault();

    if (!this.goalValue) return;

    try {
      await setCalorieGoal(this.user_id, parseInt(this.goalValue));
      // Refresh goals data
      const goalData = await getCalorieGoalHistory(this.user_id);
      this.calorieGoal = goalData.current;
      this.goalHistory = goalData.history;
      this.goalValue = '';

      // Dispatch event to update dashboard
      window.dispatchEvent(new CustomEvent('goals-updated'));

      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .container {
          padding-bottom: 5rem;
        }
        .header {
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 1rem;
        }
        .tab-btn {
          padding: 0.75rem 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .tab-btn.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
        }
        .card {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .form-section {
          margin-bottom: 1.5rem;
        }
        .form-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
          color: #374151;
        }
        input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background-color: white;
          font-size: 1rem;
        }
        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-primary {
          background-color: #4f46e5;
          color: white;
        }
        .btn-primary:hover {
          background-color: #4338ca;
        }
        .form-inline {
          display: flex;
          gap: 0.5rem;
        }
        .form-inline .form-group {
          flex: 1;
        }
        .form-inline .btn {
          align-self: flex-end;
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          font-weight: 500;
          color: #6b7280;
        }
        .divider:before, .divider:after {
          content: "";
          flex: 1;
          height: 1px;
          background-color: #e5e7eb;
        }
        .divider:before {
          margin-right: 0.5rem;
        }
        .divider:after {
          margin-left: 0.5rem;
        }
        .product-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }
        .product-details {
          flex: 1;
          min-width: 0;
        }
        .product-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-calories {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .delete-product-btn {
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }
        .delete-product-btn:hover {
          background-color: #e5e7eb;
          color: #ef4444;
        }
        .delete-product-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }
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
          max-width: 24rem;
          overflow-y: auto;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .modal-text {
          margin-bottom: 1.5rem;
          color: #4b5563;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .btn-cancel {
          background-color: #e5e7eb;
          color: #374151;
        }
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
        .btn-cancel:hover {
          background-color: #d1d5db;
        }
        .btn-danger:hover {
          background-color: #dc2626;
        }
        .goal-current {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .goal-value {
          font-weight: 600;
          font-size: 1.25rem;
        }
        .goal-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }
        .goal-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .goal-date svg {
          width: 1rem;
          height: 1rem;
        }
        .loading {
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }
        
        @media (prefers-color-scheme: dark) {
          .card {
            background-color: #1f2937;
          }
          .tabs {
            border-bottom-color: #374151;
          }
          .divider:before, .divider:after {
            background-color: #374151;
          }
          label {
            color: #e5e7eb;
          }
          input {
            background-color: #374151;
            border-color: #4b5563;
            color: #e5e7eb;
          }
          .product-item, .goal-history-item {
            background-color: #374151;
          }
          .delete-product-btn:hover {
            background-color: #4b5563;
          }
          .modal {
            background-color: #1f2937;
          }
          .modal-text {
            color: #9ca3af;
          }
          .btn-cancel {
            background-color: #4b5563;
            color: #e5e7eb;
          }
          .btn-cancel:hover {
            background-color: #6b7280;
          }
        }
      </style>
      
      <div class="container">
        <div class="tabs">
          <div class="tab-btn ${this.activeTab === 'products' ? 'active' : ''}" data-tab="products">
            Мої продукти
          </div>
          <div class="tab-btn ${this.activeTab === 'goals' ? 'active' : ''}" data-tab="goals">
            Цілі
          </div>
        </div>
        
        ${this.loading ? this.renderLoading() : this.renderTabContent()}
        
        ${this.showDeleteModal ? this.renderDeleteModal() : ''}
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="loading">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    `;
  }

  renderTabContent() {
    if (this.activeTab === 'products') {
      return this.renderProductsTab();
    } else {
      return this.renderGoalsTab();
    }
  }

  renderProductsTab() {
    return `
      <div class="card">
        <div class="form-section">
          <div class="form-title">Додати новий продукт</div>
          <form id="product-form" class="form-inline">
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
            <div class="form-group" style="max-width: 8rem;">
              <label for="product-calories">Ккал на 100г</label>
              <input 
                type="number" 
                id="product-calories" 
                placeholder="244" 
                value="${this.caloriesValue}"
                required
                min="1"
              >
            </div>
            <button type="submit" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </form>
        </div>
        
        <div class="divider">Мої продукти</div>
        
        <div class="product-list">
          ${this.products.length > 0 ?
        this.products.map(product => this.renderProductItem(product)).join('') :
        '<div class="text-center text-gray-500 py-4">Немає доданих продуктів</div>'
      }
        </div>
      </div>
    `;
  }

  renderProductItem(product) {
    return `
      <div class="product-item" data-id="${product.id}">
        <div class="product-details">
          <div class="product-name">${product.name}</div>
          <div class="product-calories">${product.caloriesPer100g} ккал/100г</div>
        </div>
        <button class="delete-product-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
  }

  renderGoalsTab() {
    return `
      <div class="card">
        <div class="goal-current">
          <div class="form-title">Ціль калорій</div>
          <div class="goal-value">${this.calorieGoal ? `${this.calorieGoal} ккал` : 'Не встановлено'}</div>
        </div>
        
        <form id="goal-form" class="form-inline">
          <div class="form-group">
            <label for="goal-value">Нова ціль (ккал)</label>
            <input 
              type="number" 
              id="goal-value" 
              placeholder="2000" 
              value="${this.goalValue}"
              required
              min="1"
            >
          </div>
          <button type="submit" class="btn btn-primary">Зберегти</button>
        </form>
        
        ${this.goalHistory.length > 0 ? `
          <div class="divider">Історія змін</div>
          
          <div class="goal-history">
            ${this.goalHistory.map(goal => this.renderGoalHistoryItem(goal)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderGoalHistoryItem(goal) {
    return `
      <div class="goal-history-item">
        <div class="goal-date">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          ${formatDate(goal.startDate)}
        </div>
        <div class="font-medium">${goal.value} ккал</div>
      </div>
    `;
  }

  renderDeleteModal() {
    if (!this.productToDelete) return '';

    return `
      <div id="delete-modal-backdrop" class="modal-backdrop">
        <div class="modal" @click.stop>
          <div class="modal-body">
            <div class="modal-title">Підтвердження видалення</div>
            <div class="modal-text">
              Ви впевнені, що хочете видалити продукт "${this.productToDelete.name}"?
            </div>
            <div class="modal-actions">
              <button id="cancel-delete" class="btn btn-cancel">Скасувати</button>
              <button id="confirm-delete" class="btn btn-danger">Видалити</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-page', SettingsPage);

// Import other components
import './add-product-form.js';