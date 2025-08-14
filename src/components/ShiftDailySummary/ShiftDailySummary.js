// src/components/ShiftDailySummary/ShiftDailySummary.js
import React, { useMemo, useEffect, useState } from "react";
import s from "./ShiftDailySummary.module.scss";

import { calculateDetailedByShift } from "../../utils/calculateDetailedByShift";
import { products } from "../../utils/constants";
import { getStratyPerShiftByProductForDate } from "../../utils/calculateStratyPerShiftByProduct";
import { getStratyPerShiftByTaskForDate } from "../../utils/calculateStratyPerShiftByTask";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";

const SHIFTS = ["first", "second", "third"];

export default function ShiftDailySummary({
  entries,
  selectedDate,
  onDateChange,
}) {
  const detailed = useMemo(
    () => calculateDetailedByShift(entries, selectedDate, products),
    [entries, selectedDate]
  );

  const [stratyByProduct, setStratyByProduct] = useState({
    first: {},
    second: {},
    third: {},
  });
  const [stratyByTask, setStratyByTask] = useState({
    first: { POD: 0, POF: 0, ZLECENIE: 0 },
    second: { POD: 0, POF: 0, ZLECENIE: 0 },
    third: { POD: 0, POF: 0, ZLECENIE: 0 },
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [byProd, byTask] = await Promise.all([
          getStratyPerShiftByProductForDate(selectedDate, products),
          getStratyPerShiftByTaskForDate(selectedDate),
        ]);
        if (!alive) return;
        setStratyByProduct(byProd);
        setStratyByTask(byTask);
      } catch (e) {
        console.error("straty fetch error:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedDate]);

  const stratyByProductTotal = useMemo(() => {
    const sum = (p) =>
      (stratyByProduct.first?.[p] || 0) +
      (stratyByProduct.second?.[p] || 0) +
      (stratyByProduct.third?.[p] || 0);
    return Object.fromEntries(products.map((p) => [p, sum(p)]));
  }, [stratyByProduct]);

  const stratyByTaskTotal = useMemo(
    () => ({
      POD:
        (stratyByTask.first.POD || 0) +
        (stratyByTask.second.POD || 0) +
        (stratyByTask.third.POD || 0),
      POF:
        (stratyByTask.first.POF || 0) +
        (stratyByTask.second.POF || 0) +
        (stratyByTask.third.POF || 0),
      ZLECENIE:
        (stratyByTask.first.ZLECENIE || 0) +
        (stratyByTask.second.ZLECENIE || 0) +
        (stratyByTask.third.ZLECENIE || 0),
    }),
    [stratyByTask]
  );

  return (
    <div className={s.wrapper}>
      <h2 className={s.pageTitle}>Shift Daily Summary</h2>

      <div className={s.controls}>
        <div className={s.datePicker}>
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </div>
        <span className={s.pill}>
          Date <strong>{selectedDate}</strong>
        </span>
      </div>

      {SHIFTS.map((sh) => (
        <div key={sh} className={s.card}>
          <div className={s.header}>
            <span className={s.shiftBadge}>{sh.toUpperCase()}</span>
            <span className={s.totalBadge}>
              Total <strong>{detailed[sh].total}</strong>
            </span>
          </div>

          <div className={s.grid}>
            {/* LEFT: Products */}
            <div className={s.block}>
              <div className={s.blockTitle}>Products</div>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className={s.num}>Σ</th>
                      <th className={`${s.num} ${s.mono}`}>Losses</th>
                      <th className={`${s.num} ${s.mono}`}>OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detailed[sh].byProduct).map(([p, vals]) => {
                      const total = vals.total || 0;
                      const losses = stratyByProduct?.[sh]?.[p] ?? 0;
                      const ok = Math.max(0, total - (losses || 0));
                      if (total === 0 && losses === 0) return null;
                      return (
                        <tr key={p}>
                          <td>{p}</td>
                          <td className={s.num}>{total}</td>
                          <td className={`${s.num} ${s.loss}`}>{losses}</td>
                          <td className={`${s.num} ${s.ok}`}>{ok}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Tasks */}
            <div className={s.block}>
              <div className={s.blockTitle}>Tasks</div>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th className={s.num}>Σ</th>
                      <th className={`${s.num} ${s.mono}`}>Losses</th>
                      <th className={`${s.num} ${s.mono}`}>OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["POD", "POF", "Test", "Zlecenie"].map((task) => {
                      const total = detailed[sh].byTask[task] || 0;
                      const losses =
                        task === "Test"
                          ? 0
                          : stratyByTask?.[sh]?.[
                              task.toUpperCase?.() || task
                            ] || 0;
                      const ok = Math.max(0, total - losses);
                      if (total === 0 && losses === 0) return null;
                      return (
                        <tr key={task}>
                          <td>{task}</td>
                          <td className={s.num}>{total}</td>
                          <td className={`${s.num} ${s.loss}`}>{losses}</td>
                          <td className={`${s.num} ${s.ok}`}>{ok}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* TOTAL CARD */}
      <div className={`${s.card} ${s.cardTotal}`}>
        <div className={s.header}>
          <span className={s.shiftBadge}>TOTAL FOR THE DAY</span>
          <span className={s.totalBadge}>
            <strong>{detailed.total.total}</strong>
          </span>
        </div>

        <div className={s.grid}>
          {/* LEFT total products */}
          <div className={s.block}>
            <div className={s.blockTitle}>Products</div>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className={s.num}>Σ</th>
                    <th className={`${s.num} ${s.mono}`}>Losses</th>
                    <th className={`${s.num} ${s.mono}`}>OK</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(detailed.total.byProduct).map(([p, vals]) => {
                    const total = vals.total || 0;
                    const losses = stratyByProductTotal[p] || 0;
                    const ok = Math.max(0, total - losses);
                    if (total === 0 && losses === 0) return null;
                    return (
                      <tr key={p}>
                        <td>{p}</td>
                        <td className={s.num}>{total}</td>
                        <td className={`${s.num} ${s.loss}`}>{losses}</td>
                        <td className={`${s.num} ${s.ok}`}>{ok}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT total tasks */}
          <div className={s.block}>
            <div className={s.blockTitle}>Tasks</div>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th className={s.num}>Σ</th>
                    <th className={`${s.num} ${s.mono}`}>Losses</th>
                    <th className={`${s.num} ${s.mono}`}>OK</th>
                  </tr>
                </thead>
                <tbody>
                  {["POD", "POF", "Test", "Zlecenie"].map((task) => {
                    const total = detailed.total.byTask[task] || 0;
                    const losses =
                      task === "Test"
                        ? 0
                        : stratyByTaskTotal[task.toUpperCase?.() || task] || 0;
                    const ok = Math.max(0, total - losses);
                    if (total === 0 && losses === 0) return null;
                    return (
                      <tr key={task}>
                        <td>{task}</td>
                        <td className={s.num}>{total}</td>
                        <td className={`${s.num} ${s.loss}`}>{losses}</td>
                        <td className={`${s.num} ${s.ok}`}>{ok}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
