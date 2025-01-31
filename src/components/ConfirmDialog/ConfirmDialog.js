import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import styles from "./ConfirmDialog.module.scss";

export const showConfirmDialog = ({ title, message, onConfirm }) => {
  confirmAlert({
    customUI: ({ onClose }) => (
      <div className={styles.overlay}>
        <div className={styles.confirmDialog}>
          <h2>{title || "Delete Confirmation"}</h2>
          <p>{message || "Are you sure?"}</p>
          <div className={styles.dialogButtons}>
            <button
              className={styles.confirmBtn}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Yes
            </button>
            <button className={styles.cancelBtn} onClick={onClose}>
              No
            </button>
          </div>
        </div>
      </div>
    ),
    closeOnEscape: true,
    closeOnClickOutside: true,
  });
};
