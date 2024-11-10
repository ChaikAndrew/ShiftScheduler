import React from "react";
import CustomActiveShapePieChart from "../CustomActiveShapePieChart/CustomActiveShapePieChart"; // Імпорт компонента для кругової діаграми
import styles from "./TaskSummary.module.scss"; // Припустимо, що є відповідний файл стилів

function TaskSummary({ taskSummary }) {
  const hasTaskData = Object.values(taskSummary).some((value) => value > 0);

  if (!hasTaskData) {
    return null; // Якщо немає даних, не відображаємо компонент
  }

  // Підготовка даних для кругової діаграми
  const taskData = Object.keys(taskSummary)
    .filter((task) => taskSummary[task] > 0)
    .map((task) => ({
      name: task,
      value: taskSummary[task],
    }));

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#d0ed57",
    "#a4de6c",
    "#b3429d",
  ]; // Кольори для кругової діаграми

  return (
    <div className={styles.taskSummary}>
      <p className={styles.taskSummaryTitle}>Task summary</p>
      <CustomActiveShapePieChart
        data={taskData}
        colors={colors}
        width="100%"
        height={250}
      />

      <ul className={styles.productList}>
        {taskData.map((task) => (
          <li key={task.name} className={styles.description}>
            <span>{task.name}</span>: <span>{task.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskSummary;
