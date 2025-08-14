import React, { useState, useMemo } from "react";
import styles from "./MachinesQuantityStats.module.scss";
import { getMachineStatistics } from "../../utils/machineStatisticsHelpers";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";

const SHIFT_LABEL = { first: "First", second: "Second", third: "Third" };

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

  const allProducts = useMemo(() => {
    const set = new Set();
    (statistics || []).forEach((stat) => {
      Object.keys(stat?.products || {}).forEach((p) => set.add(p));
    });
    return Array.from(set);
  }, [statistics]);

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
    return (statistics || []).reduce(
      (sum, stat) => sum + (stat.totalQuantity || 0),
      0
    );
  }, [statistics]);

  const noData =
    !loading &&
    !error &&
    selectedDate &&
    selectedShift &&
    (!statistics.length || totalShiftQuantity === 0);

  return (
    <div className={styles.container}>
      {/* Top bar pills */}
      <div className={styles.topbar}>
        <div className={styles.pills}>
          <span className={styles.pill}>
            <i className="ri-calendar-line" /> Date{" "}
            <strong>{selectedDate}</strong>
          </span>

          <span className={styles.pill}>
            <i className="ri-time-line" /> Shift{" "}
            <strong>{selectedShift ? SHIFT_LABEL[selectedShift] : "—"}</strong>
          </span>

          <span className={styles.pill}>
            <i className="ri-user-star-line" /> Leader <strong>{leader}</strong>
          </span>
        </div>

        <span className={styles.totalBadge}>
          <span>#</span> Total <strong>{totalShiftQuantity}</strong>
        </span>
      </div>

      {/* Filters row */}
      <div className={styles.filters}>
        <div className={styles.inlineField}>
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <label className={styles.selectWrap}>
          <span>Shift</span>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="">Select</option>
            <option value="first">1st</option>
            <option value="second">2nd</option>
            <option value="third">3rd</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className={styles.card}>
          <Skeleton height={28} width={220} style={{ marginBottom: 12 }} />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>POD</th>
                  <th>POF</th>
                  <th>Zlecenie</th>
                  <th>Test</th>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <th key={i}>
                      <Skeleton width={80} />
                    </th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    {Array(9)
                      .fill(0)
                      .map((_, i) => (
                        <td key={i}>
                          <Skeleton height={18} />
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className={styles.alertError}>Помилка: {error.message}</div>
      ) : !selectedDate || !selectedShift ? (
        <div className={styles.alertInfo}>
          Select a date and shift to view statistics.
        </div>
      ) : noData ? (
        <div className={styles.alertNote}>
          <i className="ri-database-2-line" />
          Data for <strong>{selectedDate}</strong>,{" "}
          <strong>{SHIFT_LABEL[selectedShift]} shift</strong> is not available
          in the database.
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>POD</th>
                  <th>POF</th>
                  <th>Zlecenie</th>
                  <th>Test</th>
                  {allProducts.map((p) => (
                    <th key={p}>{p}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((stat) => {
                  const zlecenie =
                    stat.totalQuantity - (stat.POD + stat.POF + stat.Test);

                  return (
                    <tr key={stat.machine}>
                      <td className={styles.machineCell}>{stat.machine}</td>
                      <td>{stat.POD || ""}</td>
                      <td>{stat.POF || ""}</td>
                      <td>{zlecenie > 0 ? zlecenie : ""}</td>
                      <td>{stat.Test || ""}</td>
                      {allProducts.map((p) => (
                        <td key={p}>{stat.products?.[p] || ""}</td>
                      ))}
                      <td className={styles.totalCell}>
                        {stat.totalQuantity || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachinesQuantityStats;
