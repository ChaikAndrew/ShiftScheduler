import { DateTime } from "luxon";
import { recalculateDowntime } from "./recalculateDowntime";

/**
 * Оновлює активну зміну, скидаючи вибраного лідера, машину та оператора.
 * @param {string} shift - Назва зміни.
 * @param {Function} setCurrentShift - Функція для оновлення поточної зміни.
 * @param {Function} setSelectedLeader - Функція для оновлення обраного лідера.
 * @param {Function} setSelectedMachine - Функція для оновлення обраної машини.
 * @param {Function} setSelectedOperator - Функція для оновлення обраного оператора.
 */
export function handleShiftChange(
  shift,
  setCurrentShift,
  setSelectedLeader,
  setSelectedMachine,
  setSelectedOperator
) {
  setCurrentShift(shift);
  setSelectedLeader("");
  setSelectedMachine("");
  setSelectedOperator("");
}

/**
 * Оновлює вибрану дату, скидаючи активну зміну, лідера, машину та оператора.
 * @param {string} date - Вибрана дата.
 * @param {Function} setSelectedDate - Функція для оновлення вибраної дати.
 * @param {Function} setCurrentShift - Функція для оновлення поточної зміни.
 * @param {Function} setSelectedLeader - Функція для оновлення обраного лідера.
 * @param {Function} setSelectedMachine - Функція для оновлення обраної машини.
 * @param {Function} setSelectedOperator - Функція для оновлення обраного оператора.
 */
export function handleDateChange(
  date,
  setSelectedDate,
  setCurrentShift,
  setSelectedLeader,
  setSelectedMachine,
  setSelectedOperator
) {
  setSelectedDate(date);
  setCurrentShift("");
  setSelectedLeader("");
  setSelectedMachine("");
  setSelectedOperator("");
}

/**
 * Ініціює редагування запису, заповнюючи форму даними вибраного запису.
 * @param {number} index - Індекс запису для редагування.
 * @param {Object} entries - Об'єкт записів.
 * @param {string} currentShift - Поточна зміна.
 * @param {string} selectedMachine - Обрана машина.
 * @param {Function} setForm - Функція для оновлення форми.
 * @param {Function} setEditingIndex - Функція для оновлення індексу редагування.
 * @param {Function} setError - Функція для встановлення помилок.
 */
export function handleEditEntry(
  index,
  entries,
  currentShift,
  selectedMachine,
  setForm,
  setEditingIndex,
  setError
) {
  const shiftMachineEntries = entries[currentShift][selectedMachine] || [];
  const entry = shiftMachineEntries[index];
  setForm({
    startTime: DateTime.fromISO(entry.startTime).toFormat("HH:mm"),
    endTime: DateTime.fromISO(entry.endTime).toFormat("HH:mm"),
    task: entry.task === entry.customTaskName ? "Zlecenie" : entry.task,
    customTaskName: entry.task === entry.customTaskName ? entry.task : "",
    product: entry.product,
    color: entry.color,
    reason: entry.reason,
    quantity: entry.quantity,
  });
  setEditingIndex(index);
  setError("");
}

/**
 * Видаляє запис із обраної зміни та машини.
 * @param {number} index - Індекс запису для видалення.
 * @param {Object} entries - Поточні записи.
 * @param {string} currentShift - Поточна зміна.
 * @param {string} selectedMachine - Обрана машина.
 * @param {Function} setEntries - Функція для оновлення записів.
 */
export function handleDeleteEntry(
  index,
  entries,
  currentShift,
  selectedMachine,
  setEntries
) {
  const updatedEntries = { ...entries };
  updatedEntries[currentShift][selectedMachine].splice(index, 1);
  setEntries(
    recalculateDowntime(updatedEntries, currentShift, selectedMachine)
  );
}
