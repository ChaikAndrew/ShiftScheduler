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
  // Стан для обраного місяця та року
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  // Завантаження записів з бази
  const { entries, loading, error } = useEntriesLoader(
    selectedMonth.year,
    selectedMonth.month + 1
  );

  // Кількість днів у місяці
  const daysInMonth = new Date(
    selectedMonth.year,
    selectedMonth.month + 1,
    0
  ).getDate();

  // Зміна місяця
  const handleMonthChange = (e) => {
    setSelectedMonth((prev) => ({
      ...prev,
      month: parseInt(e.target.value, 10),
    }));
  };

  // Зміна року
  const handleYearChange = (e) => {
    setSelectedMonth((prev) => ({
      ...prev,
      year: parseInt(e.target.value, 10),
    }));
  };

  // Статистика по лідерам
  const statistics =
    !loading && !error
      ? getLeaderStatisticsForMonth(
          entries,
          leaders.map((l) => l.trim()),
          selectedMonth
        )
      : null;

  // Чи є хоч якісь дані
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

  // Підсумки за місяць по кожному лідеру
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

  // Продукти, які мають хоча б одну одиницю
  const nonZeroProductKeys = products.filter((product) =>
    monthlyTotals.some(({ productSummary }) => productSummary[product] > 0)
  );

  // Дані для графіка по продуктах
  const chartData = monthlyTotals.map(({ leader, productSummary }) => {
    const filteredSummary = Object.fromEntries(
      nonZeroProductKeys.map((key) => [key, productSummary[key]])
    );
    return { leader, ...filteredSummary };
  });

  // Дані для графіка по типах завдань
  const taskChartData = monthlyTotals.map(({ leader, taskSummary }) => {
    const filteredTasks = Object.entries(taskSummary)
      .filter(([_, value]) => value > 0)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    return { leader, ...filteredTasks };
  });

  // Далі йде return з відображенням всього інтерфейсу...
  return (
    <div className={styles.container}>
      <h2>Monthly Leader Statistics</h2>

      <div className={styles.selects}>
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
          <Skeleton height={30} count={8} />
        </div>
      ) : error ? (
        <p>Помилка при завантаженні: {error.message}</p>
      ) : hasData ? (
        <>
          {/* Блок підсумку */}
          <ToggleBlock
            title={`Monthly Summary – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Monthly summary for each leader: total quantity produced, breakdown by task type (POD, POF, etc.), and product type."
          >
            {renderMonthlySummary(
              statistics,
              leaders.map((l) => l.trim())
            )}
          </ToggleBlock>

          {/* Графік продуктів та завданнь */}
          {(chartData.length > 0 || taskChartData.length > 0) && (
            <ToggleBlock
              title={`Charts (Products & Tasks) – ${reportTitle}`}
              defaultOpen={false}
              tooltip="Charts showing the distribution of tasks and products by leader for the selected month."
            >
              {chartData.length > 0 && (
                <LeaderProductBarChart data={chartData} />
              )}
              {taskChartData.length > 0 && (
                <LeaderTaskBarChart data={taskChartData} />
              )}
            </ToggleBlock>
          )}

          {/* Щоденна таблиця */}
          <ToggleBlock
            title={`Daily Statistics – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Table showing total quantity per day for each leader, along with the average on active days."
          >
            {renderDailyStatistics(
              statistics,
              leaders.map((l) => l.trim()),
              daysInMonth
            )}
          </ToggleBlock>

          {/* Деталізація */}
          <ToggleBlock
            title={`Detailed Daily Info – ${reportTitle}`}
            defaultOpen={false}
            tooltip="Detailed table showing tasks and products completed by each leader on each day of the selected month."
          >
            {renderDetailedDailyInfo(
              statistics,
              leaders.map((l) => l.trim()),
              daysInMonth,
              selectedMonth
            )}
          </ToggleBlock>
        </>
      ) : (
        <p>No data available for the selected month and leaders.</p>
      )}
    </div>
  );
};

export default MonthlyLeaderStatistics;
