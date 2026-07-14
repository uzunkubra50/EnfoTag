import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import BrandMark from "../components/BrandMark";
import Spinner from "../components/Spinner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Kullanıcı adı veya şifre hatalı.");
      } else {
        setError("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <span className="brand-mark">
          <BrandMark size={26} />
        </span>
        <h1>Barkod Yönetim Sistemi</h1>
        <p className="login-sub">Devam etmek için hesabınla giriş yap.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Kullanıcı Adı
            <input
              className={error ? "input-error" : ""}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="kullanıcı adın"
              autoFocus
              required
            />
          </label>
          <label>
            Şifre
            <input
              className={error ? "input-error" : ""}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
      <p className="login-foot">EnfoTag — Dijital Arşiv Barkod Modülü</p>
    </div>
  );
}
