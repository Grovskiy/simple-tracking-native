# Calorie Tracker - Vanilla JS + Web Components

Мінімалістичний застосунок для відстеження калорій, який використовує Web Components і працює напряму з Supabase.

🌐 **[Переглянути демо на GitHub Pages](https://your-username.github.io/calorie-tracker/)**

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

## Розгортання на GitHub Pages

1. Форкніть цей репозиторій
2. У вашому репозиторії перейдіть до **Settings > Secrets and variables > Actions**
3. Додайте наступні секрети:

   - `VITE_SUPABASE_URL`: URL вашого Supabase проекту
   - `VITE_SUPABASE_KEY`: публічний API ключ Supabase

4. Внесіть будь-які зміни та зробіть push до вашої `main` гілки
5. GitHub Action автоматично розгорне ваш застосунок на GitHub Pages

## Локальний розвиток

1. Клонуйте репозиторій

```bash
git clone https://github.com/your-username/calorie-tracker.git
cd calorie-tracker
```

2. Встановіть залежності

```bash
npm install
```

3. Створіть файл `.env` з вашими Supabase ключами

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_KEY=YOUR_SUPABASE_KEY
```

4. Запустіть застосунок у режимі розробки

```bash
npm run dev
```

## Налаштування Supabase

1. Створіть проект у [Supabase](https://app.supabase.io/)
2. Налаштуйте Google OAuth у Supabase Auth панелі
3. Створіть таблиці використовуючи SQL з розділу "SQL для налаштування бази даних" нижче
4. Додайте до авторизованих доменів:
   - `localhost:5173` (для розробки)
   - `your-username.github.io` (для GitHub Pages)

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

## Ліцензія

MIT
