import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "./OperatorManager.module.scss";

const OperatorManager = () => {
  const [operators, setOperators] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
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

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.roleTitle}>Add new operator</h2>

      <div className={styles.addOperatorForm}>
        <input
          type="text"
          placeholder="Name Surname"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className={styles.addButton} onClick={addOperator}>
          Add
        </button>
      </div>

      <div className={styles.roleSection}>
        <h3>Operators</h3>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name, Surname</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {[...operators]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((op) => (
                <tr key={op._id}>
                  <td>{op._id}</td>
                  <td>
                    {editId === op._id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      op.name
                    )}
                  </td>
                  <td>
                    {editId === op._id ? (
                      <>
                        <button onClick={updateOperator}>Save</button>
                        <button onClick={() => setEditId(null)}>❌</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditId(op._id);
                            setEditName(op.name);
                          }}
                        >
                          Edit
                        </button>
                        <button onClick={() => deleteOperator(op._id)}>
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
  );
};

export default OperatorManager;
