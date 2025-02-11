import { DateTime } from "luxon";
import { recalculateDowntime } from "./recalculateDowntime";

/**
 * Перевіряє, чи дата запису відповідає вибраній даті.
 * @param {string} entryDate - Дата запису.
 * @param {string} selectedDate - Вибрана дата.
 * @returns {boolean} - true, якщо дати збігаються.
 */
const isDateMatching = (entryDate, selectedDate) => {
  const entry = DateTime.fromISO(entryDate).toISODate();
  const selected = DateTime.fromISO(selectedDate).toISODate();
  return entry === selected;
};

/**
 * Оновлює активну зміну, скидаючи вибраного лідера, машину та оператора.
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
 * Ініціює редагування запису.
 */

export function handleEditEntry(
  filteredIndex,
  entries,
  currentShift,
  selectedMachine,
  setForm,
  setEditingIndex,
  setError,
  selectedDate
) {
  console.group("✏️ handleEditEntry Process");
  console.log("Filtered Index:", filteredIndex);
  console.log("Current Shift:", currentShift);
  console.log("Selected Machine:", selectedMachine);
  console.log("Selected Date:", selectedDate);

  const shiftMachineEntries = entries[currentShift]?.[selectedMachine] || [];
  const filteredEntries = shiftMachineEntries.filter((entry) =>
    isDateMatching(entry.date, selectedDate)
  );

  console.log("Filtered Entries for Date:", filteredEntries);

  const entry = filteredEntries[filteredIndex];
  const originalIndex = shiftMachineEntries.findIndex((e) => e === entry);

  if (!entry) {
    console.error("❌ Entry not found for the selected date.");
    setError("Entry not found for the selected date.");
    console.groupEnd();
    return;
  }

  console.log("Original Index:", originalIndex);

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

  setEditingIndex(originalIndex);
  setError("");
  console.log("Editing entry:", entry);
  console.groupEnd();
}
/**
 * Видаляє запис і перераховує простій.
 */
export function handleDeleteEntry(
  filteredIndex,
  entries,
  currentShift,
  selectedMachine,
  setEntries,
  selectedDate
) {
  console.group("🗑️ handleDeleteEntry Process");
  console.log("Filtered Index:", filteredIndex);
  console.log("Current Shift:", currentShift);
  console.log("Selected Machine:", selectedMachine);
  console.log("Selected Date:", selectedDate);

  const updatedEntries = { ...entries };
  const machineEntries = updatedEntries[currentShift]?.[selectedMachine] || [];

  const filteredEntries = machineEntries.filter((entry) =>
    isDateMatching(entry.date, selectedDate)
  );
  console.log("Filtered Entries for Date:", filteredEntries);

  const entry = filteredEntries[filteredIndex];
  const entryIndex = machineEntries.findIndex((e) => e === entry);

  if (entryIndex !== -1) {
    const entryToDelete = machineEntries[entryIndex];
    console.log("Deleting Entry:", entryToDelete);

    updatedEntries[currentShift][selectedMachine] = machineEntries.filter(
      (e) => e !== entryToDelete
    );

    const recalculatedEntries = recalculateDowntime(
      updatedEntries,
      currentShift,
      selectedMachine
    );

    console.log(
      "Recalculated Entries with updated downtime:",
      JSON.stringify(recalculatedEntries, null, 2)
    );

    setEntries(recalculatedEntries);
  } else {
    console.error("❌ Invalid index for deletion.");
  }
  console.groupEnd();
}
