import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "./OperatorManager.module.scss";

// ...імпорти як були

const OperatorManager = () => {
  const [operators, setOperators] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState(null);

  const token = localStorage.getItem("token");

  const fetchOperators = useCallback(async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/operators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOperators(res.data);
    } catch (err) {
      console.error("❌ Помилка при отриманні операторів:", err?.message);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    const checkLocalhost = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const res = await fetch("http://localhost:4040", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) setBaseUrl("http://localhost:4040");
      } catch {}
    };
    checkLocalhost();
  }, []);

  useEffect(() => {
    if (baseUrl) fetchOperators();
  }, [baseUrl, fetchOperators]);

  const addOperator = async () => {
    if (!newName.trim()) return;
    try {
      await axios.post(
        `${baseUrl}/api/operators`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewName("");
      setIsAdding(false);
      fetchOperators();
    } catch (err) {
      console.error("❌ Не вдалося додати оператора:", err?.message);
    }
  };

  // ✅ завжди каскад
  const updateOperator = async () => {
    if (!editName.trim() || !editId) return;
    try {
      await axios.put(
        `${baseUrl}/api/operators/${editId}/rename?cascade=true`,
        { newName: editName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditId(null);
      setEditName("");
      fetchOperators();
    } catch (err) {
      console.error("❌ Не вдалося оновити оператора:", err?.message);
    }
  };

  const askDeleteOperator = (op) => {
    setOperatorToDelete(op);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!operatorToDelete) return;
    try {
      await axios.delete(`${baseUrl}/api/operators/${operatorToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOperators((list) =>
        list.filter((o) => o._id !== operatorToDelete._id)
      );
      setIsDeleting(false);
      setOperatorToDelete(null);
    } catch (err) {
      console.error("❌ Не вдалося видалити оператора:", err?.message);
    }
  };

  const cancelDelete = () => {
    setIsDeleting(false);
    setOperatorToDelete(null);
  };

  const renderModal = (
    title,
    content,
    onClose,
    onSave,
    primaryLabel = "Save"
  ) => (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2 className={styles.roleTitle}>{title}</h2>
        </div>
        <div className={styles.modalBody}>{content}</div>
        <div className={styles.modalActions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onSave}
          >
            {primaryLabel}
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.cardHeader} ${styles.inner}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.roleTitle}>Operators</h3>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setIsAdding(true)}
            >
              + Add New Operator
            </button>
          </div>
        </div>

        <div className={`${styles.cardHeader} ${styles.inner}`}>
          <div className={styles.cardBody}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <colgroup>
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "38%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name, Surname</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...operators]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((op) => (
                      <tr key={op._id}>
                        <td className={styles.mono}>{op._id}</td>
                        <td>
                          {editId === op._id ? (
                            <div className={styles.editCell}>
                              <input
                                className={styles.input}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Name Surname"
                              />
                            </div>
                          ) : (
                            op.name
                          )}
                        </td>
                        <td className={styles.actionsCol}>
                          {editId === op._id ? (
                            <>
                              <button
                                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                                onClick={updateOperator}
                                title="Rename and update history"
                              >
                                Save
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                                onClick={() => {
                                  setEditId(null);
                                  setEditName("");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className={`${styles.btn} ${styles.btnSmall}`}
                                onClick={() => {
                                  setEditId(op._id);
                                  setEditName(op.name);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                                onClick={() => askDeleteOperator(op)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isAdding &&
        renderModal(
          "Add New Operator",
          <>
            <input
              className={styles.input}
              type="text"
              placeholder="Name Surname"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </>,
          () => setIsAdding(false),
          addOperator,
          "Save"
        )}

      {isDeleting &&
        renderModal(
          "Delete Operator",
          <>
            <p>
              Delete Operator <strong>{operatorToDelete?.name}</strong>?
            </p>
            <p className={styles.note}>This action cannot be undone.</p>
          </>,
          cancelDelete,
          confirmDelete,
          "Delete"
        )}

      {editId && (
        <div className={styles.editBanner} role="status" aria-live="polite">
          <span className={styles.editBannerDot} aria-hidden="true" />
          <strong>Rename mode:</strong> history will be updated automatically.
        </div>
      )}
    </div>
  );
};

export default OperatorManager;
