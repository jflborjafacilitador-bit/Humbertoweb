import { useState, useEffect } from "react"
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db } from "../firebase/config"

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "leads"), (snap) => {
      const data: any[] = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      // Ordenar: No leídos primero, luego por fecha descendente
      data.sort((a, b) => {
        if (a.leido === b.leido) {
          const dateA = a.createdAt?.toMillis() || 0
          const dateB = b.createdAt?.toMillis() || 0
          return dateB - dateA
        }
        return a.leido ? 1 : -1
      })
      setLeads(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const markAsRead = async (id: string, current: boolean) => {
    try {
      if (!current) {
         await updateDoc(doc(db, "leads", id), { leido: true })
      }
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este lead de forma permanente?")) {
      await deleteDoc(doc(db, "leads", id))
    }
  }

  if (loading) return <div style={{ color: "#1A1A1A" }}>Cargando leads...</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.875rem", margin: 0, color: "#111827", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Leads Recibidos</h2>
        <div style={{ background: "rgba(212,175,55,0.1)", color: "#111827", padding: "0.6rem 1.25rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600, border: "1px solid rgba(212,175,55,0.2)" }}>
          Total: <span style={{color: "#BF9B2D"}}>{leads.length}</span> &nbsp;|&nbsp; No leídos: <span style={{color: "#BF9B2D"}}>{leads.filter(l => !l.leido).length}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {leads.length === 0 ? (
          <div style={{ background: "#FFFFFF", padding: "4rem 2rem", textAlign: "center", borderRadius: "16px", border: "2px dashed #E5E7EB", color: "#6B7280" }}>
            No hay leads registrados aún.
          </div>
        ) : (
          leads.map(lead => (
            <div 
              key={lead.id} 
              onMouseEnter={() => !lead.leido && markAsRead(lead.id, lead.leido)}
              style={{
                background: "#FFFFFF",
                border: lead.leido ? "1px solid #E5E7EB" : "1px solid #D4AF37",
                borderRadius: "16px",
                padding: "1.75rem",
                boxShadow: lead.leido ? "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.025)" : "0 10px 15px -3px rgba(212,175,55,0.1)",
                display: "flex",
                gap: "1.5rem",
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "1.15rem", color: "#111827" }}>{lead.nombre}</span>
                  {!lead.leido && (
                    <span style={{ background: "rgba(212,175,55,0.15)", color: "#BF9B2D", fontSize: "0.65rem", padding: "4px 10px", borderRadius: "100px", fontWeight: 700, letterSpacing: "0.05em", border: "1px solid rgba(212,175,55,0.3)" }}>NUEVO</span>
                  )}
                  <span style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                    {lead.createdAt?.toDate().toLocaleDateString()} a las {lead.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div style={{ display: "flex", gap: "2rem", marginBottom: "1.25rem", color: "#4B5563", fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{opacity:0.6}}>📱</span> <a href={`https://wa.me/${lead.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: "#111827", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#BF9B2D"} onMouseOut={e=>e.currentTarget.style.color="#111827"}>{lead.telefono}</a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{opacity:0.6}}>✉️</span> <a href={`mailto:${lead.correo}`} style={{ color: "#111827", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#BF9B2D"} onMouseOut={e=>e.currentTarget.style.color="#111827"}>{lead.correo}</a>
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", padding: "1.25rem", borderRadius: "8px", fontSize: "0.95rem", color: "#4B5563", lineHeight: 1.6, border: "1px solid #E5E7EB", fontStyle: "italic" }}>
                  "{lead.mensaje}"
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: "130px", justifyContent: "center" }}>
                <a 
                  href={`https://wa.me/${lead.telefono.replace(/\D/g,'')}?text=Hola ${lead.nombre}, soy Humberto Sotelo. Recibí tu mensaje:`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", textAlign: "center", background: "#D1FAE5", color: "#065F46", textDecoration: "none", fontSize: "0.85rem", padding: "0.75rem", borderRadius: "8px", fontWeight: 600, transition: "background 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.background="#A7F3D0"}
                  onMouseOut={e => e.currentTarget.style.background="#D1FAE5"}
                >
                  WhatsApp
                </a>
                <button 
                  onClick={() => handleDelete(lead.id)}
                  style={{ background: "#FEF2F2", border: "none", color: "#B91C1C", fontSize: "0.85rem", padding: "0.75rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600, transition: "background 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.background="#FEE2E2"}
                  onMouseOut={e => e.currentTarget.style.background="#FEF2F2"}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
