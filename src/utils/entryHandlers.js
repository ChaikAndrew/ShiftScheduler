// import { DateTime } from "luxon";
// import { calculateWorkTime } from "./timeCalculations";
// import {
//   isValidFirstShiftTime,
//   isValidSecondShiftTime,
//   isValidThirdShiftTime,
// } from "./validateShiftTime";
// // import { recalculateDowntime } from "./recalculateDowntime";

// import {
//   saveEntryToDB,
//   updateEntryInDB,
//   deleteEntryFromDB,
//   getEntriesFromDB,
// } from "../utils/api/shiftApi";

// /**
//  * Обробляє збереження запису для вибраної зміни.
//  *
//  * @param {Object} form - Об'єкт з інформацією про запис.
//  * @param {string} currentShift - Поточна зміна (first, second, third).
//  * @param {string} selectedDate - Обрана дата.
//  * @param {string} selectedLeader - Обраний лідер.
//  * @param {string} selectedMachine - Обрана машина.
//  * @param {string} selectedOperator - Обраний оператор.
//  * @param {Object} entries - Поточні записи.
//  * @param {Function} setEntries - Функція для оновлення стану entries.
//  * @param {Function} setEditingIndex - Функція для скидання індексу редагування.
//  * @param {Function} setForm - Функція для скидання форми після збереження.
//  * @param {number|null} editingIndex - Індекс редагованого запису.
//  * @returns {void}
//  */

// export async function handleSaveEntryToDB({
//   form,
//   currentShift,
//   selectedDate,
//   selectedLeader,
//   selectedMachine,
//   selectedOperator,
//   setForm,
//   editingIndex,
//   editingEntryId, // якщо редагування
//   token,
//   onSuccess,
// }) {
//   const startTime = `${selectedDate}T${form.startTime}`;
//   const endTime = `${selectedDate}T${form.endTime}`;

//   if (
//     (currentShift === "first" && !isValidFirstShiftTime(startTime, endTime)) ||
//     (currentShift === "second" &&
//       !isValidSecondShiftTime(startTime, endTime)) ||
//     (currentShift === "third" && !isValidThirdShiftTime(startTime, endTime))
//   ) {
//     console.error("⛔ Invalid time for shift!");
//     return;
//   }

//   const { workingTime, initialDowntime, shift } = calculateWorkTime(
//     startTime,
//     endTime
//   );

//   const entryData = {
//     shift,
//     machine: selectedMachine,
//     date: selectedDate,
//     displayDate: selectedDate,
//     startTime,
//     endTime,
//     workingTime,
//     downtime: initialDowntime,
//     initialDowntime,
//     leader: selectedLeader,
//     operator: selectedOperator,
//     task: form.task === "Zlecenie" ? form.customTaskName : form.task,
//     product: form.product,
//     color: form.color,
//     reason: form.reason,
//     quantity: parseInt(form.quantity, 10),
//   };

//   try {
//     if (editingIndex !== null && editingEntryId) {
//       const response = await updateEntryInDB(editingEntryId, entryData, token);
//       console.log("✅ Updated entry:", response.data);
//     } else {
//       const response = await saveEntryToDB(entryData, token);
//       console.log("✅ Added entry:", response.data);
//     }

//     setForm({
//       startTime: "",
//       endTime: "",
//       task: "",
//       customTaskName: "",
//       product: "",
//       color: "",
//       reason: "",
//       quantity: 0,
//     });

//     if (onSuccess) onSuccess();
//   } catch (err) {
//     console.error("❌ Error saving entry:", err.response?.data || err.message);
//   }
// }
import { DateTime } from "luxon";
import { calculateWorkTime } from "./timeCalculations";
import {
  isValidFirstShiftTime,
  isValidSecondShiftTime,
  isValidThirdShiftTime,
} from "./validateShiftTime";

import { saveEntryToDB, updateEntryInDB } from "../utils/api/shiftApi";

/**
 * Обробляє збереження запису для вибраної зміни.
 *
 * @param {Object} form - Об'єкт з інформацією про запис.
 * @param {string} currentShift - Поточна зміна (first, second, third).
 * @param {string} selectedDate - Обрана дата.
 * @param {string} selectedLeader - Обраний лідер.
 * @param {string} selectedMachine - Обрана машина.
 * @param {string} selectedOperator - Обраний оператор.
 * @param {Function} setForm - Функція для скидання форми після збереження.
 * @param {number|null} editingIndex - Індекс редагованого запису.
 * @param {string|null} editingEntryId - ID редагованого запису.
 * @param {string} token - JWT токен користувача.
 * @param {Function} onSuccess - Колбек після успішного збереження.
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
  editingEntryId,
  token,
  onSuccess,
}) {
  // ⏱️ Створюємо об'єкти Luxon з UTC-зоною
  const start = DateTime.fromISO(`${selectedDate}T${form.startTime}`, {
    zone: "utc",
  });
  const end = DateTime.fromISO(`${selectedDate}T${form.endTime}`, {
    zone: "utc",
  });

  // 🛡️ Перевірка часу для обраної зміни
  if (
    (currentShift === "first" &&
      !isValidFirstShiftTime(start.toISO(), end.toISO())) ||
    (currentShift === "second" &&
      !isValidSecondShiftTime(start.toISO(), end.toISO())) ||
    (currentShift === "third" &&
      !isValidThirdShiftTime(start.toISO(), end.toISO()))
  ) {
    console.error("⛔ Invalid time for shift!");
    return;
  }

  // 🧮 Обрахунок робочого часу та простою
  const { workingTime, initialDowntime, shift } = calculateWorkTime(start, end);

  // 📝 Формуємо дані запису
  const entryData = {
    shift,
    machine: selectedMachine,
    date: selectedDate,
    displayDate: selectedDate,
    startTime: start.toISO(),
    endTime: end.toISO(),
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

    // 🧼 Очищення форми після збереження
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
