import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
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

import { formatTime } from "./utils/formatTime";

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

  return (
    <div className="container">
      {/* Заголовок та кнопки вибору зміни */}

      <div className="header-main-input">
        <h2>Shift Scheduler</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) =>
            handleDateChange(
              e.target.value,
              setSelectedDate,
              setCurrentShift,
              setSelectedLeader,
              setSelectedMachine,
              setSelectedOperator
            )
          }
          placeholder="Select Date"
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

      {/* Відображення записів */}
      {filteredEntries.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Shift</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Leader</th>
              <th>Machine</th>
              <th>Operator</th>
              <th>Task</th>
              <th>Product</th>
              <th>Color</th>
              <th>Reason</th>
              <th>Quantity</th>
              <th>Working Time</th>
              <th>Downtime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, index) => (
              <tr key={index}>
                <td>{entry.shift}</td>
                <td>{entry.displayDate}</td>
                <td>{DateTime.fromISO(entry.startTime).toFormat("HH:mm")}</td>
                <td>{DateTime.fromISO(entry.endTime).toFormat("HH:mm")}</td>
                <td>{entry.leader}</td>
                <td>{entry.machine}</td>
                <td>{entry.operator}</td>
                <td>{entry.task}</td>
                <td>{entry.product}</td>
                <td>{entry.color}</td>
                <td>{entry.reason}</td>
                <td>{entry.quantity}</td>
                <td>{formatTime(entry.workingTime)}</td>
                <td>{formatTime(entry.downtime)}</td>
                <td>
                  <button
                    className="edit"
                    onClick={() =>
                      handleEditEntry(
                        index,
                        entries,
                        currentShift,
                        selectedMachine,
                        setForm,
                        setEditingIndex,
                        setError
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete"
                    onClick={() =>
                      handleDeleteEntry(
                        index,
                        entries,
                        currentShift,
                        selectedMachine,
                        setEntries
                      )
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Підсумки */}
      <div className="summary">
        {/* Заголовок підсумків */}
        {summary.totalQuantity > 0 ||
        summary.totalWorkingTime > 0 ||
        summary.totalDowntime > 0 ? (
          <h3>
            Summary for {selectedDate} - Shift {currentShift}{" "}
            {selectedMachine && ` - Machine ${selectedMachine}`}
          </h3>
        ) : null}

        <div className="all-summary-statistics">
          {/* Заголовок, який відображається, якщо всі показники 0 */}
          {!(
            summary.totalQuantity > 0 ||
            summary.totalWorkingTime > 0 ||
            summary.totalDowntime > 0 ||
            overallSummary.overallTotalQuantity > 0 ||
            Object.values(overallSummary.overallTaskSummary).some(
              (value) => value > 0
            ) ||
            Object.values(overallSummary.overallProductSummary).some(
              (value) => value > 0
            ) ||
            summary.taskSummary.POD > 0 ||
            summary.taskSummary.POF > 0 ||
            summary.taskSummary.Zlecenie > 0 ||
            summary.taskSummary.Test > 0 ||
            Object.values(summary.productSummary).some((value) => value > 0) ||
            operators.some(
              (operator) => summary.operatorSummary[operator]?.total > 0
            )
          ) && (
            <h4>
              {selectedDate && currentShift
                ? `Data for ${selectedDate}, ${currentShift?.toUpperCase()} shift is not available in the database `
                : "Please select a date and shift to display data."}
            </h4>
          )}

          {/* Контент, який відображається, якщо є хоча б один показник > 0 */}
          {(summary.totalQuantity > 0 ||
            summary.totalWorkingTime > 0 ||
            summary.totalDowntime > 0 ||
            overallSummary.overallTotalQuantity > 0 ||
            Object.values(overallSummary.overallTaskSummary).some(
              (value) => value > 0
            ) ||
            Object.values(overallSummary.overallProductSummary).some(
              (value) => value > 0
            ) ||
            summary.taskSummary.POD > 0 ||
            summary.taskSummary.POF > 0 ||
            summary.taskSummary.Zlecenie > 0 ||
            summary.taskSummary.Test > 0 ||
            Object.values(summary.productSummary).some((value) => value > 0) ||
            operators.some(
              (operator) => summary.operatorSummary[operator]?.total > 0
            )) && (
            <div className="all-totals-for-shift">
              {/* Total Quantity */}
              <div className="total-quantity-shift">
                {summary.totalQuantity > 0 && (
                  <p>Total Quantity: {summary.totalQuantity}</p>
                )}
                {summary.totalWorkingTime > 0 && (
                  <p>
                    Total Working Time: {formatTime(summary.totalWorkingTime)}
                  </p>
                )}
                {summary.totalDowntime > 0 && (
                  <p>Total Downtime: {formatTime(summary.totalDowntime)}</p>
                )}

                {/* Overall Summaries */}
                {!selectedMachine && (
                  <>
                    {selectedDate && currentShift && (
                      <div className="summary-all-machines">
                        {overallSummary.overallTotalQuantity > 0 && (
                          <>
                            <h4>Overall Total Summary</h4>
                            <p>
                              Total Quantity:{" "}
                              {overallSummary.overallTotalQuantity}
                            </p>
                          </>
                        )}

                        {(overallSummary.overallTaskSummary.POD > 0 ||
                          overallSummary.overallTaskSummary.POF > 0 ||
                          overallSummary.overallTaskSummary.Zlecenie > 0 ||
                          overallSummary.overallTaskSummary.Test > 0) && (
                          <>
                            <h4>Overall Task Summary</h4>
                            {overallSummary.overallTaskSummary.POD > 0 && (
                              <p>
                                POD: {overallSummary.overallTaskSummary.POD}
                              </p>
                            )}
                            {overallSummary.overallTaskSummary.POF > 0 && (
                              <p>
                                POF: {overallSummary.overallTaskSummary.POF}
                              </p>
                            )}
                            {overallSummary.overallTaskSummary.Zlecenie > 0 && (
                              <p>
                                Zlecenie:{" "}
                                {overallSummary.overallTaskSummary.Zlecenie}
                              </p>
                            )}
                            {overallSummary.overallTaskSummary.Test > 0 && (
                              <p>
                                Test: {overallSummary.overallTaskSummary.Test}
                              </p>
                            )}
                          </>
                        )}

                        {Object.values(
                          overallSummary.overallProductSummary
                        ).some((value) => value > 0) && (
                          <>
                            <h4>Overall Product Summary</h4>
                            {Object.keys(
                              overallSummary.overallProductSummary
                            ).map((product) =>
                              overallSummary.overallProductSummary[product] >
                              0 ? (
                                <p key={product}>
                                  {product}:{" "}
                                  {
                                    overallSummary.overallProductSummary[
                                      product
                                    ]
                                  }
                                </p>
                              ) : null
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Task Summary */}
              {summary.taskSummary.POD > 0 ||
              summary.taskSummary.POF > 0 ||
              summary.taskSummary.Zlecenie > 0 ||
              summary.taskSummary.Test > 0 ? (
                <div className="task-summary">
                  <h4>Task Summary</h4>
                  {summary.taskSummary.POD > 0 && (
                    <p>POD: {summary.taskSummary.POD}</p>
                  )}
                  {summary.taskSummary.POF > 0 && (
                    <p>POF: {summary.taskSummary.POF}</p>
                  )}
                  {summary.taskSummary.Zlecenie > 0 && (
                    <p>Zlecenie: {summary.taskSummary.Zlecenie}</p>
                  )}
                  {summary.taskSummary.Test > 0 && (
                    <p>Test: {summary.taskSummary.Test}</p>
                  )}
                </div>
              ) : null}

              {/* Product Summary */}
              {Object.values(summary.productSummary).some(
                (value) => value > 0
              ) ? (
                <div className="product-summary">
                  <h4>Product Summary</h4>
                  {summary.productSummary["T-shirts"] > 0 && (
                    <p>T-shirts: {summary.productSummary["T-shirts"]}</p>
                  )}
                  {summary.productSummary["Hoodie"] > 0 && (
                    <p>Hoodie: {summary.productSummary["Hoodie"]}</p>
                  )}
                  {summary.productSummary["Bags"] > 0 && (
                    <p>Bags: {summary.productSummary["Bags"]}</p>
                  )}
                  {summary.productSummary["Sleeves"] > 0 && (
                    <p>Sleeves: {summary.productSummary["Sleeves"]}</p>
                  )}
                  {summary.productSummary["Children"] > 0 && (
                    <p>Children: {summary.productSummary["Children"]}</p>
                  )}
                  {summary.productSummary["Others"] > 0 && (
                    <p>Others: {summary.productSummary["Others"]}</p>
                  )}
                </div>
              ) : null}

              {/* Operator Summary */}
              {operators.some(
                (operator) => summary.operatorSummary[operator].total > 0
              ) ? (
                <div className="operators-summary">
                  {operators.map((operator) => {
                    const operatorSummary = summary.operatorSummary[operator];
                    if (operatorSummary.total > 0) {
                      return (
                        <div key={operator} className="operators-summary">
                          <h4>{operator} Task Summary</h4>
                          <p>Total: {operatorSummary.total}</p>
                          {operatorSummary.taskSummary.POD > 0 && (
                            <p>POD: {operatorSummary.taskSummary.POD}</p>
                          )}
                          {operatorSummary.taskSummary.POF > 0 && (
                            <p>POF: {operatorSummary.taskSummary.POF}</p>
                          )}
                          {operatorSummary.taskSummary.Zlecenie > 0 && (
                            <p>
                              Zlecenie: {operatorSummary.taskSummary.Zlecenie}
                            </p>
                          )}
                          {operatorSummary.taskSummary.Test > 0 && (
                            <p>Test: {operatorSummary.taskSummary.Test}</p>
                          )}

                          <h4>{operator} Product Summary</h4>
                          {operatorSummary.productSummary["T-shirts"] > 0 && (
                            <p>
                              T-shirts:{" "}
                              {operatorSummary.productSummary["T-shirts"]}
                            </p>
                          )}
                          {operatorSummary.productSummary["Hoodie"] > 0 && (
                            <p>
                              Hoodie: {operatorSummary.productSummary["Hoodie"]}
                            </p>
                          )}
                          {operatorSummary.productSummary["Bags"] > 0 && (
                            <p>
                              Bags: {operatorSummary.productSummary["Bags"]}
                            </p>
                          )}
                          {operatorSummary.productSummary["Sleeves"] > 0 && (
                            <p>
                              Sleeves:{" "}
                              {operatorSummary.productSummary["Sleeves"]}
                            </p>
                          )}
                          {operatorSummary.productSummary["Children"] > 0 && (
                            <p>
                              Children:{" "}
                              {operatorSummary.productSummary["Children"]}
                            </p>
                          )}
                          {operatorSummary.productSummary["Others"] > 0 && (
                            <p>
                              Others: {operatorSummary.productSummary["Others"]}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null; // Не відображаємо операторів з нульовими значеннями
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
