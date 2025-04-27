import { getEntries, deleteEntry } from '../services/db-service.js';
import { getCalorieGoal } from '../services/db-service.js';
import { getTodayDate, formatDate } from '../utils/helpers.js';

class CalorieTracker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.entries = [];
    this.loading = true;
    this.selectedDate = getTodayDate();
    this.calorieGoal = null;
  }

  static get observedAttributes() {
    return ['user-id'];
  }

  async connectedCallback() {
    this.render();
    await this.loadData();

    this.shadowRoot.querySelector('.date-prev')
      .addEventListener('click', () => this.changeDate(-1));

    this.shadowRoot.querySelector('.date-next')
      .addEventListener('click', () => this.changeDate(1));

    this.shadowRoot.querySelector('.date-today')
      .addEventListener('click', () => this.resetToToday());

    window.addEventListener('entries-updated', () => this.loadData());
    window.addEventListener('goals-updated', () => this.loadData());
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('.date-prev')
      .removeEventListener('click', () => this.changeDate(-1));

    this.shadowRoot.querySelector('.date-next')
      .removeEventListener('click', () => this.changeDate(1));

    this.shadowRoot.querySelector('.date-today')
      .removeEventListener('click', () => this.resetToToday());

    window.removeEventListener('entries-updated', () => this.loadData());
    window.removeEventListener('goals-updated', () => this.loadData());
  }

  attributeChangedCallback() {
    if (this.isConnected) this.loadData();
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
      this.setupEntryDeleteListeners();
    }
  }

  setupEntryDeleteListeners() {
    this.shadowRoot.querySelectorAll('.delete-entry').forEach(btn => {
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
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .container {
          padding-bottom: 5rem;
        }
        .date-selector {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .date-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          cursor: pointer;
          border-radius: 9999px;
          transition: background-color 0.2s;
        }
        .date-nav:hover {
          background-color: #f3f4f6;
        }
        .date-today {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: background-color 0.2s;
        }
        .date-today:hover {
          background-color: #f3f4f6;
        }
        .date-today svg {
          margin-right: 0.5rem;
        }
        .progress-card {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .progress-bar {
          height: 0.5rem;
          background-color: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        .progress-value {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        .progress-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }
        .stat-label {
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .entries-card {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .entry-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }
        .entry-details {
          flex: 1;
          min-width: 0;
        }
        .entry-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .entry-grams {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .entry-calories {
          font-weight: 500;
          margin-right: 1rem;
        }
        .delete-entry {
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
        .delete-entry:hover {
          background-color: #e5e7eb;
          color: #ef4444;
        }
        .delete-entry svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        .empty-state {
          text-align: center;
          padding: 2rem 0;
          color: #6b7280;
        }
        .loading {
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }
        .add-meal-btn {
          position: fixed;
          bottom: 5rem;
          right: 1.5rem;
          width: 3.5rem;
          height: 3.5rem;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          z-index: 10;
          transition: background-color 0.2s;
        }
        .add-meal-btn:hover {
          background-color: #4338ca;
        }
        .add-meal-btn svg {
          width: 1.5rem;
          height: 1.5rem;
        }
        
        @media (prefers-color-scheme: dark) {
          .date-selector, .progress-card, .entries-card {
            background-color: #1f2937;
          }
          .date-nav:hover, .date-today:hover {
            background-color: #374151;
          }
          .progress-bar {
            background-color: #374151;
          }
          .entry-item {
            background-color: #374151;
          }
          .delete-entry:hover {
            background-color: #4b5563;
          }
        }
      </style>
      
      <div class="container">
        <div class="date-selector">
          <div class="date-nav date-prev">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          
          <div class="date-today">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${formatDate(this.selectedDate)}
          </div>
          
          <div class="date-nav date-next">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
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
      <div class="loading">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div class="progress-card">
        <div class="progress-header">
          <span class="text-lg font-medium">Прогрес</span>
          <span class="text-lg font-medium ${color}">${progressPercentage}%</span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-value ${barColor}" style="width: ${progressPercentage}%"></div>
        </div>
        
        <div class="progress-stats">
          <div>
            <div class="stat-label">Спожито</div>
            <div class="font-medium">${totalCalories} ккал</div>
          </div>
          
          <div class="text-center">
            <div class="stat-label">Залишилось</div>
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
            <div class="stat-label">Ціль</div>
            <div class="font-medium">${this.calorieGoal || 'Не вказано'}</div>
          </div>
        </div>
      </div>
      
      <div class="entries-card">
        ${this.entries.length > 0
        ? this.entries.map(entry => this.renderEntryItem(entry)).join('')
        : `<div class="empty-state">Додайте прийом їжі за цей день</div>`
      }
      </div>
      
      <button class="add-meal-btn" id="add-meal-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-details">
          <div class="entry-name">${entry.productName}</div>
          <div class="entry-grams">${entry.grams}г</div>
        </div>
        
        <div class="entry-calories">${entry.calories} ккал</div>
        
        <button class="delete-entry">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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