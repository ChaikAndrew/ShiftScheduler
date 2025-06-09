import React from "react";
import DatePicker from "react-datepicker";
import { parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import style from "./CustomDatePicker.module.scss";
const CustomDatePicker = ({
  selectedDate,
  onDateChange,
  shouldCloseOnSelect = true,
}) => {
  return (
    <DatePicker
      selected={selectedDate ? parseISO(selectedDate) : null}
      onChange={(date) => {
        if (!(date instanceof Date) || isNaN(date)) return;

        const iso = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        onDateChange(iso);
      }}
      dateFormat="yyyy-MM-dd"
      withPortal
      shouldCloseOnSelect={shouldCloseOnSelect}
      className={style.customDatepicker}
    />
  );
};

export default CustomDatePicker;
