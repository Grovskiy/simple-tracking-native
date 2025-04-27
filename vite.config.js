import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    root: './',
    base: '/simple-tracking-native/',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            }
        }
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    plugins: [
        VitePWA({
            // Режим за замовчуванням
            mode: 'development',
            base: '/simple-tracking-native/',

            // Стратегії для розробки
            devOptions: {
                enabled: true,          // Увімкнути в режимі розробки
                type: 'module',         // Тип SW для розробки
                navigateFallback: '/simple-tracking-native/', // SPA fallback
            },

            // Налаштування для manifest.json
            manifest: false,  // Використовуємо зовнішній manifest.json

            // Налаштування Workbox
            workbox: {
                globDirectory: 'dist',
                globPatterns: [
                    '**/*.{html,js,css,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}'
                ],
                cleanupOutdatedCaches: true,
                sourcemap: true,

                // Різні стратегії для різних типів ресурсів
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-webfonts',
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 рік
                                maxEntries: 30,
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/cdn\.jsdelivr\.net/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'jsdelivr-cdn',
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 днів
                                maxEntries: 50,
                            },
                        },
                    },
                    {
                        // Кешування Supabase API відповідей
                        urlPattern: ({ url }) => url.origin.includes('supabase.co'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'supabase-api',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 5, // 5 хвилин
                            },
                            networkTimeoutSeconds: 10,
                        },
                    }
                ],
            },

            // Надає стратегії оновлення
            strategies: 'generateSW',

            // Реєстрація SW
            injectRegister: 'auto',
            registerType: 'autoUpdate',

            // Ігнорування параметрів URL
            includeAssets: ['favicon.ico'],
        })
    ],
});