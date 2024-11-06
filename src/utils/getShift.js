/**
 * Визначає зміну на основі переданого часу.
 *
 * @param {DateTime} time - Об'єкт часу з бібліотеки Luxon.
 * @returns {string} - Назва зміни: "first", "second" або "third".
 */
export function getShiftByTime(time) {
  const hour = time.hour;
  if (hour >= 6 && hour < 14) return "first";
  if (hour >= 14 && hour < 22) return "second";
  return "third";
}
