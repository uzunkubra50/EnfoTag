import client from "./client";

export async function login(username, password) {
  const { data } = await client.post("/token/", { username, password });
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  localStorage.setItem("username", username);
  return data;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
}

export function getUsername() {
  return localStorage.getItem("username") || "";
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem("accessToken"));
}
