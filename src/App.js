import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link } from "react-router-dom"; // Додаємо імпорти для маршрутизації
import "./styles.css";

import {
  machines,
  operators,
  tasks,
  products,
  colors,
  reasons,
  leaders,
} from "./utils/constants";

import {
  calculateSummary,
  calculateOverallSummary,
} from "./utils/calculateSummaries";

import { handleSaveEntry } from "./utils/entryHandlers";
import {
  handleShiftChange,
  handleDateChange,
  handleEditEntry,
  handleDeleteEntry,
} from "./utils/entryActions";

import { filterEntries } from "./utils/filterEntries";

import ShiftButtons from "./components/ShiftButtons/ShiftButtons";
import SelectionFields from "./components/SelectionFields/SelectionFields";
import EntryForm from "./components/EntryForm/EntryForm";

import DateSelector from "./components/DateSelector/DateSelector";
import OverallSummary from "./components/OverallSummary/OverallSummary";
import TotalSummary from "./components/TotalSummary/TotalSummary";
import ProductSummary from "./components/ProductSummary/ProductSummary";
import OperatorSummary from "./components/OperatorSummary/OperatorSummary";
import TaskSummary from "./components/TaskSummary/TaskSummary";
import NoDataMessage from "./components/NoDataMessage/NoDataMessage";
import SummaryHeader from "./components/SummaryHeader/SummaryHeader";
import EntryTable from "./components/EntryTable/EntryTable";

import SearchByZlecenieName from "./components/SearchByZlecenieName/SearchByZlecenieName";
import OperatorStatistics from "./components/OperatorStatistics/OperatorStatistics";

