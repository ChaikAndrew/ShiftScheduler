export async function fetchStraties({
  date,
  shift,
  month,
  year,
  mode = "day",
}) {
  const baseURL = "https://braki-api.vercel.app/api";
  const endpoint =
    mode === "month"
      ? `${baseURL}/straties-filtered?year=${year}&month=${month}`
      : `${baseURL}/straties-filtered?date=${date}&shift=${encodeURIComponent(
          shift
        )}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Straty fetch failed: ${res.status}`);
  return res.json();
}
