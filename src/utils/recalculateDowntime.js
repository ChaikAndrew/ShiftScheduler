import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";

/**
 * Парсить ISO-час для третьої зміни.
 * Якщо час < 6:00 — вважаємо його наступним днем, щоб уникнути плутанини в сортуванні.
 */
const parseDateTimeForThirdShift = (dateTimeStr) => {
  const dt = DateTime.fromISO(dateTimeStr, { zone: "utc" });
  return dt.hour < 6 ? dt.plus({ days: 1 }) : dt;
};

/**
 * Перераховує час простою (downtime) для кожної дати окремо.
 *
 * @param {Object} updatedEntries - Оновлені записи змін.
 * @param {string} currentShift - Поточна зміна ("first", "second", "third").
 * @param {string} selectedMachine - Обрана машина.
 * @returns {Object} - Оновлені записи з перерахованим простоєм.
 */
export function recalculateDowntime(
  updatedEntries,
  currentShift,
  selectedMachine
) {
  const shiftEntries = updatedEntries[currentShift][selectedMachine] || [];

  // Групуємо записи по даті (з ISO startTime)
  const entriesByDate = shiftEntries.reduce((acc, entry) => {
    const date = DateTime.fromISO(entry.startTime, { zone: "utc" }).toISODate();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  // Обробка кожної дати окремо
  Object.keys(entriesByDate).forEach((date) => {
    let entriesForDate = entriesByDate[date];

    // Видаляємо порожні записи
    entriesForDate = entriesForDate.filter(
      (entry) => entry.startTime && entry.endTime
    );

    // Сортування з урахуванням нічної зміни
    entriesForDate.sort((a, b) => {
      const timeA =
        currentShift === "third"
          ? parseDateTimeForThirdShift(a.startTime)
          : DateTime.fromISO(a.startTime, { zone: "utc" });

      const timeB =
        currentShift === "third"
          ? parseDateTimeForThirdShift(b.startTime)
          : DateTime.fromISO(b.startTime, { zone: "utc" });

      return timeA - timeB;
    });

    // Розрахунок downtime
    entriesByDate[date] = entriesForDate.map((entry, index) => {
      try {
        const startTime =
          currentShift === "third"
            ? parseDateTimeForThirdShift(entry.startTime)
            : DateTime.fromISO(entry.startTime, { zone: "utc" });

        const shiftStart = DateTime.fromISO(
          `${date}T${shiftStartTimes[currentShift]}`,
          { zone: "utc" }
        );

        if (index === 0) {
          // Перший запис: downtime від початку зміни
          const downtime = Math.round(
            startTime.diff(shiftStart, "minutes").minutes
          );
          entry.downtime = Math.max(downtime, 0);
        } else {
          // Наступні записи — від кінця попереднього
          const prevEnd =
            currentShift === "third"
              ? parseDateTimeForThirdShift(entriesForDate[index - 1].endTime)
              : DateTime.fromISO(entriesForDate[index - 1].endTime, {
                  zone: "utc",
                });

          const downtime = Interval.fromDateTimes(prevEnd, startTime).length(
            "minutes"
          );
          entry.downtime = Math.max(Math.round(downtime), 0);
        }
      } catch (err) {
        console.warn("⚠️ Помилка в обчисленні downtime:", err.message);
        entry.downtime = 0;
      }

      return entry;
    });
  });

  // Об'єднуємо всі дати назад
  const recalculatedEntries = Object.values(entriesByDate).flat();

  return {
    ...updatedEntries,
    [currentShift]: {
      ...updatedEntries[currentShift],
      [selectedMachine]: recalculatedEntries,
    },
  };
}
