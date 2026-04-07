import { useState, useEffect, useCallback } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import type { SlotInfo } from "react-big-calendar"
import { format } from "date-fns/format"
import { parse } from "date-fns/parse"
import { startOfWeek } from "date-fns/startOfWeek"
import { getDay } from "date-fns/getDay"
import { es } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase/config"

const locales = { "es": es }
const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
})

const DIAS_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
  4: "Jueves", 5: "Viernes", 6: "Sábado"
}

export default function CalendarioAdmin() {
  const [events, setEvents] = useState<any[]>([])
  const [propiedades, setPropiedades] = useState<any[]>([])
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [slotAlert, setSlotAlert] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    propertyId: "",
    clientName: "",
    personas: "",
    notas: "",
    start: "",
    end: ""
  })

  useEffect(() => {
    // Solo propiedades de tipo Evento
    const qProps = query(collection(db, "propiedades"), where("operacion", "==", "Evento"))
    const unsubProps = onSnapshot(qProps, (snap) => {
      const data: any[] = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setPropiedades(data)
    })

    const unsubReservas = onSnapshot(collection(db, "reservas"), (snap) => {
      const data: any[] = []
      snap.forEach(doc => {
        const res = doc.data()
        data.push({
          id: doc.id,
          title: res.clientName
            ? `${res.propertyName} — ${res.clientName}`
            : res.propertyName,
          start: new Date(res.start),
          end: new Date(res.end),
          allDay: true,
          resource: res
        })
      })
      setEvents(data)
    })

    return () => { unsubProps(); unsubReservas() }
  }, [])

  // Propiedad seleccionada actualmente
  const selectedProp = propertyFilter !== "all"
    ? propiedades.find(p => p.id === propertyFilter)
    : null

  const displayedEvents = propertyFilter === "all"
    ? events
    : events.filter(e => e.resource.propertyId === propertyFilter)

  // ── Coloreado de días disponibles en el calendario ──────────────────────────
  const dayPropGetter = useCallback((date: Date) => {
    if (!selectedProp?.diasDisponibles?.length) return {}
    const dayOfWeek = getDay(date)
    const isAvailable = selectedProp.diasDisponibles.includes(dayOfWeek)

    if (!isAvailable) {
      return {
        style: {
          backgroundColor: "#F3F4F6",
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)",
          opacity: 0.7,
        }
      }
    }
    return {
      style: {
        backgroundColor: "rgba(212,175,55,0.06)",
        borderLeft: "2px solid rgba(212,175,55,0.3)",
      }
    }
  }, [selectedProp])

  // ── Selección de slot con validación ───────────────────────────────────────
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Validar que el día está disponible si hay propiedad seleccionada
    if (selectedProp?.diasDisponibles?.length > 0) {
      const dayOfWeek = getDay(slotInfo.start)
      if (!selectedProp.diasDisponibles.includes(dayOfWeek)) {
        const nombreDia = DIAS_SEMANA_LABELS[dayOfWeek]
        setSlotAlert(`⚠️ ${selectedProp.nombre} no está disponible los ${nombreDia}s. Selecciona un día disponible.`)
        setTimeout(() => setSlotAlert(null), 4000)
        return
      }
    }

    setModalMode("create")
    setFormData({
      propertyId: propertyFilter !== "all" ? propertyFilter : "",
      clientName: "",
      personas: "",
      notas: "",
      start: format(slotInfo.start, "yyyy-MM-dd"),
      end: format(slotInfo.end, "yyyy-MM-dd")
    })
    setIsModalOpen(true)
  }

  const handleSelectEvent = (event: any) => {
    setModalMode("edit")
    setSelectedEventId(event.id)
    setFormData({
      propertyId: event.resource.propertyId,
      clientName: event.resource.clientName || "",
      personas: event.resource.personas || "",
      notas: event.resource.notas || "",
      start: format(event.start, "yyyy-MM-dd"),
      end: format(event.end, "yyyy-MM-dd")
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.propertyId || !formData.start || !formData.end) return

    const prop = propiedades.find(p => p.id === formData.propertyId)
    const dataToSave = {
      propertyId: formData.propertyId,
      propertyName: prop?.nombre || "",
      clientName: formData.clientName,
      personas: formData.personas,
      notas: formData.notas,
      start: `${formData.start}T00:00:00`,
      end: `${formData.end}T23:59:59`
    }

    if (modalMode === "create") {
      await addDoc(collection(db, "reservas"), dataToSave)
    } else if (selectedEventId) {
      await updateDoc(doc(db, "reservas", selectedEventId), dataToSave)
    }
    setIsModalOpen(false)
  }

  const handleDelete = async () => {
    if (selectedEventId) {
      await deleteDoc(doc(db, "reservas", selectedEventId))
    }
    setIsModalOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0",
    borderRadius: "6px", background: "#FAFAFA", boxSizing: "border-box"
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.85rem", color: "#4B5563",
    marginBottom: "0.5rem", fontWeight: 600
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.875rem", margin: 0, color: "#111827", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Calendario de Eventos
          </h2>
          <span style={{ color: "#6B7280", fontSize: "0.95rem" }}>Gestiona reservas y disponibilidad de espacios</span>
        </div>

        {/* Selector de propiedad */}
        <select
          style={{ padding: "0.6rem 1rem", border: "1px solid #E5E7EB", borderRadius: "8px", background: "#FFF", fontSize: "0.95rem", minWidth: "220px" }}
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
        >
          <option value="all">🗓️ Todos los espacios</option>
          {propiedades.map(p => (
            <option key={p.id} value={p.id}>🎉 {p.nombre}</option>
          ))}
        </select>
      </div>

      {/* Banner informativo de la propiedad seleccionada */}
      {selectedProp && (
        <div style={{
          background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
          border: "1px solid #FDE68A",
          borderRadius: "12px",
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "center"
        }}>
          <div style={{ fontWeight: 700, color: "#92400E", fontSize: "0.95rem" }}>
            🎉 {selectedProp.nombre}
          </div>
          {selectedProp.diasDisponibles?.length > 0 && (
            <div style={{ fontSize: "0.85rem", color: "#78350F" }}>
              📅 <strong>Disponible:</strong>{" "}
              {selectedProp.diasDisponibles.map((d: number) => DIAS_SEMANA_LABELS[d]).join(", ")}
            </div>
          )}
          {selectedProp.horaEntrada && (
            <div style={{ fontSize: "0.85rem", color: "#78350F" }}>
              🕐 <strong>Check-in:</strong> {selectedProp.horaEntrada}
            </div>
          )}
          {selectedProp.horaSalida && (
            <div style={{ fontSize: "0.85rem", color: "#78350F" }}>
              🚪 <strong>Check-out:</strong> {selectedProp.horaSalida}
            </div>
          )}
          {selectedProp.capacidadPersonas && (
            <div style={{ fontSize: "0.85rem", color: "#78350F" }}>
              👥 <strong>Hasta:</strong> {selectedProp.capacidadPersonas} personas
            </div>
          )}
          {selectedProp.precioEvento && (
            <div style={{ fontSize: "0.85rem", color: "#78350F" }}>
              💰 <strong>Precio:</strong> ${Number(selectedProp.precioEvento).toLocaleString()} / evento
            </div>
          )}
        </div>
      )}

      {/* Alerta de día no disponible */}
      {slotAlert && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px",
          padding: "0.875rem 1.25rem", marginBottom: "1rem",
          color: "#DC2626", fontWeight: 600, fontSize: "0.9rem",
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          {slotAlert}
        </div>
      )}

      {/* Leyenda */}
      {selectedProp?.diasDisponibles?.length > 0 && (
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", fontSize: "0.8rem", color: "#6B7280" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)" }}></div>
            Días disponibles
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#F3F4F6", backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)" }}></div>
            No disponibles
          </div>
        </div>
      )}

      {/* Calendario */}
      <div style={{ height: "70vh", minHeight: "500px", background: "#FFF", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", border: "1px solid #E5E7EB" }}>
        <Calendar
          localizer={localizer}
          events={displayedEvents}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          dayPropGetter={dayPropGetter}
          messages={{
            next: "Sig.", previous: "Ant.", today: "Hoy",
            month: "Mes", week: "Semana", day: "Día"
          }}
          style={{ height: "100%", fontFamily: "Inter, sans-serif" }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.resource.propertyId === propertyFilter ? "#D4AF37" : "#111827",
              borderColor: event.resource.propertyId === propertyFilter ? "#BF9B2D" : "#000",
              color: event.resource.propertyId === propertyFilter ? "#111827" : "#FFF",
              fontWeight: 600, fontSize: "0.82rem", borderRadius: "5px",
              padding: "2px 6px"
            }
          })}
        />
      </div>

      {/* ── Modal de Reserva ──────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "520px", borderRadius: "16px", padding: "2.5rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", color: "#111827", fontSize: "1.5rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {modalMode === "create" ? "🎉 Nueva Reserva" : "✏️ Editar Reserva"}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Selector de espacio */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Espacio / Propiedad</label>
                <select required style={inputStyle} value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}>
                  <option value="">Selecciona un espacio...</option>
                  {propiedades.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.capacidadPersonas ? `· Hasta ${p.capacidadPersonas} per.` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info del espacio seleccionado en el modal */}
              {(() => {
                const prop = propiedades.find(p => p.id === formData.propertyId)
                if (!prop) return null
                return (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#78350F" }}>
                    📅 {prop.diasDisponibles?.map((d: number) => DIAS_SEMANA_LABELS[d]).join(", ") || "Sin restricción"}
                    {prop.horaEntrada && <> · 🕐 {prop.horaEntrada}</>}
                    {prop.horaSalida && <> – 🚪 {prop.horaSalida}</>}
                  </div>
                )
              })()}

              {/* Nombre del cliente */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Nombre del Cliente o Detalle</label>
                <input type="text"
                  placeholder="Ej: Familia García · XV años · Bloqueo mantenimiento"
                  style={inputStyle}
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} />
              </div>

              {/* Personas y fechas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>👥 Personas</label>
                  <input type="number" min="1" placeholder="Ej: 30"
                    style={inputStyle} value={formData.personas}
                    onChange={(e) => setFormData({ ...formData, personas: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>📅 Llegada</label>
                  <input type="date" required style={inputStyle} value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>📅 Salida</label>
                  <input type="date" required style={inputStyle} value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })} />
                </div>
              </div>

              {/* Notas */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={labelStyle}>📝 Notas</label>
                <textarea placeholder="Tipo de evento, requerimientos especiales..." rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                {modalMode === "edit" && (
                  <button type="button" onClick={handleDelete}
                    style={{ marginRight: "auto", padding: "0.75rem 1.2rem", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
                    🗑️ Liberar
                  </button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.75rem 1.2rem", background: "#F3F4F6", color: "#4B5563", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit"
                  style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #D4AF37, #BF9B2D)", color: "#111827", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>
                  {modalMode === "create" ? "✅ Confirmar Reserva" : "✅ Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
