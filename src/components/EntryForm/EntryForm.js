import React from "react";

/**
 * Компонент EntryForm рендерить форму для додавання або редагування запису.
 *
 * Пропси:
 * - form: об'єкт з поточними значеннями форми
 * - setForm: функція для оновлення значень форми
 * - tasks, products, colors, reasons: масиви з варіантами вибору для полів select
 * - onSaveEntry: функція для збереження або оновлення запису
 * - editingIndex: індекс запису, що редагується (null, якщо додаємо новий запис)
 */
const EntryForm = ({
  form,
  setForm,
  tasks,
  products,
  colors,
  reasons,
  onSaveEntry,
  editingIndex,
}) => {
  return (
    <div>
      {/* Поле введення для часу початку роботи */}
      <input
        type="time"
        value={form.startTime}
        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        placeholder="Start Time"
      />

      {/* Поле введення для часу закінчення роботи */}
      <input
        type="time"
        value={form.endTime}
        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
        placeholder="End Time"
      />

      {/* Вибір задачі з можливістю вибору "Zlecenie" для введення кастомного значення */}
      <select
        value={form.task}
        onChange={(e) => setForm({ ...form, task: e.target.value })}
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
        />
      )}

      {/* Вибір продукту */}
      <select
        value={form.product}
        onChange={(e) => setForm({ ...form, product: e.target.value })}
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
      >
        <option value="">Select Color</option>
        {colors.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      {/* Вибір причини простою */}
      <select
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
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
        value={form.quantity}
        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        placeholder="0"
      />

      {/* Кнопка для збереження запису: текст змінюється залежно від того, чи редагується існуючий запис */}
      <button onClick={onSaveEntry}>
        {editingIndex !== null ? "Update Entry" : "Add Entry"}
      </button>
    </div>
  );
};

export default EntryForm;
