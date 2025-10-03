import React, { useState } from "react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { showToast } from "../ToastNotification/ToastNotification";
import ShiftButtons from "../../components/ShiftButtons/ShiftButtons";
import { reasons } from "../../utils/constants";
import useEntriesLoader from "../../hooks/useEntriesLoader";
import { recalculateDowntime } from "../../utils/recalculateDowntime";
// import { povodDescription } from "../MonthlyStratyStats/povodDescription";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";
import style from "./ExportToExcel.module.scss";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SHOW_BACKLOG = false;

const ExportToExcel = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentShift, setCurrentShift] = useState(null);
  const [stratySummary, setStratySummary] = useState({});
  const [stratyMachines, setStratyMachines] = useState({});
  // const [stratyPovods, setStratyPovods] = useState({});

  React.useEffect(() => {
    const shiftMapToZMIANA = {
      first: "1 ZMIANA",
      second: "2 ZMIANA",
      third: "3 ZMIANA",
    };

    const fetchStraty = async () => {
      if (!selectedDate || !currentShift) return;
      try {
        const shiftZMIANA = shiftMapToZMIANA[currentShift];
        const res = await fetch(
          `https://braki-api.vercel.app/api/straties-filtered?date=${selectedDate}&shift=${encodeURIComponent(
            shiftZMIANA
          )}`
        );
        const data = await res.json();

        const summary = {
          POD: 0,
          POF: 0,
          ZLECENIE: 0,
          BLUZA: 0,
          TSHIRT: 0,
          TOTAL: data.length,
        };
        const machines = {};
        const povods = {};

        data.forEach((item) => {
          const m = item.number_dtg || "UNKNOWN";
          const hurt = item.pof_pod_hurt;
          const product = item.bluza_t_shirt
            ?.toUpperCase()
            .replace(/[^A-Z]/g, "");
          const povod = item.povod;

          summary[hurt] = (summary[hurt] || 0) + 1;
          summary[product] = (summary[product] || 0) + 1;

          if (!machines[m]) {
            machines[m] = {
              POD: 0,
              POF: 0,
              ZLECENIE: 0,
              BLUZA: 0,
              TSHIRT: 0,
              TOTAL: 0,
            };
          }
          machines[m][hurt] = (machines[m][hurt] || 0) + 1;
          machines[m][product] = (machines[m][product] || 0) + 1;
          machines[m].TOTAL++;

          if (povod) povods[povod] = (povods[povod] || 0) + 1;
        });

        setStratySummary(summary);
        setStratyMachines(machines);
        // setStratyPovods(povods);
      } catch (err) {
        console.error("Failed to fetch straty:", err);
      }
    };

    fetchStraty();
  }, [selectedDate, currentShift]);

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

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <Skeleton count={8} height={30} style={{ marginBottom: "0.5rem" }} />
      </div>
    );
  }
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
    const knownTasks = ["POD", "POF", "Test"];
    //  const knownTasks = ["POD", "POF", "Sample", "Test"];
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
      showToast("No data found for the selected date.", "warning");
      return;
    }

    const sortedTasks = [
      ...knownTasks
        .filter((task) => totalTasks[task])
        .map((task) => [task, totalTasks[task]]),
      ...(totalZlecenieQty > 0 ? [["ZLECENIE", totalZlecenieQty]] : []),
      [],
      // ...Object.entries(totalTasks)
      //   .filter(([task]) => !knownTasks.includes(task))
      //   .map(([task, qty]) => [task.toUpperCase(), qty])
      //   .sort(([a], [b]) => a.localeCompare(b)),
    ];

    const allLeaders = Array.from(leaderNameSet).join(", ");

    const defaultHeaderStyle = {
      font: { bold: true, sz: 12 },

      fill: { fgColor: { rgb: "D9EAD3" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };

    const headerLines = [
      [{ v: "Shift Summary", s: defaultHeaderStyle }],
      [{ v: `Date: ${selectedDate}`, s: defaultHeaderStyle }],
      [
        {
          v: mode === "all" ? "All Shifts" : `Shift: ${currentShift}`,
          s: defaultHeaderStyle,
        },
      ],
      [{ v: `Leader: ${allLeaders}`, s: defaultHeaderStyle }],
      [{ v: `Total Quantity: ${grandTotalQty}`, s: defaultHeaderStyle }],
      ...(mode === "single"
        ? [[{ v: "Absence:", s: defaultHeaderStyle }, { v: 0 }]]
        : []),
      [],
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
      ...sortedTasks.map(([task, qty]) => [{ v: task }, { v: qty, t: "n" }]),
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
        .map(([prod, qty]) => [{ v: prod }, { v: qty, t: "n" }]),
      [],
    ];
    const headerRowCount = headerLines.length;

    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, headerLines, { origin: "A1" });

    // const zlecSummaryStart = headerLines.findIndex(
    //   (row) => row[0]?.v === "ZLECENIE"
    // );

    // if (zlecSummaryStart !== -1) {
    //   XLSX.utils.sheet_add_aoa(
    //     worksheet,
    //     [
    //       [
    //         {
    //           v: "Zlecenie numbers:",
    //           s: {
    //             font: { bold: true, color: { rgb: "FFFFFF" } },
    //             fill: { fgColor: { rgb: "4F81BD" } },
    //             alignment: { horizontal: "left", vertical: "center" },
    //           },
    //         },
    //       ],
    //     ],
    //     { origin: `A${zlecSummaryStart + 2}` } // +2 щоб після ZLECENIE вставити
    //   );
    // }

    const cleanedResult = result.filter((row) => !row.__emptyRow);
    const headerKeys = Object.keys(result[0] || {});
    XLSX.utils.sheet_add_json(worksheet, cleanedResult, {
      origin: `A${headerRowCount + 1}`,
      skipHeader: false,
    });
    headerLines.forEach((row, rowIndex) => {
      if (
        Array.isArray(row) &&
        row.length === 2 &&
        typeof row[0]?.v === "string" &&
        (knownTasks.includes(row[0].v) || row[0].v === "ZLECENIE")
      ) {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (worksheet[cell]) {
          worksheet[cell].s = {
            ...worksheet[cell].s,
            ...styleGreenText,
          };
        }
      }
    });
    if (mode === "all") {
      cleanedResult.forEach((row, index) => {
        const shift = row.Shift;
        const fillColors = {
          first: { fgColor: { rgb: "D9EAD3" } }, // світло-зелений
          second: { fgColor: { rgb: "D0E0E3" } }, // світло-блакитний
          third: { fgColor: { rgb: "FCE5CD" } }, // світло-оранжевий
        };

        const fill = fillColors[shift];
        if (!fill) return;

        headerKeys.forEach((_, colIndex) => {
          const cell = XLSX.utils.encode_cell({
            r: headerRowCount + index + 1,
            c: colIndex,
          });

          if (worksheet[cell]) {
            worksheet[cell].s = {
              ...worksheet[cell].s,
              fill,
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } },
              },
            };
          }
        });
      });
    }

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

    worksheet["!cols"] = columnWidths;

    const styleBlueHeader = {
      font: { bold: true },
      fill: { fgColor: { rgb: "D9EAD3" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };

    const styleRedHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "FF0000" } },
      alignment: { horizontal: "left", vertical: "center" },
    };
    // Знайди реальний рядок з "Product summary:"
    const productSummaryIndex = headerLines.findIndex(
      (row) => row[0]?.v === "Product summary:"
    );

    if (productSummaryIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: productSummaryIndex, c: 0 });
      if (worksheet[cell]) {
      }
    }

    if (worksheet["A1"]) {
      worksheet["A1"].s = {
        ...(worksheet["A1"].s || {}),
        alignment: {
          ...(worksheet["A1"].s?.alignment || {}),
          wrapText: true,
          horizontal: "center",
          vertical: "center",
        },
      };
    }

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

    // const legendHeaderStyle = {
    //   font: { bold: true, color: { rgb: "FFFFFF" } },
    //   fill: { fgColor: { rgb: "4F81BD" } },
    //   alignment: {
    //     horizontal: "left",
    //     vertical: "center",
    //     wrapText: true,
    //   },
    // };

    // const legend = [
    //   [{ v: "" }],
    //   [{ v: "Downtime reason list:", s: legendHeaderStyle }],
    //   ...Array.from(downtimeReasonMap.entries())
    //     .sort((a, b) => a[0] - b[0])
    //     .map(([num, desc]) => [{ v: `${num}. ${desc}` }]),
    // ];

    // Додаємо інформацію про Packed для single режиму
    if (mode === "single") {
      const POD_COL = 6; // колонка H
      const POF_COL = 8; // колонка J

      const packedTotalFormula = {
        f: `${String.fromCharCode(65 + POD_COL)}1+${String.fromCharCode(
          65 + POF_COL
        )}1`,
      };

      const emptyTemplate = [
        [
          { v: "Packed total:", s: styleBlueHeader },
          packedTotalFormula,
          { v: "POD :", s: styleBlueHeader },
          { v: 0 },
          { v: "POF :", s: styleBlueHeader },
          { v: 0 },
        ],
        [
          { v: "PS working:", s: styleBlueHeader },
          { v: 0 },

          { v: "PS1 :", s: styleBlueHeader },
          { v: 0 },
          { v: "PS2 :", s: styleBlueHeader },
          { v: 0 },
          { v: "PS3 :", s: styleBlueHeader },
          { v: 0 },
          { v: "PS4 :", s: styleBlueHeader },
          { v: 0 },
        ],
        [
          { v: "Packed BULK:", s: styleBlueHeader },
          { v: 0 },
          { v: "Orders:", s: styleBlueHeader },
          { v: 0 },
        ],
      ];

      XLSX.utils.sheet_add_aoa(worksheet, emptyTemplate, { origin: "D1" });
      worksheet["!cols"] = worksheet["!cols"] || [];
    }

    // XLSX.utils.sheet_add_aoa(worksheet, legend, { origin: -1 });

    // 📊 Додати straty summary (оновлений стиль)
    // Підрахунок кількості надрукованого по машинах для Loss %
    // Хелпер для однакового ключа машини
    const normMachine = (m) => m?.toUpperCase().replace(/\s+/g, " ").trim();
    const quantitiesByMachine = {};

    const shiftsForLoss =
      mode === "all" ? ["first", "second", "third"] : [currentShift];

    for (const shift of shiftsForLoss) {
      const machines = entries[shift] || {};
      for (const [machine, records] of Object.entries(machines)) {
        const key = normMachine(machine);
        for (const entry of records) {
          if (!entry.date?.startsWith(selectedDate)) continue; // фільтр за датою
          quantitiesByMachine[key] =
            (quantitiesByMachine[key] || 0) + (entry.quantity || 0);
        }
      }
    }

    // Підрахунок totalLossesCount (T-shirt + Hoodie по всіх машинах)
    const totalLossesCount = Object.values(stratyMachines).reduce(
      (sum, m) => sum + (m.TSHIRT || 0) + (m.BLUZA || 0),
      0
    );
    // Підрахунок totalQuantity (надруковано по всіх машинах)
    const totalQuantity = Object.values(quantitiesByMachine).reduce(
      (sum, q) => sum + q,
      0
    );
    // Підрахунок відсотка втрат
    const totalLossPercent =
      totalQuantity > 0
        ? ((totalLossesCount / totalQuantity) * 100).toFixed(1)
        : "0";

    const stratyTable = [
      [],

      [{ v: "Total records:", s: styleBlueHeader }],
      [
        {
          v: "All Machines:",
        },
        {
          v: stratySummary.TOTAL || 0,
          t: "n",
        },
      ],
      // Додаємо рядок з Loss % від totalQuantity
      [
        {
          v: "Loss % from total quantity:",
          s: {
            font: { bold: true },
          },
        },
        {
          v: `${totalLossPercent}%`,
          s:
            totalLossPercent < 2
              ? {
                  font: { bold: true, color: { rgb: "00AA00" } },
                  alignment: { horizontal: "right" },
                }
              : {
                  font: { bold: true, color: { rgb: "FF0000" } },
                  alignment: { horizontal: "right" },
                },
        },
      ],
      // Додаємо нові підсумкові рядки загальних втрат по футболках та худі
      [
        { v: "Total T-shirt losses:" },
        {
          v: Object.values(stratyMachines).reduce(
            (sum, m) => sum + (m.TSHIRT || 0),
            0
          ),
          t: "n",
        },
      ],
      [
        { v: "Total Hoodie losses:" },
        {
          v: Object.values(stratyMachines).reduce(
            (sum, m) => sum + (m.BLUZA || 0),
            0
          ),
          t: "n",
        },
      ],
      [
        { v: "Total € losses:" },
        {
          v: Object.values(stratyMachines).reduce((sum, m) => {
            const hoodieCost = (m.BLUZA || 0) * 10;
            const tshirtCost = (m.TSHIRT || 0) * 3.5;
            return sum + hoodieCost + tshirtCost;
          }, 0),
          t: "n",
        },
      ],
      [],
      [
        { v: "Machine", s: styleBlueHeader },
        { v: "POD", s: styleBlueHeader },
        { v: "POF", s: styleBlueHeader },
        { v: "ZLECENIE", s: styleBlueHeader },
        { v: "HOODIE", s: styleBlueHeader },
        { v: "T-SHIRT", s: styleBlueHeader },
        { v: "Hoodie(10 €)", s: styleBlueHeader },
        { v: "T-shirt(3.5 €)", s: styleBlueHeader },
        { v: "Total €", s: styleBlueHeader },
        { v: "Loss %", s: styleBlueHeader },
      ],
      ...Object.entries(stratyMachines).map(([machine, data]) => {
        const hoodieCost = (data.BLUZA || 0) * 10;
        const tshirtCost = (data.TSHIRT || 0) * 3.5;
        const totalCost = hoodieCost + tshirtCost;
        // Новий розрахунок кількості надрукованого для машини через quantitiesByMachine
        const machineKey = normMachine(machine);
        const totalQuantity = quantitiesByMachine[machineKey] || 0;
        const totalLosses = (data.TSHIRT || 0) + (data.BLUZA || 0);
        const lossPercent =
          totalQuantity > 0
            ? ((totalLosses / totalQuantity) * 100).toFixed(1) + "%"
            : "0%";
        return [
          {
            v: `${machine}:`,
          },
          { v: data.POD || 0, t: "n" },
          { v: data.POF || 0, t: "n" },
          { v: data.ZLECENIE || 0, t: "n" },
          { v: data.BLUZA || 0, t: "n" },
          { v: data.TSHIRT || 0, t: "n" },
          { v: hoodieCost, t: "n" },
          { v: tshirtCost, t: "n" },
          { v: totalCost, t: "n" },
          {
            v: `${parseFloat(lossPercent).toFixed(2)}%`,
            s: {
              font: {
                color: {
                  rgb: parseFloat(lossPercent) < 2 ? "00AA00" : "FF0000",
                },
              },
              alignment: { horizontal: "right" },
            },
          },
        ];
      }),
      [],
      // [{ v: "Scrap (info)", s: styleBlueHeader }],
      // ...Object.entries(stratyPovods)
      //   .sort((a, b) => b[1] - a[1]) // Sort from highest to lowest
      //   .map(([reason, val]) => {
      //     const desc = povodDescription[reason] || "";
      //     return [
      //       { v: `${val} pcs` }, // ➕ add unit label
      //       {
      //         v: `${reason}: ${desc}`,
      //         s: { font: { color: { rgb: "000000" } } },
      //       },
      //     ];
      //   }),
    ];

    worksheet["!cols"] = worksheet["!cols"] || [];
    worksheet["!cols"][6] = { wch: 10 }; // колонка G — Hoodie
    worksheet["!cols"][7] = { wch: 10 }; // колонка H — T-shirt
    worksheet["!cols"][8] = { wch: 12 }; // колонка I — Total €

    // Таблиця Backlog після легенди
    if (mode === "single" && SHOW_BACKLOG) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      const insertStartRow = range.e.r + 2;
      const lastColLetter = XLSX.utils.encode_col(columnWidths.length - 1);

      const extraTableBackLog = [
        [],
        [
          { v: "Backlog Total:", s: styleBlueHeader },
          { t: "n", v: 0 },
          { v: "Missing" },
        ],
        [
          { v: "POF TBI:", s: styleBlueHeader },
          { t: "n", v: 0 },
        ],
        [
          { v: "POD TBI:", s: styleBlueHeader },
          { t: "n", v: 0 },
          { t: "n", v: 0 },
        ],
        [
          { v: "POD Other:", s: styleBlueHeader },
          {
            f: `SUM(B${insertStartRow + 6}:${lastColLetter}${
              insertStartRow + 6
            },B${insertStartRow + 9}:${lastColLetter}${insertStartRow + 9})`,
          },
        ],
        [
          { v: "", s: styleBlueHeader },
          { v: "Neomachi", s: styleBlueHeader },
          { v: "Go Jungo", s: styleRedHeader },
          { v: "Co hubo", s: styleBlueHeader },
          { v: "IC", s: styleBlueHeader },
          { v: "LAVY", s: styleBlueHeader },
          { v: "UT", s: styleBlueHeader },
          { v: "Printify", s: styleBlueHeader },
          { v: "YAGO", s: styleBlueHeader },
          { v: "TDE", s: styleBlueHeader },
        ],
        [
          { v: "POD other details:", s: styleBlueHeader },
          ...Array(9).fill({ t: "n", v: 0 }),
        ],
        [
          { v: "Total:", s: styleBlueHeader },
          ...Array(9).fill({ t: "n", v: 0 }),
        ],
        [
          { v: "Trevco", s: styleBlueHeader },
          { v: "EMP", s: styleBlueHeader },
          { v: "Amazon ES", s: styleBlueHeader },
          { v: "Amazon IT", s: styleBlueHeader },
          { v: "Amazon DE", s: styleBlueHeader },
          { v: "Zalando Cr.", s: styleBlueHeader },
          { v: "Privalia", s: styleBlueHeader },
          { v: "Amazon FR", s: styleBlueHeader },
          { v: "Zalando PL", s: styleBlueHeader },
        ],
        [{ v: "", s: styleBlueHeader }, ...Array(8).fill({ t: "n", v: 0 })],
        [
          { v: "Total:", s: styleBlueHeader },
          ...Array(8).fill({ t: "n", v: 0 }),
        ],
      ];

      XLSX.utils.sheet_add_aoa(worksheet, extraTableBackLog, {
        origin: `A${insertStartRow}`,
      });
    }

    // --- Straty: додаємо завжди у single ---
    if (mode === "single") {
      XLSX.utils.sheet_add_aoa(worksheet, stratyTable, { origin: -1 });
    }

    worksheet["!cols"] = worksheet["!cols"] || [];
    worksheet["!cols"][0] = { wch: 25 };

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
    <div className={style.container}>
      <h2>Export to Excel</h2>

      <CustomDatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

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
          Export selected shift
        </button>
        <button onClick={() => handleExport("all")} disabled={!selectedDate}>
          Export all shifts
        </button>
      </div>
    </div>
  );
};

export default ExportToExcel;
