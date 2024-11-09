import React from "react";
import { formatTime } from "../../utils/formatTime";
import style from "./TotalSummary.module.scss";

function TotalSummary({
  totalQuantity,
  totalWorkingTime,
  totalDowntime,
  selectedMachine,
  selectedDate,
  currentShift,
}) {
  return (
    <div>
      <div className={style.totalQuantityShiftTitle}>
        <div>{selectedMachine.toUpperCase()}</div>
        <div>{selectedDate}</div>
        <div>{currentShift.toUpperCase()} SHIFT</div>
      </div>

      <div className={style.totalQuantityShift}>
        {totalQuantity > 0 && (
          <div className={style.totalQuantity}>
            Total:
            <span className={style.shiftQuantity}>{totalQuantity}</span>
          </div>
        )}
        {totalWorkingTime > 0 && (
          <div className={style.totalWorkingTime}>
            Working Time:
            <span className={style.workingTime}>
              {formatTime(totalWorkingTime)}
            </span>
          </div>
        )}
        {totalDowntime > 0 && (
          <div className={style.totalDowntime}>
            Downtime:
            <span className={style.downtimeTime}>
              {formatTime(totalDowntime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TotalSummary;
