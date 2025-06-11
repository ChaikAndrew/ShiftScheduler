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

const OperatorProductBarChart = ({ data }) => {
  if (!data || data.length === 0) return <p>Немає даних для графіка.</p>;

  const productKeys = Object.keys(data[0])
    .filter((key) => key !== "operator")
    .filter((key) => data.some((item) => item[key] > 0));

  return (
    <ResponsiveContainer width="90%" height={Math.max(data.length * 30, 180)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 20, bottom: 20, left: 30, right: 30 }}
      >
        <XAxis type="number" />
        <YAxis
          dataKey="operator"
          type="category"
          tick={{ fontSize: 12 }}
          tickFormatter={(name) => name.replace(" ", "\u00A0")} // ← вставляє нерозривний пробіл
        />

        <Tooltip />
        <Legend />
        {productKeys.map((key, index) => (
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

export default OperatorProductBarChart;
