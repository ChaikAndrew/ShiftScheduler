/**
 * Обчислює підсумки для вибраних записів.
 *
 * @param {Array} entries - Масив записів, для яких потрібно обчислити підсумки.
 * @param {Array} operators - Список операторів для генерації статистики.
 * @param {Array} products - Список продуктів для обчислення статистики.
 * @returns {Object} - Об'єкт, що містить загальні підсумки.
 */
export function calculateSummary(entries, operators, products) {
  const totalQuantity = entries.reduce(
    (sum, entry) => sum + (parseInt(entry.quantity, 10) || 0),
    0
  );
  const totalWorkingTime = entries.reduce(
    (sum, entry) => sum + (entry.workingTime || 0),
    0
  );
  const totalDowntime = entries.reduce(
    (sum, entry) => sum + (entry.downtime || 0),
    0
  );

  const taskSummary = {
    POD: 0,
    POF: 0,
    Zlecenie: 0,
    Test: 0,
  };

  entries.forEach((entry) => {
    const task = entry.task;
    if (task === "POD") {
      taskSummary.POD += parseInt(entry.quantity, 10) || 0;
    } else if (task === "POF") {
      taskSummary.POF += parseInt(entry.quantity, 10) || 0;
    } else if (task === "Test") {
      taskSummary.Test += parseInt(entry.quantity, 10) || 0;
    } else {
      taskSummary.Zlecenie += parseInt(entry.quantity, 10) || 0;
    }
  });

  const operatorSummary = operators.reduce((acc, operator) => {
    acc[operator] = {
      total: 0,
      taskSummary: {
        POD: 0,
        POF: 0,
        Zlecenie: 0,
        Test: 0,
      },
      productSummary: {},
    };

    const operatorEntries = entries.filter(
      (entry) => entry.operator === operator
    );

    acc[operator].total = operatorEntries.reduce(
      (sum, entry) => sum + (parseInt(entry.quantity, 10) || 0),
      0
    );

    operatorEntries.forEach((entry) => {
      const task = entry.task;
      if (task === "POD") {
        acc[operator].taskSummary.POD += parseInt(entry.quantity, 10) || 0;
      } else if (task === "POF") {
        acc[operator].taskSummary.POF += parseInt(entry.quantity, 10) || 0;
      } else if (task === "Test") {
        acc[operator].taskSummary.Test += parseInt(entry.quantity, 10) || 0;
      } else {
        acc[operator].taskSummary.Zlecenie += parseInt(entry.quantity, 10) || 0;
      }
    });

    products.forEach((product) => {
      acc[operator].productSummary[product] = operatorEntries
        .filter((entry) => entry.product === product)
        .reduce((sum, entry) => sum + (parseInt(entry.quantity, 10) || 0), 0);
    });

    return acc;
  }, {});

  const productSummary = products.reduce((acc, product) => {
    acc[product] = entries
      .filter((entry) => entry.product === product)
      .reduce((sum, entry) => sum + (parseInt(entry.quantity, 10) || 0), 0);
    return acc;
  }, {});

  return {
    totalQuantity,
    totalWorkingTime,
    totalDowntime,
    taskSummary,
    operatorSummary,
    productSummary,
  };
}

/**
 * Обчислює загальні підсумки для всіх змін за вибраною датою.
 *
 * @param {Object} entries - Об'єкт із записами для всіх змін.
 * @param {string} selectedDate - Вибрана дата для фільтрації записів.
 * @param {string} currentShift - Поточна зміна.
 * @param {Array} products - Список продуктів для підсумків.
 * @returns {Object} - Загальні підсумки.
 */
export function calculateOverallSummary(
  entries,
  selectedDate,
  currentShift,
  products
) {
  const filteredEntries = Object.values(entries)
    .flatMap((shiftEntries) => Object.values(shiftEntries).flat())
    .filter(
      (entry) =>
        entry.displayDate === selectedDate && entry.shift === currentShift
    );

  const overallTotalQuantity = filteredEntries.reduce(
    (sum, entry) => sum + (parseInt(entry.quantity, 10) || 0),
    0
  );

  const overallTaskSummary = {
    POD: 0,
    POF: 0,
    Zlecenie: 0,
    Test: 0,
  };

  filteredEntries.forEach((entry) => {
    const task = entry.task;
    if (task === "POD") {
      overallTaskSummary.POD += parseInt(entry.quantity, 10) || 0;
    } else if (task === "POF") {
      overallTaskSummary.POF += parseInt(entry.quantity, 10) || 0;
    } else if (task === "Test") {
      overallTaskSummary.Test += parseInt(entry.quantity, 10) || 0;
    } else {
      overallTaskSummary.Zlecenie += parseInt(entry.quantity, 10) || 0;
    }
  });

  const overallProductSummary = products.reduce((acc, product) => {
    acc[product] = filteredEntries
      .filter((entry) => entry.product === product)
      .reduce((sum, entry) => sum + (parseInt(entry.quantity, 10) || 0), 0);
    return acc;
  }, {});

  return {
    overallTotalQuantity,
    overallTaskSummary,
    overallProductSummary,
  };
}
