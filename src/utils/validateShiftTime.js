// utils/validateShiftTime.js

import { DateTime } from "luxon";

/**
 * Перевіряє час для першої зміни (06:00-14:00).
 *
 * @param {string} startTime - Час початку у форматі ISO.
 * @param {string} endTime - Час завершення у форматі ISO.
 * @returns {boolean} - Повертає true, якщо час у межах допустимого діапазону.
 */
export function isValidFirstShiftTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  console.log("isValidFirstShiftTime:", { startTime, endTime, start, end });

  if (start.hour < 6 || end.hour > 14 || (end.hour === 14 && end.minute > 0)) {
    alert("Помилка: у першій зміні час повинен бути між 06:00 та 14:00");
    return false;
  }
  return true;
}

export function isValidSecondShiftTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  console.log("isValidSecondShiftTime:", { startTime, endTime, start, end });

  if (start.hour < 14 || end.hour > 22 || (end.hour === 22 && end.minute > 0)) {
    alert("Помилка: у другій зміні час повинен бути між 14:00 та 22:00");
    return false;
  }
  return true;
}

export function isValidThirdShiftTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  console.log("isValidThirdShiftTime:", { startTime, endTime, start, end });

  if (!(start.hour >= 22 || start.hour < 6)) {
    alert(
      "Помилка: у третій зміні час початку повинен бути між 22:00 та 06:00 наступного дня"
    );
    return false;
  }

  if (start.hour < 22 && start.hour >= 6) {
    alert("Помилка: час початку для третьої зміни не може бути пізніше 06:00");
    return false;
  }

  if (end < start && end.hour >= 6) {
    alert(
      "Помилка: час закінчення для третьої зміни не може бути пізніше 06:00 наступного дня"
    );
    return false;
  }

  return true;
}
