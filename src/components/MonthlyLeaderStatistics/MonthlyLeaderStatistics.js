import React, { useState } from "react";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import { getLeaderStatisticsForMonth } from "../../utils/leaderStatisticsHelpers";
import { products, tasks } from "../../utils/constants";
import styles from "./MonthlyLeaderStatistics.module.scss";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MonthlyLeaderStatistics = ({ leaders }) => {
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const { entries, loading, error } = useEntriesLoader(
    selectedMonth.year,
    selectedMonth.month + 1
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

  const statistics =
    !loading && !error
      ? getLeaderStatisticsForMonth(entries, leaders, selectedMonth)
      : null;

  const hasData =
    statistics &&
    Object.values(statistics).some((leaderData) =>
      leaderData.some((day) => day.total > 0)
    );

  return (
    <div className={styles.container}>
      <h2>Monthly Leader Statistics</h2>

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

      {loading ? (
        <div className={styles.skeletonWrapper}>
          <Skeleton height={30} count={8} />
        </div>
      ) : error ? (
        <p>Помилка при завантаженні: {error.message}</p>
      ) : hasData ? (
        <>
          {renderDailyStatistics(statistics, leaders, daysInMonth)}
          {renderMonthlySummary(statistics, leaders)}
          <div>
            {renderDetailedDailyInfo(
              statistics,
              leaders,
              daysInMonth,
              selectedMonth
            )}
          </div>
        </>
      ) : (
        <p>No data available for the selected month and leaders.</p>
      )}
    </div>
  );
};

const renderDailyStatistics = (statistics, leaders, daysInMonth) => (
  <table>
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
        const daysWithData = monthlyData.filter((day) => day.total > 0).length;
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

const renderMonthlySummary = (statistics, leaders) => {
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
    <table>
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
        {monthlyTotals.map(({ leader, total, taskSummary, productSummary }) => (
          <tr key={leader}>
            <td>{leader}</td>
            <td>{total > 0 ? total : ""}</td>
            {tasks.map((task) => (
              <td key={task} className={styles.highlightedTask}>
                {taskSummary[task] > 0 ? taskSummary[task] : ""}
              </td>
            ))}
            {products.map((product) => (
              <td key={product}>
                {productSummary[product] > 0 ? productSummary[product] : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const renderDetailedDailyInfo = (
  statistics,
  leaders,
  daysInMonth,
  selectedMonth
) => (
  <div className={styles.detailedInfo}>
    {leaders.map((leader) => (
      <div
        className={styles.detailedTable}
        key={leader}
        style={{ marginBottom: "2rem" }}
      >
        <h4>
          {" "}
          {leader} - Detailed daily statistics for{" "}
          {new Date(selectedMonth.year, selectedMonth.month).toLocaleString(
            "en-US",
            {
              month: "long",
              year: "numeric",
            }
          )}{" "}
        </h4>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              {tasks.map((task) => (
                <th key={task}>{task}</th>
              ))}
              {products.map((product) => (
                <th key={product}>{product}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayData = statistics[leader][i];
              const hasData = dayData.total > 0;

              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {tasks.map((task) => (
                    <td key={task} className={styles.highlightedTask}>
                      {hasData && dayData.taskSummary[task]
                        ? dayData.taskSummary[task]
                        : ""}
                    </td>
                  ))}
                  {products.map((product) => (
                    <td key={product}>
                      {hasData && dayData.productSummary[product]
                        ? dayData.productSummary[product]
                        : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ))}
  </div>
);

export default MonthlyLeaderStatistics;
