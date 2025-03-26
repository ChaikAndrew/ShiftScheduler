import { DateTime } from "luxon";
import { recalculateDowntime } from "./recalculateDowntime";
import { deleteEntryFromDB, getEntriesFromDB } from "../utils/api/shiftApi";

/**
 * Перевіряє, чи дата запису відповідає вибраній даті.
 * @param {string} entryDate - Дата запису.
 * @param {string} selectedDate - Вибрана дата.
 * @returns {boolean} - true, якщо дати збігаються.
 */
const isDateMatching = (entryDate, selectedDate) => {
  const entry = DateTime.fromISO(entryDate, { zone: "utc" }).toISODate();
  const selected = DateTime.fromISO(selectedDate, { zone: "utc" }).toISODate();
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
  setEditingEntryId,
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

  // 🟢 Корекція дати для третьої зміни
  let displayDate = entry.date;
  if (
    currentShift === "third" &&
    DateTime.fromISO(entry.startTime, { zone: "utc" }).hour <= 6
  ) {
    displayDate = DateTime.fromISO(entry.startTime, { zone: "utc" })
      .minus({ days: 1 })
      .toISODate();
    console.log("Corrected Date for Third Shift:", displayDate);
  }

  console.log("Original Index:", originalIndex);

  setForm({
    startTime: DateTime.fromISO(entry.startTime, { zone: "utc" }).toFormat(
      "HH:mm"
    ),
    endTime: DateTime.fromISO(entry.endTime, { zone: "utc" }).toFormat("HH:mm"),
    task: entry.task === entry.customTaskName ? "Zlecenie" : entry.task,
    customTaskName: entry.task === entry.customTaskName ? entry.task : "",
    product: entry.product,
    color: entry.color,
    reason: entry.reason,
    quantity: entry.quantity,
  });

  setEditingIndex(originalIndex);
  setEditingEntryId(entry._id); // ⬅️ ось головне!
  setError("");
  console.log("Editing entry:", entry);
  console.groupEnd();
}
/**
 * Видаляє запис і перераховує простій.
 */
export async function handleDeleteEntry(
  filteredIndex,
  entries,
  currentShift,
  selectedMachine,
  setEntries,
  selectedDate,
  token
) {
  console.group("🗑️ handleDeleteEntryFromDB");
  console.log("Filtered Index:", filteredIndex);
  console.log("Current Shift:", currentShift);
  console.log("Selected Machine:", selectedMachine);
  console.log("Selected Date:", selectedDate);

  const machineEntries = entries[currentShift]?.[selectedMachine] || [];

  const filteredEntries = machineEntries.filter((entry) =>
    isDateMatching(entry.date, selectedDate)
  );

  const entryToDelete = filteredEntries[filteredIndex];
  const entryId = entryToDelete?._id;

  if (!entryId) {
    console.error("❌ Entry ID not found for deletion.");
    return;
  }

  try {
    await deleteEntryFromDB(entryId, token);
    console.log("✅ Entry deleted from MongoDB");

    const response = await getEntriesFromDB(token);
    const dbEntries = response.data;

    const grouped = { first: {}, second: {}, third: {} };
    dbEntries.forEach((entry) => {
      const { shift, machine } = entry;
      if (!grouped[shift][machine]) {
        grouped[shift][machine] = [];
      }
      grouped[shift][machine].push(entry);
    });

    const recalculated = recalculateDowntime(
      grouped,
      currentShift,
      selectedMachine
    );
    setEntries(recalculated);
    console.log("📊 Entries after downtime recalculation:", recalculated);
  } catch (err) {
    console.error("❌ Error deleting entry:", err.message);
  }

  console.groupEnd();
}
