import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

// Initialize Supabase Client
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function signInWithGoogle() {
  // Визначаємо URL для перенаправлення після авторизації
  const redirectUrl = import.meta.env.PROD
    ? `${window.location.origin}/simple-tracking-native`
    : window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const response = await supabase.auth.getUser();

  // Зберігаємо ID користувача в глобальний стан для легкого доступу
  if (response.data && response.data.user) {
    window.appState = window.appState || {};
    window.appState.user_id = response.data.user.id;
    console.log('User ID оновлено через getCurrentUser:', response.data.user.id);
  }

  return response;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    // Оновлюємо глобальний стан при зміні авторизації
    if (session && session.user) {
      window.appState = window.appState || {};
      window.appState.user_id = session.user.id;
      console.log('User ID оновлено через onAuthStateChange:', session.user.id);
    } else if (event === 'SIGNED_OUT') {
      // Видаляємо ID при виході
      if (window.appState) {
        delete window.appState.user_id;
      }
      console.log('User ID видалено після виходу');
    }

    // Викликаємо колбек з правильними параметрами
    callback({ event, session });
  });
}

export function getuser_id() {
  // Спочатку перевіряємо глобальний стан
  if (window.appState && window.appState.user_id) {
    return Promise.resolve(window.appState.user_id);
  }

  // Якщо в глобальному стані немає, отримуємо з сесії
  return supabase.auth.getSession()
    .then(({ data }) => {
      const user_id = data?.session?.user?.id;

      // Якщо знайдено, зберігаємо в глобальний стан
      if (user_id) {
        window.appState = window.appState || {};
        window.appState.user_id = user_id;
        console.log('User ID отримано з сесії:', user_id);
      }

      return user_id;
    });
}