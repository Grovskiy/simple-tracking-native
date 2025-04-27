# Calorie Tracker - Vanilla JS + Web Components

Мінімалістичний застосунок для відстеження калорій, який використовує Web Components і працює напряму з Supabase.

## Основні технології

- **Vanilla JavaScript** - без фреймворків
- **Web Components** - нативні компоненти
- **Supabase** - бекенд для аутентифікації та бази даних
- **Tailwind CSS** - для стилізації
- **PWA з Workbox** - для встановлення на телефон

## Особливості

- 📱 Прогресивний веб-застосунок (PWA) - можна встановити на телефон
- 🔐 Google аутентифікація через Supabase
- 🌙 Автоматичне визначення світлої/темної теми
- 📊 Відстеження щоденного прогресу
- 🥗 Додавання продуктів та прийомів їжі
- 🎯 Встановлення цілей калорій
- 🔄 Синхронізація між пристроями в реальному часі

## Початок роботи

1. Клонуйте репозиторій

```bash
git clone https://github.com/your-username/calorie-tracker-vanilla.git
cd calorie-tracker-vanilla
```

2. Встановіть залежності

```bash
npm install
```

3. Налаштуйте Supabase

   - Створіть проект у Supabase [https://supabase.com](https://supabase.com)
   - Оновіть URL і ключ у файлах `services/auth-service.js` та `services/db-service.js`
   - Створіть необхідні таблиці у Supabase за допомогою SQL скрипта (див. нижче)
   - Налаштуйте Google OAuth провайдер у консолі Supabase

4. Запустіть застосунок у режимі розробки

```bash
npm run dev
```

5. Для збірки

```bash
npm run build
```

## SQL для налаштування бази даних

```sql
-- Таблиця продуктів
CREATE TABLE products (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories_per_100g INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Таблиця прийомів їжі
CREATE TABLE entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  grams INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- Таблиця цілей по калоріям
CREATE TABLE calorie_goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  value INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Індекси
CREATE INDEX idx_products_user_id ON products (user_id);
CREATE INDEX idx_entries_user_id ON entries (user_id);
CREATE INDEX idx_entries_date ON entries (date);
CREATE INDEX idx_goals_user_id ON calorie_goals (user_id);
CREATE INDEX idx_goals_start_date ON calorie_goals (start_date);

-- Дозволи через Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_goals ENABLE ROW LEVEL SECURITY;

-- Політики для products
CREATE POLICY "Users can view only their products"
  ON products FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE USING (auth.uid() = user_id);

-- Політики для entries
CREATE POLICY "Users can view only their entries"
  ON entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE USING (auth.uid() = user_id);

-- Політики для calorie_goals
CREATE POLICY "Users can view only their goals"
  ON calorie_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON calorie_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON calorie_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON calorie_goals FOR DELETE USING (auth.uid() = user_id);
```

## Структура проекту

```
calorie-tracker-vanilla/
├── index.html               # Головна HTML сторінка
├── manifest.json            # PWA маніфест
├── assets/                  # Статичні файли
│   └── css/                 # Компільовані CSS
│       └── styles.css
├── components/              # Web Components
│   ├── app-root.js          # Головний компонент
│   ├── auth-page.js         # Сторінка авторизації
│   ├── nav-bar.js           # Навігаційна панель
│   ├── calorie-tracker.js   # Основний трекер
│   └── ...                  # Інші компоненти
├── services/                # Сервіси для роботи з даними
│   ├── auth-service.js      # Авторизація
│   └── db-service.js        # Робота з базою даних
├── src/                     # Вихідні файли
│   └── styles/              # Стилі Tailwind
│       └── input.css        # Вхідний файл для Tailwind
└── utils/                   # Допоміжні функції
    └── helpers.js           # Загальні утиліти
```

## Ліцензія

MIT
