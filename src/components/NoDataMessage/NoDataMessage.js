import React from "react";

function NoDataMessage({ selectedDate, currentShift }) {
  return (
    <h4>
      {selectedDate && currentShift
        ? `Data for ${selectedDate}, ${currentShift?.toUpperCase()} shift is not available in the database`
        : "Please select a date and shift to display data."}
    </h4>
  );
}

export default NoDataMessage;
