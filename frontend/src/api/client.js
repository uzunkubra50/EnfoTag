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

export default client;
