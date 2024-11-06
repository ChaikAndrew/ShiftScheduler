import React from "react";

/**
 * Компонент ShiftButtons рендерить кнопки для вибору зміни (Shift 1, Shift 2, Shift 3).
 *
 * Пропси:
 * - currentShift: поточна обрана зміна
 * - selectedDate: обрана дата (кнопки будуть активні лише при виборі дати)
 * - handleShiftChange: функція для зміни обраної зміни (викликається при натисканні на кнопку)
 */
const ShiftButtons = ({ currentShift, selectedDate, handleShiftChange }) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Кнопка для вибору першої зміни */}
      <button
        onClick={() => handleShiftChange("first")}
        className={`shiftBtn ${currentShift === "first" ? "active" : ""}`}
        disabled={!selectedDate} // Кнопка активна лише при виборі дати
      >
        Shift 1
      </button>

      {/* Кнопка для вибору другої зміни */}
      <button
        onClick={() => handleShiftChange("second")}
        className={`shiftBtn ${currentShift === "second" ? "active" : ""}`}
        disabled={!selectedDate} // Кнопка активна лише при виборі дати
      >
        Shift 2
      </button>

      {/* Кнопка для вибору третьої зміни */}
      <button
        onClick={() => handleShiftChange("third")}
        className={`shiftBtn ${currentShift === "third" ? "active" : ""}`}
        disabled={!selectedDate} // Кнопка активна лише при виборі дати
      >
        Shift 3
      </button>
    </div>
  );
};

export default ShiftButtons;
