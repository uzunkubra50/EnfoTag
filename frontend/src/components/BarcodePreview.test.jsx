import { render } from "@testing-library/react";
import JsBarcode from "jsbarcode";
import BarcodePreview from "./BarcodePreview";

vi.mock("jsbarcode", () => ({ default: vi.fn() }));

describe("BarcodePreview", () => {
  it("qr tipinde bir svg çizer", () => {
    const { container } = render(<BarcodePreview name="PTYD-0000001" type="qr" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("şerit tipinde jsbarcode'u CODE128 formatıyla çağırır", () => {
    render(<BarcodePreview name="PTYD-0000001" type="strip" />);
    expect(JsBarcode).toHaveBeenCalledWith(
      expect.anything(),
      "PTYD-0000001",
      expect.objectContaining({ format: "CODE128" })
    );
  });

  it("isim yoksa hiçbir şey çizmez", () => {
    const { container } = render(<BarcodePreview name="" type="qr" />);
    expect(container.firstChild).toBeNull();
  });
});
