import { DateTime, Interval } from "luxon";
import { shiftStartTimes } from "./constants";

/**
 * Перераховує час простою для кожної дати окремо.
 *
 * @param {Object} updatedEntries - Оновлені записи змін.
 * @param {string} currentShift - Поточна зміна.
 * @param {string} selectedMachine - Обрана машина.
 * @returns {Object} - Оновлені записи з перерахованим простоєм по кожній даті.
 */
export function recalculateDowntime(
  updatedEntries,
  currentShift,
  selectedMachine
) {
  console.log("Starting recalculateDowntime...");
  console.log("Current Shift:", currentShift);
  console.log("Selected Machine:", selectedMachine);

  const shiftEntries = updatedEntries[currentShift][selectedMachine] || [];
  console.log("Shift Entries:", shiftEntries);

  // Групуємо записи за датою
  const entriesByDate = shiftEntries.reduce((acc, entry) => {
    const date = DateTime.fromISO(entry.startTime).toISODate();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  console.log("Grouped Entries by Date:", entriesByDate);

  // Перераховуємо downtime для кожної дати окремо
  Object.keys(entriesByDate).forEach((date) => {
    console.log(`\n--- Processing Date: ${date} ---`);
    const entriesForDate = entriesByDate[date];

    entriesByDate[date] = entriesForDate.map((entry, index) => {
      const scheduledStart = DateTime.fromISO(
        `${date}T${shiftStartTimes[currentShift]}`
      );
      console.log("Scheduled Start:", scheduledStart.toISO());

      if (index === 0) {
        console.log("Processing first entry...");

        if (currentShift === "third") {
          const thirdShiftStart = DateTime.fromISO(`${date}T22:00`);
          const entryStartTime = DateTime.fromISO(entry.startTime);

          if (entryStartTime.hour <= 6) {
            console.log("Handling third shift after midnight...");
            const previousDay = thirdShiftStart.minus({ days: 1 });
            entry.downtime = Math.max(
              0,
              entryStartTime.diff(previousDay, "minutes").minutes
            );
            console.log(
              "Downtime for third shift (after midnight):",
              entry.downtime
            );
          } else {
            entry.downtime = Math.max(
              0,
              entryStartTime.diff(thirdShiftStart, "minutes").minutes
            );
            console.log(
              "Downtime for third shift (before midnight):",
              entry.downtime
            );
          }
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
          console.log(
            "Calculated Downtime for First Entry (Old Logic):",
            entry.downtime
          );
        }
      } else {
        console.log("Processing subsequent entry...");
        const lastEntry = entriesForDate[index - 1];
        let lastEndTime = lastEntry.endTime
          ? DateTime.fromISO(lastEntry.endTime)
          : scheduledStart;
        let currentStartTime = DateTime.fromISO(entry.startTime);

        console.log("Last End Time:", lastEndTime.toISO());
        console.log("Current Start Time:", currentStartTime.toISO());

        if (currentShift === "third" && currentStartTime < lastEndTime) {
          currentStartTime = currentStartTime.plus({ days: 1 });
        }

        entry.downtime = Math.max(
          0,
          Interval.fromDateTimes(lastEndTime, currentStartTime).length(
            "minutes"
          )
        );
        console.log(
          "Calculated Downtime for Subsequent Entry:",
          entry.downtime
        );
      }

      console.log("--- Entry Processed ---\n");
      return entry;
    });
  });

  // Об’єднуємо всі записи назад у список
  const recalculatedEntries = Object.values(entriesByDate).flat();
  console.log("Recalculated Entries:", recalculatedEntries);

  return {
    ...updatedEntries,
    [currentShift]: {
      ...updatedEntries[currentShift],
      [selectedMachine]: recalculatedEntries,
    },
  };
}
