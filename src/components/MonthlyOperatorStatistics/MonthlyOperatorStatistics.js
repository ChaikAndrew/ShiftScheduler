import React, { useState } from "react";
import style from "./MonthlyOperatorStatistics.module.scss";

import { calculateWorkTime } from "../../utils/timeCalculations";
import { formatTime } from "../../utils/formatTime";

const MonthlyOperatorStatistics = ({ entries, operators, products }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState({
    year: currentYear,
    month: currentMonth,
  });

  const daysInMonth = new Date(
    selectedMonth.year,
    selectedMonth.month + 1,
    0
  ).getDate();

  const getOperatorStatisticsForMonth = () => {
    const statistics = {};

    operators.forEach((operator) => {
      statistics[operator] = Array(daysInMonth).fill({
        total: 0,
        taskSummary: { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 },
        productSummary: {
          "T-shirts": 0,
          Hoodie: 0,
          Bags: 0,
          Sleeves: 0,
          Children: 0,
          Others: 0,
        },
      });
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

        let taskSummary = { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 };
        let productSummary = {
          "T-shirts": 0,
          Hoodie: 0,
          Bags: 0,
          Sleeves: 0,
          Children: 0,
          Others: 0,
        };
        let total = 0;

        operatorEntries.forEach((entry) => {
          const task = entry.task;
          const quantity = parseInt(entry.quantity, 10) || 0;
          if (task === "POD") {
            taskSummary.POD += quantity;
          } else if (task === "POF") {
            taskSummary.POF += quantity;
          } else if (task === "Test") {
            taskSummary.Test += quantity;
          } else if (task === "Sample") {
            taskSummary.Sample += quantity;
          } else {
            taskSummary.Zlecenie += quantity;
          }
          total += quantity;

          if (entry.product in productSummary) {
            productSummary[entry.product] += quantity;
          }
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
          Object.keys(data.taskSummary).forEach((task) => {
            acc.taskSummary[task] += data.taskSummary[task];
          });
          Object.keys(data.productSummary).forEach((product) => {
            acc.productSummary[product] += data.productSummary[product];
          });
          return acc;
        },
        {
          total: 0,
          taskSummary: { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 },
          productSummary: {
            "T-shirts": 0,
            Hoodie: 0,
            Bags: 0,
            Sleeves: 0,
            Children: 0,
            Others: 0,
          },
        }
      );

      return { operator, ...monthlyTotal };
    })
    .filter((total) => total.total > 0) // Фільтруємо операторів без показників
    .sort((a, b) => b.total - a.total);

  const totalStatistics = sortedMonthlyTotals.reduce(
    (acc, operatorData) => {
      acc.total += operatorData.total;
      Object.keys(operatorData.taskSummary).forEach((task) => {
        acc.taskSummary[task] += operatorData.taskSummary[task];
      });
      Object.keys(operatorData.productSummary).forEach((product) => {
        acc.productSummary[product] += operatorData.productSummary[product];
      });
      return acc;
    },
    {
      total: 0,
      taskSummary: { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 },
      productSummary: {
        "T-shirts": 0,
        Hoodie: 0,
        Bags: 0,
        Sleeves: 0,
        Children: 0,
        Others: 0,
      },
    }
  );

  const filteredEntries = Object.values(entries)
    .flatMap((shiftEntries) => Object.values(shiftEntries).flat())
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === selectedMonth.month &&
        entryDate.getFullYear() === selectedMonth.year
      );
    });

  // 🔹 Обчислення робочого часу операторів та продуктивності
  const operatorEfficiency = {};

  filteredEntries.forEach((entry) => {
    const { operator, startTime, endTime, quantity, product } = entry;

    if (!operatorEfficiency[operator]) {
      operatorEfficiency[operator] = {
        totalWorkHours: 0,
        totalProducts: 0,
        productDetails: {},
      };
    }

    const { workingTime } = calculateWorkTime(startTime, endTime);
    const workHours = workingTime / 60; // Конвертуємо хвилини в години

    operatorEfficiency[operator].totalWorkHours += workHours;
    operatorEfficiency[operator].totalProducts += quantity;

    if (!operatorEfficiency[operator].productDetails[product]) {
      operatorEfficiency[operator].productDetails[product] = {
        total: 0,
        workHours: 0, // 🔹 Додаємо окремий час для кожного продукту
        speed: 0,
      };
    }

    operatorEfficiency[operator].productDetails[product].total += quantity;
    operatorEfficiency[operator].productDetails[product].workHours += workHours; // 🔥 Вставити тут!
  });

  // Отримуємо назву вибраного місяця
  const formattedMonth = new Date(
    selectedMonth.year,
    selectedMonth.month
  ).toLocaleString("en-US", {
    month: "long",
  });

  // Формуємо заголовок
  const reportTitle = `${formattedMonth} ${selectedMonth.year}`;

  return (
    <div className={style.container}>
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

      <h3 className={style.title}>Daily Operator Statistics – {reportTitle}</h3>
      <table className={style.table}>
        <thead>
          <tr>
            <th>Operator</th>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <th key={i}>{i + 1}</th>
            ))}
            <th>Average per Day</th>
          </tr>
        </thead>
        <tbody>
          {sortedMonthlyTotals.map((total) => {
            // Розраховуємо кількість днів з даними для цього оператора
            const daysWithRecords = monthlyStatistics[total.operator].filter(
              (data) => data.total > 0
            ).length;

            // Якщо є дні з даними, обчислюємо середнє, інакше ставимо "0"
            const averagePerDay =
              daysWithRecords > 0
                ? Math.round(total.total / daysWithRecords)
                : "0";

            return (
              <tr key={total.operator}>
                <td>{total.operator}</td>
                {monthlyStatistics[total.operator].map((data, index) => (
                  <td key={index}>{data.total || ""}</td>
                ))}
                <td>{averagePerDay}</td>
                {/* Відображення середнього значення */}
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 className={style.title}>Monthly Total Summary - {reportTitle}</h3>
      <table className={style.table}>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Total Quantity</th>
            <th>POD</th>
            <th>POF</th>
            <th>Zlecenie</th>
            <th>Sample</th>
            <th>Test</th>
            <th>T-shirts</th>
            <th>Hoodie</th>
            <th>Bags</th>
            <th>Sleeves</th>
            <th>Children</th>
            <th>Others</th>
          </tr>
        </thead>
        <tbody>
          {sortedMonthlyTotals.map((total) => (
            <tr key={total.operator}>
              <td>{total.operator}</td>
              <td>{total.total || ""}</td>
              <td>{total.taskSummary.POD || ""}</td>
              <td>{total.taskSummary.POF || ""}</td>
              <td>{total.taskSummary.Zlecenie || ""}</td>
              <td>{total.taskSummary.Sample || ""}</td>
              <td>{total.taskSummary.Test || ""}</td>
              <td>{total.productSummary["T-shirts"] || ""}</td>
              <td>{total.productSummary.Hoodie || ""}</td>
              <td>{total.productSummary.Bags || ""}</td>
              <td>{total.productSummary.Sleeves || ""}</td>
              <td>{total.productSummary.Children || ""}</td>
              <td>{total.productSummary.Others || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className={style.title}>
        Overall Monthly Statistics - {reportTitle}, ( All operators )
      </h3>
      <table className={style.table}>
        <thead>
          <tr>
            <th>Total Quantity</th>
            <th>POD</th>
            <th>POF</th>
            <th>Zlecenie</th>
            <th>Sample</th>
            <th>Test</th>
            <th>T-shirts</th>
            <th>Hoodie</th>
            <th>Bags</th>
            <th>Sleeves</th>
            <th>Children</th>
            <th>Others</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{totalStatistics.total || ""}</td>
            <td>{totalStatistics.taskSummary.POD || ""}</td>
            <td>{totalStatistics.taskSummary.POF || ""}</td>
            <td>{totalStatistics.taskSummary.Zlecenie || ""}</td>
            <td>{totalStatistics.taskSummary.Sample || ""}</td>
            <td>{totalStatistics.taskSummary.Test || ""}</td>
            <td>{totalStatistics.productSummary["T-shirts"] || ""}</td>
            <td>{totalStatistics.productSummary.Hoodie || ""}</td>
            <td>{totalStatistics.productSummary.Bags || ""}</td>
            <td>{totalStatistics.productSummary.Sleeves || ""}</td>
            <td>{totalStatistics.productSummary.Children || ""}</td>
            <td>{totalStatistics.productSummary.Others || ""}</td>
          </tr>
        </tbody>
      </table>

      <h3 className={style.title}>Operator Work Efficiency – {reportTitle}</h3>
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
          {Object.keys(operatorEfficiency).map((operator) => {
            const data = operatorEfficiency[operator];
            const avgSpeed = data.totalWorkHours
              ? (data.totalProducts / data.totalWorkHours).toFixed(2)
              : 0;

            return (
              <tr key={operator}>
                <td>{operator}</td>
                <td>{formatTime(data.totalWorkHours * 60)}</td>
                <td>{data.totalProducts}</td>
                <td>{avgSpeed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 className={style.title}>
        Detailed Product Breakdown – {reportTitle}
      </h3>
      <table className={style.table}>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Product</th>
            <th>Total Produced</th>
            <th>Speed (units/hr)</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(operatorEfficiency).map((operator) => {
            const productDetails = Object.keys(
              operatorEfficiency[operator].productDetails
            )
              .filter(
                (product) =>
                  operatorEfficiency[operator].productDetails[product].total > 0
              )
              .map((product) => {
                const details =
                  operatorEfficiency[operator].productDetails[product];
                const productSpeed =
                  details.workHours > 0
                    ? (details.total / details.workHours).toFixed(2)
                    : "-";
                return {
                  product,
                  total: details.total,
                  speed: productSpeed,
                };
              });

            if (productDetails.length === 0) return null; // Пропускаємо операторів без продуктів

            return (
              <React.Fragment key={operator}>
                <tr>
                  <td
                    rowSpan={productDetails.length}
                    className={style.operatorName}
                  >
                    {operator}
                  </td>
                  <td>{productDetails[0].product}</td>
                  <td>{productDetails[0].total}</td>
                  <td>{productDetails[0].speed}</td>
                </tr>
                {productDetails.slice(1).map((entry) => (
                  <tr key={`${operator}-${entry.product}`}>
                    <td>{entry.product}</td>
                    <td>{entry.total}</td>
                    <td>{entry.speed}</td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyOperatorStatistics;
