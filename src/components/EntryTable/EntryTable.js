import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { formatTime } from "../../utils/formatTime";
import { reasons } from "../../utils/constants";
import style from "./EntryTable.module.scss";
import { showConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { showToast } from "../ToastNotification/ToastNotification";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin5Line } from "react-icons/ri";
import { updateEntryInDB } from "../../utils/api/shiftApi";
import { FcComments } from "react-icons/fc";
import { AiOutlineInfoCircle } from "react-icons/ai";

/* 🔸 Downtime колонка — виділяємо, коли є простій */
const taskAccentClass = (taskRaw) => {
  const task = (taskRaw || "").toString().trim().toUpperCase();
  if (!task) return "";
  if (task === "POD") return style.accentPod;
  if (task === "POF") return style.accentPof;
  if (task === "TEST") return style.accentTest;
  if (task === "ZLECENIE") return style.accentZlec;
  return "";
};

// Правильна обробка нічної зміни для сортування
const parseDateTimeForThirdShift = (isoStr) => {
  const dt = DateTime.fromISO(isoStr, { zone: "utc" });
  return dt.hour < 6 ? dt.plus({ days: 1 }) : dt;
};

// Чи є простій (> 0 хв). Підтримка чисел та рядка "HH:MM".
const hasDowntimeValue = (downtime) => {
  if (typeof downtime === "number") return downtime > 0;
  if (typeof downtime === "string") return downtime !== "00:00";
  return false;
};

// Визначення типу завдання для бейджів
const getTaskType = (task) => {
  const t = String(task || "")
    .trim()
    .toUpperCase();
  if (!t) return "";
  if (t === "POD") return "pod";
  if (t === "POF") return "pof";
  if (t === "TEST") return "test";
  return "zlecenie";
};

function EntryTable({ entries, onEdit, onDelete, onUpdateEntry }) {
  const [commentId, setCommentId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (index, username, task, quantity, machine) => {
    const message =
      task && quantity > 0
        ? `${username}, are you sure you want to delete ${task} with a quantity of ${quantity} from ${machine}?`
        : `${username}, are you sure you want to delete this entry from ${machine}?`;

    showConfirmDialog({
      title: "Delete Confirmation",
      message,
      onConfirm: () => {
        onDelete(index);
        showToast(
          task && quantity > 0
            ? `Entry successfully deleted! ${task} with a quantity of ${quantity}`
            : "Entry successfully deleted!",
          "success"
        );
      },
    });
  };

  const handleAddComment = (entry) => {
    setCommentId(entry._id);
    setNewComment(entry.comment || "");
    setIsModalOpen(true);
  };

  const handleSaveComment = async () => {
    if (!commentId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await updateEntryInDB(
        commentId,
        { comment: newComment },
        token
      );
      const updatedEntry = res.data.entry;
      showToast("Comment saved successfully", "success");
      setIsModalOpen(false);
      setCommentId(null);
      setNewComment("");
      if (onUpdateEntry) onUpdateEntry(updatedEntry);
    } catch (err) {
      showToast("Failed to save comment", "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCommentId(null);
    setNewComment("");
  };

  // Закриття модалки по Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") handleCloseModal();
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleCloseModal();
  };

  return (
    <>
      <table className={style.table}>
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
            <th>Quantity</th>
            <th>Working Time</th>
            <th>Downtime</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {[...entries]
            .sort((a, b) => {
              const timeA = (
                a.shift === "third"
                  ? parseDateTimeForThirdShift(a.startTime)
                  : DateTime.fromISO(a.startTime, { zone: "utc" })
              ).toMillis();

              const timeB = (
                b.shift === "third"
                  ? parseDateTimeForThirdShift(b.startTime)
                  : DateTime.fromISO(b.startTime, { zone: "utc" })
              ).toMillis();

              return timeA - timeB;
            })
            .map((entry, filteredIndex) => {
              const rowHasDowntime = hasDowntimeValue(entry.downtime);
              const taskType = getTaskType(entry.task);
              const reason = reasons.find(
                (r) => r.description === entry.reason
              );

              return (
                <tr
                  key={filteredIndex}
                  className={[
                    rowHasDowntime ? style.hasDowntime : style.noDowntime,
                    taskAccentClass(entry.task),
                    style.row,
                  ].join(" ")}
                >
                  <td>{entry.shift}</td>
                  <td>{entry.displayDate}</td>

                  <td>
                    {DateTime.fromISO(entry.startTime, {
                      zone: "utc",
                    }).toFormat("HH:mm")}
                  </td>

                  <td>
                    {DateTime.fromISO(entry.endTime, { zone: "utc" }).toFormat(
                      "HH:mm"
                    )}
                  </td>

                  <td>{entry.leader}</td>
                  <td>{entry.machine}</td>

                  <td className={style.operatorCell}>
                    <span
                      className={style.operatorName}
                      onClick={() => handleAddComment(entry)}
                    >
                      {entry.operator}
                      {entry.comment && (
                        <span className={style.comment}>
                          <FcComments className={style.commentIcon} />
                          <span className={style.commentTooltip}>
                            {entry.comment}
                          </span>
                        </span>
                      )}
                    </span>
                  </td>

                  <td
                    className={`${style.taskCell} ${
                      taskType ? style[`task--${taskType}`] : ""
                    }`}
                  >
                    <span className={style.taskBadge}>
                      {entry.task ? String(entry.task).toUpperCase() : null}
                    </span>
                  </td>

                  <td>{entry.product}</td>
                  <td>{entry.color}</td>

                  <td>{entry.quantity > 0 ? entry.quantity : ""}</td>
                  <td>{formatTime(entry.workingTime)}</td>

                  <td
                    className={`${style.downtimeCell} ${
                      rowHasDowntime ? style["downtime--has"] : ""
                    }`}
                  >
                    {formatTime(entry.downtime)}
                  </td>

                  <td className={style.reasonDescription}>
                    {reason?.id || ""}
                    {entry.reason && (
                      <span className={style.reasonIcon}>
                        <AiOutlineInfoCircle />
                        <span className={style.tooltip}>
                          {reason?.description || ""}
                        </span>
                      </span>
                    )}
                  </td>

                  <td>
                    <button
                      className={style.edit}
                      onClick={() =>
                        onEdit(
                          entry.originalIndex ?? filteredIndex,
                          entry.originalIndex
                        )
                      }
                      aria-label="Edit entry"
                    >
                      <FaRegEdit className={style.icon} />
                    </button>

                    <button
                      className={style.delete}
                      onClick={() =>
                        handleDelete(
                          entry.originalIndex ?? filteredIndex, // ✅ використовуємо originalIndex якщо є
                          localStorage.getItem("username"),
                          entry.task,
                          entry.quantity,
                          entry.machine
                        )
                      }
                      aria-label="Delete entry"
                    >
                      <RiDeleteBin5Line className={style.icon} />
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {isModalOpen && (
        <div className={style.modalOverlay} onClick={handleOverlayClick}>
          <div className={style.modalContent}>
            <h2>Add Comment</h2>
            <textarea
              className={style.commentInput}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment here..."
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
