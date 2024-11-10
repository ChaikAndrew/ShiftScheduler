import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { formatTime } from "../../utils/formatTime";
import { reasons } from "../../utils/constants";
import style from "./EntryTable.module.scss";

// Завантаження коментарів із localStorage з урахуванням дати, зміни та оператора
const loadComments = () => {
  const savedComments = localStorage.getItem("comments");
  return savedComments ? JSON.parse(savedComments) : {};
};

// Збереження коментарів у localStorage з урахуванням дати, зміни та оператора
const saveComments = (comments) => {
  localStorage.setItem("comments", JSON.stringify(comments));
};

// Функція для створення унікального ключа на основі дати, зміни, оператора та індексу запису
const getCommentKey = (entry, index) => {
  return `${entry.displayDate}-${entry.shift}-${entry.operator}-${index}`;
};

function EntryTable({ entries, onEdit, onDelete }) {
  const [comments, setComments] = useState(loadComments());
  const [commentKey, setCommentKey] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setComments(loadComments()); // Завантаження коментарів під час першого рендеру
  }, []);

  const handleDelete = (index, operator, task, quantity) => {
    const confirmation = window.confirm(
      `${operator}, are you sure you want to delete ${task} with a quantity of ${quantity}?`
    );
    if (confirmation) {
      onDelete(index);
    }
  };

  const handleAddComment = (entry, index) => {
    const key = getCommentKey(entry, index);
    setCommentKey(key);
    setNewComment(comments[key] || ""); // Показуємо коментар для конкретного запису з localStorage
    setIsModalOpen(true); // Відкриваємо модальне вікно
  };

  const handleSaveComment = () => {
    if (commentKey) {
      const updatedComments = { ...comments, [commentKey]: newComment };
      setComments(updatedComments); // Оновлюємо стан коментарів
      saveComments(updatedComments); // Зберігаємо у localStorage
      setCommentKey(null);
      setNewComment("");
      setIsModalOpen(false); // Закриваємо модальне вікно
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCommentKey(null);
    setNewComment("");
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Shift</th>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Leader</th>
            <th>Machine</th>
            <th>Operator</th>
            <th>Task</th>
            <th>Product</th>
            <th>Color</th>
            <th>Reason</th>
            <th>Quantity</th>
            <th>Working Time</th>
            <th>Downtime</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const key = getCommentKey(entry, index); // Створюємо унікальний ключ для кожного запису
            return (
              <tr key={index}>
                <td>{entry.shift}</td>
                <td>{entry.displayDate}</td>
                <td>{DateTime.fromISO(entry.startTime).toFormat("HH:mm")}</td>
                <td>{DateTime.fromISO(entry.endTime).toFormat("HH:mm")}</td>
                <td>{entry.leader}</td>
                <td>{entry.machine}</td>
                <td className={style.operatorCell}>
                  <span
                    className={style.operatorName}
                    onClick={() => handleAddComment(entry, index)}
                  >
                    {entry.operator}
                    {comments[key] && (
                      <>
                        {" "}
                        <span role="img" aria-label="comment">
                          📝
                        </span>
                      </>
                    )}
                    {comments[key] && (
                      <span className={style.commentTooltip}>
                        {comments[key]}
                      </span>
                    )}
                  </span>
                </td>
                <td>{entry.task}</td>
                <td>{entry.product}</td>
                <td>{entry.color}</td>
                <td className={style.reasonDescription}>
                  {reasons.find((reason) => reason.description === entry.reason)
                    ?.id || ""}
                  {entry.reason && (
                    <span className={style.tooltip}>
                      {
                        reasons.find(
                          (reason) => reason.description === entry.reason
                        )?.description
                      }
                    </span>
                  )}
                </td>
                <td>{entry.quantity}</td>
                <td>{formatTime(entry.workingTime)}</td>
                <td>{formatTime(entry.downtime)}</td>
                <td>
                  <button className={style.edit} onClick={() => onEdit(index)}>
                    Edit
                  </button>
                  <button
                    className={style.delete}
                    onClick={() =>
                      handleDelete(
                        index,
                        entry.operator,
                        entry.task,
                        entry.quantity
                      )
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isModalOpen && (
        <div className={style.modalOverlay}>
          <div className={style.modalContent}>
            <h2>Add Comment</h2>
            <textarea
              className={style.commentInput}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment"
              rows="5"
            />
            <div className={style.modalActions}>
              <button onClick={handleSaveComment}>Save</button>
              <button onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EntryTable;
