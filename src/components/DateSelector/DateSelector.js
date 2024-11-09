import React from "react";

function DateSelector({ selectedDate, onDateChange }) {
  return (
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => onDateChange(e.target.value)}
      placeholder="Select Date"
    />
  );
}

export default DateSelector;
