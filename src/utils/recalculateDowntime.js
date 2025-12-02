import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";

/**
 * Парсить ISO-час для третьої зміни.
 * Якщо час <= 6:00 — вважаємо його наступним днем, щоб уникнути плутанини в сортуванні.
 * Це потрібно для правильної сортування, оскільки третя зміна йде від 22:00 до 6:00 наступного дня.
 */
const parseDateTimeForThirdShift = (dateTimeStr) => {
  const dt = DateTime.fromISO(dateTimeStr, { zone: "utc" });
  // Додаємо день для часів <= 6:00 (включно з 6:00), щоб вони були після 22:00-23:59
  return dt.hour < 6 || (dt.hour === 6 && dt.minute === 0) ? dt.plus({ days: 1 }) : dt;
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
          let downtime;
          
          // Особлива обробка для третьої зміни з start = 6:00
          if (currentShift === "third") {
            const originalStart = DateTime.fromISO(entry.startTime, { zone: "utc" });
            // Якщо start = 6:00, це означає кінець зміни, downtime = 8 годин
            if (originalStart.hour === 6 && originalStart.minute === 0) {
              downtime = 8 * 60; // 8 годин = 480 хвилин
            } else {
              // Для інших часів обчислюємо нормально
              downtime = Math.round(
                startTime.diff(shiftStart, "minutes").minutes
              );
            }
          } else {
            downtime = Math.round(
              startTime.diff(shiftStart, "minutes").minutes
            );
          }
          
          entry.downtime = Math.max(downtime, 0);
        } else {
          // Наступні записи — від кінця попереднього
          let prevEnd;
          if (currentShift === "third") {
            const prevEndOriginal = DateTime.fromISO(entriesForDate[index - 1].endTime, { zone: "utc" });
            // Для третьої зміни: якщо endTime <= 6:00, це наступний день
            if (prevEndOriginal.hour < 6 || (prevEndOriginal.hour === 6 && prevEndOriginal.minute === 0)) {
              prevEnd = prevEndOriginal.plus({ days: 1 });
            } else {
              prevEnd = prevEndOriginal;
            }
          } else {
            prevEnd = DateTime.fromISO(entriesForDate[index - 1].endTime, {
              zone: "utc",
            });
          }

          let downtime;
          
          // Особлива обробка для третьої зміни з start = 6:00 (коли це не перший запис)
          if (currentShift === "third") {
            const originalStart = DateTime.fromISO(entry.startTime, { zone: "utc" });
            // Якщо start = 6:00 і це не перший запис, то це кінець зміни
            // Downtime = від кінця попереднього запису до 6:00 наступного дня
            if (originalStart.hour === 6 && originalStart.minute === 0) {
              // prevEnd вже оброблений вище
              // startTime також оброблений і має +1 день
              // Обчислюємо інтервал між ними
              downtime = Interval.fromDateTimes(prevEnd, startTime).length("minutes");
            } else {
              // Для інших часів обчислюємо нормально
              downtime = Interval.fromDateTimes(prevEnd, startTime).length("minutes");
            }
          } else {
            downtime = Interval.fromDateTimes(prevEnd, startTime).length("minutes");
          }
          
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
