import { fetchStraties } from "./stratyApi";

const SHIFT_LABEL = {
  first: "1 ZMIANA",
  second: "2 ZMIANA",
  third: "3 ZMIANA",
};

// мапа продуктів → категорія з API (BLUZA / T-SHIRT)
const PRODUCT_TO_STRATY = {
  "T-shirts": "T-SHIRT",
  Hoodies: "BLUZA",
};

export async function getStratyPerShiftByProductForDate(date, products) {
  const out = {
    first: Object.fromEntries(products.map((p) => [p, 0])),
    second: Object.fromEntries(products.map((p) => [p, 0])),
    third: Object.fromEntries(products.map((p) => [p, 0])),
  };

  await Promise.all(
    Object.entries(SHIFT_LABEL).map(async ([key, label]) => {
      const data = await fetchStraties({ date, shift: label, mode: "day" });

      // рахуємо BLUZA / T-SHIRT
      let bluza = 0,
        tshirt = 0;
      for (const x of data) {
        const kind = (x.bluza_t_shirt || "").toUpperCase();
        if (kind === "BLUZA") bluza++;
        else if (kind === "T-SHIRT") tshirt++;
      }

      // розкидаємо по продуктах через мапу
      for (const p of products) {
        const mapTo = PRODUCT_TO_STRATY[p];
        out[key][p] =
          mapTo === "BLUZA" ? bluza : mapTo === "T-SHIRT" ? tshirt : 0;
      }
    })
  );

  return out;
}
