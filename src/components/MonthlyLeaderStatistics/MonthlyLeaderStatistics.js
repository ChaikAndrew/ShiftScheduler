import React, { useState } from "react";
import { getLeaderStatisticsForMonth } from "../../utils/leaderStatisticsHelpers";
import { renderDailyStatistics } from "./renderDailyStatistics";
import { renderMonthlySummary } from "./renderMonthlySummary";
import { exportDailyStatisticsToPDF } from "../../utils/exportDailyStatisticsToPDF";
import { exportMonthlySummaryToPDF } from "../../utils/exportMonthlySummaryToPDF";

const MonthlyLeaderStatistics = ({ entries, leaders }) => {
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const [selectedDate, setSelectedDate] = useState(""); // Стан для обраної дати

  const statistics = getLeaderStatisticsForMonth(
    entries,
    leaders,
    selectedMonth
  );

  const dailyData = leaders.flatMap((leader) =>
    statistics[leader].map((day, index) => ({
      Leader: leader,
      Day: index + 1,
      Total: day.total,
      ...day.taskSummary,
      ...day.productSummary,
    }))
  );

  const summaryData = leaders.map((leader) => {
    const total = statistics[leader].reduce((sum, day) => sum + day.total, 0);
    const taskSummary = statistics[leader].reduce(
      (acc, day) => {
        Object.keys(day.taskSummary).forEach((task) => {
          acc[task] += day.taskSummary[task];
        });
        return acc;
      },
      { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 }
    );

    const productSummary = statistics[leader].reduce(
      (acc, day) => {
        Object.keys(day.productSummary).forEach((product) => {
          acc[product] += day.productSummary[product];
        });
        return acc;
      },
      {
        "T-shirts": 0,
        Hoodie: 0,
        Bags: 0,
        Sleeves: 0,
        Children: 0,
        Others: 0,
      }
    );

    return {
      Leader: leader,
      Total: total,
      ...taskSummary,
      ...productSummary,
    };
  });

  const handleExportDaily = () => {
    if (!selectedDate) {
      alert("Please select a date for the export.");
      return;
    }

    const filteredData = dailyData.filter((row) => {
      const rowDate = new Date(
        selectedMonth.year,
        selectedMonth.month,
        row.Day
      );
      const exportDate = new Date(selectedDate);
      return (
        rowDate.getFullYear() === exportDate.getFullYear() &&
        rowDate.getMonth() === exportDate.getMonth() &&
        rowDate.getDate() === exportDate.getDate()
      );
    });

    exportDailyStatisticsToPDF(
      filteredData,
      `Daily_Statistics_${selectedDate}`
    );
  };

  return (
    <div>
      <h1>Monthly Leader Statistics</h1>

      {/* Вибір місяця і року */}
      <div>
        <label>
          Select Month:
          <select
            value={selectedMonth.month}
            onChange={(e) =>
              setSelectedMonth((prev) => ({
                ...prev,
                month: parseInt(e.target.value, 10),
              }))
            }
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </label>

        <label>
          Select Year:
          <select
            value={selectedMonth.year}
            onChange={(e) =>
              setSelectedMonth((prev) => ({
                ...prev,
                year: parseInt(e.target.value, 10),
              }))
            }
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - 2 + i}>
                {new Date().getFullYear() - 2 + i}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Відображення таблиць */}
      {renderDailyStatistics(statistics, leaders, 31)}

      {/* Поле для вибору дати */}
      <div>
        <label>
          Select Date for Daily Export:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      <button onClick={handleExportDaily}>
        Export Daily Statistics to PDF
      </button>
      {renderMonthlySummary(statistics, leaders)}
      <button
        onClick={() =>
          exportMonthlySummaryToPDF(
            summaryData,
            "Monthly_Summary_Statistics",
            selectedMonth
          )
        }
      >
        Export Monthly Summary to PDF
      </button>
    </div>
  );
};

export default MonthlyLeaderStatistics;
