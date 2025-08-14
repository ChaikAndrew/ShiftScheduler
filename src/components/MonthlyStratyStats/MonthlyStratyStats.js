import React, { useEffect, useState } from "react";
import s from "./MonthlyStratyStats.module.scss";
import ets from "../EntryTable/EntryTable.module.scss";
import { povodDescription } from "./povodDescription";

const MonthlyStratyStats = () => {
  const now = new Date();
  const [mode, setMode] = useState("day");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [date, setDate] = useState(now.toISOString().split("T")[0]);

  const [straty, setStraty] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [machineStats, setMachineStats] = useState({});
  const [povodStats, setPovodStats] = useState({});
  const [totalLosses, setTotalLosses] = useState(0);
  const [selectedShift, setSelectedShift] = useState("1 ZMIANA");

  const [totalAggregateValues, setTotalAggregateValues] = useState({
    pod: 0,
    pof: 0,
    zlecenie: 0,
    bluza: 0,
    tshirt: 0,
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const fetchStraties = async () => {
      if (mode === "day" && !date) return;
      setLoading(true);
      try {
        const encodedShift = encodeURIComponent(selectedShift);
        const baseURL = "https://braki-api.vercel.app/api";
        const endpoint =
          mode === "month"
            ? `${baseURL}/straties-filtered?year=${year}&month=${month}`
            : `${baseURL}/straties-filtered?date=${date}&shift=${encodedShift}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        setStraty(data);
        calculate(data);
      } catch (err) {
        console.error("❌ Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStraties();
  }, [mode, month, year, date, selectedShift]);

  const calculate = (data) => {
    setTotalLosses(data.length);

    const pod = data.filter((x) => x.pof_pod_hurt === "POD").length;
    const pof = data.filter((x) => x.pof_pod_hurt === "POF").length;
    const zlecenie = data.filter((x) => x.pof_pod_hurt === "ZLECENIE").length;
    const bluza = data.filter((x) => x.bluza_t_shirt === "BLUZA").length;
    const tshirt = data.filter((x) => x.bluza_t_shirt === "T-SHIRT").length;
    setTotalAggregateValues({ pod, pof, zlecenie, bluza, tshirt });

    const byMachine = {};
    data.forEach((item) => {
      const machine = item.number_dtg;
      if (!byMachine[machine]) {
        byMachine[machine] = {
          POD: 0,
          POF: 0,
          ZLECENIE: 0,
          BLUZA: 0,
          TSHIRT: 0,
          TOTAL: 0,
        };
      }
      if (item.pof_pod_hurt === "POD") byMachine[machine].POD++;
      if (item.pof_pod_hurt === "POF") byMachine[machine].POF++;
      if (item.pof_pod_hurt === "ZLECENIE") byMachine[machine].ZLECENIE++;
      if (item.bluza_t_shirt === "BLUZA") byMachine[machine].BLUZA++;
      if (item.bluza_t_shirt === "T-SHIRT") byMachine[machine].TSHIRT++;
      byMachine[machine].TOTAL++;
    });
    setMachineStats(byMachine);

    const povod = {};
    data.forEach((item) => {
      if (!povod[item.povod]) povod[item.povod] = 0;
      povod[item.povod]++;
    });
    setPovodStats(povod);
  };

  return (
    <div className={s.container}>
      {/* Topbar summary pills */}
      <div className={s.topbar}>
        <div className={s.pills}>
          <span className={s.pill}>
            Mode <strong>{mode === "month" ? "Month" : "Day"}</strong>
          </span>
          <span className={s.pill}>
            {mode === "month" ? "Period" : "Date"}{" "}
            <strong>
              {mode === "month" ? `${months[month - 1]} ${year}` : date}
            </strong>
          </span>
          {mode === "day" && (
            <span className={s.pill}>
              Shift <strong>{selectedShift}</strong>
            </span>
          )}
        </div>

        <div className={s.badgesRight}>
          <span className={s.totalBadge}>
            Total records <strong>{totalLosses}</strong>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={s.filters}>
        <label className={s.selectWrap}>
          <span>Mode</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="day">By day</option>
            <option value="month">By month</option>
          </select>
        </label>

        {mode === "month" && (
          <>
            <label className={s.selectWrap}>
              <span>Month</span>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {months.map((name, index) => (
                  <option key={index} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className={s.selectWrap}>
              <span>Year</span>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2023, 2024, 2025].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {mode === "day" && (
          <>
            <div className={s.inlineField}>
              <input
                className={s.inputDate}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <label className={s.selectWrap}>
              <span>Shift</span>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
              >
                <option value="1 ZMIANA">Shift 1</option>
                <option value="2 ZMIANA">Shift 2</option>
                <option value="3 ZMIANA">Shift 3</option>
              </select>
            </label>
          </>
        )}
      </div>

      {/* Totals table */}
      <div className={s.card}>
        <div className={s.tableWrap}>
          <table className={s.dataTable}>
            <thead>
              <tr>
                <th>Total records:</th>
                <th>POD</th>
                <th>POF</th>
                <th>ZLECENIE</th>
                <th>BLUZA</th>
                <th>T-SHIRT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  All Machines:{" "}
                  <span className={s.redCount}>{totalLosses}</span>
                </td>
                <td>{totalAggregateValues.pod}</td>
                <td>{totalAggregateValues.pof}</td>
                <td>{totalAggregateValues.zlecenie}</td>
                <td>{totalAggregateValues.bluza}</td>
                <td>{totalAggregateValues.tshirt}</td>
              </tr>
            </tbody>

            <thead>
              <tr>
                <th colSpan="6">Machines (DTG)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className={s.loadingRow}>
                    Loading…
                  </td>
                </tr>
              ) : (
                Object.keys(machineStats)
                  .sort()
                  .map((machine) => (
                    <tr key={machine}>
                      <td>
                        <strong>{machine}</strong>:{" "}
                        <span className={s.redCount}>
                          {machineStats[machine].TOTAL}
                        </span>
                      </td>
                      <td>{machineStats[machine].POD}</td>
                      <td>{machineStats[machine].POF}</td>
                      <td>{machineStats[machine].ZLECENIE}</td>
                      <td>{machineStats[machine].BLUZA}</td>
                      <td>{machineStats[machine].TSHIRT}</td>
                    </tr>
                  ))
              )}
            </tbody>

            <thead>
              <tr>
                <th colSpan="6">Loss reasons (POVOD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6">
                  {Object.entries(povodStats)
                    .sort(([, a], [, b]) => b - a)
                    .map(([reason, count], index, array) => (
                      <span key={reason} className={ets.reasonDescription}>
                        {reason.toUpperCase()}:{" "}
                        <span className={index < 3 ? s.redCount : " "}>
                          {count}
                        </span>
                        {index !== array.length - 1 && ", "}
                        <div className={ets.tooltip}>
                          {povodDescription[reason] || "Опис відсутній"}
                        </div>
                      </span>
                    ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {mode === "day" && (
        <>
          <h3 className={s.sectionTitle}>All Loss Records</h3>
          <div className={s.card}>
            <div className={s.tableWrap}>
              <table className={s.dataTable}>
                <thead>
                  <tr>
                    <th>ZMIANA</th>
                    <th>№ DTG</th>
                    <th>KOD KRESKOWY / NR ZLECENIA</th>
                    <th>POF / POD / HURT</th>
                    <th>BLUZA / T-SHIRT</th>
                    <th>MODEL</th>
                    <th>POVOD</th>
                    <th>GODZINA</th>
                    <th>DATA</th>
                  </tr>
                </thead>
                <tbody>
                  {[...straty]
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .map((item, index) => {
                      const time = new Date(item.createdAt).toLocaleTimeString(
                        "pl-PL"
                      );
                      const day = new Date(item.createdAt).toLocaleDateString(
                        "pl-PL"
                      );
                      return (
                        <tr key={index}>
                          <td>{item.zmiana}</td>
                          <td>{item.number_dtg}</td>
                          <td>{item.kod_kreskowy_nr_zlecenia}</td>
                          <td>{item.pof_pod_hurt}</td>
                          <td>{item.bluza_t_shirt}</td>
                          <td>{item.model}</td>
                          <td
                            className={ets.reasonDescription}
                            style={{ cursor: "pointer" }}
                          >
                            {item.povod}
                            <div className={ets.tooltip}>
                              {povodDescription[item.povod] || "Опис відсутній"}
                            </div>
                          </td>
                          <td>{time}</td>
                          <td>{day}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyStratyStats;
