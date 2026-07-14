import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBarcode } from "../api/barcodes";
import { apiErrorMessage } from "../api/client";
import { getUnit, getUnits } from "../api/units";
import BarcodePreview from "../components/BarcodePreview";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";

function TagIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export default function BarcodeCreate() {
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [unitFields, setUnitFields] = useState([]);
  const [values, setValues] = useState({});
  const [barcodeType, setBarcodeType] = useState(
    localStorage.getItem("barcodeType") || "qr"
  );
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    getUnits()
      .then(setUnits)
      .catch((err) => setError(apiErrorMessage(err, "Birimler yüklenemedi.")));
  }, []);

  async function handleUnitChange(event) {
    const id = event.target.value;
    setUnitId(id);
    setValues({});
    setCreated(null);
    setError("");
    if (!id) {
      setUnitFields([]);
      return;
    }
    try {
      const unit = await getUnit(id); // fields list comes from GET /api/units/{id}/
      setUnitFields(unit.fields);
    } catch (err) {
      setError(apiErrorMessage(err, "Birim bilgisi yüklenemedi."));
    }
  }

  function changeType(type) {
    setBarcodeType(type);
    localStorage.setItem("barcodeType", type); // team decision: preference lives in the browser
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      // only filled fields are stored (and later printed)
      const filledValues = {};
      unitFields.forEach((field) => {
        const value = (values[field] || "").trim();
        if (value) {
          filledValues[field] = value;
        }
      });
      const barcode = await createBarcode({
        unit_id: Number(unitId),
        field_values: filledValues,
      });
      setCreated(barcode);
      setValues({});
      toast.success(`${barcode.name} oluşturuldu.`);
    } catch (err) {
      setError(apiErrorMessage(err, "Barkod oluşturulamadı."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Barkod Oluştur"
        description="Birimi seç, indeks alanlarını doldur; sıradaki numara otomatik verilir."
      />

      <div className="create-grid">
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2>Barkod Bilgileri</h2>
          <label>
            Birim
            <select value={unitId} onChange={handleUnitChange} required>
              <option value="">Birim seçin...</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.barcode_prefix})
                </option>
              ))}
            </select>
            <span className="hint">Numara, birimin ön ekiyle otomatik üretilir.</span>
          </label>

          {unitFields.map((field) => (
            <label key={field}>
              {field}
              <input
                value={values[field] || ""}
                onChange={(event) =>
                  setValues({ ...values, [field]: event.target.value })
                }
              />
              <span className="hint">Boş bırakılırsa etikete basılmaz.</span>
            </label>
          ))}

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

          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={saving || !unitId}>
            {saving && <Spinner />}
            {saving ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </form>

        <div className="card">
          <h2>Önizleme</h2>
          {created ? (
            <>
              <div className="label">
                <div className="label-name">{created.name}</div>
                <div className="label-body">
                  <BarcodePreview name={created.name} type={barcodeType} />
                  <div className="label-fields">
                    {Object.entries(created.field_values).map(([field, value]) => (
                      <span key={field}>
                        {field}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => navigate(`/print?barcode=${created.id}`)}
                >
                  Bu Barkodu Yazdır
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <TagIcon />
              <span className="empty-title">Henüz barkod oluşturulmadı</span>
              <p className="empty-text">
                Barkod oluşturduğunda etiket önizlemesi burada görünecek.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
