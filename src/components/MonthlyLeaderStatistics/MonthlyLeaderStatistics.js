import React, { useState } from "react";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import { getLeaderStatisticsForMonth } from "../../utils/leaderStatisticsHelpers";
import { products, tasks } from "../../utils/constants";
import styles from "./MonthlyLeaderStatistics.module.scss";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import LeaderProductBarChart from "../BarCharts/LeaderProductBarChart/LeaderProductBarChart";
import LeaderTaskBarChart from "../BarCharts/LeaderTaskBarChart/LeaderTaskBarChart";

import ToggleBlock from "../ToggleBlock/ToggleBlock";
import {
  renderMonthlySummary,
  renderDailyStatistics,
  renderDetailedDailyInfo,
} from "../../utils/monthlyLeaderHelpers";

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
      ? getLeaderStatisticsForMonth(
          entries,
          leaders.map((l) => l.trim()),
          selectedMonth
        )
      : null;

  const hasData =
    statistics &&
    Object.values(statistics).some((leaderData) =>
      leaderData.some((day) => day.total > 0)
    );

  const formattedMonth = new Date(
    selectedMonth.year,
    selectedMonth.month
  ).toLocaleString("en-US", { month: "long" });

  const reportTitle = `${formattedMonth} ${selectedMonth.year}`;

  const monthlyTotals = statistics
    ? leaders
        .map((l) => l.trim())
        .map((leader) => {
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
        })
    : [];

  const nonZeroProductKeys = products.filter((product) =>
    monthlyTotals.some(({ productSummary }) => productSummary[product] > 0)
  );

  const chartData = monthlyTotals.map(({ leader, productSummary }) => {
    const filteredSummary = Object.fromEntries(
      nonZeroProductKeys.map((key) => [key, productSummary[key]])
    );
    return { leader, ...filteredSummary };
  });

  const taskChartData = monthlyTotals.map(({ leader, taskSummary }) => {
    const filteredTasks = Object.entries(taskSummary)
      .filter(([_, value]) => value > 0)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    return { leader, ...filteredTasks };
  });

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <h2 className={styles.pageTitle}>Monthly Leader Statistics</h2>
        <div className={styles.pills}>
          <span className={styles.pill}>
            Month <strong>{formattedMonth}</strong>
          </span>
          <span className={styles.pill}>
            Year <strong>{selectedMonth.year}</strong>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <label className={styles.selectWrap}>
          <span>Select Month</span>
          <select value={selectedMonth.month} onChange={handleMonthChange}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.selectWrap}>
          <span>Select Year</span>
          <select value={selectedMonth.year} onChange={handleYearChange}>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {loading ? (
        <div className={styles.skeletonWrapper}>
          <Skeleton height={36} width={260} style={{ marginBottom: 12 }} />
          <Skeleton height={28} count={8} />
        </div>
      ) : error ? (
        <div className={styles.alertError}>
          Помилка при завантаженні: {error.message}
        </div>
      ) : hasData ? (
        <>
          <ToggleBlock
            title={`Monthly Summary – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Monthly summary for each leader: total quantity produced, breakdown by task type (POD, POF, etc.), and product type."
          >
            <div className={styles.section}>
              {/* рендер з хелперів (не змінював) */}
              {renderMonthlySummary(
                statistics,
                leaders.map((l) => l.trim())
              )}
            </div>
          </ToggleBlock>

          {(chartData.length > 0 || taskChartData.length > 0) && (
            <ToggleBlock
              title={`Charts (Products & Tasks) – ${reportTitle}`}
              defaultOpen={false}
              tooltip="Charts showing the distribution of tasks and products by leader for the selected month."
            >
              <div className={styles.section}>
                {chartData.length > 0 && (
                  <div className={styles.card}>
                    <LeaderProductBarChart data={chartData} />
                  </div>
                )}
                {taskChartData.length > 0 && (
                  <div className={styles.card}>
                    <LeaderTaskBarChart data={taskChartData} />
                  </div>
                )}
              </div>
            </ToggleBlock>
          )}

          <ToggleBlock
            title={`Daily Statistics – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Table showing total quantity per day for each leader, along with the average on active days."
          >
            <div className={styles.section}>
              {renderDailyStatistics(
                statistics,
                leaders.map((l) => l.trim()),
                daysInMonth
              )}
            </div>
          </ToggleBlock>

          <ToggleBlock
            title={`Detailed Daily Info – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Detailed table showing tasks and products completed by each leader on each day of the selected month."
          >
            <div className={styles.section}>
              {renderDetailedDailyInfo(
                statistics,
                leaders.map((l) => l.trim()),
                daysInMonth,
                selectedMonth
              )}
            </div>
          </ToggleBlock>
        </>
      ) : (
        <div className={styles.noDataMessage}>
          <i className={styles.dbIcon} aria-hidden />
          <span>
            Data for{" "}
            <strong>
              {formattedMonth} {selectedMonth.year}
            </strong>{" "}
            is not available in the database.
          </span>
        </div>
      )}
    </div>
  );
};

export default MonthlyLeaderStatistics;
