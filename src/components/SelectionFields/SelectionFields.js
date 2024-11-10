import React from "react";
import style from "./SelectionFields.module.scss";
/**
 * Компонент SelectionFields рендерить поля для вибору лідера, машини та оператора.
 *
 * Пропси:
 * - selectedLeader: обране значення для лідера
 * - setSelectedLeader: функція для оновлення обраного лідера
 * - leaders: масив з варіантами вибору для лідера
 * - selectedMachine: обране значення для машини
 * - setSelectedMachine: функція для оновлення обраної машини
 * - machines: масив з варіантами вибору для машини
 * - selectedOperator: обране значення для оператора
 * - setSelectedOperator: функція для оновлення обраного оператора
 * - operators: масив з варіантами вибору для оператора
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
  operators,
}) => {
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
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {operator}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectionFields;
