import { useState, useEffect } from "react"
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

const locales = {
  "es": es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes
  getDay,
  locales,
})

export default function CalendarioAdmin() {
  const [events, setEvents] = useState<any[]>([])
  const [propiedades, setPropiedades] = useState<any[]>([])
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    propertyId: "",
    propertyName: "",
    clientName: "",
    start: "",
    end: ""
  })

  useEffect(() => {
    // 1. Cargar propiedades en Renta para el Selector
    const qProps = query(collection(db, "propiedades"), where("operacion", "==", "Renta"))
    const unsubProps = onSnapshot(qProps, (snap) => {
      const data: any[] = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setPropiedades(data)
    })
    
    // 2. Cargar reservas globales
    const unsubReservas = onSnapshot(collection(db, "reservas"), (snap) => {
      const data: any[] = []
      snap.forEach(doc => {
        const res = doc.data()
        data.push({
          id: doc.id,
          title: res.clientName ? `${res.propertyName} - ${res.clientName}` : res.propertyName,
          start: new Date(res.start),
          end: new Date(res.end),
          allDay: true,
          resource: res
        })
      })
      setEvents(data)
    })

    return () => {
      unsubProps()
      unsubReservas()
    }
  }, [])

  const displayedEvents = propertyFilter === "all" 
    ? events 
    : events.filter(e => e.resource.propertyId === propertyFilter)

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const preselectedProp = propertyFilter !== "all" ? propertyFilter : ""
    setModalMode("create")
    setFormData({
      propertyId: preselectedProp,
      propertyName: "",
      clientName: "",
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
      propertyName: event.resource.propertyName,
      clientName: event.resource.clientName || "",
      start: format(event.start, "yyyy-MM-dd"),
      end: format(event.end, "yyyy-MM-dd")
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!formData.propertyId || !formData.start || !formData.end) return

    const propSelection = propiedades.find(p => p.id === formData.propertyId)
    const propName = propSelection ? propSelection.nombre : formData.propertyName

    const dataToSave = {
      propertyId: formData.propertyId,
      propertyName: propName,
      clientName: formData.clientName,
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
    if(selectedEventId) {
      await deleteDoc(doc(db, "reservas", selectedEventId))
    }
    setIsModalOpen(false)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.875rem", margin: 0, color: "#111827", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Calendario de Reservas
          </h2>
          <span style={{ color: "#6B7280", fontSize: "0.95rem" }}>Gestiona fechas bloqueadas y huéspedes</span>
        </div>
        
        {/* Filtro por Propiedad */}
        <div>
          <select 
            style={{ padding: "0.6rem 1rem", border: "1px solid #E5E7EB", borderRadius: "8px", background: "#FFF", fontSize: "0.95rem", minWidth: "200px" }}
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
          >
            <option value="all">Todas las propiedades</option>
            {propiedades.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

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
          messages={{
            next: "Sig.",
            previous: "Ant.",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}
          style={{ height: "100%", fontFamily: "Inter, sans-serif" }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.resource.propertyId === propertyFilter ? "#D4AF37" : "#111827",
              borderColor: event.resource.propertyId === propertyFilter ? "#BF9B2D" : "#000",
              color: "#FFF",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: "4px"
            }
          })}
        />
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "500px", borderRadius: "16px", padding: "2.5rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", color: "#111827", fontSize: "1.5rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {modalMode === "create" ? "Nueva Reserva / Bloquear Fechas" : "Editar Reserva"}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#4B5563", marginBottom: "0.5rem", fontWeight: 600 }}>Propiedad</label>
                <select 
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "6px", background: "#FAFAFA" }}
                  value={formData.propertyId}
                  onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                >
                  <option value="">Selecciona una propiedad...</option>
                  {propiedades.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#4B5563", marginBottom: "0.5rem", fontWeight: 600 }}>Nombre del Cliente / Detalle (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ej: Familia López o Bloqueo p/ pintura"
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "6px", background: "#FAFAFA" }}
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#4B5563", marginBottom: "0.5rem", fontWeight: 600 }}>Ingreso</label>
                  <input 
                    type="date"
                    required
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "6px", background: "#FAFAFA" }}
                    value={formData.start}
                    onChange={(e) => setFormData({...formData, start: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#4B5563", marginBottom: "0.5rem", fontWeight: 600 }}>Salida</label>
                  <input 
                    type="date"
                    required
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "6px", background: "#FAFAFA" }}
                    value={formData.end}
                    onChange={(e) => setFormData({...formData, end: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                {modalMode === "edit" && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    style={{ marginRight: "auto", padding: "0.75rem 1.2rem", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Liberar Fechas
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.75rem 1.2rem", background: "#F3F4F6", color: "#4B5563", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: "0.75rem 1.5rem", background: "#111827", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                >
                  {modalMode === "create" ? "Guardar Reserva" : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
