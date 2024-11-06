/**
 * Форматує кількість хвилин у вигляді годин:хвилин (hh:mm).
 *
 * @param {number} minutes - Кількість хвилин, які потрібно відформатувати.
 * @returns {string} - Час у вигляді рядка, наприклад, "02:30".
 */
export function formatTime(minutes) {
  if (isNaN(minutes)) return; // Значення за замовчуванням для NaN
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
