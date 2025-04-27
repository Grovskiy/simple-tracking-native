import { getEntries, deleteEntry } from '../services/db-service.js';
import { getCalorieGoal } from '../services/db-service.js';
import { getTodayDate, formatDate } from '../utils/helpers.js';

class CalorieTracker extends HTMLElement {
  constructor() {
    super();
    this.entries = [];
    this.loading = true;
    this.selectedDate = getTodayDate();
    this.calorieGoal = null;

    // Зв'язуємо методи для використання як колбеки
    this.handlePrevClick = this.handlePrevClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handleTodayClick = this.handleTodayClick.bind(this);
    this.handleEntriesUpdated = this.handleEntriesUpdated.bind(this);
    this.handleGoalsUpdated = this.handleGoalsUpdated.bind(this);
    this.handleAddMealClick = this.handleAddMealClick.bind(this);
  }

  static get observedAttributes() {
    return ['user-id'];
  }

  async connectedCallback() {
    this.render();
    await this.loadData();
    this.setupEventListeners();

    window.addEventListener('entries-updated', this.handleEntriesUpdated);
    window.addEventListener('goals-updated', this.handleGoalsUpdated);
  }

  disconnectedCallback() {
    this.removeEventListeners();
    window.removeEventListener('entries-updated', this.handleEntriesUpdated);
    window.removeEventListener('goals-updated', this.handleGoalsUpdated);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.loadData();
  }

  setupEventListeners() {
    // Спочатку видаляємо будь-які існуючі слухачі
    this.removeEventListeners();

    // Додаємо нові слухачі подій
    const prevButton = this.querySelector('.date-prev');
    if (prevButton) {
      prevButton.addEventListener('click', this.handlePrevClick);
    }

    const nextButton = this.querySelector('.date-next');
    if (nextButton) {
      nextButton.addEventListener('click', this.handleNextClick);
    }

    const todayButton = this.querySelector('.date-today');
    if (todayButton) {
      todayButton.addEventListener('click', this.handleTodayClick);
    }

    const addMealBtn = this.querySelector('#add-meal-btn');
    if (addMealBtn) {
      addMealBtn.addEventListener('click', this.handleAddMealClick);
    }

    this.setupEntryDeleteListeners();
  }

  removeEventListeners() {
    const prevButton = this.querySelector('.date-prev');
    if (prevButton) {
      prevButton.removeEventListener('click', this.handlePrevClick);
    }

    const nextButton = this.querySelector('.date-next');
    if (nextButton) {
      nextButton.removeEventListener('click', this.handleNextClick);
    }

    const todayButton = this.querySelector('.date-today');
    if (todayButton) {
      todayButton.removeEventListener('click', this.handleTodayClick);
    }

    const addMealBtn = this.querySelector('#add-meal-btn');
    if (addMealBtn) {
      addMealBtn.removeEventListener('click', this.handleAddMealClick);
    }
  }

  handlePrevClick() {
    this.changeDate(-1);
  }

  handleNextClick() {
    this.changeDate(1);
  }

  handleTodayClick() {
    this.resetToToday();
  }

  handleAddMealClick() {
    const addMealEntry = document.querySelector('add-meal-entry');
    if (addMealEntry) {
      addMealEntry.isOpen = true;
      addMealEntry.render();
    }
  }

  async loadData() {
    if (!this.user_id) return;

    this.loading = true;
    this.render();

    try {
      // Load entries and goals in parallel
      const [entries, goal] = await Promise.all([
        getEntries(this.user_id, this.selectedDate),
        getCalorieGoal(this.user_id, this.selectedDate)
      ]);

      this.entries = entries;
      this.calorieGoal = goal;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
      this.render();
      this.setupEventListeners();
    }
  }

