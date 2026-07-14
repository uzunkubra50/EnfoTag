import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBarcodes, updateBarcode } from "../api/barcodes";
import { apiErrorMessage } from "../api/client";
import { getUnit, getUnits } from "../api/units";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { TableSkeleton } from "../components/Skeleton";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function PrinterIcon() {
  return (
    <svg {...iconProps}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="10" y1="9" x2="10" y2="15" />
      <line x1="14" y1="9" x2="14" y2="15" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="5" width="2" height="14" rx="0.6" />
      <rect x="6.4" y="5" width="1.2" height="14" rx="0.6" />
      <rect x="9" y="5" width="2.6" height="14" rx="0.6" />
      <rect x="13" y="5" width="1.2" height="14" rx="0.6" />
      <rect x="15.6" y="5" width="2.2" height="14" rx="0.6" />
      <rect x="19.2" y="5" width="1.2" height="14" rx="0.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function BarcodeList() {
  const [barcodes, setBarcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [query, setQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null); // { barcode, fields, values }
  const [confirming, setConfirming] = useState(null); // barcode awaiting deactivation approval
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function load(includeInactive) {
    try {
      setBarcodes(await getBarcodes(includeInactive));
    } catch (err) {
      setError(apiErrorMessage(err, "Barkodlar yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(showInactive);
  }, [showInactive]);

  useEffect(() => {
    // only feeds the filter dropdown; the list still works if this fails
    getUnits().then(setUnits).catch(() => {});
  }, []);

  async function startEdit(barcode) {
    setError("");
    try {
      // the unit's field list decides which inputs to show
      const unit = await getUnit(barcode.unit_id);
      const values = {};
      unit.fields.forEach((field) => {
        values[field] = barcode.field_values[field] || "";
      });
      setEditing({ barcode, fields: unit.fields, values });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Birim bilgisi yüklenemedi."));
    }
  }

  async function saveEdit() {
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
      toast.success(`${editing.barcode.name} güncellendi.`);
      setEditing(null);
      load(showInactive);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Barkod güncellenemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function performToggle(barcode) {
    try {
      await updateBarcode(barcode.id, { is_active: !barcode.is_active });
      toast.success(
        barcode.is_active
          ? `${barcode.name} pasife alındı.`
          : `${barcode.name} yeniden aktifleştirildi.`
      );
      load(showInactive);
    } catch (err) {
      toast.error(apiErrorMessage(err, "İşlem başarısız."));
    }
  }

  function toggleActive(barcode) {
    if (barcode.is_active) {
      setConfirming(barcode); // deactivation needs explicit approval
    } else {
      performToggle(barcode);
    }
  }

  function fieldSummary(fieldValues) {
    const entries = Object.entries(fieldValues);
    if (entries.length === 0) {
      return "—";
    }
    return entries.map(([field, value]) => `${field}: ${value}`).join(", ");
  }

  // search matches the barcode name and the filled field values
  const searchText = query.trim().toLowerCase();
  const visibleBarcodes = barcodes.filter((barcode) => {
    if (unitFilter && String(barcode.unit_id) !== unitFilter) {
      return false;
    }
    if (!searchText) {
      return true;
    }
    if (barcode.name.toLowerCase().includes(searchText)) {
      return true;
    }
    return Object.values(barcode.field_values).some((value) =>
      String(value).toLowerCase().includes(searchText)
    );
  });

  return (
    <>
      <PageHeader
        title="Barkod Listesi"
        description="Kayıtlı barkodları görüntüle, düzenle, pasife al veya yeniden yazdır."
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Barkodu pasife al"
        message={
          confirming && (
            <>
              <span className="code-text">{confirming.name}</span> pasife alınacak ve
              listelerde varsayılan olarak gizlenecek. Kayıt silinmez; daha sonra yeniden
              aktifleştirebilirsin.
            </>
          )
        }
        confirmLabel="Pasife Al"
        danger
        onConfirm={() => {
          performToggle(confirming);
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)}
      />

      {editing && (
        <div className="card form-grid">
          <h2>
            <span className="code-text">{editing.barcode.name}</span> — Düzenle
          </h2>
          {editing.fields.length === 0 && (
            <p>Bu birimin indeks alanı yok; düzenlenecek bir şey bulunmuyor.</p>
          )}
          {editing.fields.map((field) => (
            <label key={field}>
              {field}
              <input
                value={editing.values[field]}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    values: { ...editing.values, [field]: event.target.value },
                  })
                }
              />
              <span className="hint">Boş bırakılırsa etikete basılmaz.</span>
            </label>
          ))}
          <div className="actions">
            <button type="button" onClick={saveEdit} disabled={saving}>
              {saving && <Spinner />}
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
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Barkod adı veya alan değeri ara..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              value={unitFilter}
              onChange={(event) => setUnitFilter(event.target.value)}
            >
              <option value="">Tüm birimler</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.barcode_prefix})
                </option>
              ))}
            </select>
            <label className="radio-option">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              Pasifleri de göster
            </label>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <TableSkeleton rows={5} />
        ) : barcodes.length === 0 ? (
          <EmptyState
            icon={<BarcodeIcon />}
            title="Henüz barkod yok"
            text="İlk barkodunu oluşturduğunda burada listelenecek."
            action={
              <button type="button" onClick={() => navigate("/barcodes/new")}>
                Barkod Oluştur
              </button>
            }
          />
        ) : visibleBarcodes.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title="Eşleşen barkod yok"
            text="Arama ve filtre ölçütlerine uyan kayıt bulunamadı."
            action={
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setQuery("");
                  setUnitFilter("");
                }}
              >
                Filtreleri Temizle
              </button>
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Barkod</th>
                <th>Birim</th>
                <th>Alanlar</th>
                <th>Oluşturan</th>
                <th>Oluşturma</th>
                <th>Durum</th>
                <th className="actions-col">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {visibleBarcodes.map((barcode) => (
                <tr key={barcode.id} className={barcode.is_active ? "" : "inactive"}>
                  <td>
                    <span className="code-text">{barcode.name}</span>
                  </td>
                  <td>{barcode.unit_name}</td>
                  <td>{fieldSummary(barcode.field_values)}</td>
                  <td>{barcode.created_by}</td>
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
                  <td className="actions-cell">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Yazdır"
                        aria-label={`${barcode.name} barkodunu yazdır`}
                        onClick={() => navigate(`/print?barcode=${barcode.id}`)}
                      >
                        <PrinterIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Düzenle"
                        aria-label={`${barcode.name} barkodunu düzenle`}
                        onClick={() => startEdit(barcode)}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className={
                          barcode.is_active
                            ? "icon-button icon-button-danger"
                            : "icon-button"
                        }
                        title={barcode.is_active ? "Pasife Al" : "Aktifleştir"}
                        aria-label={
                          barcode.is_active
                            ? `${barcode.name} barkodunu pasife al`
                            : `${barcode.name} barkodunu aktifleştir`
                        }
                        onClick={() => toggleActive(barcode)}
                      >
                        {barcode.is_active ? <PauseIcon /> : <PlayIcon />}
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
