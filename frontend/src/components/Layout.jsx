import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

export default function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <header className="topbar">
        <span className="brand">Barkod Yönetim Sistemi</span>
        <nav>
          <NavLink to="/units">Birimler</NavLink>
          <NavLink to="/barcodes/new">Barkod Oluştur</NavLink>
          <NavLink to="/print">Yazdır</NavLink>
        </nav>
        <button className="button-secondary button-small" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
