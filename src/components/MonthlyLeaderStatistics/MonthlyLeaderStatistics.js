// MonthlyLeaderStatistics.js
import React, { useState } from "react";
import { getLeaderStatisticsForMonth } from "../../utils/leaderStatisticsHelpers";
import { products, tasks } from "../../utils/constants";
import styles from "./MonthlyLeaderStatistics.module.scss";

const MonthlyLeaderStatistics = ({ entries, leaders }) => {
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const statistics = getLeaderStatisticsForMonth(
    entries,
    leaders,
    selectedMonth
  );

  const daysInMonth = new Date(
    selectedMonth.year,
    selectedMonth.month + 1,
    0
  ).getDate();

  const handleMonthChange = (e) => {
    setSelectedMonth((prev) => ({
      ...prev,
      month: parseInt(e.target.value, 10),
    }));
  };

  const handleYearChange = (e) => {
    setSelectedMonth((prev) => ({
      ...prev,
      year: parseInt(e.target.value, 10),
    }));
  };

  const renderDailyStatistics = () => {
    const hasData = Object.values(statistics).some((leaderData) =>
      leaderData.some((day) => day.total > 0)
    );

    if (!hasData) {
      return <p>No data available for the selected month and leaders.</p>;
    }

    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Leader</th>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <th key={i}>{i + 1}</th>
            ))}
            <th>Average per Day</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((leader) => {
            const monthlyData = statistics[leader];
            const totalQuantity = monthlyData.reduce(
              (sum, day) => sum + day.total,
              0
            );
            const daysWithData = monthlyData.filter(
              (day) => day.total > 0
            ).length;
            const averagePerDay =
              daysWithData > 0 ? Math.round(totalQuantity / daysWithData) : 0;

            return (
              <tr key={leader}>
                <td>{leader}</td>
                {monthlyData.map((day, index) => (
                  <td key={index}>{day.total > 0 ? day.total : ""}</td>
                ))}
                <td>{averagePerDay > 0 ? averagePerDay : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderMonthlySummary = () => {
    const hasData = leaders.some((leader) =>
      statistics[leader].some((day) => day.total > 0)
    );

    if (!hasData) {
      return (
        <p>No summary data available for the selected month and leaders.</p>
      );
    }

    const monthlyTotals = leaders.map((leader) => {
      const monthlyData = statistics[leader];
      const total = monthlyData.reduce((sum, day) => sum + day.total, 0);

      const taskSummary = monthlyData.reduce((acc, day) => {
        tasks.forEach((task) => {
          acc[task] += day.taskSummary[task] || 0;
        });
        return acc;
      }, Object.fromEntries(tasks.map((task) => [task, 0])));

      const productSummary = monthlyData.reduce((acc, day) => {
        products.forEach((product) => {
          acc[product] += day.productSummary[product] || 0;
        });
        return acc;
      }, Object.fromEntries(products.map((product) => [product, 0])));

      return { leader, total, taskSummary, productSummary };
    });

    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Leader</th>
            <th>Total Quantity</th>
            {tasks.map((task) => (
              <th key={task}>{task}</th>
            ))}
            {products.map((product) => (
              <th key={product}>{product}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthlyTotals.map(
            ({ leader, total, taskSummary, productSummary }) => (
              <tr key={leader}>
                <td>{leader}</td>
                <td>{total > 0 ? total : ""}</td>
                {tasks.map((task) => (
                  <td key={task}>
                    {taskSummary[task] > 0 ? taskSummary[task] : ""}
                  </td>
                ))}
                {products.map((product) => (
                  <td key={product}>
                    {productSummary[product] > 0 ? productSummary[product] : ""}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.container}>
      <h1>Monthly Leader Statistics</h1>

      <div>
        <label>
          Select Month:
          <select value={selectedMonth.month} onChange={handleMonthChange}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </label>

        <label>
          Select Year:
          <select value={selectedMonth.year} onChange={handleYearChange}>
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - 2 + i}>
                {new Date().getFullYear() - 2 + i}
              </option>
            ))}
          </select>
        </label>
      </div>

      {renderDailyStatistics()}
      {renderMonthlySummary()}
    </div>
  );
};

export default MonthlyLeaderStatistics;
