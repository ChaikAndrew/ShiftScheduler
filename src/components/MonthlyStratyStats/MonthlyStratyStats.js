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
    zlecenieNadrukow: 0,
    bluza: 0,
    tshirt: 0,
  });

  // Aggregate values for all shifts on selected date (for mode === "day")
  const [allShiftsAggregateValues, setAllShiftsAggregateValues] = useState({
    pod: 0,
    pof: 0,
    zlecenie: 0,
    zlecenieNadrukow: 0,
    bluza: 0,
    tshirt: 0,
  });
  const [totalLossesAllShifts, setTotalLossesAllShifts] = useState(0);

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

  // Format date to DD.MM.YYYY format
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    const fetchStraties = async () => {
      if (mode === "day" && !date) return;
      setLoading(true);
      try {
        const baseURL = "https://braki-api.vercel.app/api";
        let data = [];

        if (mode === "month") {
          // Month mode - fetch all data for the month
          const endpoint = `${baseURL}/straties-filtered?year=${year}&month=${month}`;
          const res = await fetch(endpoint);
          data = await res.json();
        } else {
          // Day mode
          if (selectedShift === "ALL") {
            // Fetch all shifts and combine results
            const shifts = ["1 ZMIANA", "2 ZMIANA", "3 ZMIANA"];
            const promises = shifts.map((shift) => {
              const encodedShift = encodeURIComponent(shift);
              const endpoint = `${baseURL}/straties-filtered?date=${date}&shift=${encodedShift}`;
              return fetch(endpoint).then((res) => res.json());
            });
            const results = await Promise.all(promises);
            data = results.flat();
          } else {
            // Fetch single shift
            const encodedShift = encodeURIComponent(selectedShift);
            const endpoint = `${baseURL}/straties-filtered?date=${date}&shift=${encodedShift}`;
            const res = await fetch(endpoint);
            data = await res.json();
          }
        }

        // Ensure ilosc_strat is properly set (default to 1 if missing or invalid)
        const adjustedData = data.map((strata) => {
          let iloscStrat = 1;
          if (strata.ilosc_strat !== undefined && strata.ilosc_strat !== null && strata.ilosc_strat !== '') {
            iloscStrat = parseInt(strata.ilosc_strat, 10);
            if (isNaN(iloscStrat) || iloscStrat <= 0) {
              iloscStrat = 1;
            }
          }
          return {
            ...strata,
            ilosc_strat: iloscStrat,
          };
        });

        setStraty(adjustedData);
        calculate(adjustedData);

        // If mode is "day", also fetch all shifts data for total statistics
        if (mode === "day" && date) {
          const shifts = ["1 ZMIANA", "2 ZMIANA", "3 ZMIANA"];
          const promises = shifts.map((shift) => {
            const encodedShift = encodeURIComponent(shift);
            const endpoint = `${baseURL}/straties-filtered?date=${date}&shift=${encodedShift}`;
            return fetch(endpoint).then((res) => res.json());
          });
          
          Promise.all(promises)
            .then((results) => {
              const allData = results.flat();
              const adjustedAllData = allData.map((strata) => {
                let iloscStrat = 1;
                if (strata.ilosc_strat !== undefined && strata.ilosc_strat !== null && strata.ilosc_strat !== '') {
                  iloscStrat = parseInt(strata.ilosc_strat, 10);
                  if (isNaN(iloscStrat) || iloscStrat <= 0) {
                    iloscStrat = 1;
                  }
                }
                return {
                  ...strata,
                  ilosc_strat: iloscStrat,
                };
              });
              calculateAllShifts(adjustedAllData);
            })
            .catch((err) => {
              console.error("❌ Error loading all shifts data:", err);
            });
        }
      } catch (err) {
        console.error("❌ Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStraties();
  }, [mode, month, year, date, selectedShift]);

  const calculate = (data) => {
    // Calculate total losses using ilosc_strat
    const total = data.reduce((acc, curr) => {
      const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
      return acc + quantity;
    }, 0);
    setTotalLosses(total);

    // Calculate aggregate values using ilosc_strat
    const pod = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.pof_pod_hurt === "POD" ? quantity : 0);
      },
      0
    );
    const pof = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.pof_pod_hurt === "POF" ? quantity : 0);
      },
      0
    );
    const zlecenie = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.pof_pod_hurt === "ZLECENIE" ? quantity : 0);
      },
      0
    );
    const zlecenieNadrukow = data.reduce(
      (acc, curr) => {
        if (curr.pof_pod_hurt === "ZLECENIE" && curr.ilosc_nadrukow) {
          const nadruki = parseInt(curr.ilosc_nadrukow, 10);
          return acc + (isNaN(nadruki) ? 0 : nadruki);
        }
        return acc;
      },
      0
    );
    const bluza = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.bluza_t_shirt === "BLUZA" ? quantity : 0);
      },
      0
    );
    const tshirt = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.bluza_t_shirt === "T-SHIRT" ? quantity : 0);
      },
      0
    );
    setTotalAggregateValues({ pod, pof, zlecenie, zlecenieNadrukow, bluza, tshirt });

    // Calculate machine stats using ilosc_strat
    const byMachine = {};
    data.forEach((item) => {
      const machine = item.number_dtg;
      const quantity = item.ilosc_strat && item.ilosc_strat > 0 ? parseInt(item.ilosc_strat, 10) : 1;
      
      if (!byMachine[machine]) {
        byMachine[machine] = {
          POD: 0,
          POF: 0,
          ZLECENIE: 0,
          ZLECENIE_NADRUKOW: 0,
          BLUZA: 0,
          TSHIRT: 0,
          TOTAL: 0,
        };
      }
      
      if (item.pof_pod_hurt === "POD") byMachine[machine].POD += quantity;
      if (item.pof_pod_hurt === "POF") byMachine[machine].POF += quantity;
      if (item.pof_pod_hurt === "ZLECENIE") {
        byMachine[machine].ZLECENIE += quantity;
        if (item.ilosc_nadrukow) {
          const nadruki = parseInt(item.ilosc_nadrukow, 10);
          if (!isNaN(nadruki)) {
            byMachine[machine].ZLECENIE_NADRUKOW += nadruki;
          }
        }
      }
      if (item.bluza_t_shirt === "BLUZA") byMachine[machine].BLUZA += quantity;
      if (item.bluza_t_shirt === "T-SHIRT") byMachine[machine].TSHIRT += quantity;
      byMachine[machine].TOTAL = byMachine[machine].POF + byMachine[machine].POD + byMachine[machine].ZLECENIE;
    });
    setMachineStats(byMachine);

    // Calculate povod stats using ilosc_strat and ilosc_nadrukow
    const povod = {};
    data.forEach((item) => {
      const quantity = item.ilosc_strat && item.ilosc_strat > 0 ? parseInt(item.ilosc_strat, 10) : 1;
      if (!povod[item.povod]) {
        povod[item.povod] = {
          count: 0,
          nadrukow: 0,
        };
      }
      povod[item.povod].count += quantity;
      
      // Add nadrukow count if it's ZLECENIE type
      if (item.pof_pod_hurt === "ZLECENIE" && item.ilosc_nadrukow) {
        const nadruki = parseInt(item.ilosc_nadrukow, 10);
        if (!isNaN(nadruki)) {
          povod[item.povod].nadrukow += nadruki;
        }
      }
    });
    setPovodStats(povod);
  };

  const calculateAllShifts = (data) => {
    // Calculate total losses for all shifts
    const total = data.reduce((acc, curr) => {
      const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
      return acc + quantity;
    }, 0);
    setTotalLossesAllShifts(total);

    // Calculate aggregate values for all shifts
    const pod = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.pof_pod_hurt === "POD" ? quantity : 0);
      },
      0
    );
    const pof = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.pof_pod_hurt === "POF" ? quantity : 0);
      },
      0
    );
    const zlecenie = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.pof_pod_hurt === "ZLECENIE" ? quantity : 0);
      },
      0
    );
    const zlecenieNadrukow = data.reduce(
      (acc, curr) => {
        if (curr.pof_pod_hurt === "ZLECENIE" && curr.ilosc_nadrukow) {
          const nadruki = parseInt(curr.ilosc_nadrukow, 10);
          return acc + (isNaN(nadruki) ? 0 : nadruki);
        }
        return acc;
      },
      0
    );
    const bluza = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.bluza_t_shirt === "BLUZA" ? quantity : 0);
      },
      0
    );
    const tshirt = data.reduce(
      (acc, curr) => {
        const quantity = curr.ilosc_strat && curr.ilosc_strat > 0 ? parseInt(curr.ilosc_strat, 10) : 1;
        return acc + (curr.bluza_t_shirt === "T-SHIRT" ? quantity : 0);
      },
      0
    );
    setAllShiftsAggregateValues({ pod, pof, zlecenie, zlecenieNadrukow, bluza, tshirt });
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
              Shift <strong>{selectedShift === "ALL" ? "ALL SHIFTS" : selectedShift}</strong>
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
                <option value="ALL">All Shifts</option>
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
                <th>NADRUKI</th>
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
                <td>{totalAggregateValues.zlecenieNadrukow}</td>
                <td>{totalAggregateValues.bluza}</td>
                <td>{totalAggregateValues.tshirt}</td>
              </tr>
            </tbody>

            <thead>
              <tr>
                <th colSpan="7">Machines (DTG)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className={s.loadingRow}>
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
                      <td>{machineStats[machine].ZLECENIE_NADRUKOW || 0}</td>
                      <td>{machineStats[machine].BLUZA}</td>
                      <td>{machineStats[machine].TSHIRT}</td>
                    </tr>
                  ))
              )}
            </tbody>

            <thead>
              <tr>
                <th colSpan="7">Loss reasons (POVOD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7">
                  {Object.entries(povodStats)
                    .sort(([, a], [, b]) => {
                      const countA = typeof a === 'object' ? a.count : a;
                      const countB = typeof b === 'object' ? b.count : b;
                      return countB - countA;
                    })
                    .map(([reason, data], index, array) => {
                      const count = typeof data === 'object' ? data.count : data;
                      const nadrukow = typeof data === 'object' ? data.nadrukow : 0;
                      return (
                        <span key={reason} className={ets.reasonDescription}>
                          {reason.toUpperCase()}:{" "}
                          <span className={index < 3 ? s.redCount : " "}>
                            {count}
                            {nadrukow > 0 && ` (${nadrukow})`}
                          </span>
                          {index !== array.length - 1 && ", "}
                          <div className={ets.tooltip}>
                            {povodDescription[reason] || "Опис відсутній"}
                          </div>
                        </span>
                      );
                    })}
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
                    <th>ILOŚĆ STRAT</th>
                    <th>ILOŚĆ NADRUKÓW</th>
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
                          <td>
                            {item.ilosc_strat && !isNaN(item.ilosc_strat) && item.ilosc_strat > 0
                              ? item.ilosc_strat
                              : "1"}
                          </td>
                          <td>
                            {item.pof_pod_hurt === "ZLECENIE" && item.ilosc_nadrukow
                              ? item.ilosc_nadrukow
                              : item.pof_pod_hurt === "ZLECENIE"
                              ? "-"
                              : "-"}
                          </td>
                          <td>{time}</td>
                          <td>{day}</td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  {/* Summary row for selected shift */}
                  <tr>
                    <th colSpan="4">
                      {selectedShift === "ALL" ? "ALL SHIFTS" : selectedShift} ({formatDate(date)}):{" "}
                      <span className={s.redCount}>{totalLosses}</span>
                    </th>
                    <th colSpan="7">
                      POD: {totalAggregateValues.pod}, POF: {totalAggregateValues.pof}, ZLECENIE: {totalAggregateValues.zlecenie} (NADRUKI: {totalAggregateValues.zlecenieNadrukow}) (BLUZA: {totalAggregateValues.bluza}, T-SHIRT: {totalAggregateValues.tshirt})
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyStratyStats;
