import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

export default function Home() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="page">
      <h1>Barkod Yönetim Sistemi</h1>
      <p>Giriş başarılı 🎉 Sıradaki adımda birim (unit) ekranı buraya gelecek.</p>
      <button onClick={handleLogout}>Çıkış Yap</button>
    </div>
  );
}
