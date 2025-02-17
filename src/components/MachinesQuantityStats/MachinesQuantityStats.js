import React, { useState } from "react";
import styles from "./MachinesQuantityStats.module.scss";
import { getMachineStatistics } from "../../utils/machineStatisticsHelpers";

const MachinesQuantityStats = ({
  entries = {},
  machines = [],
  leaders = [],
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedShift, setSelectedShift] = useState("");

  // Отримання статистики машин
  const statistics = getMachineStatistics(
    entries,
    machines,
    selectedDate,
    selectedShift
  );

  // Функція отримання лідера зміни
  const getShiftLeader = (entries, selectedShift, selectedDate) => {
    if (!entries[selectedShift]) return "Unknown";

    for (const machine in entries[selectedShift]) {
      const machineEntries = entries[selectedShift][machine];
      for (const entry of machineEntries) {
        if (
          entry.date &&
          entry.date.split("T")[0] === selectedDate &&
          entry.leader
        ) {
          return entry.leader;
        }
      }
    }
    return "Unknown";
  };

  const leader = getShiftLeader(entries, selectedShift, selectedDate);

  return (
    <div className={styles.container}>
      <h2>Machines Quantity Stats</h2>

      {/* Фільтри */}
      <div className={styles.filters}>
        <label>
          Select Date:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>

        <label>
          Select Shift:
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="">Select Shift</option>
            <option value="first">1st Shift</option>
            <option value="second">2nd Shift</option>
            <option value="third">3rd Shift</option>
          </select>
        </label>
      </div>

      {/* Показ лідера зміни */}
      {selectedDate && selectedShift && (
        <p>
          <strong>Shift Leader:</strong> {leader}
        </p>
      )}

      {/* Таблиця статистики */}
      {!selectedDate || !selectedShift ? (
        <p>Please select both date and shift to view statistics.</p>
      ) : statistics.length > 0 ? (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Machine</th>
                <th>POD</th>
                <th>POF</th>
                <th>Zlecenie</th>
                <th>Sample</th>
                <th>Test</th>
                <th>Total Quantity</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((machineStat) => {
                // 🛠 Визначаємо кількість Zlecenie як все, що не POD, POF, Sample, Test
                const zlecenieCount =
                  machineStat.totalQuantity -
                  (machineStat.POD +
                    machineStat.POF +
                    machineStat.Sample +
                    machineStat.Test);

                return (
                  <tr key={machineStat.machine}>
                    <td>{machineStat.machine}</td>
                    <td>{machineStat.POD > 0 ? machineStat.POD : ""}</td>
                    <td>{machineStat.POF > 0 ? machineStat.POF : ""}</td>
                    <td>{zlecenieCount > 0 ? zlecenieCount : ""}</td>
                    <td>{machineStat.Sample > 0 ? machineStat.Sample : ""}</td>
                    <td>{machineStat.Test > 0 ? machineStat.Test : ""}</td>
                    <td>
                      <strong>
                        {machineStat.totalQuantity > 0
                          ? machineStat.totalQuantity
                          : ""}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p>No data available for the selected date and shift.</p>
      )}
    </div>
  );
};

export default MachinesQuantityStats;
