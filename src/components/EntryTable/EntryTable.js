import React, { useState } from "react";
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

// 🔥 Функція для правильної обробки нічної зміни
const parseDateTimeForThirdShift = (isoStr) => {
  const dt = DateTime.fromISO(isoStr, { zone: "utc" });
  return dt.hour < 6 ? dt.plus({ days: 1 }) : dt;
};

function EntryTable({ entries, onEdit, onDelete, onUpdateEntry }) {
  const [commentId, setCommentId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (index, operator, task, quantity) => {
    const message =
      task && quantity > 0
        ? `${operator}, are you sure you want to delete ${task} with a quantity of ${quantity}?`
        : `${operator}, are you sure you want to delete this entry?`;

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
          {[...entries]
            .sort((a, b) => {
              const timeA =
                a.shift === "third"
                  ? parseDateTimeForThirdShift(a.startTime)
                  : DateTime.fromISO(a.startTime, { zone: "utc" });

              const timeB =
                b.shift === "third"
                  ? parseDateTimeForThirdShift(b.startTime)
                  : DateTime.fromISO(b.startTime, { zone: "utc" });

              return timeA - timeB;
            })
            .map((entry, filteredIndex) => (
              <tr key={filteredIndex}>
                <td>{entry.shift}</td>
                <td>{entry.displayDate}</td>
                <td>
                  {DateTime.fromISO(entry.startTime, { zone: "utc" }).toFormat(
                    "HH:mm"
                  )}
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
                <td>{entry.task}</td>
                <td>{entry.product}</td>
                <td>{entry.color}</td>
                <td className={style.reasonDescription}>
                  {reasons.find((r) => r.description === entry.reason)?.id ||
                    ""}
                  {entry.reason && (
                    <span className={style.tooltip}>
                      {
                        reasons.find((r) => r.description === entry.reason)
                          ?.description
                      }
                    </span>
                  )}
                </td>
                <td>{entry.quantity > 0 ? entry.quantity : ""}</td>
                <td>{formatTime(entry.workingTime)}</td>
                <td>{formatTime(entry.downtime)}</td>
                <td>
                  <button
                    className={style.edit}
                    onClick={() => onEdit(filteredIndex, entry.originalIndex)}
                  >
                    <FaRegEdit className={style.icon} />
                  </button>
                  <button
                    className={style.delete}
                    onClick={() =>
                      handleDelete(
                        filteredIndex,
                        entry.operator,
                        entry.task,
                        entry.quantity
                      )
                    }
                  >
                    <RiDeleteBin5Line className={style.icon} />
                  </button>
                </td>
              </tr>
            ))}
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
