import React, { useState, useMemo } from "react";
import { getMachineStatistics } from "../../utils/machineStatisticsHelpers";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import { recalculateDowntime } from "../../utils/recalculateDowntime";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";

import style from "./MachineTimeStats.module.scss";
const MachineTimeStats = ({ machines = [] }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedShift, setSelectedShift] = useState("");

  const selectedYear = new Date(selectedDate).getFullYear();
  const selectedMonth = new Date(selectedDate).getMonth() + 1;

  const { entries, loading, error } = useEntriesLoader(
    selectedYear,
    selectedMonth
  );

  const enrichedEntries = useMemo(() => {
    const newEntries = structuredClone(entries);
    if (!selectedShift || !machines.length) return newEntries;

    machines.forEach((machine) => {
      if (newEntries[selectedShift]?.[machine]) {
        recalculateDowntime(newEntries, selectedShift, machine);
      }
    });

    return newEntries;
  }, [entries, selectedShift, machines]);

  const statistics = useMemo(() => {
    return getMachineStatistics(
      enrichedEntries,
      machines,
      selectedDate,
      selectedShift
    );
  }, [enrichedEntries, machines, selectedDate, selectedShift]);

  const leader = useMemo(() => {
    const shiftEntries = enrichedEntries?.[selectedShift];
    if (!shiftEntries) return "Unknown";

    for (const machine in shiftEntries) {
      const machineEntries = shiftEntries[machine];
      for (const entry of machineEntries) {
        if (entry.displayDate === selectedDate && entry.leader) {
          return entry.leader;
        }
      }
    }
    return "Unknown";
  }, [enrichedEntries, selectedShift, selectedDate]);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className={style.container}>
      <h2>Machine Time Stats</h2>

      <div>
        <div style={{ marginBottom: "1rem" }}>
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

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

      {loading ? (
        <div>
          <Skeleton height={40} width={250} style={{ margin: "1rem 0" }} />
          <Skeleton height={30} count={5} />
        </div>
      ) : error ? (
        <p>Помилка: {error.message}</p>
      ) : !selectedDate || !selectedShift ? (
        <p>Select a date and shift to view statistics. </p>
      ) : (
        <>
          <p>
            <strong>Shift Leader:</strong> {leader}
          </p>

          {statistics.length > 0 ? (
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
                {statistics.map((stat) => (
                  <tr key={stat.machine}>
                    <td>{stat.machine}</td>
                    <td>{formatTime(stat.workingTime)}</td>
                    <td>{formatTime(stat.downtime)}</td>
                    <td>
                      {Object.entries(stat.downtimeReasons).map(
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
          ) : (
            <p>No data found for this date and shift.</p>
          )}
        </>
      )}
    </div>
  );
};

export default MachineTimeStats;
