import styles from "./MonthlyLeaderStatistics.module.scss";

export const renderMonthlySummary = (statistics, leaders) => {
  const hasData = leaders.some((leader) =>
    statistics[leader].some((day) => day.total > 0)
  );

  if (!hasData) {
    return <p>No summary data available for the selected month and leaders.</p>;
  }

  const monthlyTotals = leaders.map((leader) => {
    const monthlyData = statistics[leader];
    const total = monthlyData.reduce((sum, day) => sum + day.total, 0);
    const taskSummary = monthlyData.reduce(
      (acc, day) => {
        Object.keys(day.taskSummary).forEach((task) => {
          acc[task] += day.taskSummary[task];
        });
        return acc;
      },
      { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 }
    );

    const productSummary = monthlyData.reduce(
      (acc, day) => {
        Object.keys(day.productSummary).forEach((product) => {
          acc[product] += day.productSummary[product];
        });
        return acc;
      },
      {
        "T-shirts": 0,
        Hoodie: 0,
        Bags: 0,
        Sleeves: 0,
        Children: 0,
        Others: 0,
      }
    );

    return { leader, total, taskSummary, productSummary };
  });

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Leader</th>
          <th>Total Quantity</th>
          <th>POD</th>
          <th>POF</th>
          <th>Zlecenie</th>
          <th>Sample</th>
          <th>Test</th>
          <th>T-shirts</th>
          <th>Hoodie</th>
          <th>Bags</th>
          <th>Sleeves</th>
          <th>Children</th>
          <th>Others</th>
        </tr>
      </thead>
      <tbody>
        {monthlyTotals.map(({ leader, total, taskSummary, productSummary }) => (
          <tr key={leader}>
            <td>{leader}</td>
            <td>{total > 0 ? total : ""}</td>
            <td>{taskSummary.POD > 0 ? taskSummary.POD : ""}</td>
            <td>{taskSummary.POF > 0 ? taskSummary.POF : ""}</td>
            <td>{taskSummary.Zlecenie > 0 ? taskSummary.Zlecenie : ""}</td>
            <td>{taskSummary.Sample > 0 ? taskSummary.Sample : ""}</td>
            <td>{taskSummary.Test > 0 ? taskSummary.Test : ""}</td>
            <td>
              {productSummary["T-shirts"] > 0 ? productSummary["T-shirts"] : ""}
            </td>
            <td>{productSummary.Hoodie > 0 ? productSummary.Hoodie : ""}</td>
            <td>{productSummary.Bags > 0 ? productSummary.Bags : ""}</td>
            <td>{productSummary.Sleeves > 0 ? productSummary.Sleeves : ""}</td>
            <td>
              {productSummary.Children > 0 ? productSummary.Children : ""}
            </td>
            <td>{productSummary.Others > 0 ? productSummary.Others : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
