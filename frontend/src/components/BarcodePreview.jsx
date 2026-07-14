import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef } from "react";

// draws the barcode name as a QR code or a CODE128 strip.
// qrcode.react is a React component; jsbarcode is imperative,
// so we point it at an <svg> element through a ref.
export default function BarcodePreview({ name, type }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (type === "strip" && svgRef.current && name) {
      JsBarcode(svgRef.current, name, {
        format: "CODE128",
        height: 50,
        width: 1.6,
        displayValue: false,
        margin: 0,
      });
    }
  }, [name, type]);

  if (!name) {
    return null;
  }
  if (type === "qr") {
    return <QRCodeSVG value={name} size={110} />;
  }
  return <svg ref={svgRef} />;
}
