import client, { fetchAllResults } from "./client";

export async function createBarcode(barcode) {
  const { data } = await client.post("/barcodes/", barcode);
  return data;
}

export async function getBarcode(id) {
  const { data } = await client.get(`/barcodes/${id}/`);
  return data;
}

export async function getBarcodes(includeInactive = false) {
  return fetchAllResults(
    "/barcodes/",
    includeInactive ? { include_inactive: "true" } : {}
  );
}

export async function updateBarcode(id, changes) {
  const { data } = await client.patch(`/barcodes/${id}/`, changes);
  return data;
}
