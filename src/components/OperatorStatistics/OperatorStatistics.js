import React, { useState, useEffect } from "react";
import { calculateSummary } from "../../utils/calculateSummaries";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import styles from "./OperatorStatistics.module.scss";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function OperatorStatistics({ tasks = [], products = [] }) {
  const [viewType, setViewType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [operatorsFromDB, setOperatorsFromDB] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );

  const selectedYear =
    viewType === "day"
      ? new Date(selectedDate).getFullYear()
      : new Date(`${selectedMonth}-01`).getFullYear();
  const selectedMonthNumber =
    viewType === "day"
      ? new Date(selectedDate).getMonth() + 1
      : new Date(`${selectedMonth}-01`).getMonth() + 1;

  const { entries, loading, error } = useEntriesLoader(
    selectedYear,
    selectedMonthNumber
  );

  const handleViewTypeChange = (e) => setViewType(e.target.value);
  const handleOperatorChange = (e) =>
    setSelectedOperator(e.target.value.trim());

  useEffect(() => {
    const checkLocalhost = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const res = await fetch("http://localhost:4040", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) setBaseUrl("http://localhost:4040");
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
        setOperatorsFromDB(data.map((op) => op.name.trim()));
      } catch (err) {
        console.error("❌ Не вдалося отримати операторів:", err);
      }
    };
    if (baseUrl) fetchOperators();
  }, [baseUrl]);

  useEffect(() => {
    if (viewType === "month" && !selectedMonth) {
      const now = new Date();
      setSelectedMonth(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      );
    }
  }, [viewType, selectedMonth]);

  const filteredEntries = entries
    ? Object.entries(entries).flatMap(([_, machines]) =>
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

  const summary = calculateSummary(
    filteredEntries,
    operatorsFromDB.map((op) => op.trim()),
    products
  );

  const totalTaskQuantity = Object.values(summary.taskSummary).reduce(
    (sum, q) => sum + q,
    0
  );
  const totalProductQuantity = Object.values(summary.productSummary).reduce(
    (sum, q) => sum + q,
    0
  );

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <h2 className={styles.pageTitle}>Operator Statistics</h2>
        {selectedOperator && (
          <span className={styles.pill}>
            Operator: <strong>{selectedOperator}</strong>
          </span>
        )}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.viewType}>
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

        <div className={styles.datePicker}>
          {viewType === "day" ? (
            <CustomDatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          ) : (
            <DatePicker
              selected={
                selectedMonth ? new Date(`${selectedMonth}-01`) : new Date()
              }
              onChange={(date) => {
                if (!date) return;
                setSelectedMonth(
                  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}`
                );
              }}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              className={styles.customMonthPicker}
            />
          )}
        </div>

        <div className={styles.operatorSelect}>
          <select value={selectedOperator} onChange={handleOperatorChange}>
            <option value="">-- Select Operator --</option>
            {[...operatorsFromDB]
              .sort((a, b) => a.localeCompare(b))
              .map((op) => (
                <option key={op} value={op.trim()}>
                  {op}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className={styles.results}>
        {loading ? (
          <div className={styles.skeletonWrapper}>
            <Skeleton height={36} width={240} style={{ marginBottom: 12 }} />
            <Skeleton height={28} count={8} />
          </div>
        ) : error ? (
          <div className={styles.alertError}>❌ Error: {error.message}</div>
        ) : selectedOperator ? (
          <>
            <div className={styles.card}>
              <h4>Task Summary</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.taskSummary)
                    .filter(([, q]) => q > 0)
                    .map(([task, q]) => (
                      <tr key={task}>
                        <td>{task}</td>
                        <td>{q}</td>
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

            <div className={styles.card}>
              <h4>Product Summary</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.productSummary)
                    .filter(([, q]) => q > 0)
                    .map(([product, q]) => (
                      <tr key={product}>
                        <td>{product}</td>
                        <td>{q}</td>
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
          <div className={styles.noDataMessage}>
            Select an operator to view statistics
          </div>
        )}
      </div>
    </div>
  );
}

export default OperatorStatistics;
