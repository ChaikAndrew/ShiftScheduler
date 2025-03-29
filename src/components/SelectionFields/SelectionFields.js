import React, { useEffect, useState } from "react";
import style from "./SelectionFields.module.scss";

/**
 * Компонент SelectionFields рендерить поля для вибору лідера, машини та оператора.
 */
const SelectionFields = ({
  selectedLeader,
  setSelectedLeader,
  leaders,
  selectedMachine,
  setSelectedMachine,
  machines,
  selectedOperator,
  setSelectedOperator,
}) => {
  const [operatorsFromDB, setOperatorsFromDB] = useState([]);
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );

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
        }
      } catch {
        console.log("🌍 Використовується продакшн API");
      }
    };

    const fetchOperators = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/operators`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        const names = data.map((op) => op.name);
        setOperatorsFromDB(names);
      } catch (err) {
        console.error("❌ Не вдалося завантажити операторів:", err);
      }
    };

    checkLocalhost().then(fetchOperators);
  }, [baseUrl]);

  return (
    <div className={style.SelectionFields}>
      {/* Вибір лідера */}
      <select
        value={selectedLeader}
        onChange={(e) => setSelectedLeader(e.target.value)}
      >
        <option value="">Select Leader</option>
        {leaders.map((leader) => (
          <option key={leader} value={leader}>
            {leader}
          </option>
        ))}
      </select>

      {/* Вибір машини */}
      <select
        value={selectedMachine}
        onChange={(e) => setSelectedMachine(e.target.value)}
      >
        <option value="">Select Machine</option>
        {machines.map((machine) => (
          <option key={machine} value={machine}>
            {machine}
          </option>
        ))}
      </select>

      {/* Вибір оператора */}
      <select
        value={selectedOperator}
        onChange={(e) => setSelectedOperator(e.target.value)}
      >
        <option value="">Select Operator</option>
        {[...operatorsFromDB]
          .sort((a, b) => a.localeCompare(b))
          .map((operator) => (
            <option key={operator} value={operator}>
              {operator}
            </option>
          ))}
      </select>
    </div>
  );
};

export default SelectionFields;
