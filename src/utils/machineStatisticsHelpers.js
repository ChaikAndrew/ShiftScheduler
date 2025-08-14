/**
 * Повертає статистику по кожній машині для обраної дати та зміни.
 *
 * @param {Object} entries - Об'єкт з усіма записами, структурований за змінами.
 * @param {string[]} machines - Список доступних машин.
 * @param {string} selectedDate - Обрана дата у форматі 'YYYY-MM-DD'.
 * @param {string} selectedShift - Назва обраної зміни (first, second, third).
 * @returns {Array<Object>} Масив статистики по кожній машині, де є дані.
 *
 * Кожен об'єкт у масиві містить:
 * - machine: назва машини
 * - totalQuantity: загальна кількість виконаних завдань
 * - workingTime: загальний робочий час
 * - downtime: загальний час простою
 * - downtimeReasons: об'єкт з причинами простою та їх тривалістю
 * - POD, POF, Zlecenie, Test: кількість кожного типу завдань
 * - products: { [productName]: summedQuantity }
 */
export const getMachineStatistics = (
  entries,
  machines,
  selectedDate,
  selectedShift
) => {
  if (!selectedDate || !selectedShift || !machines?.length) return [];

  // Отримуємо записи для обраної зміни
  const shiftEntries = entries?.[selectedShift] || {};

  // Перевіряємо, чи є записи для машин
  if (!Object.keys(shiftEntries).length) return []; // Якщо нема записів, повертаємо порожній масив

  const statistics = machines.map((machine) => {
    const machineEntries =
      shiftEntries[machine]?.filter(
        (entry) => entry.displayDate === selectedDate // Перевіряємо дату
      ) || [];

    // Якщо записів для машини нема, пропускаємо
    if (!machineEntries.length) return null;

    const taskSummary = { POD: 0, POF: 0, Zlecenie: 0, Test: 0 };
    let totalQuantity = 0;
    let workingTime = 0;
    let downtime = 0;
    const downtimeReasons = {};
    const products = {}; // 👈 Агрегація продуктів (не впливає на існуючу логіку)

    machineEntries.forEach((entry) => {
      const task = entry.task;
      const quantity = parseInt(entry.quantity, 10) || 0;
      const entryWorkingTime = parseInt(entry.workingTime, 10) || 0;
      const entryDowntime = parseInt(entry.downtime, 10) || 0;
      const reasonDescription = entry.reason || "Unknown";

      // 👇 збір продуктів
      const prod = (entry.product ?? "").toString().trim();
      if (prod) products[prod] = (products[prod] || 0) + quantity;

      if (task in taskSummary) {
        taskSummary[task] += quantity;
      }

      totalQuantity += quantity;
      workingTime += entryWorkingTime;
      downtime += entryDowntime;

      if (entryDowntime > 0) {
        downtimeReasons[reasonDescription] =
          (downtimeReasons[reasonDescription] || 0) + entryDowntime;
      }
      console.log("📊 MACHINE ENTRIES:", machineEntries);
      console.log("⏱️ TOTAL downtime:", downtime);
      console.log("📋 REASONS:", downtimeReasons);
    });

    return {
      machine,
      totalQuantity,
      workingTime,
      downtime,
      downtimeReasons,
      products, // 👈 додано
      ...taskSummary,
    };
  });

  // Видаляємо машини без даних
  return statistics.filter(
    (stat) => stat !== null && (stat.totalQuantity > 0 || stat.downtime > 0)
  );
};
