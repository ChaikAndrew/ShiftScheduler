// src/utils/calculateDetailedByShift.js
// Рахує по кожній зміні: продукти (з кольорами), задачі, деталі Zlecenie,
// + агрегати "ВСЬОГО ЗА ДЕНЬ".
// Опційно приймає losses (страти) по продуктам і задачам та підмішує їх у результат.
export function calculateDetailedByShift(
  entries,
  selectedDate,
  products,
  losses // { byProduct?: {first|second|third}, byTask?: {first|second|third} }
) {
  const SHIFTS = ["first", "second", "third"];

  const mkProd = () =>
    products.reduce((acc, p) => {
      acc[p] = { total: 0, Color: 0, White: 0 };
      return acc;
    }, {});

  const mkTasks = () => ({ POD: 0, POF: 0, Test: 0, Zlecenie: 0 });

  const res = {
    first: {
      total: 0,
      byProduct: mkProd(),
      byTask: mkTasks(),
      zlecenia: {},
      byColor: { Color: 0, White: 0 },
      // опційно
      losses: { byProduct: {}, byTask: { POD: 0, POF: 0, ZLECENIE: 0 } },
    },
    second: {
      total: 0,
      byProduct: mkProd(),
      byTask: mkTasks(),
      zlecenia: {},
      byColor: { Color: 0, White: 0 },
      losses: { byProduct: {}, byTask: { POD: 0, POF: 0, ZLECENIE: 0 } },
    },
    third: {
      total: 0,
      byProduct: mkProd(),
      byTask: mkTasks(),
      zlecenia: {},
      byColor: { Color: 0, White: 0 },
      losses: { byProduct: {}, byTask: { POD: 0, POF: 0, ZLECENIE: 0 } },
    },
  };

  // Основні підсумки з entries
  SHIFTS.forEach((shift) => {
    const list = Object.values(entries[shift] || {})
      .flat()
      .filter((e) => e.displayDate === selectedDate);

    list.forEach((e) => {
      const qty = parseInt(e.quantity, 10) || 0;
      const product = e.product;
      const color = e.color; // "Color" | "White"
      const taskGroup =
        e.task === "POD" || e.task === "POF" || e.task === "Test"
          ? e.task
          : "Zlecenie";

      res[shift].total += qty;

      if (product && res[shift].byProduct[product]) {
        res[shift].byProduct[product].total += qty;
        if (color === "Color" || color === "White") {
          res[shift].byProduct[product][color] += qty;
          res[shift].byColor[color] += qty;
        }
      }

      res[shift].byTask[taskGroup] += qty;

      if (taskGroup === "Zlecenie") {
        const name = (e.task || "Zlecenie").trim();
        res[shift].zlecenia[name] = (res[shift].zlecenia[name] || 0) + qty;
      }
    });
  });

  // Підмішуємо страти (якщо передали)
  if (losses?.byProduct) {
    SHIFTS.forEach((sh) => {
      res[sh].losses.byProduct = {
        ...products.reduce((a, p) => ({ ...a, [p]: 0 }), {}),
        ...(losses.byProduct[sh] || {}),
      };
    });
  }
  if (losses?.byTask) {
    SHIFTS.forEach((sh) => {
      const src = losses.byTask[sh] || {};
      res[sh].losses.byTask = {
        POD: src.POD || 0,
        POF: src.POF || 0,
        ZLECENIE: src.ZLECENIE || 0,
      };
    });
  }

  // Агрегати "ВСЬОГО ЗА ДЕНЬ"
  res.total = {
    total: SHIFTS.reduce((s, sh) => s + res[sh].total, 0),
    byColor: {
      Color: SHIFTS.reduce((s, sh) => s + res[sh].byColor.Color, 0),
      White: SHIFTS.reduce((s, sh) => s + res[sh].byColor.White, 0),
    },
    byTask: ["POD", "POF", "Test", "Zlecenie"].reduce((acc, t) => {
      acc[t] = SHIFTS.reduce((s, sh) => s + res[sh].byTask[t], 0);
      return acc;
    }, {}),
    byProduct: products.reduce((acc, p) => {
      const sumKey = (k) =>
        SHIFTS.reduce((s, sh) => s + (res[sh].byProduct[p][k] || 0), 0);
      acc[p] = {
        total: sumKey("total"),
        Color: sumKey("Color"),
        White: sumKey("White"),
      };
      return acc;
    }, {}),
    // тотали страт (якщо вони були)
    losses: {
      byProduct: products.reduce((acc, p) => {
        acc[p] = SHIFTS.reduce(
          (s, sh) => s + (res[sh].losses?.byProduct?.[p] || 0),
          0
        );
        return acc;
      }, {}),
      byTask: {
        POD: SHIFTS.reduce(
          (s, sh) => s + (res[sh].losses?.byTask?.POD || 0),
          0
        ),
        POF: SHIFTS.reduce(
          (s, sh) => s + (res[sh].losses?.byTask?.POF || 0),
          0
        ),
        ZLECENIE: SHIFTS.reduce(
          (s, sh) => s + (res[sh].losses?.byTask?.ZLECENIE || 0),
          0
        ),
      },
    },
  };

  return res;
}
