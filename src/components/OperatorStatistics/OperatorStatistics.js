import React, { useState, useEffect } from "react";
import { calculateSummary } from "../../utils/calculateSummaries";
import style from "./OperatorStatistics.module.scss";

function OperatorStatistics({
  entries = { first: {}, second: {}, third: {} },
  tasks = [],
  products = [],
}) {
  const [viewType, setViewType] = useState("day");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [operatorsFromDB, setOperatorsFromDB] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );

  const handleViewTypeChange = (e) => setViewType(e.target.value);
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleOperatorChange = (e) => setSelectedOperator(e.target.value);

  useEffect(() => {
    const checkLocalhost = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const res = await fetch("http://localhost:4040", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          setBaseUrl("http://localhost:4040");
        }
      } catch {
        console.log("🌍 Використовується продакшн API");
      }
    };

    checkLocalhost();
  }, []);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/operators`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        const operatorNames = data.map((op) => op.name.trim());
        setOperatorsFromDB(operatorNames);
      } catch (err) {
        console.error("❌ Не вдалося отримати операторів:", err);
      }
    };

    if (baseUrl) {
      fetchOperators();
    }
  }, [baseUrl]);

  const filteredEntries = entries
    ? Object.entries(entries).flatMap(([shift, machines]) =>
        Object.values(machines || {}).flatMap((machineEntries) =>
          Array.isArray(machineEntries)
            ? machineEntries.filter((entry) => {
                const isOperatorSelected =
                  entry.operator?.trim() === selectedOperator?.trim();
                const isDateSelected =
                  viewType === "day" && entry.date === selectedDate;
                const isMonthSelected =
                  viewType === "month" && entry.date?.startsWith(selectedMonth);
                return (
                  isOperatorSelected &&
                  ((viewType === "day" && isDateSelected) ||
                    (viewType === "month" && isMonthSelected))
                );
              })
            : []
        )
      )
    : [];

  const summary = calculateSummary(filteredEntries, operatorsFromDB, products);

  const totalTaskQuantity = Object.values(summary.taskSummary).reduce(
    (sum, quantity) => sum + quantity,
    0
  );
  const totalProductQuantity = Object.values(summary.productSummary).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  return (
    <div className={style.container}>
      <h2 className={style.header}>Operator Statistics</h2>

      {/* View Type */}
      <div className={style.viewTypeSelection}>
        <label>
          <input
            type="radio"
            value="day"
            checked={viewType === "day"}
            onChange={handleViewTypeChange}
          />
          By Date
        </label>
        <label>
          <input
            type="radio"
            value="month"
            checked={viewType === "month"}
            onChange={handleViewTypeChange}
          />
          By Month
        </label>
      </div>

      {/* Date / Month Input */}
      <div className={style.dateSelection}>
        {viewType === "day" ? (
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className={style.dateInput}
          />
        ) : (
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className={style.monthInput}
          />
        )}
      </div>

      {/* Operator Dropdown */}
      <div className={style.operatorSelection}>
        <h3>Select Operator</h3>
        <select
          value={selectedOperator}
          onChange={handleOperatorChange}
          className={style.operatorDropdown}
        >
          <option value="">-- Select Operator --</option>
          {[...operatorsFromDB]
            .sort((a, b) => a.localeCompare(b))
            .map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
        </select>
      </div>

      {/* Results */}
      <div className={style.resultTables}>
        <h3>Results</h3>
        {selectedOperator ? (
          <>
            {/* Tasks */}
            <div className={style.tableContainer}>
              <h4>Task Summary</h4>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.taskSummary)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([task, quantity]) => (
                      <tr key={task}>
                        <td>{task}</td>
                        <td>{quantity}</td>
                      </tr>
                    ))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{totalTaskQuantity}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Products */}
            <div className={style.tableContainer}>
              <h4>Product Summary</h4>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.productSummary)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([product, quantity]) => (
                      <tr key={product}>
                        <td>{product}</td>
                        <td>{quantity}</td>
                      </tr>
                    ))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{totalProductQuantity}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className={style.emptyMessage}>
            Select an operator to view statistics
          </p>
        )}
      </div>
    </div>
  );
}

export default OperatorStatistics;
