import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";
import { getShiftByTime } from "./getShift";

/**
 * Обчислює робочий час та початковий простій для запису зміни.
 *
 * @param {string} startTime - Час початку роботи у форматі ISO.
 * @param {string} endTime - Час завершення роботи у форматі ISO.
 * @returns {Object} - Об'єкт з інформацією про зміну, робочий час та початковий простій.
 */
export function calculateWorkTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime, { zone: "utc" });
  let end = DateTime.fromISO(endTime, { zone: "utc" });

  if (end < start) {
    end = end.plus({ days: 1 });
  }

  const shift = getShiftByTime(start);

  const scheduledStart = DateTime.fromISO(
    `${start.toISODate()}T${shiftStartTimes[shift]}`,
    { zone: "utc" }
  );
  const initialDowntime = start.equals(scheduledStart)
    ? 0
    : Math.max(0, start.diff(scheduledStart, "minutes").minutes);

  const workInterval = Interval.fromDateTimes(start, end);
  const workingTime = workInterval.length("minutes");

  return {
    shift,
    workingTime: Math.max(workingTime, 0),
    initialDowntime,
  };
}
