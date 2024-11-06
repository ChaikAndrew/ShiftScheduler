/**
 * Фільтрує записи для поточної зміни, машини та обраної дати.
 *
 * @param {Object} entries - Всі записи по змінах, машинам та датам.
 * @param {string} currentShift - Поточна зміна ("first", "second" або "third").
 * @param {string} selectedMachine - Обрана машина для фільтрації.
 * @param {string} selectedDate - Обрана дата для фільтрації записів.
 * @returns {Array} - Масив відфільтрованих записів для обраної зміни, машини та дати.
 */
export function filterEntries(
  entries,
  currentShift,
  selectedMachine,
  selectedDate
) {
  return (entries[currentShift]?.[selectedMachine] || []).filter(
    (entry) => entry.displayDate === selectedDate
  );
}
