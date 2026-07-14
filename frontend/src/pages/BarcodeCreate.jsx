import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBarcode } from "../api/barcodes";
import { apiErrorMessage } from "../api/client";
import { getUnit, getUnits } from "../api/units";
import BarcodePreview from "../components/BarcodePreview";

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
    } catch (err) {
      setError(apiErrorMessage(err, "Barkod oluşturulamadı."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Barkod Oluştur</h1>

      <form className="card form-grid" onSubmit={handleSubmit}>
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
        </label>

        {unitFields.map((field) => (
          <label key={field}>
            {field} <span className="hint">(boş bırakılırsa etikete basılmaz)</span>
            <input
              value={values[field] || ""}
              onChange={(event) =>
                setValues({ ...values, [field]: event.target.value })
              }
            />
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
          {saving ? "Oluşturuluyor..." : "Oluştur"}
        </button>
      </form>

      {created && (
        <div className="card">
          <h2>Oluşturulan Barkod</h2>
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
          <button
            type="button"
            className="button-secondary"
            style={{ marginTop: "1rem", display: "block" }}
            onClick={() => navigate(`/print?barcode=${created.id}`)}
          >
            Bu Barkodu Yazdır
          </button>
        </div>
      )}
    </>
  );
}
