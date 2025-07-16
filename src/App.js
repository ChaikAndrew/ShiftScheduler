import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import { DateTime } from "luxon";
import { ToastContainer } from "react-toastify";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import LoginPage from "../src/pages/LoginPage/LoginPage";
import AdminDashboard from "../src/pages/AdminDashboard/AdminDashboard";
import OperatorDashboard from "../src/pages/OperatorDashboard/OperatorDashboard";
import LeaderDashboard from "../src/pages/LeaderDashboard/LeaderDashboard";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import CustomDatePicker from "./components/CustomDatePicker/CustomDatePicker";
import StratyStatistics from "./pages/StratyStatistics/StratyStatistics";

import {
  machines,
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
import MonthlyOperatorStatistics from "./components/MonthlyOperatorStatistics/MonthlyOperatorStatistics";
import MonthlyLeaderStatistics from "./components/MonthlyLeaderStatistics/MonthlyLeaderStatistics";
import MachineStatistics from "./components/MachineTimeStats/MachineTimeStats";
import MonthlyMachineStatistics from "./components/MachinesQuantityStats/MachinesQuantityStats";

import ExportToExcel from "./components/ExportToExcel/ExportToExcel";

import NavBar from "./components/NavBar/NavBar";
import Footer from "./components/Footer/Footer";

import { handleSaveEntryToDB } from "../src/utils/entryHandlers";
import { getEntriesByMonth } from "../src/utils/api/shiftApi";
import { recalculateDowntime } from "./utils/recalculateDowntime";

import { FaArrowUp } from "react-icons/fa";

// Додамо AdminDashboard і OperatorDashboard пізніше

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() =>
    DateTime.now().toISODate()
  );
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("entries");
    return savedEntries
      ? JSON.parse(savedEntries)
      : { first: {}, second: {}, third: {} };
  });

  const navigate = useNavigate();
  const location = useLocation();
  // Функція поза useEffect
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!selectedDate) return;

    const dt = DateTime.fromISO(selectedDate);
    const year = dt.year;
    const month = dt.month;

    try {
      const response = await getEntriesByMonth(year, month, token);
      const dbEntries = response.data;

      const grouped = { first: {}, second: {}, third: {} };
      dbEntries.forEach((entry) => {
        const { shift, machine } = entry;
        if (!grouped[shift][machine]) {
          grouped[shift][machine] = [];
        }
        grouped[shift][machine].push(entry);
      });

      let fullyRecalculated = { ...grouped };
      for (const shift in grouped) {
        for (const machine in grouped[shift]) {
          fullyRecalculated = recalculateDowntime(
            fullyRecalculated,
            shift,
            machine
          );
        }
      }

      setEntries(fullyRecalculated);
    } catch (err) {
      console.error("❌ Не вдалося завантажити записи за місяць:", err.message);
    }
  }, [selectedDate]); // ← залежність

  // А тепер useEffect виглядає ок:
  useEffect(() => {
    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate, fetchData]);
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          const expirationDate = new Date(decoded.exp * 1000).toLocaleString();

          if (decoded.exp * 1000 < Date.now()) {
            console.warn("⏰ Токен протермінований");
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            navigate("/login");
          } else {
            console.log("✅ Токен чинний до:", expirationDate);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error("❌ Помилка токена:", err);
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          navigate("/login");
        }
      } else {
        setIsAuthenticated(false);
        navigate("/login");
      }
      setIsCheckingToken(false);
    };

    checkTokenExpiration();
  }, [navigate]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);

  const [selectedLeader, setSelectedLeader] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [showMachineSummary, setShowMachineSummary] = useState(false);
  const [showUpButton, setShowUpButton] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          "https://shift-scheduler-server.vercel.app/api/operators",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setOperators(data.map((op) => op.name.trim()));
      } catch (err) {
        console.error("❌ Не вдалося завантажити операторів:", err.message);
      }
    };

    if (isAuthenticated) {
      fetchOperators();
    }
  }, [isAuthenticated]);

  const onSaveEntry = () => {
    const token = localStorage.getItem("token");

    handleSaveEntryToDB({
      form,
      currentShift,
      selectedDate,
      selectedLeader,
      selectedMachine,
      selectedOperator,
      setForm,
      editingIndex,
      editingEntryId,
      token,
      onSuccess: async () => {
        try {
          const dt = DateTime.fromISO(selectedDate);
          const response = await getEntriesByMonth(dt.year, dt.month, token);
          const dbEntries = response.data;

          const grouped = { first: {}, second: {}, third: {} };
          dbEntries.forEach((entry) => {
            const { shift, machine } = entry;
            if (!grouped[shift]) grouped[shift] = {};
            if (!grouped[shift][machine]) grouped[shift][machine] = [];
            grouped[shift][machine].push(entry);
          });

          grouped[currentShift][selectedMachine].sort(
            (a, b) => new Date(a.startTime) - new Date(b.startTime)
          );

          let fullyRecalculated = { ...grouped };
          for (const machine in grouped[currentShift]) {
            fullyRecalculated = recalculateDowntime(
              fullyRecalculated,
              currentShift,
              machine
            );
          }

          setEntries(fullyRecalculated);
          setEditingIndex(null);
          setEditingEntryId(null);
          setForm({
            startTime: "",
            endTime: "",
            task: "",
            customTaskName: "",
            product: "",
            color: "",
            reason: "",
            quantity: 0,
          });
          console.log("✅ Дані оновлено з правильним downtime");
        } catch (error) {
          console.error("❌ Помилка при оновленні entries:", error.message);
        }
      },
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

  // Функція для обробки редагування запису
  const handleEdit = (index) => {
    let dateToUse = selectedDate;

    if (typeof dateToUse !== "string") {
      console.warn("selectedDate is not a string. Converting to ISODate...");
      dateToUse = new Date(dateToUse).toISOString().split("T")[0]; // Перетворення в ISO формат
    }
    console.log("Selected Date before edit:", selectedDate);
    console.log("Selected Date in handleEdit:", dateToUse);
    console.log("Current Shift:", currentShift);
    console.log("Selected Machine:", selectedMachine);

    handleEditEntry(
      index,
      entries,
      currentShift,
      selectedMachine,
      setForm,
      setEditingIndex,
      setEditingEntryId,
      setError,
      dateToUse // Передаємо оброблену дату
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

  //перевіряємо, чи всі необхідні поля в <SelectionFields /> заповнені.
  const isSelectionComplete =
    selectedLeader && selectedMachine && selectedOperator;

  //оновлюємо коментар
  const handleUpdateEntryComment = (updatedEntry) => {
    setEntries((prev) => {
      const updated = { ...prev };
      const list = updated[updatedEntry.shift]?.[updatedEntry.machine];
      if (list) {
        const index = list.findIndex((e) => e._id === updatedEntry._id);
        if (index !== -1) {
          list[index] = updatedEntry;
        }
      }
      return updated;
    });

    // ⬅️ Тригеримо оновлення компонента
    setRefreshKey((prev) => prev + 1);
  };

  const [isCollapsed, setIsCollapsed] = useState(true);
  if (isCheckingToken) {
    return <div>Loading...</div>; // або твій кастомний спінер
  }
  return (
    <div className={`app-container ${isCollapsed ? "collapsed" : ""}`}>
      {isAuthenticated && location.pathname !== "/login" && (
        <NavBar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setIsSearchModalOpen={setIsSearchModalOpen}
        />
      )}
      <SearchByZlecenieName
        entries={entries}
        isModalOpen={isSearchModalOpen}
        setIsModalOpen={setIsSearchModalOpen}
      />

      <div className={`content container`}>
        <ToastContainer />
        <Routes>
          <Route
            path="/shift-scheduler"
            element={
              <PrivateRoute allowedRoles={["operator", "admin", "leader"]}>
                <div>
                  {/* Заголовок та кнопки вибору зміни */}

                  <div className="header-main-input">
                    <h2>Shift Scheduler</h2>
                    {/* DateSelector */}
                    {/* Компонент вибору дати */}
                    <CustomDatePicker
                      selectedDate={selectedDate}
                      onDateChange={(isoDate) =>
                        handleDateChange(
                          isoDate,
                          setSelectedDate,
                          setCurrentShift,
                          setSelectedLeader,
                          setSelectedMachine,
                          setSelectedOperator
                        )
                      }
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
                      selectedLeader={selectedLeader}
                      selectedMachine={selectedMachine}
                      selectedOperator={selectedOperator}
                      disabled={!isSelectionComplete}
                      currentShift={currentShift} /// Додаємо проп для блокування форми
                      className={editingIndex !== null ? "editing-form" : ""} // Додаємо клас
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
                      key={refreshKey} // 🆕 Перемалює компонент при кожному збереженні
                      entries={filteredEntries
                        .sort(
                          (a, b) =>
                            new Date(a.startTime) - new Date(b.startTime)
                        )
                        .map((entry) => ({
                          ...entry,
                          originalIndex: entries[currentShift]?.[
                            selectedMachine
                          ]?.findIndex((e) => e === entry),
                        }))}
                      onEdit={(filteredIndex, originalIndex) =>
                        handleEdit(filteredIndex, originalIndex)
                      }
                      onDelete={(filteredIndex) =>
                        handleDeleteEntry(
                          filteredIndex,
                          entries,
                          currentShift,
                          selectedMachine,
                          setEntries,
                          selectedDate,
                          localStorage.getItem("token") // ⬅️ передаємо токен
                        )
                      }
                      onUpdateEntry={handleUpdateEntryComment} // 🆕 ⬅️ Ось це
                    />
                  )}

                  {/* Додаємо компонент пошуку */}

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
                          <p style={{ color: "gray" }}>
                            Data for this machine is not available in the
                            database
                          </p>
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
                    <button
                      className="btn-up"
                      onClick={scrollToTop}
                      title="Go up"
                    >
                      <FaArrowUp size={20} />
                    </button>
                  )}
                </div>
              </PrivateRoute>
            }
          ></Route>
          {/* Сторінка Статистика по операторам */}

          <Route
            path="/monthly-statistics"
            element={
              <PrivateRoute allowedRoles={["admin", "leader"]}>
                <MonthlyOperatorStatistics
                  entries={entries}
                  operators={operators}
                  selectedMonth={{
                    month: new Date().getMonth(),
                    year: new Date().getFullYear(),
                  }}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/leader-statistics"
            element={
              <PrivateRoute allowedRoles={["admin", "leader"]}>
                <MonthlyLeaderStatistics
                  entries={entries}
                  leaders={leaders}
                  tasks={tasks}
                  products={products}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/machine-time-stats"
            element={
              <PrivateRoute allowedRoles={["admin", "leader"]}>
                <MachineStatistics entries={entries} machines={machines} />
              </PrivateRoute>
            }
          />
          <Route
            path="/machines-quantity-stats"
            element={
              <PrivateRoute allowedRoles={["admin", "leader"]}>
                <MonthlyMachineStatistics
                  entries={entries}
                  machines={machines}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/operator-statistics"
            element={
              <PrivateRoute allowedRoles={["leader", "admin"]}>
                <OperatorStatistics
                  entries={entries}
                  operators={operators}
                  tasks={tasks}
                  products={products}
                />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-dashboard"
            element={
              <PrivateRoute allowedRoles={["operator", "leader", "admin"]}>
                <LeaderDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/operator-dashboard"
            element={
              <PrivateRoute allowedRoles={["operator", "leader", "admin"]}>
                <OperatorDashboard />
              </PrivateRoute>
            }
          />

          <Route path="/straty-statistics" element={<StratyStatistics />} />

          <Route
            path="/export-to-excel"
            element={
              <PrivateRoute allowedRoles={["admin", "leader"]}>
                <ExportToExcel
                  entries={entries}
                  selectedDate={selectedDate}
                  currentShift={currentShift}
                  leaders={leaders}
                />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<h2>404 - Сторінка не знайдена</h2>} />
        </Routes>

        <Footer className="footer" />
      </div>
    </div>
  );
}
export default App;
