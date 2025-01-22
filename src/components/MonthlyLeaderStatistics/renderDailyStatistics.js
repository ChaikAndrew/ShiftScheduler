import styles from "./MonthlyLeaderStatistics.module.scss";

export const renderDailyStatistics = (statistics, leaders, daysInMonth) => {
  const hasData = Object.values(statistics).some((leaderData) =>
    leaderData.some((day) => day.total > 0)
  );

  if (!hasData) {
    return <p>No data available for the selected month and leaders.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Leader</th>
          {Array.from({ length: daysInMonth }, (_, i) => (
            <th key={i}>{i + 1}</th>
          ))}
          <th>Average per Day</th>
        </tr>
      </thead>
      <tbody>
        {leaders.map((leader) => {
          const monthlyData = statistics[leader];
          const totalQuantity = monthlyData.reduce(
            (sum, day) => sum + day.total,
            0
          );
          const daysWithData = monthlyData.filter(
            (day) => day.total > 0
          ).length;
          const averagePerDay =
            daysWithData > 0 ? Math.round(totalQuantity / daysWithData) : 0;

          return (
            <tr key={leader}>
              <td>{leader}</td>
              {monthlyData.map((day, index) => (
                <td key={index}>{day.total > 0 ? day.total : ""}</td>
              ))}
              <td>{averagePerDay > 0 ? averagePerDay : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
