import React from "react";
import style from "./EntryForm.module.scss";

import { showToast } from "../ToastNotification/ToastNotification";
/**
 * Компонент EntryForm рендерить форму для додавання або редагування запису.
 *
 * Пропси:
 * - form: об'єкт з поточними значеннями форми
 * - setForm: функція для оновлення значень форми
 * - tasks, products, colors, reasons: масиви з варіантами вибору для полів select
 * - onSaveEntry: функція для збереження або оновлення запису
 * - editingIndex: індекс запису, що редагується (null, якщо додаємо новий запис)
 * - selectedLeader, selectedMachine, selectedOperator: вибрані значення для лідера, машини та оператора
 * - disabled: прапорець для блокування форми, якщо значення true
 */

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
  editingIndex,
  selectedLeader,
  selectedMachine,
  selectedOperator,
  disabled,
  currentShift,
}) => {
  const handleSave = () => {
    // Перевірка на заповненість всіх обов'язкових полів
    if (
      !form.startTime.trim() || // Перевірка на порожній рядок
      !form.endTime.trim() ||
      !selectedLeader ||
      !selectedMachine ||
      !selectedOperator
    ) {
      showToast("Please fill in all required fields of the form.", "warning");
      console.log("Required fields missing:", {
        startTime: form.startTime,
        endTime: form.endTime,
        selectedLeader,
        selectedMachine,
        selectedOperator,
      });
      return;
    }

    // Перевірка валідності часу в зміні
    if (
      currentShift === "first" &&
      !isValidFirstShiftTime(form.startTime, form.endTime)
    ) {
      console.log("Time validation failed for first shift");
      return;
    }
    if (
      currentShift === "second" &&
      !isValidSecondShiftTime(form.startTime, form.endTime)
    ) {
      console.log("Time validation failed for second shift");
      return;
    }
    if (
      currentShift === "third" &&
      !isValidThirdShiftTime(form.startTime, form.endTime)
    ) {
      console.log("Time validation failed for third shift");
      return;
    }

    // Зберігаємо запис
    onSaveEntry();
    console.log("Entry saved:", form);

    // Використання showToast для повідомлення про успіх
    showToast(
      editingIndex !== null
        ? "Record updated successfully!"
        : "Record added successfully!",
      "success"
    );
  };

  return (
    <div className={style.formRow}>
      {/* Поле введення для часу початку роботи */}
      <input
        type="time"
        value={form.startTime}
        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        placeholder="Start Time"
        disabled={disabled} // Блокування поля, якщо disabled = true
      />

      {/* Вибір задачі з можливістю вибору "Zlecenie" для введення кастомного значення */}
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

      {/* Поле для введення номера "Zlecenie" з'являється, якщо вибрано "Zlecenie" */}
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

      {/* Вибір продукту */}
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

      {/* Вибір кольору */}
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

      {/* Вибір причини простою (необов'язкове поле) */}
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

      {/* Поле для введення кількості */}
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

      {/* Поле введення для часу закінчення роботи */}
      <input
        type="time"
        value={form.endTime}
        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
        placeholder="End Time"
        disabled={disabled}
      />

      {/* Кнопка для збереження запису */}
      <button onClick={handleSave} className={style.addEntry}>
        {editingIndex !== null ? "Update Entry" : "Add Entry"}
      </button>
    </div>
  );
};

export default EntryForm;
