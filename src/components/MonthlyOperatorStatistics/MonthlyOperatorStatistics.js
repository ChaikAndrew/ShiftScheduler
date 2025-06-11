import React, { useState } from "react";
import style from "./MonthlyOperatorStatistics.module.scss";
import { formatTime } from "../../utils/formatTime";
import { tasks, products } from "../../utils/constants";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import OperatorProductBarChart from "../BarCharts/OperatorProductBarChart/OperatorProductBarChart";
import OperatorTaskBarChart from "../BarCharts/OperatorTaskBarChart/OperatorTaskBarChart";
import ToggleBlock from "../ToggleBlock/ToggleBlock";

const MonthlyOperatorStatistics = ({ operators }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState({
    year: currentYear,
    month: currentMonth,
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

  const getOperatorStatisticsForMonth = () => {
    const statistics = {};

    operators.forEach((operator) => {
      statistics[operator] = Array.from({ length: daysInMonth }, () => ({
        total: 0,
        taskSummary: Object.fromEntries(tasks.map((t) => [t, 0])),
        productSummary: Object.fromEntries(products.map((p) => [p, 0])),
      }));
    });

    const allEntries = Object.values(entries).flatMap((shiftEntries) =>
      Object.values(shiftEntries).flat()
    );

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEntries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getDate() === day &&
          entryDate.getMonth() === selectedMonth.month &&
          entryDate.getFullYear() === selectedMonth.year
        );
      });

      operators.forEach((operator) => {
        const operatorEntries = dayEntries.filter(
          (entry) => entry.operator === operator
        );

        let taskSummary = Object.fromEntries(tasks.map((t) => [t, 0]));
        let productSummary = Object.fromEntries(products.map((p) => [p, 0]));
        let total = 0;

        operatorEntries.forEach((entry) => {
          const task = entry.task;
          const quantity = parseInt(entry.quantity, 10) || 0;

          if (task in taskSummary) {
            taskSummary[task] += quantity;
          } else {
            taskSummary["Zlecenie"] += quantity;
          }

          if (entry.product in productSummary) {
            productSummary[entry.product] += quantity;
          }

          total += quantity;
        });

        statistics[operator][day - 1] = { total, taskSummary, productSummary };
      });
    }

    return statistics;
  };

  const monthlyStatistics = getOperatorStatisticsForMonth();

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setSelectedMonth((prev) => ({ ...prev, month: newMonth }));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setSelectedMonth((prev) => ({ ...prev, year: newYear }));
  };

  const sortedOperators = [...operators].sort();

  const sortedMonthlyTotals = sortedOperators
    .map((operator) => {
      const monthlyTotal = monthlyStatistics[operator].reduce(
        (acc, data) => {
          acc.total += data.total;
          tasks.forEach((task) => {
            acc.taskSummary[task] += data.taskSummary[task];
          });
          products.forEach((product) => {
            acc.productSummary[product] += data.productSummary[product];
          });
          return acc;
        },
        {
          total: 0,
          taskSummary: Object.fromEntries(tasks.map((t) => [t, 0])),
          productSummary: Object.fromEntries(products.map((p) => [p, 0])),
        }
      );

      return { operator, ...monthlyTotal };
    })
    .filter((total) => total.total > 0)
    .sort((a, b) => b.total - a.total);

  const filteredEntries = Object.values(entries)
    .flatMap((shiftEntries) => Object.values(shiftEntries).flat())
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === selectedMonth.month &&
        entryDate.getFullYear() === selectedMonth.year
      );
    });

  const operatorEfficiency = {};

  filteredEntries.forEach((entry) => {
    const { operator, quantity, product } = entry;

    if (!operatorEfficiency[operator]) {
      operatorEfficiency[operator] = {
        totalWorkHours: 0,
        totalProducts: 0,
        productDetails: {},
      };
    }

    const workingTime = entry.workingTime || 0;
    const workHours = workingTime / 60;

    operatorEfficiency[operator].totalWorkHours += workHours;
    operatorEfficiency[operator].totalProducts += quantity;

    if (!product) return;
    if (!operatorEfficiency[operator].productDetails[product]) {
      operatorEfficiency[operator].productDetails[product] = {
        total: 0,
        workHours: 0,
        speed: 0,
      };
    }

    operatorEfficiency[operator].productDetails[product].total += quantity;
    operatorEfficiency[operator].productDetails[product].workHours += workHours;
  });

  const formattedMonth = new Date(
    selectedMonth.year,
    selectedMonth.month
  ).toLocaleString("en-US", { month: "long" });

  const reportTitle = `${formattedMonth} ${selectedMonth.year}`;

  const isDataAvailable =
    sortedMonthlyTotals.length > 0 ||
    Object.keys(operatorEfficiency).length > 0;

  const productChartData = sortedMonthlyTotals.map((item) => ({
    operator: item.operator,
    ...item.productSummary,
  }));

  const taskChartData = sortedMonthlyTotals.map((item) => ({
    operator: item.operator,
    ...item.taskSummary,
  }));

  return (
    <div className={style.container}>
      <h2 className={style.pageTitle}>Monthly Operator Statistics</h2>
      <div className={style.selection}>
        <label>
          Month:
          <select value={selectedMonth.month} onChange={handleMonthChange}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <select value={selectedMonth.year} onChange={handleYearChange}>
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={currentYear - 2 + i}>
                {currentYear - 2 + i}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className={style.skeletonWrapper}>
          <Skeleton height={40} width={250} style={{ marginBottom: "1rem" }} />
          <Skeleton height={30} count={8} />
        </div>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : isDataAvailable ? (
        <>
          <ToggleBlock
            title={`Monthly Task Summary – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Monthly total quantity per operator and breakdown by task type (POD, POF, etc.)."
          >
            <div className={style.section}>
              <h3 className={style.title}>
                Monthly Task Summary – {reportTitle}
              </h3>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Total</th>
                    {tasks.map((task) => (
                      <th key={task}>{task}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedMonthlyTotals.map((total) => (
                    <tr key={total.operator}>
                      <td>{total.operator}</td>
                      <td>{total.total}</td>
                      {tasks.map((task) => (
                        <td key={task}>{total.taskSummary[task] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <OperatorTaskBarChart data={taskChartData} />
          </ToggleBlock>

          <ToggleBlock
            title={`Monthly Product Summary – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Monthly product totals per operator, showing quantity for each product type."
          >
            <div className={style.section}>
              <h3 className={style.title}>
                Monthly Product Summary – {reportTitle}
              </h3>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Operator</th>
                    {products.map((product) => (
                      <th key={product}>{product}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedMonthlyTotals.map((total) => (
                    <tr key={total.operator}>
                      <td>{total.operator}</td>
                      {products.map((product) => (
                        <td key={product}>
                          {total.productSummary[product] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <OperatorProductBarChart data={productChartData} />
          </ToggleBlock>

          <ToggleBlock
            title={`Daily Operator Statistics  – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Table showing daily totals and average per day for each operator."
          >
            {/* таблиця 1 */}
            <div className={style.section}>
              <h3 className={style.title}>
                Daily Operator Statistics – {reportTitle}
              </h3>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Average per Day</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i}>{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedMonthlyTotals.map((total) => {
                    const daysWithRecords = monthlyStatistics[
                      total.operator
                    ].filter((data) => data.total > 0).length;
                    const averagePerDay =
                      daysWithRecords > 0
                        ? Math.round(total.total / daysWithRecords)
                        : "0";
                    return (
                      <tr key={total.operator}>
                        <td className={style.operatorCell}>{total.operator}</td>
                        <td>{averagePerDay}</td>
                        {monthlyStatistics[total.operator].map(
                          (data, index) => (
                            <td key={index}>{data.total || ""}</td>
                          )
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ToggleBlock>

          <ToggleBlock
            title={`Operator Work Efficiency – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Total work time, number of products, and average production speed per operator."
          >
            <div className={style.section}>
              <h3 className={style.title}>
                Operator Work Efficiency – {reportTitle}
              </h3>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Work Hours</th>
                    <th>Total Products</th>
                    <th>Average Speed (units/hr)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(operatorEfficiency).map(
                    ([operator, data]) => (
                      <tr key={operator}>
                        <td>{operator}</td>
                        <td>
                          {formatTime(Math.round(data.totalWorkHours * 60))}
                        </td>
                        <td>{data.totalProducts}</td>
                        <td>
                          {data.totalWorkHours > 0
                            ? Math.round(
                                data.totalProducts / data.totalWorkHours
                              )
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </ToggleBlock>

          <ToggleBlock
            title={`Detailed Product Breakdown – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Per-product stats: total quantity and average speed (units/hr) for each operator."
          >
            <div className={style.section}>
              <h3 className={style.title}>
                Detailed Product Breakdown – {reportTitle}
              </h3>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Product</th>
                    <th>Total</th>
                    <th>Speed (units/hr)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(operatorEfficiency).map(
                    ([operator, data]) => {
                      const productDetails = Object.entries(
                        data.productDetails
                      ).filter(([_, val]) => val.total > 0);

                      return productDetails.map(([product, val], index) => (
                        <tr key={`${operator}-${product}`}>
                          {index === 0 && (
                            <td rowSpan={productDetails.length}>{operator}</td>
                          )}
                          <td>{product}</td>
                          <td>{val.total}</td>
                          <td>
                            {val.workHours > 0
                              ? Math.round(val.total / val.workHours)
                              : "-"}
                          </td>
                        </tr>
                      ));
                    }
                  )}
                </tbody>
              </table>
            </div>
          </ToggleBlock>
        </>
      ) : (
        <div className={style.noDataMessage}>
          <p>No data available for this month.</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyOperatorStatistics;
