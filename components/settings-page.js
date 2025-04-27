import { getProducts, addProduct, deleteProduct } from '../services/db-service.js';
import { getCalorieGoalHistory, setCalorieGoal } from '../services/db-service.js';
import { formatDate, generateId } from '../utils/helpers.js';

class SettingsPage extends HTMLElement {
  constructor() {
    super();
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

    // Зв'язуємо методи для використання як колбеки
    this.handleProductFormSubmit = this.handleProductFormSubmit.bind(this);
    this.handleAddProduct = this.handleAddProduct.bind(this);
  }

  static get observedAttributes() {
    return ['user-id'];
  }

  async connectedCallback() {
    this.render();
    await this.loadData();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    // Видаляємо обробник події form-submit при видаленні компонента з DOM
    this.removeEventListener('product-form-submit', this.handleProductFormSubmit);
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
    // Перед додаванням нових обробників, видаляємо старі
    this.removeAllEventListeners();

    // Tab switching
    this.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
        this.setupEventListeners();
      });
    });

    // Обробник події від add-product-form компонента
    this.addEventListener('product-form-submit', this.handleProductFormSubmit);

    // Add product form (для випадку, коли не використовується компонент add-product-form)
    const productForm = this.querySelector('#product-form');
    if (productForm) {
      productForm.addEventListener('submit', this.handleAddProduct);
    }

    const productNameInput = this.querySelector('#product-name');
    if (productNameInput) {
      productNameInput.addEventListener('input', (e) => {
        this.productName = e.target.value;
      });
      // Встановлюємо поточне значення
      productNameInput.value = this.productName;
    }

    const productCaloriesInput = this.querySelector('#product-calories');
    if (productCaloriesInput) {
      productCaloriesInput.addEventListener('input', (e) => {
        this.caloriesValue = e.target.value;
      });
      // Встановлюємо поточне значення
      productCaloriesInput.value = this.caloriesValue;
    }

    // Goal setting form
    const goalForm = this.querySelector('#goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', this.handleSetGoal.bind(this));
    }

    const goalValueInput = this.querySelector('#goal-value');
    if (goalValueInput) {
      goalValueInput.addEventListener('input', (e) => {
        this.goalValue = e.target.value;
      });
      // Встановлюємо поточне значення
      goalValueInput.value = this.goalValue;
    }

    // Delete buttons
    this.querySelectorAll('.delete-product-btn').forEach(btn => {
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

  // Допоміжний метод для видалення всіх обробників подій
  removeAllEventListeners() {
    // Видаляємо обробник події form-submit
    this.removeEventListener('product-form-submit', this.handleProductFormSubmit);

    // Тут можна додати інші специфічні обробники, які потрібно видалити
  }

  setupDeleteModalListeners() {
    const cancelButton = this.querySelector('#cancel-delete');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.showDeleteModal = false;
        this.productToDelete = null;
        this.render();
        this.setupEventListeners();
      });
    }

    const confirmButton = this.querySelector('#confirm-delete');
    if (confirmButton) {
      confirmButton.addEventListener('click', async () => {
        if (this.productToDelete) {
          try {
            await deleteProduct(this.productToDelete.id);
            this.loadData()
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
    }

    const modalBackdrop = this.querySelector('#delete-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => {
        this.showDeleteModal = false;
        this.productToDelete = null;
        this.render();
        this.setupEventListeners();
      });
    }
  }

  // Обробник події від компонента add-product-form
  async handleProductFormSubmit(e) {
    try {
      const { name, caloriesPer100g } = e.detail;

      const newProduct = {
        id: generateId(),
        user_id: this.user_id,
        name: name,
        caloriesPer100g: caloriesPer100g,
        createdAt: new Date().toISOString()
      };

      console.log('Отримано дані з add-product-form, спроба додати продукт:', newProduct);

      await addProduct(newProduct);
      this.products.unshift(newProduct);
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error adding product from form component:', error);
    }
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
      console.log('Спроба додати продукт з вбудованої форми:', newProduct);
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
    this.innerHTML = `
      <div class="pb-20">
        <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <div 
            class="px-4 py-3 font-medium cursor-pointer transition-all tab-btn ${this.activeTab === 'products' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400'}" 
            data-tab="products"
          >
            Мої продукти
          </div>
          <div 
            class="px-4 py-3 font-medium cursor-pointer transition-all tab-btn ${this.activeTab === 'goals' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400'}" 
            data-tab="goals"
          >
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
      <div class="flex justify-center py-8">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div class="mb-6">
          <div class="font-semibold mb-2">Додати новий продукт</div>
          <form id="product-form" class="flex gap-2">
            <div class="flex-1">
              <label for="product-name" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Назва продукту</label>
              <input 
                type="text" 
                id="product-name" 
                placeholder="Цільнозерновий хліб" 
                value="${this.productName}"
                class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                required
              >
            </div>
            <div class="w-32">
              <label for="product-calories" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Ккал на 100г</label>
              <input 
                type="number" 
                id="product-calories" 
                placeholder="244" 
                value="${this.caloriesValue}"
                class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                required
                min="1"
              >
            </div>
            <button type="submit" class="self-end bg-primary-600 hover:bg-primary-700 text-white rounded-md p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </form>
        </div>
        
        <div class="flex items-center my-6">
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <div class="px-3 font-medium text-gray-500 dark:text-gray-400">Мої продукти</div>
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>
        
        <div class="space-y-2">
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
      <div class="flex justify-between items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md product-item" data-id="${product.id}">
        <div class="flex-1 min-w-0 flex items-center gap-2">
          <div class="font-medium whitespace-nowrap overflow-hidden text-ellipsis">${product.name}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${product.caloriesPer100g} ккал/100г</div>
        </div>
        <button class="delete-product-btn text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 p-1 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
  }

  renderGoalsTab() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <div class="font-semibold">Ціль калорій</div>
          <div class="text-xl font-semibold">${this.calorieGoal ? `${this.calorieGoal} ккал` : 'Не встановлено'}</div>
        </div>
        
        <form id="goal-form" class="flex gap-2 mb-6">
          <div class="flex-1">
            <label for="goal-value" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Нова ціль (ккал)</label>
            <input 
              type="number" 
              id="goal-value" 
              placeholder="2000" 
              value="${this.goalValue}"
              class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
              required
              min="1"
            >
          </div>
          <button type="submit" class="self-end bg-primary-600 hover:bg-primary-700 text-white rounded-md px-4 py-2 font-medium">Зберегти</button>
        </form>
        
        ${this.goalHistory.length > 0 ? `
          <div class="flex items-center my-6">
            <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <div class="px-3 font-medium text-gray-500 dark:text-gray-400">Історія змін</div>
            <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <div class="space-y-2">
            ${this.goalHistory.map(goal => this.renderGoalHistoryItem(goal)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderGoalHistoryItem(goal) {
    return `
      <div class="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
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
      <div id="delete-modal-backdrop" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg w-[90%] max-w-md shadow-lg" @click.stop>
          <div class="p-6">
            <div class="text-lg font-semibold mb-2">Підтвердження видалення</div>
            <div class="text-gray-700 dark:text-gray-300 mb-6">
              Ви впевнені, що хочете видалити продукт "${this.productToDelete.name}"?
            </div>
            <div class="flex justify-end gap-2">
              <button id="cancel-delete" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600">Скасувати</button>
              <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Видалити</button>
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