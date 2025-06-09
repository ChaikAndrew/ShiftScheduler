import { useEffect, useState } from "react";
import { getEntriesByMonth } from "../utils/api/shiftApi";

/**
 * Хук для завантаження entries з сервера за вказаний місяць і рік
 * @param {number} year - Наприклад 2025
 * @param {number} month - Наприклад 6 (червень)
 * @returns {Object} entries - згруповані по shift → machine
 */
const useEntriesLoader = (year, month) => {
  const [entries, setEntries] = useState({ first: {}, second: {}, third: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const response = await getEntriesByMonth(year, month, token);
        const dbEntries = response.data;

        const grouped = { first: {}, second: {}, third: {} };
        dbEntries.forEach((entry) => {
          const { shift, machine } = entry;
          if (!grouped[shift][machine]) grouped[shift][machine] = [];
          grouped[shift][machine].push(entry);
        });

        setEntries(grouped);
        setError(null);
      } catch (err) {
        console.error("❌ useEntriesLoader error:", err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [year, month]);

  return { entries, loading, error };
};

export default useEntriesLoader;
