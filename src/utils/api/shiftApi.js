import axios from "axios";

const REMOTE = "https://shift-scheduler-server.vercel.app/shifts";
const LOCAL_ROOT = "http://localhost:4040";
let API_BASE = REMOTE;

// --- 1) Пінг локалки один раз (кешуємо в sessionStorage) ---
async function checkLocalhost() {
  try {
    const cached = sessionStorage.getItem("apiBase");
    if (cached) {
      API_BASE = cached;
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 800);
    const res = await fetch(LOCAL_ROOT, { signal: controller.signal });
    clearTimeout(t);
    if (res.ok) {
      API_BASE = `${LOCAL_ROOT}/shifts`;
      console.log("Localhost detected. Switching API base.");
    } else {
      API_BASE = REMOTE;
      console.log("Using remote API.");
    }
    sessionStorage.setItem("apiBase", API_BASE);
  } catch {
    API_BASE = REMOTE;
    sessionStorage.setItem("apiBase", API_BASE);
    console.log("Using remote API.");
  }
}
checkLocalhost();

// --- 2) Єдиний axios‑інстанс + перехоплювач 401 ---
const api = axios.create({ baseURL: API_BASE });
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const e = new Error("Unauthorized");
      e.code = 401;
      return Promise.reject(e);
    }
    return Promise.reject(err);
  }
);

// --- 3) Хелпер: без токена не фетчимо (кидаємо NO_TOKEN) ---
function requireToken(token) {
  if (!token) {
    const e = new Error("NO_TOKEN");
    e.code = "NO_TOKEN";
    throw e;
  }
}
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// --- 4) Експорти ---
export const saveEntryToDB = (entryData, token) => {
  requireToken(token);
  return api.post(`/add`, entryData, auth(token));
};

export const updateEntryInDB = (id, entryData, token) => {
  requireToken(token);
  return api.put(`/update/${id}`, entryData, auth(token));
};

export const deleteEntryFromDB = (id, token) => {
  requireToken(token);
  return api.delete(`/delete/${id}`, auth(token));
};

export const getEntriesFromDB = (token) => {
  requireToken(token);
  return api.get(`/`, auth(token));
};

export const getEntriesByMonth = (year, month, token) => {
  requireToken(token);
  return api.get(`/month/${year}/${month}`, auth(token));
};

export function getEntriesByMonthRange(
  { startMonth, startYear, endMonth, endYear },
  token
) {
  requireToken(token);
  return api.get(`/range`, {
    ...auth(token),
    params: { startMonth, startYear, endMonth, endYear },
  });
}
