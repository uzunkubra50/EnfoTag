import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUsername, logout } from "../api/auth";
import BrandMark from "./BrandMark";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function LayersIcon() {
  return (
    <svg {...iconProps}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg {...iconProps}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg {...iconProps}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const username = getUsername();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-text">
            <span className="brand-name">EnfoTag</span>
            <span className="brand-sub">Barkod Yönetim</span>
          </span>
        </div>
        <div className="brand-divider" aria-hidden="true" />

        <span className="side-label">Menü</span>
        <nav className="side-nav">
          <NavLink to="/units">
            <LayersIcon />
            Birimler
          </NavLink>
          <NavLink to="/barcodes/new">
            <PlusIcon />
            Barkod Oluştur
          </NavLink>
          <NavLink to="/barcodes" end>
            <ListIcon />
            Barkod Listesi
          </NavLink>
          <NavLink to="/print">
            <PrinterIcon />
            Yazdır
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{(username || "K")[0].toUpperCase()}</span>
            <span className="user-name">{username || "Kullanıcı"}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogoutIcon />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
