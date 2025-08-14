import React, { useState, useMemo } from "react";
import { getMachineStatistics } from "../../utils/machineStatisticsHelpers";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import { recalculateDowntime } from "../../utils/recalculateDowntime";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";

import style from "./MachineTimeStats.module.scss";

const SHIFT_LABEL = { first: "First", second: "Second", third: "Third" };

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

  const totalWorking = useMemo(
    () => (statistics || []).reduce((sum, s) => sum + (s.workingTime || 0), 0),
    [statistics]
  );
  const totalDowntime = useMemo(
    () => (statistics || []).reduce((sum, s) => sum + (s.downtime || 0), 0),
    [statistics]
  );

  const noData =
    !loading &&
    !error &&
    selectedDate &&
    selectedShift &&
    (!statistics.length || (totalWorking === 0 && totalDowntime === 0));

  const formatTime = (minutes) => {
    const h = Math.floor((minutes || 0) / 60);
    const m = (minutes || 0) % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className={style.container}>
      {/* Top bar pills */}
      <div className={style.topbar}>
        <div className={style.pills}>
          <span className={style.pill}>
            Date <strong>{selectedDate}</strong>
          </span>
          <span className={style.pill}>
            Shift{" "}
            <strong>{selectedShift ? SHIFT_LABEL[selectedShift] : "—"}</strong>
          </span>
          <span className={style.pill}>
            Leader <strong>{leader}</strong>
          </span>
        </div>

        <div className={style.badgesRight}>
          <span className={`${style.totalBadge} ${style.badgeWorking}`}>
            Working <strong>{formatTime(totalWorking)}</strong>
          </span>
          <span className={`${style.totalBadge} ${style.badgeDowntime}`}>
            Downtime <strong>{formatTime(totalDowntime)}</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={style.filters}>
        <div className={style.inlineField}>
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <label className={style.selectWrap}>
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
        <div className={style.card}>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Working Time</th>
                  <th>Downtime</th>
                  <th>Downtime Reasons</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <Skeleton height={18} />
                    </td>
                    <td>
                      <Skeleton height={18} />
                    </td>
                    <td>
                      <Skeleton height={18} />
                    </td>
                    <td>
                      <Skeleton height={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className={style.alertError}>Помилка: {error.message}</div>
      ) : !selectedDate || !selectedShift ? (
        <div className={style.alertInfo}>
          Select a date and shift to view statistics.
        </div>
      ) : noData ? (
        <div className={style.alertNote}>
          Data for <strong>{selectedDate}</strong>,{" "}
          <strong>{SHIFT_LABEL[selectedShift]} shift</strong> is not available
          in the database.
        </div>
      ) : (
        <div className={style.card}>
          <div className={style.tableWrap}>
            <table className={style.table}>
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
                    <td className={style.machineCell}>{stat.machine}</td>
                    <td>{formatTime(stat.workingTime)}</td>
                    <td className={style.downtimeCell}>
                      {formatTime(stat.downtime)}
                    </td>
                    <td>
                      <div className={style.reasonsWrap}>
                        {Object.entries(stat.downtimeReasons).map(
                          ([reason, time]) => (
                            <span key={reason} className={style.reasonPill}>
                              <span className={style.reasonText}>{reason}</span>
                              <span className={style.reasonTime}>
                                {formatTime(time)}
                              </span>
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineTimeStats;
