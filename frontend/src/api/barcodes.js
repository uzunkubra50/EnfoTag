import client from "./client";

export async function createBarcode(barcode) {
  const { data } = await client.post("/barcodes/", barcode);
  return data;
}

export async function getBarcode(id) {
  const { data } = await client.get(`/barcodes/${id}/`);
  return data;
}
