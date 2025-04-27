module.exports = {
  globDirectory: './',
  globPatterns: [
    '**/*.{html,js,css,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}'
  ],
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/
  ],
  swDest: 'sw.js',
  runtimeCaching: [{
    urlPattern: /^https:\/\/fonts\.googleapis\.com/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'google-fonts-stylesheets',
    },
  }, {
    urlPattern: /^https:\/\/fonts\.gstatic\.com/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      },
    },
  }, {
    urlPattern: /^https:\/\/cdn\.jsdelivr\.net/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'jsdelivr-cdn',
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 50,
      },
    },
  }, {
    // Cache Supabase API responses
    urlPattern: ({url}) => url.origin.includes('supabase.co'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-api',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 5, // 5 minutes
      },
      networkTimeoutSeconds: 10,
    },
  }],
};