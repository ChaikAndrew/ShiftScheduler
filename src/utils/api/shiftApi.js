import axios from "axios";

const API_BASE = "http://localhost:4040/shifts"; // або твій прод-URL

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
