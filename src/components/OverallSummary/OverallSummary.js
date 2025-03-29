import React from "react";
import CustomActiveShapePieChart from "../CustomActiveShapePieChart/CustomActiveShapePieChart"; // Імпортуємо кастомний компонент
import styles from "./OverallSummary.module.scss";

function OverallSummary({ overallSummary }) {
  const hasOverallData =
    overallSummary.overallTotalQuantity > 0 ||
    Object.values(overallSummary.overallTaskSummary).some(
      (value) => value > 0
    ) ||
    Object.values(overallSummary.overallProductSummary).some(
      (value) => value > 0
    );

  if (!hasOverallData) {
    return null;
  }

  const taskData = Object.keys(overallSummary.overallTaskSummary)
    .filter((task) => overallSummary.overallTaskSummary[task] > 0)
    .map((task) => ({
      name: task,
      value: overallSummary.overallTaskSummary[task],
    }));

  const productData = Object.keys(overallSummary.overallProductSummary)
    .filter((product) => overallSummary.overallProductSummary[product] > 0)
    .map((product) => ({
      name: product,
      value: overallSummary.overallProductSummary[product],
    }));

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#d0ed57",
    "#a4de6c",
    "#b3429d",
  ];

  return (
    <div>
      <div className={styles.summaryTitle}>
        {overallSummary.overallTotalQuantity > 0 && (
          <>
            <h4 className={styles.title}>Overall Total Summary</h4>
            <p className={styles.value}>
              Total Quantity:{" "}
              <span className={styles.highlight}>
                {overallSummary.overallTotalQuantity}
              </span>
            </p>
          </>
        )}
      </div>

      <div className={styles.summaryContainer}>
        <div className={styles.summaryBlock}>
          {taskData.length > 0 && (
            <>
              <h4 className={styles.title}>Overall Task Summary</h4>
              <CustomActiveShapePieChart
                data={taskData}
                colors={colors}
                width="100%"
                height={350}
              />
              <ul className={styles.taskList}>
                {taskData.map((task) => (
                  <li key={task.name} className={styles.description}>
                    <span className={styles.taskName}>{task.name}</span>:{" "}
                    <span className={styles.taskValue}>{task.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={styles.summaryBlock}>
          {productData.length > 0 && (
            <>
              <h4 className={styles.title}>Overall Product Summary</h4>
              <CustomActiveShapePieChart
                data={productData}
                colors={colors}
                width="100%"
                height={350}
              />
              <ul className={styles.productList}>
                {productData.map((product) => (
                  <li key={product.name} className={styles.description}>
                    <span className={styles.productName}>{product.name}</span>:{" "}
                    <span className={styles.productValue}>{product.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OverallSummary;
