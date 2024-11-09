import React from "react";
import { DateTime } from "luxon";
import { formatTime } from "../../utils/formatTime";
import { reasons } from "../../utils/constants"; // заміни path_to_your_data_file на правильний шлях
import style from "./EntryTable.module.scss";

function EntryTable({ entries, onEdit, onDelete }) {
  return (
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
        {entries.map((entry, index) => (
          <tr key={index}>
            <td>{entry.shift}</td>
            <td>{entry.displayDate}</td>
            <td>{DateTime.fromISO(entry.startTime).toFormat("HH:mm")}</td>
            <td>{DateTime.fromISO(entry.endTime).toFormat("HH:mm")}</td>
            <td>{entry.leader}</td>
            <td>{entry.machine}</td>
            <td>{entry.operator}</td>
            <td>{entry.task}</td>
            <td>{entry.product}</td>
            <td>{entry.color}</td>
            <td className={style.reasonDescription}>
              {
                reasons.find((reason) => reason.description === entry.reason)
                  ?.id
              }
              <span className={style.tooltip}>
                {
                  reasons.find((reason) => reason.description === entry.reason)
                    ?.description
                }
              </span>
            </td>
            <td>{entry.quantity}</td>
            <td>{formatTime(entry.workingTime)}</td>
            <td>{formatTime(entry.downtime)}</td>
            <td>
              <button className="edit" onClick={() => onEdit(index)}>
                Edit
              </button>

              <button className="delete" onClick={() => onDelete(index)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default EntryTable;
