import client from "./client";

export async function createBarcode(barcode) {
  const { data } = await client.post("/barcodes/", barcode);
  return data;
}
