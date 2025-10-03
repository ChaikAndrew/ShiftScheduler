import React from "react";
import s from "./SummaryHeader.module.scss";
import { formatTime } from "../../utils/formatTime";
import { LuCalendar, LuClock3, LuCpu, LuHash, LuTimer } from "react-icons/lu";

export default function SummaryHeader({
  totalQuantity,
  totalWorkingTime,
  totalDowntime,
  selectedDate,
  currentShift,
  selectedMachine,
  taskSummary = {},
  productSummary = {},
}) {
  const hasData =
    (Number(totalQuantity) || 0) > 0 ||
    (Number(totalWorkingTime) || 0) > 0 ||
    (Number(totalDowntime) || 0) > 0;
  if (!hasData) return null;

  const shiftLabel = currentShift
    ? currentShift.charAt(0).toUpperCase() + currentShift.slice(1)
    : "";

  const dateLabel = (() => {
    const d = new Date(selectedDate);
    return isNaN(d) ? selectedDate : d.toISOString().slice(0, 10);
  })();

  const machineLabel =
    selectedMachine &&
    ` ${selectedMachine.charAt(0).toUpperCase()}${selectedMachine.slice(
      1,
      -1
    )} ${selectedMachine.slice(-1)}`;

  // ---- Підсумки задач: POD/POF/TEST явно, решта -> Zlecenie ----
  const num = (v) => Number(v) || 0;
  const POD = num(taskSummary.POD);
  const POF = num(taskSummary.POF);
  const TEST = num(taskSummary.TEST ?? taskSummary.Test);
  const ZLEC = Math.max(0, num(totalQuantity) - (POD + POF + TEST));

  const taskPairs = [
    ["POD", POD],
    ["POF", POF],
    ["TEST", TEST],
    ["Zlecenie", ZLEC],
  ].filter(([, v]) => v > 0);

  const productPairs = Object.entries(productSummary)
    .map(([k, v]) => [k, num(v)])
    .filter(([, v]) => v > 0);

  return (
    <div className={s.wrap}>
      {/* Ліва частина */}
      <div className={s.left}>
        <div className={s.pill}>
          <LuCalendar className={s.icon} />
          <span className={s.label}>Date</span>
          <span className={s.value}>{dateLabel}</span>
        </div>
        <div className={s.pill}>
          <LuClock3 className={s.icon} />
          <span className={s.label}>Shift</span>
          <span className={s.value}>{shiftLabel}</span>
        </div>
        <div className={s.pill}>
          <LuCpu className={s.icon} />
          <span className={s.value}>{machineLabel}</span>
        </div>
      </div>

      {/* Центр: Total + Tasks + Products */}
      <div className={s.center}>
        <LuHash className={s.icon} />

        <div className={s.pillGroup}>
          <span className={`${s.pill} ${s.accent}`}>
            Total: {totalQuantity}
          </span>
        </div>

        {taskPairs.length > 0 && (
          <div className={s.pillGroup}>
            {taskPairs.map(([k, v]) => (
              <span key={k} className={s.pill}>
                {k}: {v}
              </span>
            ))}
          </div>
        )}

        {productPairs.length > 0 && (
          <div className={s.pillGroup}>
            {productPairs.map(([k, v]) => (
              <span key={k} className={s.pill}>
                {k}: {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Права частина */}
      <div className={s.right}>
        <div className={`${s.metric} ${s.work}`}>
          <LuClock3 className={s.icon} />
          <span className={s.label}>Working</span>
          <span className={s.value}>{formatTime(totalWorkingTime)}</span>
        </div>
        <div className={`${s.metric} ${s.down}`}>
          <LuTimer className={s.icon} />
          <span className={s.label}>Downtime</span>
          <span className={s.value}>{formatTime(totalDowntime)}</span>
        </div>
      </div>
    </div>
  );
}
