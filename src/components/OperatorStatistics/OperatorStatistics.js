import React, { useState } from "react";
import { calculateSummary } from "../../utils/calculateSummaries"; // Імпорт функції
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
  const [selectedOperators, setSelectedOperators] = useState([]);

  const handleViewTypeChange = (e) => setViewType(e.target.value);
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);

  const handleOperatorSelection = (operator) => {
    setSelectedOperators((prevSelected) =>
      prevSelected.includes(operator)
        ? prevSelected.filter((op) => op !== operator)
        : [...prevSelected, operator]
    );
  };

  const filteredEntries = entries
    ? Object.entries(entries).flatMap(([shift, machines]) =>
        Object.values(machines || {}).flatMap((machineEntries) =>
          (machineEntries || []).filter((entry) => {
            const isOperatorSelected = selectedOperators.includes(
              entry.operator
            );
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
        )
      )
    : [];

  const summary = calculateSummary(filteredEntries, operators, products);

  // Підрахунок загальної суми для завдань та продуктів
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
      <h2 className={style.header}>Статистика по операторам</h2>

      {/* Вибір типу перегляду */}
      <div className={style.viewTypeSelection}>
        <div className={style.radioGroup}>
          <label>
            <input
              type="radio"
              name="viewType"
              value="day"
              checked={viewType === "day"}
              onChange={handleViewTypeChange}
            />
            По даті
          </label>
          <label>
            <input
              type="radio"
              name="viewType"
              value="month"
              checked={viewType === "month"}
              onChange={handleViewTypeChange}
            />
            За місяць
          </label>
        </div>
      </div>

      {/* Вибір дати або місяця */}
      <div className={style.dateSelection}>
        {viewType === "day" && (
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className={style.dateInput}
          />
        )}
        {viewType === "month" && (
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className={style.monthInput}
          />
        )}
      </div>

      {/* Вибір операторів */}
      <div className={style.operatorSelection}>
        <h3>Оператори</h3>
        <div className={style.operatorCheckboxGroup}>
          {operators.map((operator) => (
            <label key={operator} className={style.operatorLabel}>
              <input
                type="checkbox"
                checked={selectedOperators.includes(operator)}
                onChange={() => handleOperatorSelection(operator)}
              />
              {operator}
            </label>
          ))}
        </div>
      </div>

      {/* Відображення результатів */}
      <div className={style.resultTables}>
        <h3>Результати</h3>
        {selectedOperators.length > 0 ? (
          <>
            {/* Таблиця завдань */}
            <div className={style.tableContainer}>
              <h4>Підсумок по завданнях</h4>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Завдання</th>
                    <th>Кількість</th>
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
                  {/* Рядок для загальної кількості */}
                  <tr>
                    <td>
                      <strong>Загалом</strong>
                    </td>
                    <td>
                      <strong>{totalTaskQuantity}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Таблиця продуктів */}
            <div className={style.tableContainer}>
              <h4>Підсумок по продуктах</h4>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Продукт</th>
                    <th>Кількість</th>
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
                  {/* Рядок для загальної кількості */}
                  <tr>
                    <td>
                      <strong>Загалом</strong>
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
            Виберіть оператора для перегляду статистики
          </p>
        )}
      </div>
    </div>
  );
}

export default OperatorStatistics;
