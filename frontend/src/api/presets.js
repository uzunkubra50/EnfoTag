import client, { fetchAllResults } from "./client";

export async function getPresets() {
  return fetchAllResults("/presets/");
}

export async function createPreset(preset) {
  const { data } = await client.post("/presets/", preset);
  return data;
}
