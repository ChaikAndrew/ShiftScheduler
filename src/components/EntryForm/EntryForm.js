import React from "react";
import style from "./EntryForm.module.scss";
import { showToast } from "../ToastNotification/ToastNotification";
import {
  isValidFirstShiftTime,
  isValidSecondShiftTime,
  isValidThirdShiftTime,
} from "../../utils/validateShiftTime";

const EntryForm = ({
  form,
  setForm,
  tasks,
  products,
  colors,
  reasons,
  onSaveEntry,
  onEndShift,
  editingIndex,
  selectedLeader,
  selectedMachine,
  selectedOperator,
  disabled,
  currentShift,
  // 🆕 додали сеттери з батька
  setEditingIndex,
  setEditingEntryId,
}) => {
  const handleSave = () => {
    if (
      !form.startTime.trim() ||
      !form.endTime.trim() ||
      !selectedLeader ||
      !selectedMachine ||
      !selectedOperator
    ) {
      showToast("Please fill in all required fields of the form.", "warning");
      return;
    }

    if (
      currentShift === "first" &&
      !isValidFirstShiftTime(form.startTime, form.endTime)
    )
      return;
    if (
      currentShift === "second" &&
      !isValidSecondShiftTime(form.startTime, form.endTime)
    )
      return;
    if (
      currentShift === "third" &&
      !isValidThirdShiftTime(form.startTime, form.endTime)
    )
      return;

    onSaveEntry();
    showToast(
      editingIndex !== null
        ? "Record updated successfully!"
        : "Record added successfully!",
      "success"
    );
  };

  const handleCancel = () => {
    setForm({
      startTime: "",
      endTime: "",
      task: "",
      customTaskName: "",
      product: "",
      color: "",
      reason: "",
      quantity: 0,
      comment: "",
    });
    setEditingIndex(null);
    setEditingEntryId(null);
    showToast("Editing cancelled", "info"); // можна прибрати, якщо не потрібно
  };

  return (
    <div className={style.formRow}>
      <input
        type="time"
        value={form.startTime}
        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        placeholder="Start Time"
        disabled={disabled}
      />

      <select
        value={form.task}
        onChange={(e) => setForm({ ...form, task: e.target.value })}
        disabled={disabled}
      >
        <option value="">Select Task</option>
        {tasks.map((task) => (
          <option key={task} value={task}>
            {task}
          </option>
        ))}
      </select>

      {form.task === "Zlecenie" && (
        <input
          className="zlecenie-input"
          type="text"
          placeholder="Zlecenie №"
          value={form.customTaskName}
          onChange={(e) => setForm({ ...form, customTaskName: e.target.value })}
          disabled={disabled}
        />
      )}

      <select
        value={form.product}
        onChange={(e) => setForm({ ...form, product: e.target.value })}
        disabled={disabled}
      >
        <option value="">Select Product</option>
        {products.map((product) => (
          <option key={product} value={product}>
            {product}
          </option>
        ))}
      </select>

      <select
        value={form.color}
        onChange={(e) => setForm({ ...form, color: e.target.value })}
        disabled={disabled}
      >
        <option value="">Select Color</option>
        {colors.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      <select
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
        disabled={disabled}
      >
        <option value="">Select Reason</option>
        {reasons.map((reason) => (
          <option key={reason.id} value={reason.description}>
            {reason.description}
          </option>
        ))}
      </select>

      <input
        className="input-quantity"
        type="number"
        value={form.quantity || ""}
        onChange={(e) => {
          let value = e.target.value.replace(/\D/g, "");
          value = value.replace(/^0+/, "");
          setForm({ ...form, quantity: value });
        }}
        placeholder="0"
        disabled={disabled}
      />

      <input
        type="time"
        value={form.endTime}
        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
        placeholder="End Time"
        disabled={disabled}
      />

      {/* КНОПКИ */}
      <div className={style.buttonsRow}>
        <button onClick={handleSave} className={`${style.btn} ${style.ghost}`}>
          {editingIndex !== null ? "Update Entry" : "Add Entry"}
        </button>

        {editingIndex !== null && (
          <button
            type="button"
            onClick={handleCancel}
            className={`${style.btn} ${style.ghost}`}
          >
            Cancel
          </button>
        )}

        {/* <button
          type="button"
          onClick={onEndShift}
          className={`${style.btn} ${style.ghost}`}
          disabled={disabled || !!form.startTime} // ⬅️ додаємо перевірку
        >
          End Shift
        </button> */}
      </div>
    </div>
  );
};

export default EntryForm;
