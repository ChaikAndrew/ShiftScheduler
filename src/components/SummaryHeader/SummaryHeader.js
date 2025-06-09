import React from "react";
import style from "./SummaryHeader.module.scss";
function SummaryHeader({
  totalQuantity,
  totalWorkingTime,
  totalDowntime,
  selectedDate,
  currentShift,
  selectedMachine,
}) {
  // Перевірка, чи є дані для відображення заголовка
  const hasData =
    totalQuantity > 0 || totalWorkingTime > 0 || totalDowntime > 0;

  if (!hasData) {
    return null; // Якщо даних немає, не відображаємо заголовок
  }

  return (
    <div className={style.titleMachineForDate}>
      <div> {selectedDate}</div>
      <div>
        Shift:{" "}
        {currentShift &&
          currentShift.charAt(0).toUpperCase() + currentShift.slice(1)}
      </div>
      <div>
        {selectedMachine &&
          ` ${selectedMachine.charAt(0).toUpperCase()}${selectedMachine.slice(
            1,
            -1
          )} ${selectedMachine.slice(-1)}`}
      </div>
      <div>Total: {totalQuantity}</div>
    </div>
  );
}

export default SummaryHeader;
