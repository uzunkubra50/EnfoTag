import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getBarcode } from "../api/barcodes";
import { apiErrorMessage } from "../api/client";
import { createPreset, getPresets } from "../api/presets";
import BarcodePreview from "../components/BarcodePreview";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/Toast";

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

function PrinterIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export default function BarcodePrint() {
  const [searchParams] = useSearchParams();
  const barcodeId = searchParams.get("barcode");

  const [barcode, setBarcode] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState([]);
  const [presetId, setPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [error, setError] = useState("");
  const [barcodeType, setBarcodeType] = useState(
    localStorage.getItem("barcodeType") || "qr"
  );
  const toast = useToast();

  function changeType(type) {
    setBarcodeType(type);
    localStorage.setItem("barcodeType", type); // same preference key as the create page
  }

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
    if (!presetName.trim()) {
      toast.error("Önce yeni preset için bir ad girin.");
      return;
    }
    try {
      const preset = await createPreset({ ...settings, name: presetName.trim() });
      setPresets([...presets, preset]);
      setPresetId(String(preset.id));
      setPresetName("");
      toast.success(`"${preset.name}" preset'i kaydedildi.`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Preset kaydedilemedi."));
    }
  }

  const count = Math.max(0, Math.min(500, Math.floor(num("count"))));
  const perRow = Math.max(1, Math.min(4, Math.floor(num("per_row")) || 1));

  // does the label grid actually fit the configured paper?
  const requiredWidth =
    num("margin_left") +
    num("margin_right") +
    perRow * num("barcode_w") +
    (perRow - 1) * num("gap");
  const rowCount = count > 0 ? Math.ceil(count / perRow) : 0;
  const requiredHeight =
    num("margin_top") +
    num("margin_bottom") +
    rowCount * num("barcode_h") +
    Math.max(0, rowCount - 1) * num("gap");
  const widthOverflow = num("paper_w") > 0 && requiredWidth > num("paper_w");
  const heightOverflow = num("paper_h") > 0 && requiredHeight > num("paper_h");
  const round1 = (value) => Math.round(value * 10) / 10;

  if (!barcodeId) {
    return (
      <>
        <PageHeader
          title="Barkod Yazdır"
          description="Etiket ölçülerini ayarla, preset olarak kaydet ve yazdır."
        />
        <div className="card">
          <EmptyState
            icon={<PrinterIcon />}
            title="Yazdırılacak barkod seçilmedi"
            text='Önce bir barkod oluşturup "Bu Barkodu Yazdır" butonunu kullan
              veya listeden bir barkod seç.'
            action={
              <Link className="button-link" to="/barcodes/new">
                Barkod Oluştur
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        className="no-print"
        title="Barkod Yazdır"
        description="Kağıt ve etiket ölçülerini ayarla; önizleme gerçek boyuttadır (mm)."
      />

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

        <div className="field-list">
          <span className="group-label">Görsel Tipi</span>
          <div className="radio-row">
            <label className="radio-option">
              <input
                type="radio"
                name="barcodeType"
                checked={barcodeType === "qr"}
                onChange={() => changeType("qr")}
              />
              QR Kod
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="barcodeType"
                checked={barcodeType === "strip"}
                onChange={() => changeType("strip")}
              />
              Şerit (Code128)
            </label>
          </div>
        </div>

        {widthOverflow && (
          <p className="warning">
            Etiketler kağıt genişliğine sığmıyor: bu ayarlar {round1(requiredWidth)} mm
            gerektiriyor, kağıt {num("paper_w")} mm. Satır başına barkodu, etiket
            genişliğini veya boşlukları azalt.
          </p>
        )}
        {heightOverflow && (
          <p className="warning">
            Etiketler tek sayfaya sığmıyor ({round1(requiredHeight)} mm gerekiyor, kağıt{" "}
            {num("paper_h")} mm) — yazdırmada birden fazla sayfa çıkacak.
          </p>
        )}

        {error && <p className="error">{error}</p>}
        <button type="button" onClick={() => window.print()} disabled={!barcode}>
          Yazdır
        </button>
      </div>

      {barcode && (
        <div className="card no-print">
          <strong className="code-text">{barcode.name}</strong> — önizleme gerçek
          boyuttadır (mm). Ekran ile yazıcı çıktısı farklı olabilir; tarayıcının baskı
          önizlemesiyle de kontrol et.
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
