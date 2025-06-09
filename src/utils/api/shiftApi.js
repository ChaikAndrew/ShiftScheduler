import axios from "axios";

let API_BASE = "https://shift-scheduler-server.vercel.app/shifts";

//Перевірка на доступний локальний сервер, якщо так — перемикає API на localhost.
const checkLocalhost = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const response = await fetch("http://localhost:4040", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      console.log("Localhost detected. Switching API base.");
      API_BASE = "http://localhost:4040/shifts";
    }
  } catch (err) {
    console.log("Using remote API.");
  }
};

// Викликається автоматично при імпорті
checkLocalhost();

/**
 * Зберігає новий запис у базу даних.
 * @param {Object} entryData - Дані запису.
 * @param {string} token - JWT токен користувача.
 * @returns {Promise} - Результат запиту.
 */
export const saveEntryToDB = async (entryData, token) => {
  return axios.post(`${API_BASE}/add`, entryData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Оновлює існуючий запис у базі даних за ID.
 * @param {string} id - ID запису.
 * @param {Object} entryData - Оновлені дані.
 * @param {string} token - JWT токен користувача.
 * @returns {Promise} - Результат запиту.
 */
export const updateEntryInDB = async (id, entryData, token) => {
  return axios.put(`${API_BASE}/update/${id}`, entryData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Видаляє запис з бази даних за ID.
 * @param {string} id - ID запису.
 * @param {string} token - JWT токен користувача.
 * @returns {Promise} - Результат запиту.
 */
export const deleteEntryFromDB = async (id, token) => {
  return axios.delete(`${API_BASE}/delete/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Отримує всі записи з бази даних.
 * @param {string} token - JWT токен користувача.
 * @returns {Promise} - Масив записів.
 */
export const getEntriesFromDB = async (token) => {
  return axios.get(`${API_BASE}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Отримує записи за конкретний місяць.
 * @param {number} year - Наприклад, 2025
 * @param {number} month - Наприклад, 6 (червень)
 * @param {string} token - JWT токен
 * @returns {Promise} - Масив записів
 */
export const getEntriesByMonth = async (year, month, token) => {
  return axios.get(`${API_BASE}/month/${year}/${month}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export async function getEntriesByMonthRange(
  { startMonth, startYear, endMonth, endYear },
  token
) {
  try {
    const response = await axios.get(`${API_BASE}/range`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { startMonth, startYear, endMonth, endYear },
    });
    return response;
  } catch (error) {
    console.error("❌ Error fetching entries by month range:", error.message);
    throw error;
  }
}
