// utils/validateShiftTime.js

import { DateTime } from "luxon";
import { showToast } from "../../src/components/ToastNotification/ToastNotification";

/**
 * Validates the time for the first shift (06:00-14:00).
 *
 * @param {string} startTime - Start time in ISO format.
 * @param {string} endTime - End time in ISO format.
 * @returns {boolean} - Returns true if the time is within the allowed range.
 */
export function isValidFirstShiftTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime, { zone: "utc" });
  const end = DateTime.fromISO(endTime, { zone: "utc" });
  console.log("isValidFirstShiftTime:", { startTime, endTime, start, end });
  console.log("Start is valid:", start.isValid);
  console.log("End is valid:", end.isValid);
  if (start.hour < 6 || end.hour > 14 || (end.hour === 14 && end.minute > 0)) {
    showToast(
      "Error: In the first shift, the time must be between 06:00 and 14:00.",
      "error"
    );
    return false;
  }
  return true;
}

/**
 * Validates the time for the second shift (14:00-22:00).
 */
export function isValidSecondShiftTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  console.log("isValidSecondShiftTime:", { startTime, endTime, start, end });

  if (start.hour < 14 || end.hour > 22 || (end.hour === 22 && end.minute > 0)) {
    showToast(
      "Error: In the second shift, the time must be between 14:00 and 22:00.",
      "error"
    );
    return false;
  }
  return true;
}

/**
 * Validates the time for the third shift (22:00-06:00).
 */
export function isValidThirdShiftTime(startTime, endTime) {
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  console.log("isValidThirdShiftTime:", { startTime, endTime, start, end });

  // Перевірка початку зміни (повинна бути між 22:00 і 06:00)
  if (!(start.hour >= 22 || start.hour < 6)) {
    showToast(
      "Error: In the third shift, the start time must be between 22:00 and 06:00.",
      "error"
    );
    return false;
  }

  // Перевірка кінця зміни (дозволено рівно до 06:00)
  if (end < start && (end.hour > 6 || (end.hour === 6 && end.minute > 0))) {
    showToast(
      "Error: The end time for the third shift cannot be later than 06:00.",
      "error"
    );
    return false;
  }

  return true;
}
