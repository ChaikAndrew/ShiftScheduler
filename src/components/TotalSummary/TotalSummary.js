import React from "react";
import { formatTime } from "../../utils/formatTime";
import style from "./TotalSummary.module.scss";
import { LuPackage, LuClock4, LuTimer } from "react-icons/lu";

function TotalSummary({
  totalQuantity,
  totalWorkingTime,
  totalDowntime,
  selectedMachine,
  selectedDate,
  currentShift,
}) {
  return (
    <div className={style.wrapper}>
      {/* Верхній рядок */}
      <div className={style.topRow}>
        <span className={style.badge}>{selectedMachine.toUpperCase()}</span>
        <span className={style.badge}>{selectedDate}</span>
        <span className={style.badge}>{currentShift.toUpperCase()} SHIFT</span>
      </div>

      {/* Основні показники */}
      <div className={style.cards}>
        {totalQuantity > 0 && (
          <div className={`${style.card} ${style.total}`}>
            <LuPackage className={style.icon} />
            <span className={style.label}>Total</span>
            <span className={style.value}>{totalQuantity}</span>
          </div>
        )}
        {totalWorkingTime > 0 && (
          <div className={`${style.card} ${style.work}`}>
            <LuClock4 className={style.icon} />
            <span className={style.label}>Working Time</span>
            <span className={style.value}>{formatTime(totalWorkingTime)}</span>
          </div>
        )}
        {totalDowntime > 0 && (
          <div className={`${style.card} ${style.down}`}>
            <LuTimer className={style.icon} />
            <span className={style.label}>Downtime</span>
            <span className={style.value}>{formatTime(totalDowntime)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TotalSummary;
