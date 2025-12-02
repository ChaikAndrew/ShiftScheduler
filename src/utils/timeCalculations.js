import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";
import { getShiftByTime } from "./getShift";

/**
 * Обчислює робочий час та початковий простій для запису зміни.
 *
 * @param {string} startTime - Час початку роботи у форматі ISO.
 * @param {string} endTime - Час завершення роботи у форматі ISO.
 * @param {string} [currentShift] - Поточна зміна (first, second, third). Використовується для граничних часів.
 * @returns {Object} - Об'єкт з інформацією про зміну, робочий час та початковий простій.
 */
export function calculateWorkTime(startTime, endTime, currentShift = null) {
  const start = DateTime.fromISO(startTime, { zone: "utc" });
  let end = DateTime.fromISO(endTime, { zone: "utc" });

  if (end < start) {
    end = end.plus({ days: 1 });
  }

  // Визначаємо зміну: якщо передано currentShift, використовуємо його для граничних часів
  let shift = getShiftByTime(start);
  
  // Для граничних часів використовуємо currentShift, якщо він переданий
  if (currentShift) {
    const hour = start.hour;
    const minute = start.minute;
    
    // 14:00 - граничний час між першою і другою зміною
    if (hour === 14 && minute === 0) {
      shift = currentShift;
    }
    // 22:00 - граничний час між другою і третьою зміною
    else if (hour === 22 && minute === 0) {
      shift = currentShift;
    }
    // 6:00 - граничний час між третьою і першою зміною
    else if (hour === 6 && minute === 0) {
      shift = currentShift;
    }
  }

  // Для третьої зміни потрібна особлива обробка, оскільки вона переходить через північ
  let scheduledStart;
  let startForDowntime = start;
  
  if (shift === "third") {
    // Для третьої зміни початок зміни = 22:00 поточного дня
    scheduledStart = DateTime.fromISO(
      `${start.toISODate()}T${shiftStartTimes[shift]}`,
      { zone: "utc" }
    );
    
    // Якщо start = 6:00, це означає 6:00 наступного дня (кінець зміни)
    if (start.hour === 6 && start.minute === 0) {
      // Для обчислення downtime вважаємо start як 6:00 наступного дня
      startForDowntime = start.plus({ days: 1 });
    }
  } else {
    scheduledStart = DateTime.fromISO(
      `${start.toISODate()}T${shiftStartTimes[shift]}`,
      { zone: "utc" }
    );
  }
  
  // Обчислюємо downtime
  let initialDowntime;
  if (shift === "third" && start.hour === 6 && start.minute === 0) {
    // Для третьої зміни з start = 6:00: downtime = від 22:00 до 6:00 = 8 годин
    initialDowntime = 8 * 60; // 8 годин = 480 хвилин
  } else {
    initialDowntime = startForDowntime.equals(scheduledStart)
      ? 0
      : Math.max(0, startForDowntime.diff(scheduledStart, "minutes").minutes);
  }

  const workInterval = Interval.fromDateTimes(start, end);
  const workingTime = workInterval.length("minutes");

  return {
    shift,
    workingTime: Math.max(workingTime, 0),
    initialDowntime,
  };
}
