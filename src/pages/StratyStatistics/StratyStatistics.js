import React from "react";
import MonthlyStratyStats from "../../components/MonthlyStratyStats/MonthlyStratyStats";

const StratyStatistics = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Statystyka Strat</h1>
      <MonthlyStratyStats year={2024} month={9} />
    </div>
  );
};

export default StratyStatistics;
