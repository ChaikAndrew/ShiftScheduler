import React from "react";
import style from "./SummaryHeader.module.scss";
import { LuCalendar, LuClock3, LuCpu, LuHash } from "react-icons/lu";

function SummaryHeader({
  totalQuantity,
  totalWorkingTime,
  totalDowntime,
  selectedDate,
  currentShift,
  selectedMachine,
}) {
  const hasData =
    totalQuantity > 0 || totalWorkingTime > 0 || totalDowntime > 0;
  if (!hasData) return null;

  const shiftLabel = currentShift
    ? currentShift.charAt(0).toUpperCase() + currentShift.slice(1)
    : "";

  // якщо прийшла валідна дата — форматнемо компактно
  const dateLabel = (() => {
    const d = new Date(selectedDate);
    return isNaN(d) ? selectedDate : d.toISOString().slice(0, 10); // YYYY-MM-DD
  })();

  // красиво виведемо назву машини типу "Dtg 7"
  const machineLabel =
    selectedMachine &&
    ` ${selectedMachine.charAt(0).toUpperCase()}${selectedMachine.slice(
      1,
      -1
    )} ${selectedMachine.slice(-1)}`;

  return (
    <div className={style.summaryBar}>
      <div className={style.group}>
        <div className={style.item}>
          <LuCalendar className={style.icon} />
          <span className={style.label}>Date</span>
          <span className={style.value}>{dateLabel}</span>
        </div>

        <div className={style.item}>
          <LuClock3 className={style.icon} />
          <span className={style.label}>Shift</span>
          <span className={style.value}>{shiftLabel}</span>
        </div>

        <div className={style.item}>
          <LuCpu className={style.icon} />
          <span className={style.value}>{machineLabel}</span>
        </div>
      </div>

      <div className={`${style.item} ${style.accent}`}>
        <LuHash className={style.icon} />
        <span className={style.label}>Total</span>
        <span className={style.value}>{totalQuantity}</span>
      </div>
    </div>
  );
}

export default SummaryHeader;
