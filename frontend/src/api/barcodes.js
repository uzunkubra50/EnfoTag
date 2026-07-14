import client from "./client";

export async function createBarcode(barcode) {
  const { data } = await client.post("/barcodes/", barcode);
  return data;
}

export async function getBarcode(id) {
  const { data } = await client.get(`/barcodes/${id}/`);
  return data;
}

export async function getBarcodes(includeInactive = false) {
  const { data } = await client.get("/barcodes/", {
    params: includeInactive ? { include_inactive: "true" } : {},
  });
  return data;
}

export async function updateBarcode(id, changes) {
  const { data } = await client.patch(`/barcodes/${id}/`, changes);
  return data;
}
