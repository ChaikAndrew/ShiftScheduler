import React from "react";
import style from "./ShiftButtons.module.scss";
import { LuClock3 } from "react-icons/lu";

const shifts = [
  { key: "first", label: "Shift 1", time: "06:00–14:00" },
  { key: "second", label: "Shift 2", time: "14:00–22:00" },
  { key: "third", label: "Shift 3", time: "22:00–06:00" },
];

const ShiftButtons = ({ currentShift, selectedDate, handleShiftChange }) => {
  return (
    <div className={style.shiftCards}>
      {shifts.map(({ key, label, time }) => (
        <button
          key={key}
          onClick={() => handleShiftChange(key)}
          className={`${style.shiftCard} ${
            currentShift === key ? style.active : ""
          }`}
          disabled={!selectedDate}
        >
          <LuClock3 className={style.clockIcon} />
          <span className={style.cardTitle}>{label}</span>
          <span className={style.cardTime}>{time}</span>
        </button>
      ))}
    </div>
  );
};

export default ShiftButtons;
