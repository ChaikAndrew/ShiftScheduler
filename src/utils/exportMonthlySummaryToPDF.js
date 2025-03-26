import jsPDF from "jspdf";
import "jspdf-autotable";
import { showToast } from "../../src/components/ToastNotification/ToastNotification";

/**
 * Експортує місячну статистику у формат PDF з використанням jsPDF.
 *
 * @param {Array<Object>} data - Масив об'єктів зі статистикою. Кожен об'єкт — рядок таблиці.
 * @param {string} filename - Базова назва для PDF-файлу.
 * @param {{ year: number, month: number }} selectedMonth - Об'єкт з вибраним місяцем і роком (місяць від 0 до 11).
 *
 * @returns {void} - Зберігає PDF-файл на клієнтському пристрої. Якщо немає даних — показує попередження.
 *
 * Файл отримує назву у форматі: {filename}_{Month}_{Year}.pdf
 */
export const exportMonthlySummaryToPDF = (data, filename, selectedMonth) => {
  if (!data || !data.length) return;

  // Перевірка та дефолтні значення для місяця і року
  const month = selectedMonth?.month ?? new Date().getMonth();
  const year = selectedMonth?.year ?? new Date().getFullYear();

  // Форматування місяця та року
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const formattedMonth = monthNames[month]; // Назва місяця

  // Динамічна назва файлу
  const dynamicFilename = `${filename}_${formattedMonth}_${year}.pdf`;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Фільтрація даних
  const filteredData = data.filter((row) => row.Total > 0);

  if (!filteredData.length) {
    showToast("No data available to export for the selected month.", "warning");
    return;
  }

  const headers = Object.keys(filteredData[0]);
  const rows = filteredData.map((row) =>
    headers.map((header) => row[header] || "")
  );

  // Додаємо заголовок із місяцем і роком
  doc.setFontSize(18);
  doc.text(`Monthly Summary Statistics for ${formattedMonth} ${year}`, 14, 10);

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

  // Збереження PDF із динамічною назвою файлу
  doc.save(dynamicFilename);
};
