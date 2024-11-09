import React from "react";
import style from "./OperatorsSummary.module.scss";

function OperatorSummary({ operators, operatorSummary }) {
  // Перевірка, чи є дані для операторів
  const hasOperatorData = operators.some(
    (operator) => operatorSummary[operator]?.total > 0
  );

  if (!hasOperatorData) {
    return null; // Якщо немає даних, не відображаємо компонент
  }

  return (
    <div className={style.operatorsSummary}>
      {operators.map((operator) => {
        const summary = operatorSummary[operator];
        if (summary?.total > 0) {
          return (
            <div key={operator} className={style.operatorSummary}>
              <h3 className={style.operatorName}>{operator}</h3>

              <div className={style.summarySection}>
                <h4 className={style.sectionTitle}>Task Summary</h4>
                <p className={style.total}>Total: {summary.total}</p>

                {/* Task Summary */}
                {Object.values(summary.taskSummary).some(
                  (value) => value > 0
                ) && (
                  <ul className={style.summaryList}>
                    {Object.keys(summary.taskSummary).map(
                      (task) =>
                        summary.taskSummary[task] > 0 && (
                          <li key={task} className={style.summaryItem}>
                            {task}: {summary.taskSummary[task]}
                          </li>
                        )
                    )}
                  </ul>
                )}
              </div>

              <div className={style.summarySection}>
                <h4 className={style.sectionTitle}>Product Summary</h4>

                {/* Product Summary */}
                {Object.values(summary.productSummary).some(
                  (value) => value > 0
                ) && (
                  <ul className={style.summaryList}>
                    {Object.keys(summary.productSummary).map(
                      (product) =>
                        summary.productSummary[product] > 0 && (
                          <li key={product} className={style.summaryItem}>
                            {product}: {summary.productSummary[product]}
                          </li>
                        )
                    )}
                  </ul>
                )}
              </div>
            </div>
          );
        }
        return null; // Не відображаємо операторів з нульовими значеннями
      })}
    </div>
  );
}

export default OperatorSummary;
