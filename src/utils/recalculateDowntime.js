import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";

/**
 * Перераховує час простою для кожного запису зміни.
 *
 * @param {Object} updatedEntries - Оновлені записи змін.
 * @param {string} currentShift - Поточна зміна (наприклад, "first", "second", "third").
 * @param {string} selectedMachine - Обрана машина для поточної зміни.
 * @returns {Object} - Оновлені записи з перерахованим простоєм.
 */
export function recalculateDowntime(
  updatedEntries,
  currentShift,
  selectedMachine
) {
  const shiftEntries = updatedEntries[currentShift][selectedMachine] || [];
  return {
    ...updatedEntries,
    [currentShift]: {
      ...updatedEntries[currentShift],
      [selectedMachine]: shiftEntries.map((entry, index) => {
        const scheduledStart = DateTime.fromISO(
          `${DateTime.fromISO(entry.startTime).toISODate()}T${
            shiftStartTimes[currentShift]
          }`
        );
        if (index === 0) {
          if (
            currentShift === "third" &&
            DateTime.fromISO(entry.startTime).hour < 6
          ) {
            entry.downtime = DateTime.fromISO(entry.startTime).equals(
              DateTime.fromISO(`${entry.displayDate}T22:00`)
            )
              ? 0
              : Math.max(
                  0,
                  DateTime.fromISO(entry.startTime).diff(
                    DateTime.fromISO(`${entry.displayDate}T22:00`),
                    "minutes"
                  ).minutes
                );
          } else {
            entry.downtime = DateTime.fromISO(entry.startTime).equals(
              scheduledStart
            )
              ? 0
              : Math.max(
                  0,
                  DateTime.fromISO(entry.startTime).diff(
                    scheduledStart,
                    "minutes"
                  ).minutes
                );
          }
        } else {
          const lastEntry = shiftEntries[index - 1];
          const lastEndTime = lastEntry.endTime
            ? DateTime.fromISO(lastEntry.endTime)
            : DateTime.fromISO(`${entry.displayDate}T22:00`);
          const currentStartTime = DateTime.fromISO(entry.startTime);
          const downtimeInterval = Interval.fromDateTimes(
            lastEndTime,
            currentStartTime
          );
          entry.downtime = downtimeInterval.length("minutes");
        }
        return entry;
      }),
    },
  };
}
