// import axios from "axios";

// const API_BASE = "http://localhost:4040/shifts"; // або твій прод-URL

// export const saveEntryToDB = async (entryData, token) => {
//   return axios.post(`${API_BASE}/add`, entryData, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

// export const updateEntryInDB = async (id, entryData, token) => {
//   return axios.put(`${API_BASE}/update/${id}`, entryData, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

// export const deleteEntryFromDB = async (id, token) => {
//   return axios.delete(`${API_BASE}/delete/${id}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

// export const getEntriesFromDB = async (token) => {
//   return axios.get(`${API_BASE}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };
import axios from "axios";

let API_BASE = "https://shift-scheduler-server.vercel.app/shifts";

// Автоматично перемикаємось на localhost, якщо він доступний
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

// Викликаємо одразу
checkLocalhost();

export const saveEntryToDB = async (entryData, token) => {
  return axios.post(`${API_BASE}/add`, entryData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateEntryInDB = async (id, entryData, token) => {
  return axios.put(`${API_BASE}/update/${id}`, entryData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteEntryFromDB = async (id, token) => {
  return axios.delete(`${API_BASE}/delete/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getEntriesFromDB = async (token) => {
  return axios.get(`${API_BASE}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
