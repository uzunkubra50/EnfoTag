import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../api/client";
import { createUnit, getUnits } from "../api/units";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { TableSkeleton } from "../components/Skeleton";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";

function LayersIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [fields, setFields] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef(null);
  const toast = useToast();

  async function loadUnits() {
    try {
      setUnits(await getUnits());
    } catch (err) {
      setError(apiErrorMessage(err, "Birimler yüklenemedi."));
    } finally {
      setLoading(false);
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
    setSaving(true);
    try {
      // empty field boxes are not saved
      const cleanedFields = fields.map((f) => f.trim()).filter(Boolean);
      const unit = await createUnit({
        name,
        barcode_prefix: prefix,
        fields: cleanedFields,
      });
      toast.success(`"${unit.name}" birimi eklendi (ön ek: ${unit.barcode_prefix}).`);
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
      <PageHeader
        title="Birimler"
        description="Barkod üretecek kurum birimlerini ve indeks alanlarını tanımla."
      />

      <div className="units-grid">
      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2>Yeni Birim</h2>
        <label>
          Birim Adı
          <input
            ref={nameInputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ör. Proje Tasdik ve Yapı Denetim Şefliği"
            required
          />
        </label>
        <label>
          Barkod Ön Eki
          <input
            className="mono"
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            placeholder="ör. PTYD"
            maxLength={10}
            required
          />
          <span className="hint">
            Otomatik büyük harfe çevrilir; barkod numaralarının başına eklenir (en fazla 10 karakter).
          </span>
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
          <span className="hint">
            Barkod oluştururken doldurulacak alanlar (ör. Ada, Parsel). Boş bırakılabilir.
          </span>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving && <Spinner />}
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <div className="card">
        <h2>Kayıtlı Birimler</h2>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : units.length === 0 ? (
          <EmptyState
            icon={<LayersIcon />}
            title="Henüz birim yok"
            text="Barkod üretmeye başlamak için önce bir birim tanımlaman gerekiyor."
            action={
              <button
                type="button"
                className="button-secondary"
                onClick={() => nameInputRef.current?.focus()}
              >
                İlk Birimi Oluştur
              </button>
            }
          />
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
                  <td>
                    <span className="prefix-chip">{unit.barcode_prefix}</span>
                  </td>
                  <td>{unit.fields.length > 0 ? unit.fields.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </>
  );
}
