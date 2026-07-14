import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBarcodes, updateBarcode } from "../api/barcodes";
import { apiErrorMessage } from "../api/client";
import { getUnit } from "../api/units";

export default function BarcodeList() {
  const [barcodes, setBarcodes] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null); // { barcode, fields, values }
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function load(includeInactive) {
    try {
      setBarcodes(await getBarcodes(includeInactive));
    } catch (err) {
      setError(apiErrorMessage(err, "Barkodlar yüklenemedi."));
    }
  }

  useEffect(() => {
    load(showInactive);
  }, [showInactive]);

  async function startEdit(barcode) {
    setError("");
    setInfo("");
    try {
      // the unit's field list decides which inputs to show
      const unit = await getUnit(barcode.unit_id);
      const values = {};
      unit.fields.forEach((field) => {
        values[field] = barcode.field_values[field] || "";
      });
      setEditing({ barcode, fields: unit.fields, values });
    } catch (err) {
      setError(apiErrorMessage(err, "Birim bilgisi yüklenemedi."));
    }
  }

  async function saveEdit() {
    setError("");
    setSaving(true);
    try {
      const filled = {};
      editing.fields.forEach((field) => {
        const value = (editing.values[field] || "").trim();
        if (value) {
          filled[field] = value;
        }
      });
      await updateBarcode(editing.barcode.id, { field_values: filled });
      setInfo(`${editing.barcode.name} güncellendi.`);
      setEditing(null);
      load(showInactive);
    } catch (err) {
      setError(apiErrorMessage(err, "Barkod güncellenemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(barcode) {
    setError("");
    setInfo("");
    if (
      barcode.is_active &&
      !window.confirm(`${barcode.name} pasife alınsın mı?`)
    ) {
      return;
    }
    try {
      await updateBarcode(barcode.id, { is_active: !barcode.is_active });
      setInfo(
        barcode.is_active
          ? `${barcode.name} pasife alındı.`
          : `${barcode.name} yeniden aktifleştirildi.`
      );
      load(showInactive);
    } catch (err) {
      setError(apiErrorMessage(err, "İşlem başarısız."));
    }
  }

  function fieldSummary(fieldValues) {
    const entries = Object.entries(fieldValues);
    if (entries.length === 0) {
      return "—";
    }
    return entries.map(([field, value]) => `${field}: ${value}`).join(", ");
  }

  return (
    <>
      <h1>Barkod Listesi</h1>

      {editing && (
        <div className="card form-grid">
          <h2>{editing.barcode.name} — Düzenle</h2>
          {editing.fields.length === 0 && (
            <p>Bu birimin indeks alanı yok; düzenlenecek bir şey bulunmuyor.</p>
          )}
          {editing.fields.map((field) => (
            <label key={field}>
              {field} <span className="hint">(boş bırakılırsa etikete basılmaz)</span>
              <input
                value={editing.values[field]}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    values: { ...editing.values, [field]: event.target.value },
                  })
                }
              />
            </label>
          ))}
          <div className="actions">
            <button type="button" onClick={saveEdit} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setEditing(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="list-header">
          <h2>Barkodlar</h2>
          <label className="radio-option">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            Pasifleri de göster
          </label>
        </div>

        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}

        {barcodes.length === 0 ? (
          <p>Gösterilecek barkod yok.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Barkod</th>
                <th>Birim</th>
                <th>Alanlar</th>
                <th>Oluşturma</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {barcodes.map((barcode) => (
                <tr key={barcode.id} className={barcode.is_active ? "" : "inactive"}>
                  <td>{barcode.name}</td>
                  <td>{barcode.unit_name}</td>
                  <td>{fieldSummary(barcode.field_values)}</td>
                  <td>{new Date(barcode.created_at).toLocaleDateString("tr-TR")}</td>
                  <td>
                    <span
                      className={
                        barcode.is_active ? "badge badge-active" : "badge badge-passive"
                      }
                    >
                      {barcode.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="button-small button-secondary"
                        onClick={() => navigate(`/print?barcode=${barcode.id}`)}
                      >
                        Yazdır
                      </button>
                      <button
                        type="button"
                        className="button-small button-secondary"
                        onClick={() => startEdit(barcode)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className={
                          barcode.is_active
                            ? "button-small button-danger"
                            : "button-small button-secondary"
                        }
                        onClick={() => toggleActive(barcode)}
                      >
                        {barcode.is_active ? "Pasife Al" : "Aktifleştir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
