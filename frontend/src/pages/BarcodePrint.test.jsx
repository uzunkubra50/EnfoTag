import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BarcodePrint from "./BarcodePrint";

vi.mock("../api/barcodes", () => ({
  getBarcode: vi.fn().mockResolvedValue({
    id: 1,
    name: "PTYD-0000001",
    field_values: { Ada: "4" },
  }),
}));

vi.mock("../api/presets", () => ({
  getPresets: vi.fn().mockResolvedValue([]),
  createPreset: vi.fn(),
}));

function renderPrint() {
  return render(
    <MemoryRouter initialEntries={["/print?barcode=1"]}>
      <Routes>
        <Route path="/print" element={<BarcodePrint />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("BarcodePrint sığma uyarıları", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("varsayılan ayarlarda uyarı göstermez", async () => {
    renderPrint();
    await screen.findAllByText(/PTYD-0000001/);
    expect(screen.queryByText(/sığmıyor/)).not.toBeInTheDocument();
  });

  it("etiketler kağıt genişliğini aşınca uyarı gösterir", async () => {
    renderPrint();
    await screen.findAllByText(/PTYD-0000001/);
    fireEvent.change(screen.getByLabelText(/Satır Başına Barkod/), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/^Barkod Genişliği/), {
      target: { value: "70" },
    });
    // 10 + 10 + 4*70 + 3*4 = 312 mm > 210 mm
    expect(
      await screen.findByText(/kağıt genişliğine sığmıyor/)
    ).toBeInTheDocument();
  });

  it("adet artınca çok sayfa bilgisi gösterir", async () => {
    renderPrint();
    await screen.findAllByText(/PTYD-0000001/);
    fireEvent.change(screen.getByLabelText("Adet"), { target: { value: "60" } });
    expect(
      await screen.findByText(/tek sayfaya sığmıyor/)
    ).toBeInTheDocument();
  });
});