  setupEntryDeleteListeners() {
    this.querySelectorAll('.delete-entry').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const entryId = e.target.closest('.entry-item').dataset.id;
        try {
          await deleteEntry(entryId);
          this.loadData();
        } catch (error) {
          console.error('Error deleting entry:', error);
        }
      });
    });
  }

  handleEntriesUpdated() {
    this.loadData();
  }

  handleGoalsUpdated() {
    this.loadData();
  }

  changeDate(dayDiff) {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + dayDiff);
    this.selectedDate = date.toISOString().split('T')[0];
    this.loadData();
  }

  resetToToday() {
    this.selectedDate = getTodayDate();
    this.loadData();
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
      console.log('calorie-tracker: використовуємо user_id з глобального стану');
      return window.appState.user_id;
    }

    console.warn('calorie-tracker: user_id не знайдено');
    return null;
  }

  getProgressPercentage() {
    if (!this.calorieGoal) return 0;
    const totalCalories = this.getTotalCalories();
    return Math.min(Math.round((totalCalories / this.calorieGoal) * 100), 100);
  }

  getTotalCalories() {
    return this.entries.reduce((sum, entry) => sum + entry.calories, 0);
  }

  getRemainingCalories() {
    if (!this.calorieGoal) return 0;
    return this.calorieGoal - this.getTotalCalories();
  }

  getProgressStatus() {
    const remaining = this.getRemainingCalories();

    if (remaining >= 0) {
      return { color: 'text-green-600', barColor: 'bg-green-600' };
    }
    if (Math.abs(remaining) <= 110) {
      return { color: 'text-yellow-500', barColor: 'bg-yellow-500' };
    }
    return { color: 'text-red-500', barColor: 'bg-red-500' };
  }

  render() {
    this.innerHTML = `
      <div class="pb-20">
        <div class="flex justify-between items-center mb-4 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full date-prev">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          
          <div class="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg date-today">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${formatDate(this.selectedDate)}
          </div>
          
          <div class="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full date-next">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        ${this.loading ? this.renderLoading() : this.renderContent()}
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

  renderContent() {
    const totalCalories = this.getTotalCalories();
    const remainingCalories = this.getRemainingCalories();
    const progressPercentage = this.getProgressPercentage();
    const { color, barColor } = this.getProgressStatus();

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
        <div class="flex justify-between items-center mb-2">
          <span class="text-lg font-medium">Прогрес</span>
          <span class="text-lg font-medium ${color}">${progressPercentage}%</span>
        </div>
        
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
          <div class="h-full ${barColor} rounded-full" style="width: ${progressPercentage}%"></div>
        </div>
        
        <div class="flex justify-between text-sm">
          <div>
            <div class="text-gray-500 dark:text-gray-400 mb-1">Спожито</div>
            <div class="font-medium">${totalCalories} ккал</div>
          </div>
          
          <div class="text-center">
            <div class="text-gray-500 dark:text-gray-400 mb-1">Залишилось</div>
            <div class="font-medium ${color}">
              ${Math.abs(remainingCalories)} ккал
              ${remainingCalories >= 0
        ? ''
        : Math.abs(remainingCalories) <= 110
          ? ' (трохи перевищено)'
          : ' (перевищено)'}
            </div>
          </div>
          
          <div class="text-right">
            <div class="text-gray-500 dark:text-gray-400 mb-1">Ціль</div>
            <div class="font-medium">${this.calorieGoal || 'Не вказано'}</div>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        ${this.entries.length > 0
        ? this.entries.map(entry => this.renderEntryItem(entry)).join('')
        : `<div class="text-center py-8 text-gray-500 dark:text-gray-400">Додайте прийом їжі за цей день</div>`
      }
      </div>
      
      <button id="add-meal-btn" class="fixed bottom-20 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg z-10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <add-meal-entry></add-meal-entry>
    `;
  }

  renderEntryItem(entry) {
    const entryPercentage = this.calorieGoal
      ? Math.round((entry.calories / this.calorieGoal) * 100)
      : 0;

    return `
      <div class="flex justify-between items-center px-2 py-1 mb-2 bg-gray-100 dark:bg-gray-700 rounded-md entry-item" data-id="${entry.id}">
        <div class="flex-1 min-w-0 flex items-center gap-2">
          <div class="font-medium whitespace-nowrap overflow-hidden text-ellipsis">${entry.productName}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${entry.grams}г</div>
        </div>
        
        <div class="font-medium mr-4">${entry.calories} ккал</div>
        
        <button class="delete-entry text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 p-1 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
  }
}

customElements.define('calorie-tracker', CalorieTracker);

// Import other components
import './add-meal-entry.js';