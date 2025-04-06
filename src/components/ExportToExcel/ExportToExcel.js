import React, { useState } from "react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import DateSelector from "../../components/DateSelector/DateSelector";
import ShiftButtons from "../../components/ShiftButtons/ShiftButtons";
import { reasons } from "../../utils/constants";

const ExportToExcel = ({ entries }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [currentShift, setCurrentShift] = useState(null);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h` : ""} ${m > 0 ? `${m}min` : ""}`.trim();
  };

  if (!entries || Object.keys(entries).length === 0) {
    return (
      <div style={{ padding: "2rem", fontSize: "18px", color: "#555" }}>
        ⏳ Завантаження даних з бази даних...
      </div>
    );
  }

  const handleExport = (mode = "single") => {
    if (!selectedDate) {
      alert("Вибери дату.");
      return;
    }

    const shiftsToExport =
      mode === "all" ? ["first", "second", "third"] : [currentShift];

    if (mode === "single" && !currentShift) {
      alert("Вибери зміну.");
      return;
    }

    const result = [];
    const downtimeReasonMap = new Map();
    const totalTasks = {};
    const totalProducts = {};
    const leaderNameSet = new Set();
    let grandTotalQty = 0;
    let totalZlecenieQty = 0;
    const knownTasks = ["POD", "POF", "Sample", "Test"];
    const allProductsSet = new Set();

    shiftsToExport.forEach((shift) => {
      const machines = entries[shift] || {};
      for (const machine in machines) {
        machines[machine].forEach((e) => {
          if (e.date?.startsWith(selectedDate) && e.product) {
            allProductsSet.add(e.product);
          }
        });
      }
    });

    const allProducts = Array.from(allProductsSet);

    shiftsToExport.forEach((shift, shiftIndex) => {
      const machinesInShift = entries[shift] || {};
      const shiftRows = [];

      Object.keys(machinesInShift)
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        })
        .forEach((machine) => {
          const records = machinesInShift[machine].filter((e) =>
            e.date?.startsWith(selectedDate)
          );

          if (records.length === 0) return;

          let totalQuantity = 0;
          let downtime = 0;
          let workingTime = 0;
          let tasksPerMachine = {};
          let productsPerMachine = {};
          const reasonMap = new Map();

          records.forEach((entry) => {
            const qty = entry.quantity || 0;
            totalQuantity += qty;
            downtime += entry.downtime || 0;
            workingTime += entry.workingTime || 0;

            if (entry.task) {
              tasksPerMachine[entry.task] =
                (tasksPerMachine[entry.task] || 0) + qty;
              totalTasks[entry.task] = (totalTasks[entry.task] || 0) + qty;
            }

            const isZlecenie = !knownTasks.includes(entry.task);
            if (isZlecenie && entry.task) {
              totalZlecenieQty += qty;
            }

            if (entry.product) {
              productsPerMachine[entry.product] =
                (productsPerMachine[entry.product] || 0) + qty;
              totalProducts[entry.product] =
                (totalProducts[entry.product] || 0) + qty;
            }

            if (entry.reason) {
              const reasonEntry = reasons.find(
                (r) => r.description === entry.reason
              );
              const reasonNum = reasonEntry?.id;
              if (reasonNum !== undefined) {
                reasonMap.set(
                  reasonNum,
                  (reasonMap.get(reasonNum) || 0) + entry.downtime
                );
                if (!downtimeReasonMap.has(reasonNum)) {
                  const cleanDesc = entry.reason.replace(/^[\d.]+\s*/, "");
                  downtimeReasonMap.set(reasonNum, cleanDesc);
                }
              }
            }
          });

          const reasonNumbers = Array.from(reasonMap.keys()).sort(
            (a, b) => a - b
          );

          const row = {
            Date: selectedDate,
            Leader: records[0]?.leader || "",
            Shift: shift,
            Operators: Array.from(
              new Set(records.map((e) => e.operator).filter(Boolean))
            ).join(", "),
            Machine: machine,
            Quantity: totalQuantity,
          };

          const shiftLeader = records[0]?.leader;
          if (shiftLeader) {
            leaderNameSet.add(shiftLeader);
          }

          knownTasks.forEach((task) => {
            row[task] = tasksPerMachine[task] || 0;
          });

          row["Zlecenie"] =
            totalQuantity -
            knownTasks.reduce(
              (acc, task) => acc + (tasksPerMachine[task] || 0),
              0
            );

          allProducts.forEach((prod) => {
            row[prod] = productsPerMachine[prod] || 0;
          });

          row["Working Time"] = formatTime(workingTime);
          row["Downtime"] = formatTime(downtime);
          row["Downtime Reasons"] = reasonNumbers
            .map((num) => `${num} (${formatTime(reasonMap.get(num))})`)
            .join(", ");

          shiftRows.push(row);
          grandTotalQty += totalQuantity;
        });

      result.push(...shiftRows);
      if (shiftIndex < shiftsToExport.length - 1) {
        result.push({});
      }
    });

    if (result.length === 0) {
      alert("Даних по вибраній даті немає.");
      return;
    }

    const sortedTasks = [
      ...knownTasks
        .filter((task) => totalTasks[task])
        .map((task) => [task, totalTasks[task]]),
      ...Object.entries(totalTasks)
        .filter(([task]) => !knownTasks.includes(task))
        .sort(([a], [b]) => a.localeCompare(b)),
    ];

    const taskSummaryLine = sortedTasks
      .map(([task, qty]) => `${task}: ${qty}`)
      .join(" | ");

    const productSummaryLine = Object.entries(totalProducts)
      .filter(([, val]) => val > 0)
      .map(([prod, qty]) => `${prod}: ${qty}`)
      .join(" | ");

    const allLeaders = Array.from(leaderNameSet).join(", ");

    const headerLines = [
      [
        {
          v: `Shift Summary | Date: ${selectedDate} | ${
            mode === "all" ? "All Shifts" : `Shift: ${currentShift}`
          } | Leader: ${allLeaders} | Total Quantity: ${grandTotalQty}`,
          s: {
            font: {
              bold: true,
              color: { rgb: "006100" },
              name: "Arial",
              sz: 11,
            },
          },
        },
      ],
      [taskSummaryLine],
      totalZlecenieQty > 0 ? ["Zlecenie total: " + totalZlecenieQty] : [],
      [productSummaryLine],
      [],
    ];

    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, headerLines, { origin: "A1" });
    XLSX.utils.sheet_add_json(worksheet, result, {
      origin: "A6",
      skipHeader: false,
    });

    worksheet["!rows"] = [{ hpt: 25 }, { hpt: 25 }, { hpt: 25 }, { hpt: 25 }];

    const headerKeys = Object.keys(result[0] || {});
    headerKeys.forEach((key, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
          },
          fill: {
            fgColor: { rgb: "4F81BD" },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      }
    });

    const columnWidths = Object.keys(result[0]).map((key) => {
      const maxLength = result.reduce((acc, row) => {
        const cell = row[key];
        const len = cell ? cell.toString().length : 0;
        return Math.max(acc, len);
      }, key.length);
      const isWideColumn = ["Downtime Reasons", "Operators"].includes(key);
      const maxWidth = isWideColumn ? 50 : 20;
      return { wch: Math.max(8, Math.min(maxLength + 2, maxWidth)) };
    });
    worksheet["!cols"] = columnWidths;

    Object.keys(worksheet).forEach((cell) => {
      if (cell[0] === "!") return;
      worksheet[cell].s = {
        ...worksheet[cell].s,
        alignment: {
          ...(worksheet[cell].s?.alignment || {}),
          horizontal: "left",
          vertical: "center",
        },
      };
    });

    // Виділяємо колонку Quantity зеленим
    const quantityColIndex = headerKeys.indexOf("Quantity");
    if (quantityColIndex !== -1) {
      for (let rowIndex = 6; rowIndex < result.length + 6; rowIndex++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: quantityColIndex,
        });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,

            font: {
              ...(worksheet[cellAddress].s?.font || {}),
              color: { rgb: "006100" }, // темно-зелений текст
            },
          };
        }
      }
    }

    const legend = [
      [],
      ["Downtime reason list:"],
      ...Array.from(downtimeReasonMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([num, desc]) => [`${num}. ${desc}`]),
    ];
    XLSX.utils.sheet_add_aoa(worksheet, legend, { origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shift Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    const shiftMap = { first: "1", second: "2", third: "3" };
    const fileName =
      mode === "all"
        ? `${selectedDate}_All-Shifts.xlsx`
        : `${selectedDate}_Shift-${shiftMap[currentShift]}.xlsx`;

    saveAs(blob, fileName);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Export to Excel</h2>
      <div style={{ marginBottom: "1rem" }}>
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>
      <ShiftButtons
        currentShift={currentShift}
        selectedDate={selectedDate}
        handleShiftChange={setCurrentShift}
      />
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => handleExport("single")}
          disabled={!selectedDate || !currentShift}
          style={{
            padding: "0.5rem 1.5rem",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          📅 Export selected shift
        </button>
        <button
          onClick={() => handleExport("all")}
          disabled={!selectedDate}
          style={{
            padding: "0.5rem 1.5rem",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          📊 Export all shifts
        </button>
      </div>
    </div>
  );
};

export default ExportToExcel;
