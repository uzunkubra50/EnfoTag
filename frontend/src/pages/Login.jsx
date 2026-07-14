import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

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
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Barkod Yönetim Sistemi</h1>
        <label>
          Kullanıcı Adı
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
            required
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
