import { DateTime } from "luxon";
import { calculateWorkTime } from "./timeCalculations";
import {
  isValidFirstShiftTime,
  isValidSecondShiftTime,
  isValidThirdShiftTime,
} from "./validateShiftTime";
import { recalculateDowntime } from "./recalculateDowntime";

/**
 * Обробляє збереження запису для вибраної зміни.
 *
 * @param {Object} form - Об'єкт з інформацією про запис.
 * @param {string} currentShift - Поточна зміна (first, second, third).
 * @param {string} selectedDate - Обрана дата.
 * @param {string} selectedLeader - Обраний лідер.
 * @param {string} selectedMachine - Обрана машина.
 * @param {string} selectedOperator - Обраний оператор.
 * @param {Object} entries - Поточні записи.
 * @param {Function} setEntries - Функція для оновлення стану entries.
 * @param {Function} setEditingIndex - Функція для скидання індексу редагування.
 * @param {Function} setForm - Функція для скидання форми після збереження.
 * @param {number|null} editingIndex - Індекс редагованого запису.
 * @returns {void}
 */

export function handleSaveEntry({
  form,
  currentShift,
  selectedDate,
  selectedLeader,
  selectedMachine,
  selectedOperator,
  entries,
  setEntries,
  setEditingIndex,
  setForm,
  editingIndex,
}) {
  let startTime = DateTime.fromISO(`${selectedDate}T${form.startTime}`);
  if (currentShift === "third" && startTime.hour <= 6) {
    startTime = startTime.plus({ days: 1 });
  }

  let endTime = DateTime.fromISO(`${selectedDate}T${form.endTime}`);
  if (endTime < startTime) {
    endTime = endTime.plus({ days: 1 });
  }

  // Виконуємо перевірку залежно від поточної зміни
  if (
    (currentShift === "first" &&
      !isValidFirstShiftTime(startTime.toISO(), endTime.toISO())) ||
    (currentShift === "second" &&
      !isValidSecondShiftTime(startTime.toISO(), endTime.toISO())) ||
    (currentShift === "third" &&
      !isValidThirdShiftTime(startTime.toISO(), endTime.toISO()))
  ) {
    return;
  }

  const updatedEntries = { ...entries };
  if (!updatedEntries[currentShift]) updatedEntries[currentShift] = {};
  if (!updatedEntries[currentShift][selectedMachine])
    updatedEntries[currentShift][selectedMachine] = [];

  const displayDate =
    currentShift === "third" && startTime.hour < 6
      ? DateTime.fromISO(selectedDate).toISODate()
      : selectedDate;

  const newEntry = calculateWorkTime(startTime.toISO(), endTime.toISO());
  newEntry.startTime = startTime.toISO();
  newEntry.endTime = endTime.toISO();
  newEntry.leader = selectedLeader;
  newEntry.date = displayDate;
  newEntry.displayDate = displayDate;
  newEntry.machine = selectedMachine;
  newEntry.operator = selectedOperator;
  newEntry.task = form.task === "Zlecenie" ? form.customTaskName : form.task;
  newEntry.product = form.product;
  newEntry.color = form.color;
  newEntry.reason = form.reason;
  newEntry.quantity = parseInt(form.quantity, 10);
  newEntry.shift = currentShift;

  if (editingIndex !== null) {
    // Якщо редагуємо запис, оновлюємо його на відповідному індексі
    updatedEntries[currentShift][selectedMachine][editingIndex] = newEntry;
    setEditingIndex(null);
  } else {
    // Додаємо новий запис
    updatedEntries[currentShift][selectedMachine] = [
      ...updatedEntries[currentShift][selectedMachine],
      newEntry,
    ];
  }

  // Перераховуємо час простою після збереження
  setEntries(
    recalculateDowntime(updatedEntries, currentShift, selectedMachine)
  );

  // Скидаємо форму після збереження
  setForm({
    startTime: "",
    endTime: "",
    task: "",
    customTaskName: "",
    product: "",
    color: "",
    reason: "",
    quantity: 0,
  });
}
