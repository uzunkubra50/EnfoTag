import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getBarcode } from "../api/barcodes";
import { apiErrorMessage } from "../api/client";
import { createPreset, getPresets } from "../api/presets";
import BarcodePreview from "../components/BarcodePreview";

const DEFAULT_SETTINGS = {
  paper_w: 210,
  paper_h: 297,
  per_row: 3,
  count: 12,
  barcode_w: 60,
  barcode_h: 30,
  gap: 4,
  margin_top: 10,
  margin_bottom: 10,
  margin_left: 10,
  margin_right: 10,
};

const NUMBER_FIELDS = [
  ["paper_w", "Kağıt Genişliği (mm)"],
  ["paper_h", "Kağıt Yüksekliği (mm)"],
  ["per_row", "Satır Başına Barkod (1-4)"],
  ["count", "Adet"],
  ["barcode_w", "Barkod Genişliği (mm)"],
  ["barcode_h", "Barkod Yüksekliği (mm)"],
  ["gap", "Barkodlar Arası Boşluk (mm)"],
  ["margin_top", "Üst Kenar Payı (mm)"],
  ["margin_bottom", "Alt Kenar Payı (mm)"],
  ["margin_left", "Sol Kenar Payı (mm)"],
  ["margin_right", "Sağ Kenar Payı (mm)"],
];

export default function BarcodePrint() {
  const [searchParams] = useSearchParams();
  const barcodeId = searchParams.get("barcode");

  const [barcode, setBarcode] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState([]);
  const [presetId, setPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const barcodeType = localStorage.getItem("barcodeType") || "qr";

  useEffect(() => {
    getPresets()
      .then(setPresets)
      .catch((err) => setError(apiErrorMessage(err, "Preset'ler yüklenemedi.")));
    if (barcodeId) {
      getBarcode(barcodeId)
        .then(setBarcode)
        .catch((err) => setError(apiErrorMessage(err, "Barkod yüklenemedi.")));
    }
  }, [barcodeId]);

  function updateSetting(key, rawValue) {
    setSettings({ ...settings, [key]: rawValue === "" ? "" : Number(rawValue) });
  }

  // settings may briefly hold "" while the user is typing
  function num(key) {
    const value = settings[key];
    return typeof value === "number" && !Number.isNaN(value) ? value : 0;
  }

  function handlePresetChange(event) {
    const id = event.target.value;
    setPresetId(id);
    const preset = presets.find((p) => String(p.id) === id);
    if (preset) {
      const { id: _id, name: _name, ...values } = preset;
      setSettings(values); // preset fields match the settings keys one-to-one
    }
  }

  async function handleSavePreset() {
    setError("");
    setInfo("");
    if (!presetName.trim()) {
      setError("Önce yeni preset için bir ad girin.");
      return;
    }
    try {
      const preset = await createPreset({ ...settings, name: presetName.trim() });
      setPresets([...presets, preset]);
      setPresetId(String(preset.id));
      setPresetName("");
      setInfo(`"${preset.name}" preset'i kaydedildi.`);
    } catch (err) {
      setError(apiErrorMessage(err, "Preset kaydedilemedi."));
    }
  }

  const count = Math.max(0, Math.min(500, Math.floor(num("count"))));
  const perRow = Math.max(1, Math.min(4, Math.floor(num("per_row")) || 1));

  if (!barcodeId) {
    return (
      <>
        <header className="page-head">
          <h1>Barkod Yazdır</h1>
          <p>Etiket ölçülerini ayarla, preset olarak kaydet ve yazdır.</p>
        </header>
        <div className="card">
          <p>
            Yazdırılacak barkod seçilmedi.{" "}
            <Link to="/barcodes/new">Barkod Oluştur</Link> sayfasında bir barkod
            oluşturup "Bu Barkodu Yazdır" butonunu kullanabilirsin.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-head no-print">
        <h1>Barkod Yazdır</h1>
        <p>Kağıt ve etiket ölçülerini ayarla; önizleme gerçek boyuttadır (mm).</p>
      </header>

      <div className="card form-grid no-print">
        <h2>Yazdırma Ayarları</h2>

        <div className="preset-row">
          <label>
            Kayıtlı Preset
            <select value={presetId} onChange={handlePresetChange}>
              <option value="">Preset seçin...</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Yeni Preset Adı
            <input
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="ör. A4 - 3 sütun"
            />
          </label>
          <button type="button" className="button-secondary" onClick={handleSavePreset}>
            Preset Kaydet
          </button>
        </div>

        <div className="settings-grid">
          {NUMBER_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                step="any"
                min="0"
                value={settings[key]}
                onChange={(event) => updateSetting(key, event.target.value)}
              />
            </label>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}
        <button type="button" onClick={() => window.print()} disabled={!barcode}>
          Yazdır
        </button>
      </div>

      {barcode && (
        <div className="card no-print">
          <strong>{barcode.name}</strong> — önizleme gerçek boyuttadır (mm). Ekran ile
          yazıcı çıktısı farklı olabilir; tarayıcının baskı önizlemesiyle de kontrol et.
        </div>
      )}

      {barcode && (
        <div className="sheet-scroll">
          <style>
            {`@page { size: ${num("paper_w")}mm ${num("paper_h")}mm; margin: 0; }`}
          </style>
          <div
            className="print-sheet"
            style={{
              width: `${num("paper_w")}mm`,
              minHeight: `${num("paper_h")}mm`,
              paddingTop: `${num("margin_top")}mm`,
              paddingBottom: `${num("margin_bottom")}mm`,
              paddingLeft: `${num("margin_left")}mm`,
              paddingRight: `${num("margin_right")}mm`,
              gridTemplateColumns: `repeat(${perRow}, ${num("barcode_w")}mm)`,
              gap: `${num("gap")}mm`,
            }}
          >
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className="print-label"
                style={{
                  width: `${num("barcode_w")}mm`,
                  height: `${num("barcode_h")}mm`,
                }}
              >
                <div className="print-name">{barcode.name}</div>
                <div className="print-body">
                  <div className="print-visual">
                    <BarcodePreview name={barcode.name} type={barcodeType} />
                  </div>
                  <div className="print-fields">
                    {Object.entries(barcode.field_values).map(([field, value]) => (
                      <span key={field}>
                        {field}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
