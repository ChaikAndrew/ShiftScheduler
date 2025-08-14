import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "./OperatorManager.module.scss";

const OperatorManager = () => {
  const [operators, setOperators] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );

  const token = localStorage.getItem("token");

  const fetchOperators = useCallback(async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/operators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOperators(res.data);
    } catch (err) {
      console.error("❌ Помилка при отриманні операторів:", err.message);
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

        if (res.ok) {
          setBaseUrl("http://localhost:4040");
          console.log("✅ Використовується localhost");
        }
      } catch {
        console.log("🌍 Використовується продакшн");
      }
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
      console.error("❌ Не вдалося додати оператора:", err.message);
    }
  };

  const updateOperator = async () => {
    if (!editName.trim()) return;
    try {
      await axios.put(
        `${baseUrl}/api/operators/${editId}`,
        { name: editName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditId(null);
      setEditName("");
      fetchOperators();
    } catch (err) {
      console.error("❌ Не вдалося оновити оператора:", err.message);
    }
  };

  const deleteOperator = async (id) => {
    if (!window.confirm("Точно видалити оператора?")) return;
    try {
      await axios.delete(`${baseUrl}/api/operators/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOperators();
    } catch (err) {
      console.error("❌ Не вдалося видалити оператора:", err.message);
    }
  };

  const renderModal = (title, content, onClose, onSave) => (
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
            Save
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
          {" "}
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
                            <input
                              className={styles.input}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
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
                              >
                                Save
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                                onClick={() => setEditId(null)}
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
                                onClick={() => deleteOperator(op._id)}
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
          addOperator
        )}
    </div>
  );
};

export default OperatorManager;
