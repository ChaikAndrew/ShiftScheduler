import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";

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

  // Групуємо записи по даті
  const entriesByDate = shiftEntries.reduce((acc, entry) => {
    const date = DateTime.fromISO(entry.startTime, { zone: "utc" }).toISODate();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  // Обробка кожної дати окремо
  Object.keys(entriesByDate).forEach((date) => {
    let entriesForDate = entriesByDate[date];

    // ✅ Фільтруємо записи без часу
    entriesForDate = entriesForDate.filter(
      (entry) => entry.startTime && entry.endTime
    );

    // ✅ Сортуємо по startTime
    entriesForDate.sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    entriesByDate[date] = entriesForDate.map((entry, index) => {
      try {
        const startTime = DateTime.fromISO(entry.startTime, { zone: "utc" });
        const shiftStart = DateTime.fromISO(
          `${date}T${shiftStartTimes[currentShift]}`,
          { zone: "utc" }
        );

        if (index === 0) {
          // Перший запис на дату
          if (currentShift === "third") {
            const thirdStart = DateTime.fromISO(`${date}T22:00`, {
              zone: "utc",
            });
            const isAfterMidnight = startTime.hour < 6;

            const trueStart = isAfterMidnight
              ? thirdStart.minus({ days: 1 }) // нічна зміна після півночі
              : thirdStart;

            entry.downtime = Math.max(
              Math.round(startTime.diff(trueStart, "minutes").minutes),
              0
            );
          } else {
            entry.downtime = Math.max(
              Math.round(startTime.diff(shiftStart, "minutes").minutes),
              0
            );
          }
        } else {
          // Наступні записи — рахуємо від попереднього endTime
          const prevEnd = DateTime.fromISO(entriesForDate[index - 1].endTime, {
            zone: "utc",
          });

          let correctedStart = startTime;

          if (currentShift === "third" && correctedStart < prevEnd) {
            correctedStart = correctedStart.plus({ days: 1 });
          }

          const downtime = Interval.fromDateTimes(
            prevEnd,
            correctedStart
          ).length("minutes");

          entry.downtime = Math.max(Math.round(downtime), 0);
        }
      } catch (err) {
        console.warn("⚠️ Помилка в обчисленні downtime:", err.message);
        entry.downtime = 0;
      }

      return entry;
    });
  });

  // Збираємо всі перераховані записи
  const recalculatedEntries = Object.values(entriesByDate).flat();

  return {
    ...updatedEntries,
    [currentShift]: {
      ...updatedEntries[currentShift],
      [selectedMachine]: recalculatedEntries,
    },
  };
}
