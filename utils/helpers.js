// Format date to display in a readable format
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

// Add days to a date (positive or negative)
export function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Generate a random ID
export function generateId() {
  return crypto.randomUUID();
}

// Calculate calories from grams and per 100g
export function calculateCalories(grams, caloriesPer100g) {
  return Math.round((caloriesPer100g * grams) / 100);
}

// Format number with commas
export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Limit string length with ellipsis
export function truncateString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

// Detect dark mode preference
export function prefersDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Add event listener for dark mode changes
export function onDarkModeChange(callback) {
  if (!window.matchMedia) return;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}