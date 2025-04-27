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
    this.handleSearchInput = this.handleSearchInput.bind(this);
  }

  connectedCallback() {
    this.render();
    this.loadProducts();
  }

  disconnectedCallback() {
    // Видаляємо всі обробники подій при видаленні компонента
    this.removeEventListeners();
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

  handleSearchInput(e) {
    this.searchQuery = e.target.value;
    this.filterProducts();
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
    const productListContainer = this.querySelector('.product-list-container');
    if (productListContainer) {
      productListContainer.innerHTML = this.renderProductList();

      // Додаємо обробники кліків по продуктах
      this.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectedProductId = item.dataset.id;
          this.updateSelectedProductIndicator();

          // Фокусуємо поле для введення грамів після вибору продукту
          const gramsInput = this.querySelector('#grams-input');
          if (gramsInput) {
            gramsInput.focus();
          }
        });
      });
    }
  }

  updateSelectedProductIndicator() {
    // Знімаємо активний клас з усіх елементів
    this.querySelectorAll('.product-item').forEach(item => {
      item.classList.remove('bg-primary-50', 'dark:bg-primary-900/30', 'border-primary-300', 'dark:border-primary-700');
      item.classList.add('bg-white', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700');
    });

    // Додаємо активний клас до вибраного елемента
    const selectedItem = this.querySelector(`.product-item[data-id="${this.selectedProductId}"]`);
    if (selectedItem) {
      selectedItem.classList.remove('bg-white', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700');
      selectedItem.classList.add('bg-primary-50', 'dark:bg-primary-900/30', 'border-primary-300', 'dark:border-primary-700');
    }

    // Оновлюємо стан поля введення грамів
    const gramsInput = this.querySelector('#grams-input');
    if (gramsInput) {
      if (this.selectedProductId) {
        gramsInput.removeAttribute('disabled');
      } else {
        gramsInput.setAttribute('disabled', 'disabled');
      }
    }

    // Оновлюємо також стан кнопки відправки форми
    const submitButton = this.querySelector('button[type="submit"]');
    if (submitButton) {
      if (!this.selectedProductId || !this.grams) {
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        submitButton.setAttribute('disabled', 'disabled');
      } else {
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        submitButton.removeAttribute('disabled');
      }
    }

    // Оновлюємо розрахунок калорій
    this.updateCaloriesDisplay();
  }

  updateCaloriesDisplay() {
    const selectedProduct = this.products.find(p => p.id === this.selectedProductId);
    const caloriesLabel = this.querySelector('.calories-calculation');

    if (caloriesLabel && selectedProduct && this.grams) {
      const calculatedCalories = Math.round((selectedProduct.caloriesPer100g * parseInt(this.grams)) / 100);
      caloriesLabel.textContent = `${calculatedCalories} ккал`;
      caloriesLabel.classList.remove('hidden');
    } else if (caloriesLabel) {
      caloriesLabel.classList.add('hidden');
    }
  }

  renderProductList() {
    if (this.filteredProducts.length === 0) {
      return `
        <div class="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-300 mt-2">
          ${this.searchQuery
          ? 'За вашим запитом продуктів не знайдено. Спробуйте змінити пошук або додайте новий продукт.'
          : 'У вас ще немає продуктів. Додайте їх у розділі "Мої продукти".'}
        </div>
      `;
    }

    return this.filteredProducts.map(product => `
      <div class="product-item cursor-pointer flex justify-between items-center px-2 py-2 border rounded-md mb-2 
           ${this.selectedProductId === product.id
        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}"
           data-id="${product.id}">
        <div class="flex justify-between items-center w-full gap-2">
          <div class="text-overflow-ellipsis overflow-hidden truncate whitespace-nowrap font-medium">${product.name}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">${product.caloriesPer100g} ккал/100г</div>
        </div>
        ${this.selectedProductId === product.id
        ? `<div class="text-primary-600 dark:text-primary-400">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
               </svg>
             </div>`
        : ''}
      </div>
    `).join('');
  }

  // Метод для видалення всіх обробників подій
  removeEventListeners() {
    const closeBtn = this.querySelector('#close-modal');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.handleCloseModal);
    }

    const searchInput = this.querySelector('#product-search');
    if (searchInput) {
      searchInput.removeEventListener('input', this.handleSearchInput);
    }

    const gramsInput = this.querySelector('#grams-input');
    if (gramsInput) {
      gramsInput.removeEventListener('input', this.handleGramsInput);
    }

    const form = this.querySelector('#add-meal-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }

    // Видаляємо обробники кліків з елементів списку
    this.querySelectorAll('.product-item').forEach(item => {
      const id = item.dataset.id;
      const boundHandler = this._clickHandlers?.[id];
      if (boundHandler) {
        item.removeEventListener('click', boundHandler);
      }
    });
  }

  setupEventListeners() {
    // Спочатку видаляємо всі обробники подій
    this.removeEventListeners();

    // Додаємо обробники для основних елементів
    const closeBtn = this.querySelector('#close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', this.handleCloseModal);
    }

    const searchInput = this.querySelector('#product-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearchInput);
      // Встановлюємо поточне значення
      searchInput.value = this.searchQuery;

      // Фокусуємо поле пошуку при відкритті модального вікна
      if (this.isOpen && !this.selectedProductId) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }

    // Обробник для кнопки очищення пошуку
    const clearSearchBtn = this.querySelector('#clear-search-btn');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        const searchInput = this.querySelector('#product-search');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        this.filterProducts();
        this.updateProductsList();
      });
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

    // Додаємо обробники до елементів списку
    this.querySelectorAll('.product-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectedProductId = item.dataset.id;
        this.updateSelectedProductIndicator();

        // Фокусуємо поле для введення грамів після вибору продукту
        const gramsInput = this.querySelector('#grams-input');
        if (gramsInput) {
          gramsInput.focus();
        }
      });
    });
  }

  handleCloseModal() {
    this.isOpen = false;
    this.render();
  }

  handleProductSelect(productId) {
    this.selectedProductId = productId;
  }

  handleGramsInput(e) {
    this.grams = e.target.value;

    // Оновлюємо інформацію про калорії при зміні грамів
    this.updateCaloriesDisplay();

    // Також оновлюємо стан кнопки відправки
    const submitButton = this.querySelector('button[type="submit"]');
    if (submitButton) {
      if (!this.selectedProductId || !this.grams) {
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        submitButton.setAttribute('disabled', 'disabled');
      } else {
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        submitButton.removeAttribute('disabled');
      }
    }
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
        <div class="bg-white dark:bg-gray-800 rounded-lg w-[95%] max-w-md max-h-[95vh] overflow-hidden shadow-lg flex flex-col">
          <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="text-lg font-semibold">Додати спожиту їжу</div>
            <button id="close-modal" class="bg-transparent border-none cursor-pointer text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-4 overflow-y-auto flex-1">
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
    // Знаходимо вибраний продукт для відображення калорій
    const selectedProduct = this.products.find(p => p.id === this.selectedProductId);
    const calculatedCalories = selectedProduct && this.grams
      ? Math.round((selectedProduct.caloriesPer100g * parseInt(this.grams)) / 100)
      : null;

    return `
      <form id="add-meal-form">
        <div class="mb-4">
          <label for="product-search" class="block mb-2 font-medium text-gray-700 dark:text-gray-300">Знайти продукт</label>
          <div class="relative">
            <input 
              type="text" 
              id="product-search" 
              placeholder="Почніть вводити назву продукту..." 
              value="${this.searchQuery}"
              class="w-full p-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            ${this.searchQuery ? `
              <button 
                type="button"
                id="clear-search-btn"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="max-h-80 overflow-y-auto mb-4 product-list-container">
          ${this.renderProductList()}
        </div>
        
        <div class="mb-4">
          <label for="grams-input" class="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Кількість (грам)
            <span class="ml-2 text-primary-600 dark:text-primary-400 calories-calculation ${calculatedCalories ? '' : 'hidden'}">${calculatedCalories ? calculatedCalories + ' ккал' : ''}</span>
          </label>
          <input 
            type="number" 
            id="grams-input" 
            placeholder="100" 
            value="${this.grams}"
            min="1" 
            required
            class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            ${!this.selectedProductId ? 'disabled' : ''}
          >
        </div>
        
        <button 
          type="submit" 
          class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium ${(!this.selectedProductId || !this.grams) ? 'opacity-50 cursor-not-allowed' : ''}"
          ${(!this.selectedProductId || !this.grams) ? 'disabled' : ''}
        >
          Додати
        </button>
      </form>
    `;
  }
}

customElements.define('add-meal-entry', AddMealEntry);