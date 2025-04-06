import { tasks, products } from "../utils/constants"; // або "../../utils/constants" — залежно від розташування

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
    acc[leader] = Array.from({ length: daysInMonth }, () => ({
      total: 0,
      taskSummary: Object.fromEntries(tasks.map((task) => [task, 0])),
      productSummary: Object.fromEntries(products.map((p) => [p, 0])),
    }));
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

      const taskSummary = Object.fromEntries(tasks.map((task) => [task, 0]));
      const productSummary = Object.fromEntries(
        products.map((product) => [product, 0])
      );
      let total = 0;

      leaderEntries.forEach((entry) => {
        const task = entry.task?.trim();
        const product = entry.product?.trim();
        const quantity = parseInt(entry.quantity, 10) || 0;

        if (tasks.includes(task)) {
          taskSummary[task] += quantity;
        } else {
          taskSummary["Zlecenie"] += quantity;
        }

        if (products.includes(product)) {
          productSummary[product] += quantity;
        }

        total += quantity;
      });

      statistics[leader][day - 1] = { total, taskSummary, productSummary };
    });
  }

  return statistics;
};
