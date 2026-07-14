import client, { fetchAllResults } from "./client";

export async function getUnits() {
  return fetchAllResults("/units/");
}

export async function getUnit(id) {
  const { data } = await client.get(`/units/${id}/`);
  return data;
}

export async function createUnit(unit) {
  const { data } = await client.post("/units/", unit);
  return data;
}
