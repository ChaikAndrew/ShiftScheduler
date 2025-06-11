// src/components/BarCharts/LeaderTaskBarChart/LeaderTaskBarChart.js
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { chartColors } from "../../../utils/colors";

const LeaderTaskBarChart = ({ data }) => {
  if (!data || data.length === 0) return <p>Немає даних для графіка.</p>;

  const taskKeys = Object.keys(data[0])
    .filter((key) => key !== "leader")
    .filter((key) => data.some((item) => item[key] > 0));

  return (
    <ResponsiveContainer width="100%" height={data.length * 60}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 20, bottom: 20, left: 30, right: 30 }}
      >
        <XAxis type="number" />
        <YAxis
          dataKey="leader"
          type="category"
          tick={{ fontSize: 14 }}
          tickFormatter={(name) => name.replace(" ", "\u00A0")}
        />
        <Tooltip />
        <Legend />
        {taskKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={chartColors[index % chartColors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LeaderTaskBarChart;
