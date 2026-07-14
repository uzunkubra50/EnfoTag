import client from "./client";

export async function getPresets() {
  const { data } = await client.get("/presets/");
  return data;
}

export async function createPreset(preset) {
  const { data } = await client.post("/presets/", preset);
  return data;
}
