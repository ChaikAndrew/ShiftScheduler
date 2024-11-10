import React from "react";
import style from "./ShiftButtons.module.scss";

const ShiftButtons = ({ currentShift, selectedDate, handleShiftChange }) => {
  return (
    <div>
      {/* Кнопка для вибору першої зміни */}
      <button
        onClick={() => handleShiftChange("first")}
        className={`${style.shiftBtn} ${
          currentShift === "first" ? style.active : ""
        }`}
        disabled={!selectedDate}
      >
        Shift 1
      </button>

      {/* Кнопка для вибору другої зміни */}
      <button
        onClick={() => handleShiftChange("second")}
        className={`${style.shiftBtn} ${
          currentShift === "second" ? style.active : ""
        }`}
        disabled={!selectedDate}
      >
        Shift 2
      </button>

      {/* Кнопка для вибору третьої зміни */}
      <button
        onClick={() => handleShiftChange("third")}
        className={`${style.shiftBtn} ${
          currentShift === "third" ? style.active : ""
        }`}
        disabled={!selectedDate}
      >
        Shift 3
      </button>
    </div>
  );
};

export default ShiftButtons;
