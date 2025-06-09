import React, { useState } from "react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import DateSelector from "../../components/DateSelector/DateSelector";
import ShiftButtons from "../../components/ShiftButtons/ShiftButtons";
import { reasons } from "../../utils/constants";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import { recalculateDowntime } from "../../utils/recalculateDowntime";

const ExportToExcel = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentShift, setCurrentShift] = useState(null);

  const selectedYear = new Date(selectedDate).getFullYear();
  const selectedMonth = new Date(selectedDate).getMonth() + 1;

  const { entries, loading, error } = useEntriesLoader(
    selectedYear,
    selectedMonth
  );

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h` : ""} ${m > 0 ? `${m}min` : ""}`.trim();
  };

  if (loading) return <p style={{ padding: "2rem" }}>⏳ Завантаження...</p>;
  if (error)
    return (
      <p style={{ padding: "2rem", color: "red" }}>
        ❌ Помилка: {error.message}
      </p>
    );
  if (!entries || Object.keys(entries).length === 0) {
    return (
      <div style={{ padding: "2rem", fontSize: "18px", color: "#555" }}>
        ⏳ Дані не знайдено...
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

    const styleGreenText = {
      font: {
        bold: true,
        color: { rgb: "006100" },
      },
    };

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

          if (records.length > 0) {
            const shiftEntriesObject = {
              [shift]: {
                [machine]: records,
              },
            };
            const updated = recalculateDowntime(
              shiftEntriesObject,
              shift,
              machine
            );
            records.splice(0, records.length, ...updated[shift][machine]);
          }

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
      if (shiftRows.length > 0) {
        result.push(...shiftRows);
        if (mode === "all" && shiftIndex < shiftsToExport.length - 1) {
          result.push({ __emptyRow: true });
        }
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

    const allLeaders = Array.from(leaderNameSet).join(", ");

    const zlecenieRow =
      totalZlecenieQty > 0 ? [["ZLECENIE", totalZlecenieQty]] : [];

    const headerLines = [
      [
        {
          v: `Shift Summary\nDate: ${selectedDate}\n${
            mode === "all" ? "All Shifts" : `Shift: ${currentShift}`
          }\nLeader: ${allLeaders}\nTotal Quantity: ${grandTotalQty}`,
          s: {
            font: {
              bold: true,
              color: { rgb: "006100" },
              name: "Arial",
              sz: 11,
            },
            alignment: {
              wrapText: true,
              horizontal: "center",
              vertical: "center",
            },
          },
        },
      ],
      [
        {
          v: "Task summary:",
          s: {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "left", vertical: "center" },
          },
        },
      ],
      ...sortedTasks.map(([task, qty]) => [task, qty]),
      ...zlecenieRow,
      [
        {
          v: "Product summary:",
          s: {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "left", vertical: "center" },
          },
        },
      ],
      ...Object.entries(totalProducts)
        .filter(([, val]) => val > 0)
        .map(([prod, qty]) => [prod, qty]),
      [],
    ];
    const headerRowCount = headerLines.length;

    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, headerLines, { origin: "A1" });
    const cleanedResult = result.filter((row) => !row.__emptyRow);
    XLSX.utils.sheet_add_json(worksheet, cleanedResult, {
      origin: `A${headerRowCount + 1}`,
      skipHeader: false,
    });
    headerLines.forEach((row, rowIndex) => {
      if (
        Array.isArray(row) &&
        row.length === 2 &&
        typeof row[0] === "string" &&
        (knownTasks.includes(row[0]) || row[0] === "ZLECENIE")
      ) {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 }); // A-колонка
        if (worksheet[cell]) {
          worksheet[cell].s = {
            ...worksheet[cell].s,
            ...styleGreenText,
          };
        }
      }
    });
    const headerKeys = Object.keys(result[0] || {});
    const tableStartRow = headerRowCount;
    headerKeys.forEach((key, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({
        r: tableStartRow,
        c: colIndex,
      });
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

    const getMaxLen = (val) =>
      val && typeof val === "string"
        ? val.length
        : typeof val === "object" && val.v
        ? val.v.length
        : 0;

    let columnWidths = [];

    headerLines.forEach((line, rowIndex) => {
      line.forEach((cell, colIndex) => {
        const len = getMaxLen(cell);
        if (!columnWidths[colIndex] || columnWidths[colIndex].wch < len + 2) {
          columnWidths[colIndex] = { wch: len + 2 };
        }
      });
    });

    Object.keys(result[0] || {}).forEach((key, colIndex) => {
      const maxLength = result.reduce((acc, row) => {
        const cell = row[key];
        const len = cell ? cell.toString().length : 0;
        return Math.max(acc, len);
      }, key.length);
      const isWideColumn = ["Downtime Reasons", "Operators"].includes(key);
      const maxWidth = isWideColumn ? 50 : 20;
      const wch = Math.max(8, Math.min(maxLength + 2, maxWidth));
      columnWidths[colIndex] = {
        wch: Math.max(columnWidths[colIndex]?.wch || 0, wch),
      };
    });
    columnWidths[0] = { wpx: 100 };
    worksheet["!cols"] = columnWidths;

    worksheet["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: headerKeys.length - 1 },
      },
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: headerKeys.length - 1 },
      },
      {
        s: { r: sortedTasks.length + 3, c: 0 },
        e: { r: sortedTasks.length + 3, c: headerKeys.length - 1 },
      },
    ];

    const styleBlueHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      alignment: { horizontal: "left", vertical: "center" },
    };

    if (worksheet["A2"]) {
      worksheet["A2"].s = styleBlueHeader;
    }

    const productSummaryRow = `A${sortedTasks.length + 4}`;
    if (worksheet[productSummaryRow]) {
      worksheet[productSummaryRow].s = styleBlueHeader;
    }

    worksheet["A1"].s.alignment = {
      ...worksheet["A1"].s.alignment,
      wrapText: true,
      horizontal: "center",
      vertical: "center",
    };

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

    const quantityColIndex = headerKeys.indexOf("Quantity");
    if (quantityColIndex !== -1) {
      for (
        let rowIndex = tableStartRow + 1;
        rowIndex < result.length + tableStartRow + 1;
        rowIndex++
      ) {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: quantityColIndex,
        });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,

            font: {
              ...(worksheet[cellAddress].s?.font || {}),
              color: { rgb: "006100" },
            },
          };
        }
      }
    }
    const workingTimeColIndex = headerKeys.indexOf("Working Time");
    if (workingTimeColIndex !== -1) {
      for (
        let rowIndex = tableStartRow + 1;
        rowIndex < result.length + tableStartRow + 1;
        rowIndex++
      ) {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: workingTimeColIndex,
        });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            font: {
              ...(worksheet[cellAddress].s?.font || {}),
              color: { rgb: "006100" },
            },
          };
        }
      }
    }
    const downtimeColIndex = headerKeys.indexOf("Downtime");
    if (downtimeColIndex !== -1) {
      for (
        let rowIndex = tableStartRow + 1;
        rowIndex < result.length + tableStartRow + 1;
        rowIndex++
      ) {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: downtimeColIndex,
        });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            font: {
              ...(worksheet[cellAddress].s?.font || {}),
              color: { rgb: "9C0006" },
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
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
        >
          📅 Export selected shift
        </button>
        <button onClick={() => handleExport("all")} disabled={!selectedDate}>
          📊 Export all shifts
        </button>
      </div>
    </div>
  );
};

export default ExportToExcel;
