import { fetchStraties } from "./stratyApi";

const SHIFT_LABEL = {
  first: "1 ZMIANA",
  second: "2 ZMIANA",
  third: "3 ZMIANA",
};

// { first:{POD,POF,ZLECENIE}, second:{...}, third:{...} }
export async function getStratyPerShiftByTaskForDate(date) {
  const empty = { POD: 0, POF: 0, ZLECENIE: 0 };
  const out = {
    first: { ...empty },
    second: { ...empty },
    third: { ...empty },
  };

  await Promise.all(
    Object.entries(SHIFT_LABEL).map(async ([key, label]) => {
      const data = await fetchStraties({ date, shift: label, mode: "day" });
      const agg = { ...empty };
      for (const x of data) {
        const t = (x.pof_pod_hurt || "").toUpperCase();
        if (t === "POD") agg.POD++;
        else if (t === "POF") agg.POF++;
        else if (t === "ZLECENIE") agg.ZLECENIE++;
      }
      out[key] = agg;
    })
  );

  return out;
}
