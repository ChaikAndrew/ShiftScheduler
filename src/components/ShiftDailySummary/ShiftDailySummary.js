// src/components/ShiftDailySummary/ShiftDailySummary.js
import React, { useMemo, useEffect, useState } from "react";
import s from "./ShiftDailySummary.module.scss";

import { calculateDetailedByShift } from "../../utils/calculateDetailedByShift";
import { products, machines } from "../../utils/constants";
import { getStratyPerShiftByProductForDate } from "../../utils/calculateStratyPerShiftByProduct";
import { getStratyPerShiftByTaskForDate } from "../../utils/calculateStratyPerShiftByTask";
import { fetchStraties } from "../../utils/stratyApi";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";
import WhatsAppButton from "../WhatsAppButton/WhatsAppButton";
import { formatDailySummaryForWhatsApp } from "../../utils/whatsappFormatter";

const SHIFTS = ["first", "second", "third"];

export default function ShiftDailySummary({
  entries,
  selectedDate,
  onDateChange,
}) {
  // Перевіряємо, чи користувач є адміністратором
  const userRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = userRole === "admin";
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
  const [stratyByMachine, setStratyByMachine] = useState({});
  const [stratyDetails, setStratyDetails] = useState({
    BLUZA: 0,
    TSHIRT: 0,
    POD: 0,
    POF: 0,
    ZLECENIE: 0,
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

  // Отримуємо страти по машинах
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const SHIFT_LABEL = {
          first: "1 ZMIANA",
          second: "2 ZMIANA",
          third: "3 ZMIANA",
        };

        // Отримуємо страти для всіх змін
        const allStraty = await Promise.all(
          Object.values(SHIFT_LABEL).map((shift) =>
            fetchStraties({ date: selectedDate, shift, mode: "day" })
          )
        );

        if (!alive) return;

        // Підраховуємо страти по машинах
        const machineStats = {};
        const machineQuantity = {};

        // Підраховуємо кількість надрукованого для кожної машини
        ["first", "second", "third"].forEach((shift) => {
          machines.forEach((machine) => {
            const shiftEntries = entries[shift]?.[machine] || [];
            shiftEntries.forEach((entry) => {
              if (entry.displayDate === selectedDate) {
                const qty = parseInt(entry.quantity, 10) || 0;
                if (!machineQuantity[machine]) {
                  machineQuantity[machine] = 0;
                }
                machineQuantity[machine] += qty;
              }
            });
          });
        });

        // Підраховуємо страти по машинах та деталізацію
        const details = {
          BLUZA: 0,
          TSHIRT: 0,
          POD: 0,
          POF: 0,
          ZLECENIE: 0,
        };

        allStraty.flat().forEach((item) => {
          const machine = (item.number_dtg || "").toLowerCase();
          if (machine) {
            if (!machineStats[machine]) {
              machineStats[machine] = { quantity: 0, straty: 0 };
            }
            machineStats[machine].straty += 1;
          }

          // Деталізація по продуктах
          const product = (item.bluza_t_shirt || "").toUpperCase();
          if (product === "BLUZA") details.BLUZA++;
          else if (product === "T-SHIRT") details.TSHIRT++;

          // Деталізація по задачах
          const task = (item.pof_pod_hurt || "").toUpperCase();
          if (task === "POD") details.POD++;
          else if (task === "POF") details.POF++;
          else if (task === "ZLECENIE") details.ZLECENIE++;
        });

        setStratyDetails(details);

        // Об'єднуємо кількість та страти
        machines.forEach((machine) => {
          const machineKey = machine.toLowerCase();
          if (!machineStats[machineKey]) {
            machineStats[machineKey] = { quantity: 0, straty: 0 };
          }
          machineStats[machineKey].quantity = machineQuantity[machine] || 0;
        });

        setStratyByMachine(machineStats);
      } catch (e) {
        console.error("straty by machine fetch error:", e);
        setStratyByMachine({});
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedDate, entries, machines]);

  const stratyByProductTotal = useMemo(() => {
    const sum = (p) =>
      (stratyByProduct.first?.[p] || 0) +
      (stratyByProduct.second?.[p] || 0) +
      (stratyByProduct.third?.[p] || 0);
    return Object.fromEntries(products.map((p) => [p, sum(p)]));
  }, [stratyByProduct]);

  // сума дефектів за кожну зміну (беремо з таблиці продуктів)
  const lossesPerShift = useMemo(() => {
    const sum = (obj = {}) =>
      Object.values(obj).reduce((a, b) => a + (b || 0), 0);
    return {
      first: sum(stratyByProduct.first),
      second: sum(stratyByProduct.second),
      third: sum(stratyByProduct.third),
    };
  }, [stratyByProduct]);

  // сума дефектів за день (по всіх змінах)
  const lossesTotalDay = useMemo(
    () => Object.values(stratyByProductTotal).reduce((a, b) => a + (b || 0), 0),
    [stratyByProductTotal]
  );

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

  // Форматуємо повідомлення для WhatsApp
  const whatsappMessage = useMemo(() => {
    return formatDailySummaryForWhatsApp({
      selectedDate,
      detailed,
      lossesTotalDay,
      stratyByProductTotal,
      stratyByTaskTotal,
      products,
      entries,
      machines,
      stratyByMachine,
      stratyDetails,
    });
  }, [selectedDate, detailed, lossesTotalDay, stratyByProductTotal, stratyByTaskTotal, products, entries, stratyByMachine, stratyDetails]);

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
            <span className={s.shiftBadge}>
              {sh.toUpperCase()} —{" "}
              <time dateTime={selectedDate}>{selectedDate}</time>
            </span>

            <div className={s.badgesRight}>
              <span className={s.totalBadge}>
                Total <strong>{detailed[sh].total}</strong>
              </span>
              <span className={`${s.totalBadge} ${s.lossBadge}`}>
                Defects <strong>{lossesPerShift[sh] || 0}</strong>
              </span>
            </div>
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
                      <th className={s.num}>Total</th>
                      <th className={`${s.num} ${s.mono}`}>Defects</th>
                      <th className={`${s.num} ${s.mono}`}>Good</th>
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
                      <th className={s.num}>Total</th>
                      <th className={`${s.num} ${s.mono}`}>Defects</th>
                      <th className={`${s.num} ${s.mono}`}>Good</th>
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
          <span className={s.shiftBadge}>
            TOTAL FOR THE DAY —{" "}
            <time dateTime={selectedDate}>{selectedDate}</time>
          </span>

          <div className={s.badgesRight}>
            <span className={s.totalBadge}>
              Total <strong>{detailed.total.total}</strong>
            </span>
            <span className={`${s.totalBadge} ${s.lossBadge}`}>
              Defects <strong>{lossesTotalDay}</strong>
            </span>
            {isAdmin && <WhatsAppButton message={whatsappMessage} />}
          </div>
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
                    <th className={s.num}>Total</th>
                    <th className={`${s.num} ${s.mono}`}>Defects</th>
                    <th className={`${s.num} ${s.mono}`}>Good</th>
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
                    <th className={s.num}>Total</th>
                    <th className={`${s.num} ${s.mono}`}>Defects</th>
                    <th className={`${s.num} ${s.mono}`}>Good</th>
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
