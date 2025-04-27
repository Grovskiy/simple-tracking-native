import { registerSW } from 'virtual:pwa-register';

// Створюємо функцію оновлення Service Worker з перезавантаженням
export function setupPWA() {
    // Ця функція викликається на кожному оновленні SW
    const updateSW = registerSW({
        onNeedRefresh() {
            // Показати повідомлення з пропозицією оновити сторінку
            if (confirm('Доступна нова версія. Оновити?')) {
                updateSW(true);
            }
        },
        onOfflineReady() {
            console.log('Застосунок готовий для офлайн використання');
        },
        immediate: true
    });
}