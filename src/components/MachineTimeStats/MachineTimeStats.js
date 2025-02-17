import React, { useState } from "react";
import { getMachineStatistics } from "../../utils/machineStatisticsHelpers";

const MachineTimeStats = ({ entries, machines }) => {
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

  // Отримання лідера зміни
  const getShiftLeader = (entries, selectedShift, selectedDate) => {
    const shiftEntries = entries?.[selectedShift];
    if (!shiftEntries) return "Unknown";

    for (const machine in shiftEntries) {
      const machineEntries = shiftEntries[machine];
      for (const entry of machineEntries) {
        if (entry.displayDate === selectedDate && entry.leader) {
          return entry.leader; // Повертаємо першого знайденого лідера
        }
      }
    }
    return "Unknown";
  };

  const leader = getShiftLeader(entries, selectedShift, selectedDate);

  // Форматування часу у години:хвилини
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div>
      <h1>Machine Time Stats</h1>

      {/* Фільтри */}
      <div>
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
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Working Time</th>
                <th>Downtime</th>
                <th>Downtime Reasons</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((machineStat) => (
                <tr key={machineStat.machine}>
                  <td>{machineStat.machine}</td>
                  <td>{formatTime(machineStat.workingTime)}</td>
                  <td>{formatTime(machineStat.downtime)}</td>
                  <td>
                    {Object.entries(machineStat.downtimeReasons).map(
                      ([reason, time]) => (
                        <div key={reason}>
                          {reason}: {formatTime(time)}
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No data available for the selected date and shift.</p>
      )}
    </div>
  );
};

export default MachineTimeStats;
