import { createClient } from '@supabase/supabase-js';
import { generateId } from '../utils/helpers.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

// Initialize Supabase Client
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Products CRUD
export async function getProducts(user_id) {
  try {
    if (!user_id) {
      console.warn('getProducts called without user_id');
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Перетворення snake_case в camelCase для фронтенду
    return data.map(product => ({
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      caloriesPer100g: product.calories_per_100g,
      createdAt: product.created_at
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

export async function addProduct(product) {
  try {
    if (!product.user_id) {
      throw new Error('Product must have a user_id');
    }

    // Перетворення camelCase в snake_case для бази даних
    const snakeCaseProduct = {
      id: product.id || generateId(),
      user_id: product.user_id,
      name: product.name,
      calories_per_100g: product.caloriesPer100g,
      created_at: product.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert(snakeCaseProduct)
      .select()
      .single();

    if (error) throw error;

    // Повертаємо об'єкт у camelCase
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      caloriesPer100g: data.calories_per_100g,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export async function deleteProduct(productId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Entries CRUD
export async function getEntries(user_id, date) {
  try {
    if (!user_id) {
      console.warn('getEntries called without user_id');
      return [];
    }

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Перетворення snake_case в camelCase для фронтенду
    return data.map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      productId: entry.product_id,
      productName: entry.product_name,
      grams: entry.grams,
      calories: entry.calories,
      date: entry.date,
      createdAt: entry.created_at
    }));
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
}

export async function addEntry(entry) {
  try {
    if (!entry.user_id) {
      throw new Error('Entry must have a user_id');
    }

    // Перетворення camelCase в snake_case для бази даних
    const snakeCaseEntry = {
      id: entry.id || generateId(),
      user_id: entry.user_id,
      product_id: entry.productId,
      product_name: entry.productName,
      grams: entry.grams,
      calories: entry.calories,
      date: entry.date,
      created_at: entry.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('entries')
      .insert(snakeCaseEntry)
      .select()
      .single();

    if (error) throw error;

    // Повертаємо об'єкт у camelCase
    return {
      id: data.id,
      user_id: data.user_id,
      productId: data.product_id,
      productName: data.product_name,
      grams: data.grams,
      calories: data.calories,
      date: data.date,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
}

export async function deleteEntry(entryId) {
  try {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}

// Calorie Goals
export async function getCalorieGoal(user_id, date) {
  try {
    if (!user_id) {
      console.warn('getCalorieGoal called without user_id');
      return null;
    }

    const { data, error } = await supabase
      .from('calorie_goals')
      .select('*')
      .eq('user_id', user_id)
      .order('start_date', { ascending: false });

    if (error) throw error;

    // Перетворимо дані в camelCase
    const goals = data.map(goal => ({
      id: goal.id,
      user_id: goal.user_id,
      value: goal.value,
      startDate: goal.start_date,
      createdAt: goal.created_at
    }));

    if (goals.length === 0) return null;

    if (date) {
      const selectedDate = new Date(date).getTime();

      // Знайдемо останню ціль, встановлену до вибраної дати
      for (const goal of goals) {
        const goalDate = new Date(goal.startDate).setHours(0, 0, 0, 0);
        if (goalDate <= selectedDate) {
          return goal.value;
        }
      }

      return null;
    }

    // Повертаємо найновішу ціль
    return goals[0].value;
  } catch (error) {
    console.error('Error getting calorie goal:', error);
    throw error;
  }
}

export async function getCalorieGoalHistory(user_id) {
  try {
    if (!user_id) {
      console.warn('getCalorieGoalHistory called without user_id');
      return { history: [], current: null };
    }

    const { data, error } = await supabase
      .from('calorie_goals')
      .select('*')
      .eq('user_id', user_id)
      .order('start_date', { ascending: false });

    if (error) throw error;

    // Перетворимо дані в camelCase
    const goals = data.map(goal => ({
      id: goal.id,
      user_id: goal.user_id,
      value: goal.value,
      startDate: goal.start_date,
      createdAt: goal.created_at
    }));

    return {
      history: goals,
      current: goals.length > 0 ? goals[0].value : null
    };
  } catch (error) {
    console.error('Error getting calorie goal history:', error);
    throw error;
  }
}

export async function setCalorieGoal(user_id, value) {
  try {
    if (!user_id) {
      throw new Error('setCalorieGoal called without user_id');
    }

    const newGoal = {
      id: generateId(),
      user_id: user_id,
      value: value,
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('calorie_goals')
      .insert(newGoal)
      .select()
      .single();

    if (error) throw error;

    // Повертаємо дані в camelCase
    return {
      id: data.id,
      user_id: data.user_id,
      value: data.value,
      startDate: data.start_date,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error setting calorie goal:', error);
    throw error;
  }
}

// Функція для підписки на реальночасові оновлення
export function subscribeToRealTimeUpdates(user_id, callbacks = {}) {
  if (!user_id) return () => { };

  console.log('Subscribing to real-time updates for user:', user_id);

  // Підписка на зміни в продуктах
  const productsChannel = supabase
    .channel('products-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'products',
      filter: `user_id=eq.${user_id}`
    }, (payload) => {
      console.log('Products change:', payload);
      if (callbacks.onProductsChange) callbacks.onProductsChange(payload);
    })
    .subscribe();

  // Підписка на зміни в записах
  const entriesChannel = supabase
    .channel('entries-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'entries',
      filter: `user_id=eq.${user_id}`
    }, (payload) => {
      console.log('Entries change:', payload);
      if (callbacks.onEntriesChange) callbacks.onEntriesChange(payload);
    })
    .subscribe();

  // Підписка на зміни в цілях
  const goalsChannel = supabase
    .channel('goals-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'calorie_goals',
      filter: `user_id=eq.${user_id}`
    }, (payload) => {
      console.log('Goals change:', payload);
      if (callbacks.onGoalsChange) callbacks.onGoalsChange(payload);
    })
    .subscribe();

  // Повертаємо функцію для відписки
  return () => {
    productsChannel.unsubscribe();
    entriesChannel.unsubscribe();
    goalsChannel.unsubscribe();
  };
}