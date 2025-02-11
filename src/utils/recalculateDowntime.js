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
        entry.downtime = DateTime.fromISO(entry.startTime).equals(
          scheduledStart
        )
          ? 0
          : Math.max(
              0,
              DateTime.fromISO(entry.startTime).diff(scheduledStart, "minutes")
                .minutes
            );
        console.log("Calculated Downtime for First Entry:", entry.downtime);
      } else {
        console.log("Processing subsequent entry...");
        const lastEntry = entriesForDate[index - 1];
        const lastEndTime = lastEntry.endTime
          ? DateTime.fromISO(lastEntry.endTime)
          : scheduledStart;
        const currentStartTime = DateTime.fromISO(entry.startTime);
        console.log("Last End Time:", lastEndTime.toISO());
        console.log("Current Start Time:", currentStartTime.toISO());

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
