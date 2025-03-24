import { DateTime } from "luxon";
import { calculateWorkTime } from "./timeCalculations";
import {
  isValidFirstShiftTime,
  isValidSecondShiftTime,
  isValidThirdShiftTime,
} from "./validateShiftTime";
// import { recalculateDowntime } from "./recalculateDowntime";

import {
  saveEntryToDB,
  updateEntryInDB,
  deleteEntryFromDB,
  getEntriesFromDB,
} from "../utils/api/shiftApi";

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

export async function handleSaveEntryToDB({
  form,
  currentShift,
  selectedDate,
  selectedLeader,
  selectedMachine,
  selectedOperator,
  setForm,
  editingIndex,
  editingEntryId, // якщо редагування
  token,
  onSuccess,
}) {
  const startTime = `${selectedDate}T${form.startTime}`;
  const endTime = `${selectedDate}T${form.endTime}`;

  if (
    (currentShift === "first" && !isValidFirstShiftTime(startTime, endTime)) ||
    (currentShift === "second" &&
      !isValidSecondShiftTime(startTime, endTime)) ||
    (currentShift === "third" && !isValidThirdShiftTime(startTime, endTime))
  ) {
    console.error("⛔ Invalid time for shift!");
    return;
  }

  const { workingTime, initialDowntime, shift } = calculateWorkTime(
    startTime,
    endTime
  );

  const entryData = {
    shift,
    machine: selectedMachine,
    date: selectedDate,
    displayDate: selectedDate,
    startTime,
    endTime,
    workingTime,
    downtime: initialDowntime,
    initialDowntime,
    leader: selectedLeader,
    operator: selectedOperator,
    task: form.task === "Zlecenie" ? form.customTaskName : form.task,
    product: form.product,
    color: form.color,
    reason: form.reason,
    quantity: parseInt(form.quantity, 10),
  };

  try {
    if (editingIndex !== null && editingEntryId) {
      const response = await updateEntryInDB(editingEntryId, entryData, token);
      console.log("✅ Updated entry:", response.data);
    } else {
      const response = await saveEntryToDB(entryData, token);
      console.log("✅ Added entry:", response.data);
    }

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

    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("❌ Error saving entry:", err.response?.data || err.message);
  }
}

// export function handleSaveEntry({
//   form,
//   currentShift,
//   selectedDate,
//   selectedLeader,
//   selectedMachine,
//   selectedOperator,
//   entries,
//   setEntries,
//   setEditingIndex,
//   setForm,
//   editingIndex,
// }) {
//   console.group("⚙️ handleSaveEntry Process");
//   console.log("Form data:", form);
//   console.log("Current Shift:", currentShift);
//   console.log("Selected Date:", selectedDate);
//   console.log("Editing Index:", editingIndex);

//   let startTime = DateTime.fromISO(`${selectedDate}T${form.startTime}`);
//   let endTime = DateTime.fromISO(`${selectedDate}T${form.endTime}`);

//   // ✅ Коригуємо дату для третьої зміни, якщо час початку або кінця між 00:00 і 06:00
//   if (currentShift === "third") {
//     // Якщо годину <= 6 і дата запису вже відповідає вибраній, не коригуємо дату назад
//     if (
//       startTime.hour <= 6 &&
//       DateTime.fromISO(selectedDate).toISODate() !== startTime.toISODate()
//     ) {
//       startTime = startTime.minus({ days: 1 });
//     }
//   }

//   console.log("Start Time (ISO):", startTime.toISO());
//   console.log("End Time (ISO):", endTime.toISO());
//   console.log("Display Date (Adjusted for Third Shift):", selectedDate);

//   if (
//     (currentShift === "first" &&
//       !isValidFirstShiftTime(startTime.toISO(), endTime.toISO())) ||
//     (currentShift === "second" &&
//       !isValidSecondShiftTime(startTime.toISO(), endTime.toISO())) ||
//     (currentShift === "third" &&
//       !isValidThirdShiftTime(startTime.toISO(), endTime.toISO()))
//   ) {
//     console.error("❌ Invalid shift time.");
//     console.groupEnd();
//     return;
//   }

//   const updatedEntries = { ...entries };
//   if (!updatedEntries[currentShift]) updatedEntries[currentShift] = {};
//   if (!updatedEntries[currentShift][selectedMachine])
//     updatedEntries[currentShift][selectedMachine] = [];

//   const shiftMachineEntries = updatedEntries[currentShift][selectedMachine];
//   console.log("Current Shift Machine Entries:", shiftMachineEntries);

//   const displayDate = startTime.toISODate();
//   console.log("Final Display Date:", displayDate);

//   const newEntry = {
//     ...calculateWorkTime(startTime.toISO(), endTime.toISO()),
//     startTime: startTime.toISO(),
//     endTime: endTime.toISO(),
//     leader: selectedLeader,
//     date: displayDate,
//     displayDate: displayDate,
//     machine: selectedMachine,
//     operator: selectedOperator,
//     task: form.task === "Zlecenie" ? form.customTaskName : form.task,
//     product: form.product,
//     color: form.color,
//     reason: form.reason,
//     quantity: parseInt(form.quantity, 10),
//     shift: currentShift,
//   };

//   if (editingIndex !== null) {
//     console.log("📝 Updating entry at index:", editingIndex);
//     console.log("Old Entry:", shiftMachineEntries[editingIndex]);
//     shiftMachineEntries[editingIndex] = newEntry;
//     console.log("Updated Entry:", newEntry);
//     setEditingIndex(null);
//   } else {
//     console.log("➕ Adding new entry:", newEntry);
//     shiftMachineEntries.push(newEntry);
//   }

//   updatedEntries[currentShift][selectedMachine] = shiftMachineEntries;
//   console.log("Entries after update:", updatedEntries);

//   const recalculatedEntries = recalculateDowntime(
//     updatedEntries,
//     currentShift,
//     selectedMachine
//   );
//   console.log("Recalculated Entries with Downtime:", recalculatedEntries);

//   setEntries(recalculatedEntries);

//   setForm({
//     startTime: "",
//     endTime: "",
//     task: "",
//     customTaskName: "",
//     product: "",
//     color: "",
//     reason: "",
//     quantity: 0,
//   });

//   console.log("Form cleared after save.");
//   console.groupEnd();
// }
