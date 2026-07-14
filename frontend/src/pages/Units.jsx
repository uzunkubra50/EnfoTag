import { useEffect, useState } from "react";
import { apiErrorMessage } from "../api/client";
import { createUnit, getUnits } from "../api/units";

export default function Units() {
  const [units, setUnits] = useState([]);
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [fields, setFields] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadUnits() {
    try {
      setUnits(await getUnits());
    } catch (err) {
      setError(apiErrorMessage(err, "Birimler yüklenemedi."));
    }
  }

  useEffect(() => {
    loadUnits();
  }, []);

  function addField() {
    setFields([...fields, ""]);
  }

  function updateField(index, value) {
    setFields(fields.map((field, i) => (i === index ? value : field)));
  }

  function removeField(index) {
    setFields(fields.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      // empty field boxes are not saved
      const cleanedFields = fields.map((f) => f.trim()).filter(Boolean);
      const unit = await createUnit({
        name,
        barcode_prefix: prefix,
        fields: cleanedFields,
      });
      setSuccess(`"${unit.name}" birimi eklendi (ön ek: ${unit.barcode_prefix}).`);
      setName("");
      setPrefix("");
      setFields([]);
      loadUnits();
    } catch (err) {
      setError(apiErrorMessage(err, "Birim kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Birimler</h1>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2>Yeni Birim</h2>
        <label>
          Birim Adı
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ör. Proje Tasdik ve Yapı Denetim Şefliği"
            required
          />
        </label>
        <label>
          Barkod Ön Eki <span className="hint">(otomatik büyük harfe çevrilir)</span>
          <input
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            placeholder="ör. PTYD"
            maxLength={10}
            required
          />
        </label>

        <div className="field-list">
          <span className="group-label">İndeks Alanları</span>
          {fields.map((field, index) => (
            <div className="field-row" key={index}>
              <input
                value={field}
                onChange={(event) => updateField(index, event.target.value)}
                placeholder="ör. Ada"
              />
              <button
                type="button"
                className="button-small button-danger"
                onClick={() => removeField(index)}
              >
                Sil
              </button>
            </div>
          ))}
          <button type="button" className="button-small button-secondary" onClick={addField}>
            + Alan Ekle
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <div className="card">
        <h2>Kayıtlı Birimler</h2>
        {units.length === 0 ? (
          <p>Henüz birim eklenmemiş.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Birim Adı</th>
                <th>Ön Ek</th>
                <th>İndeks Alanları</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.name}</td>
                  <td>{unit.barcode_prefix}</td>
                  <td>{unit.fields.length > 0 ? unit.fields.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
