import React from "react";
import { tasks, products } from "./constants";
import styles from "../components/MonthlyLeaderStatistics/MonthlyLeaderStatistics.module.scss";

// Таблиця загального підсумку за місяць
export const renderMonthlySummary = (statistics, leaders) => {
  if (!statistics) return null;

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

// Таблиця загальної статистики по днях
export const renderDailyStatistics = (statistics, leaders, daysInMonth) => (
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

// Деталізована таблиця по кожному дню
export const renderDetailedDailyInfo = (
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
          {leader} – Detailed daily statistics for{" "}
          {new Date(selectedMonth.year, selectedMonth.month).toLocaleString(
            "en-US",
            {
              month: "long",
              year: "numeric",
            }
          )}
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