function App() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("entries");
    return savedEntries
      ? JSON.parse(savedEntries)
      : { first: {}, second: {}, third: {} };
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLeader, setSelectedLeader] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [showMachineSummary, setShowMachineSummary] = useState(false);
  const [showUpButton, setShowUpButton] = useState(false);

  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    task: "",
    customTaskName: "",
    product: "",
    color: "",
    reason: "",
    quantity: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  const onSaveEntry = () => {
    handleSaveEntry({
      form,
      currentShift,
      selectedDate,
      selectedLeader,
      selectedMachine,
      selectedOperator,
      entries,
      setEntries,
      setEditingIndex,
      setForm,
      editingIndex,
    });
  };

  const filteredEntries = filterEntries(
    entries,
    currentShift,
    selectedMachine,
    selectedDate
  );

  const summary = calculateSummary(filteredEntries, operators, products);
  const overallSummary = calculateOverallSummary(
    entries,
    selectedDate,
    currentShift,
    products
  );

  // Перевіряє, чи є дані для загальної кількості, робочого часу або простою
  const isTotalDataAvailable =
    summary.totalQuantity > 0 ||
    summary.totalWorkingTime > 0 ||
    summary.totalDowntime > 0;

  // Перевіряє, чи є дані для загальної кількості по всіх машинах
  const isOverallQuantityAvailable = overallSummary.overallTotalQuantity > 0;

  // Перевіряє, чи є дані у підсумку завдань по всіх машинах
  const isOverallTaskSummaryAvailable = Object.values(
    overallSummary.overallTaskSummary
  ).some((value) => value > 0);

  // Перевіряє, чи є дані у підсумку продуктів по всіх машинах
  const isOverallProductSummaryAvailable = Object.values(
    overallSummary.overallProductSummary
  ).some((value) => value > 0);

  // Перевіряє, чи є дані у підсумку завдань для обраної зміни
  const isTaskSummaryAvailable = Object.values(summary.taskSummary).some(
    (value) => value > 0
  );

  // Перевіряє, чи є дані у підсумку продуктів для обраної зміни
  const isProductSummaryAvailable = Object.values(summary.productSummary).some(
    (value) => value > 0
  );

  // Перевіряє, чи є дані по операторах (перевіряється загальна кількість для кожного оператора)
  const isOperatorDataAvailable = operators.some(
    (operator) => summary.operatorSummary[operator]?.total > 0
  );

  // Функція для обробки зміни дати
  const handleDateChangeLocal = (newDate) => {
    handleDateChange(
      newDate,
      setSelectedDate,
      setCurrentShift,
      setSelectedLeader,
      setSelectedMachine,
      setSelectedOperator
    );
  };

  // Функція для обробки редагування запису
  const handleEdit = (index) => {
    handleEditEntry(
      index,
      entries,
      currentShift,
      selectedMachine,
      setForm,
      setEditingIndex,
      setError
    );
  };

  // Функція для обробки видалення запису
  const handleDelete = (index) => {
    handleDeleteEntry(
      index,
      entries,
      currentShift,
      selectedMachine,
      setEntries
    );
  };

  // Головна перевірка наявності будь-яких даних для відображення
  const isDataAvailable =
    isTotalDataAvailable ||
    isOverallQuantityAvailable ||
    isOverallTaskSummaryAvailable ||
    isOverallProductSummaryAvailable ||
    isTaskSummaryAvailable ||
    isProductSummaryAvailable ||
    isOperatorDataAvailable;

  // Створюємо реф для machine-summary
  const machineSummaryRef = useRef(null);

  // Функція для зміни видимості
  const toggleMachineSummary = () => {
    setShowMachineSummary((prev) => {
      const newShowMachineSummary = !prev;
      if (!prev) {
        // Якщо відкриваємо machine-summary, прокручуємо до кінця сторінки
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
        }, 100); // Додаємо невеликий тайм-аут для надійності
      }
      return newShowMachineSummary;
    });
  };

  useEffect(() => {
    if (showMachineSummary) {
      // Прокрутка до кінця сторінки після зміни стану на видимий
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [showMachineSummary]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        // Кількість пікселів до появи кнопки
        setShowUpButton(true);
      } else {
        setShowUpButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container">
      <nav>
        {/* Посилання на сторінки */}
        <Link to="/">Shift Scheduler</Link> |
        <Link to="/operator-statistics">Статистика по операторам</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              {/* Заголовок та кнопки вибору зміни */}
              <div className="header-main-input">
                <h2>Shift Scheduler</h2>
                {/* DateSelector */}
                {/* Компонент вибору дати */}
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={handleDateChangeLocal}
                />

                {/*Компонент ShiftButtons відповідає за відображення кнопок вибору зміни (Shift 1, Shift 2, Shift 3)*/}
                <ShiftButtons
                  currentShift={currentShift}
                  selectedDate={selectedDate}
                  handleShiftChange={(shift) =>
                    handleShiftChange(
                      shift,
                      setCurrentShift,
                      setSelectedLeader,
                      setSelectedMachine,
                      setSelectedOperator
                    )
                  }
                />
                {/*Компонент SelectionFields відповідає за відображення полів вибору для лідера, машини та оператора*/}
                <SelectionFields
                  selectedLeader={selectedLeader}
                  setSelectedLeader={setSelectedLeader}
                  leaders={leaders}
                  selectedMachine={selectedMachine}
                  setSelectedMachine={setSelectedMachine}
                  machines={machines}
                  selectedOperator={selectedOperator}
                  setSelectedOperator={setSelectedOperator}
                  operators={operators}
                />

                {/*Компонент EntryForm рендерить форму для введення/редагування запису, що включає час, завдання, продукт, колір, причину та кількість*/}
                <EntryForm
                  form={form}
                  setForm={setForm}
                  tasks={tasks}
                  products={products}
                  colors={colors}
                  reasons={reasons}
                  onSaveEntry={onSaveEntry}
                  editingIndex={editingIndex}
                />
              </div>

              {/* Відображення помилок */}
              {error && <p style={{ color: "red" }}>{error}</p>}
              {/* SummaryHeader */}
              {/* Заголовок підсумків по конкретній машині*/}
              <SummaryHeader
                totalQuantity={summary.totalQuantity}
                totalWorkingTime={summary.totalWorkingTime}
                totalDowntime={summary.totalDowntime}
                selectedDate={selectedDate}
                currentShift={currentShift}
                selectedMachine={selectedMachine}
              />
              {/* Відображення записів */}
              {filteredEntries.length > 0 && (
                <EntryTable
                  entries={filteredEntries}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {/* Додаємо компонент пошуку */}
              <SearchByZlecenieName entries={entries} />

              {/* Підсумки */}
              <div className="summary">
                <div className="all-summary-statistics">
                  {/* NoDataMessage */}
                  {/* Заголовок, який відображається, якщо всі показники 0 */}
                  {!isDataAvailable && (
                    <NoDataMessage
                      selectedDate={selectedDate}
                      currentShift={currentShift}
                    />
                  )}

                  {/* Контент, який відображається, якщо є хоча б один показник > 0
          головна статистика по змніні  Overall Total Summary*/}
                  {isDataAvailable && (
                    <div className="main-summary">
                      {/* OverallSummary */}
                      {!selectedMachine && selectedDate && currentShift && (
                        <OverallSummary overallSummary={overallSummary} />
                      )}
                    </div>
                  )}
                </div>
                {/* Кнопка для показу/приховування machine-summary */}
                {selectedMachine && (
                  <button
                    onClick={toggleMachineSummary}
                    className="btn-summary"
                  >
                    {showMachineSummary ? "Hide Summary" : "Show Summary"}
                  </button>
                )}

                {/* Контент, який показується або приховується */}
                {showMachineSummary && selectedMachine && (
                  <div className="machine-summary" ref={machineSummaryRef}>
                    {summary.totalQuantity === 0 &&
                    summary.totalWorkingTime === 0 &&
                    summary.totalDowntime === 0 &&
                    !Object.values(summary.operatorSummary).some(
                      (val) => val.total > 0
                    ) &&
                    !Object.values(summary.taskSummary).some(
                      (val) => val > 0
                    ) &&
                    !Object.values(summary.productSummary).some(
                      (val) => val > 0
                    ) ? (
                      <p style={{ color: "gray" }}>Ще нічого нема</p>
                    ) : (
                      <>
                        <TotalSummary
                          totalQuantity={summary.totalQuantity}
                          totalWorkingTime={summary.totalWorkingTime}
                          totalDowntime={summary.totalDowntime}
                          selectedMachine={selectedMachine}
                          selectedDate={selectedDate}
                          currentShift={currentShift}
                        />

                        <OperatorSummary
                          operators={operators}
                          operatorSummary={summary.operatorSummary}
                        />
                        <TaskSummary taskSummary={summary.taskSummary} />
                        <ProductSummary
                          productSummary={summary.productSummary}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              {showUpButton && (
                <button className="btn-up" onClick={scrollToTop}>
                  go up
                </button>
              )}
            </div>
          }
        ></Route>
        {/* Сторінка Статистика по операторам */}
        <Route
          path="/operator-statistics"
          element={
            <OperatorStatistics
              entries={entries}
              operators={operators}
              tasks={tasks}
              products={products}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
