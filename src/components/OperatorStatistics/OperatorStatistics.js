import React, { useState } from "react";
import { calculateSummary } from "../../utils/calculateSummaries"; // Import function
import style from "./OperatorStatistics.module.scss";

function OperatorStatistics({
  entries = { first: {}, second: {}, third: {} },
  operators = [],
  tasks = [],
  products = [],
}) {
  const [viewType, setViewType] = useState("day");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");

  const handleViewTypeChange = (e) => setViewType(e.target.value);
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleOperatorChange = (e) => setSelectedOperator(e.target.value);

  const filteredEntries = entries
    ? Object.entries(entries).flatMap(([shift, machines]) =>
        Object.values(machines || {}).flatMap((machineEntries) => {
          return Array.isArray(machineEntries)
            ? machineEntries.filter((entry) => {
                const isOperatorSelected = entry.operator === selectedOperator;
                const isDateSelected =
                  viewType === "day" && entry.date === selectedDate;
                const isMonthSelected =
                  viewType === "month" && entry.date.startsWith(selectedMonth);
                return (
                  isOperatorSelected &&
                  ((viewType === "day" && isDateSelected) ||
                    (viewType === "month" && isMonthSelected))
                );
              })
            : [];
        })
      )
    : [];

  const summary = calculateSummary(filteredEntries, operators, products);

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

      {/* View Type Selection */}
      <div className={style.viewTypeSelection}>
        <label>
          <input
            type="radio"
            name="viewType"
            value="day"
            checked={viewType === "day"}
            onChange={handleViewTypeChange}
          />
          By Date
        </label>
        <label>
          <input
            type="radio"
            name="viewType"
            value="month"
            checked={viewType === "month"}
            onChange={handleViewTypeChange}
          />
          By Month
        </label>
      </div>

      {/* Date or Month Selection */}
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

      {/* Operator Selection Dropdown */}
      <div className={style.operatorSelection}>
        <h3>Select Operator</h3>
        <select
          value={selectedOperator}
          onChange={handleOperatorChange}
          className={style.operatorDropdown}
        >
          <option value="">-- Select Operator --</option>
          {operators.map((operator) => (
            <option key={operator} value={operator}>
              {operator}
            </option>
          ))}
        </select>
      </div>

      {/* Display Results */}
      <div className={style.resultTables}>
        <h3>Results</h3>
        {selectedOperator ? (
          <>
            {/* Task Summary Table */}
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

            {/* Product Summary Table */}
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
