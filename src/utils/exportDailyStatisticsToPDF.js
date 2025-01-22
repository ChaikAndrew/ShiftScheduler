import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportDailyStatisticsToPDF = (data, filename, selectedMonth) => {
  if (!data || !data.length) return;

  // Перевіряємо, чи є selectedMonth, і задаємо значення за замовчуванням
  const month = selectedMonth?.month ?? new Date().getMonth();
  const year = selectedMonth?.year ?? new Date().getFullYear();

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const headers = [
    "Date",
    ...Object.keys(data[0]).filter((key) => key !== "Day"),
  ];

  // Фільтруємо дані
  const filteredData = data.filter(
    (row) =>
      row.Day && // Дата не пуста
      row.Total > 0 // Total > 0
  );

  // Формуємо рядки таблиці з повною датою
  const rows = filteredData.map((row) => {
    const fullDate = new Date(year, month, row.Day).toLocaleDateString();
    return [
      fullDate,
      ...Object.keys(row)
        .filter((key) => key !== "Day")
        .map((header) => row[header] || ""),
    ];
  });

  // Додаємо заголовок
  doc.setFontSize(18);
  doc.text("Daily Leader Statistics", 14, 10);

  // Додаємо таблицю
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 20,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  // Завантажуємо PDF
  doc.save(`${filename}.pdf`);
};
