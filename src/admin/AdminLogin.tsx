import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function AdminLogin() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/admin/propiedades", { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/admin/propiedades")
    } catch {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1F2937", border: "1px solid #374151", borderRadius: "16px", padding: "3.5rem 3rem", width: "100%", maxWidth: "420px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative" }}>
          <a href="/" style={{ position: "absolute", top: "-2rem", left: "-1.5rem", color: "#9CA3AF", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}
             onMouseOver={e => e.currentTarget.style.color = "#FFFFFF"}
             onMouseOut={e => e.currentTarget.style.color = "#9CA3AF"}>
            ← Volver al sitio
          </a>
          <div style={{ color: "#D4AF37", fontSize: "0.75rem", letterSpacing: "0.25em", marginBottom: "0.75rem", fontWeight: 600 }}>SISTEMA PRIVADO</div>
          <h1 style={{ color: "#FFFFFF", fontSize: "1.875rem", fontFamily: "'Playfair Display', serif", margin: 0, fontWeight: 700 }}>Humberto Sotelo</h1>
          <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, #D4AF37, #BF9B2D)", margin: "1.25rem auto 0", borderRadius: "2px" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: "#9CA3AF", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 500 }}>Correo electrónico administrador</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@correo.com"
              style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: "8px", padding: "0.875rem 1rem", color: "#F3F4F6", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
              onFocus={e => { e.target.style.borderColor = "#D4AF37"; e.target.style.boxShadow = "0 0 0 1px #D4AF37"; }}
              onBlur={e => { e.target.style.borderColor = "#374151"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", color: "#9CA3AF", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 500 }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: "8px", padding: "0.875rem 1rem", color: "#F3F4F6", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
              onFocus={e => { e.target.style.borderColor = "#D4AF37"; e.target.style.boxShadow = "0 0 0 1px #D4AF37"; }}
              onBlur={e => { e.target.style.borderColor = "#374151"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", color: "#FCA5A5", fontSize: "0.85rem", marginBottom: "1.5rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", background: "linear-gradient(135deg, #D4AF37 0%, #BF9B2D 100%)", color: "#111827", border: "none", borderRadius: "8px", padding: "1rem", fontWeight: 600, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)" }}
            onMouseOver={e => { if(!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(212, 175, 55, 0.3)"; } }}
            onMouseOut={e => { if(!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(212, 175, 55, 0.2)"; } }}
          >
            {loading ? "Accediendo..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}
