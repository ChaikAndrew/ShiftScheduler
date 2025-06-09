import React, { useState, useMemo } from "react";
import styles from "./MachinesQuantityStats.module.scss";
import { getMachineStatistics } from "../../utils/machineStatisticsHelpers";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";

const MachinesQuantityStats = ({ machines = [] }) => {
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

  const statistics = useMemo(() => {
    return getMachineStatistics(entries, machines, selectedDate, selectedShift);
  }, [entries, machines, selectedDate, selectedShift]);

  const leader = useMemo(() => {
    if (!entries[selectedShift]) return "Unknown";

    for (const machine in entries[selectedShift]) {
      const machineEntries = entries[selectedShift][machine];
      for (const entry of machineEntries) {
        if (entry.date?.split("T")[0] === selectedDate && entry.leader) {
          return entry.leader;
        }
      }
    }
    return "Unknown";
  }, [entries, selectedShift, selectedDate]);

  const totalShiftQuantity = useMemo(() => {
    return statistics.reduce((sum, stat) => sum + (stat.totalQuantity || 0), 0);
  }, [statistics]);

  return (
    <div className={styles.container}>
      <h2>Machines Quantity Stats</h2>

      {/* Фільтри */}
      <div className={styles.filters}>
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

      {/* Статус */}
      {loading ? (
        <>
          <Skeleton height={30} width={200} style={{ marginBottom: "1rem" }} />
          <Skeleton height={40} count={1} style={{ marginBottom: "1rem" }} />
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Machine</th>
                <th>POD</th>
                <th>POF</th>
                <th>Zlecenie</th>
                <th>Sample</th>
                <th>Test</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index}>
                  {Array(7)
                    .fill(0)
                    .map((_, i) => (
                      <td key={i}>
                        <Skeleton height={20} />
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : error ? (
        <p>Помилка: {error.message}</p>
      ) : !selectedDate || !selectedShift ? (
        <p>Please select a date and shift to view statistics.</p>
      ) : (
        <>
          <p>
            <p>
              <strong>Shift Leader:</strong> {leader} &nbsp; | &nbsp;
              <strong>Total Quantity:</strong> {totalShiftQuantity}
            </p>
          </p>

          {statistics.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>POD</th>
                  <th>POF</th>
                  <th>Zlecenie</th>
                  <th>Sample</th>
                  <th>Test</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((stat) => {
                  const zlecenie =
                    stat.totalQuantity -
                    (stat.POD + stat.POF + stat.Sample + stat.Test);

                  return (
                    <tr key={stat.machine}>
                      <td>{stat.machine}</td>
                      <td>{stat.POD || ""}</td>
                      <td>{stat.POF || ""}</td>
                      <td>{zlecenie > 0 ? zlecenie : ""}</td>
                      <td>{stat.Sample || ""}</td>
                      <td>{stat.Test || ""}</td>
                      <td>
                        <strong>{stat.totalQuantity || ""}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No data available for the selected date and shift.</p>
          )}
        </>
      )}
    </div>
  );
};

export default MachinesQuantityStats;
