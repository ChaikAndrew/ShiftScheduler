export const getLeaderStatisticsForMonth = (
  entries,
  leaders,
  selectedMonth
) => {
  const daysInMonth = new Date(
    selectedMonth.year,
    selectedMonth.month + 1,
    0
  ).getDate();

  const statistics = leaders.reduce((acc, leader) => {
    acc[leader] = Array(daysInMonth).fill({
      total: 0,
      taskSummary: { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 },
      productSummary: {
        "T-shirts": 0,
        Hoodie: 0,
        Bags: 0,
        Sleeves: 0,
        Children: 0,
        Others: 0,
      },
    });
    return acc;
  }, {});

  const allEntries = Object.values(entries).flatMap((shiftEntries) =>
    Object.values(shiftEntries).flat()
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEntries = allEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === day &&
        entryDate.getMonth() === selectedMonth.month &&
        entryDate.getFullYear() === selectedMonth.year
      );
    });

    leaders.forEach((leader) => {
      const leaderEntries = dayEntries.filter(
        (entry) => entry.leader === leader
      );

      let taskSummary = { POD: 0, POF: 0, Zlecenie: 0, Sample: 0, Test: 0 };
      let productSummary = {
        "T-shirts": 0,
        Hoodie: 0,
        Bags: 0,
        Sleeves: 0,
        Children: 0,
        Others: 0,
      };
      let total = 0;

      leaderEntries.forEach((entry) => {
        const task = entry.task;
        const quantity = parseInt(entry.quantity, 10) || 0;
        if (task in taskSummary) {
          taskSummary[task] += quantity;
        } else {
          taskSummary.Zlecenie += quantity;
        }
        total += quantity;

        if (entry.product in productSummary) {
          productSummary[entry.product] += quantity;
        }
      });

      statistics[leader][day - 1] = { total, taskSummary, productSummary };
    });
  }

  return statistics;
};
