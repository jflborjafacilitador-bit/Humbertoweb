import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/admin")
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F3F4F6", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar - Dark Premium Theme */}
      <aside style={{ width: "260px", background: "#111827", borderRight: "1px solid #1F2937", padding: "2rem 0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "4px 0 24px rgba(0,0,0,0.1)", zIndex: 10 }}>
        <div style={{ padding: "0 1.75rem 2rem" }}>
          <div style={{ color: "#D4AF37", fontSize: "0.7rem", letterSpacing: "0.2em", marginBottom: "0.5rem", fontWeight: 600 }}>SISTEMA PRIVADO</div>
          <div style={{ color: "#FFFFFF", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700 }}>Humberto Sotelo</div>
          <div style={{ width: "36px", height: "2px", background: "linear-gradient(90deg, #D4AF37, #BF9B2D)", marginTop: "0.75rem", borderRadius: "2px" }} />
        </div>

        <nav style={{ flex: 1, padding: "0 1rem" }}>
          {[
            { to: "/admin/propiedades", label: "🏠 Propiedades" },
            { to: "/admin/calendario", label: "📅 Calendario" },
            { to: "/admin/leads", label: "📋 Leads" },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "block", padding: "0.875rem 1rem", borderRadius: "8px", marginBottom: "0.35rem",
                color: isActive ? "#F3F4F6" : "#9CA3AF", background: isActive ? "rgba(212, 175, 55, 0.15)" : "transparent",
                textDecoration: "none", fontSize: "0.9rem", fontWeight: isActive ? 500 : 400,
                transition: "all 0.2s", borderLeft: isActive ? "3px solid #D4AF37" : "3px solid transparent"
              })}
            >
              {item.label}
            </NavLink>
          ))}
          
          <div style={{ marginTop: "2rem" }} />
          <a
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "0.875rem 1rem", borderRadius: "8px", color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", transition: "all 0.2s"
            }}
            onMouseOver={e => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
            onMouseOut={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent" }}
          >
            🌍 Ver sitio web
          </a>
        </nav>

        <div style={{ padding: "1.5rem 1.75rem", borderTop: "1px solid #1F2937" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ color: "#6B7280", fontSize: "0.75rem", wordBreak: "break-all" }}>{user?.email}</div>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", color: "#9CA3AF", fontSize: "0.65rem", fontWeight: "bold" }}>v1.0.1</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: "100%", background: "#1F2937", border: "1px solid #374151", color: "#D1D5DB", borderRadius: "8px", padding: "0.75rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background = "#374151"; e.currentTarget.style.color = "#FFFFFF" }}
            onMouseOut={e => { e.currentTarget.style.background = "#1F2937"; e.currentTarget.style.color = "#D1D5DB" }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content - Very Light Background for contrast */}
      <main style={{ flex: 1, padding: "3rem", height: "100vh", overflow: "auto", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
