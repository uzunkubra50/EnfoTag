import axios from "axios";

const BASE_URL = "http://localhost:8000/api";

const client = axios.create({
  baseURL: BASE_URL,
});

// attach the JWT access token to every request
client.interceptors.request.use((config) => {
  const access = localStorage.getItem("accessToken");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// on 401 try to refresh the access token once, then retry the request;
// if refresh also fails the session is over -> back to login
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem("refreshToken");
    if (error.response?.status === 401 && refresh && !original._retried) {
      original._retried = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, { refresh });
        localStorage.setItem("accessToken", data.access);
        return client(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// list endpoints are paginated (DRF PageNumberPagination: {results, next, ...});
// this follows `next` until exhausted so callers keep getting a plain array
export async function fetchAllResults(path, params = {}) {
  const results = [];
  let url = path;
  let config = { params };
  while (url) {
    const { data } = await client.get(url, config);
    if (!data || !Array.isArray(data.results)) {
      return Array.isArray(data) ? data : results;
    }
    results.push(...data.results);
    url = data.next;
    config = undefined; // `next` is already a full URL with its query string
  }
  return results;
}

// turn a DRF error response into a single readable message
export function apiErrorMessage(error, fallback = "Bir hata oluştu.") {
  if (!error.response) {
    return "Sunucuya ulaşılamadı. Backend çalışıyor mu?";
  }
  const data = error.response.data;
  if (data && typeof data === "object") {
    const first = Object.values(data)[0];
    const message = Array.isArray(first) ? first[0] : first;
    if (typeof message === "string") {
      return message;
    }
  }
  return fallback;
}

export default client;
