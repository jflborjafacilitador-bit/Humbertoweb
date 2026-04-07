import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import { es } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { collection, onSnapshot, query, where } from "firebase/firestore"
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

  useEffect(() => {
    // Escuchar cambios solo para las operaciones de Renta
    const q = query(collection(db, "propiedades"), where("operacion", "==", "Renta"))
    const unsub = onSnapshot(q, (snap) => {
      const data: any[] = []
      snap.forEach(doc => {
        const prop = doc.data()
        // Si la propiedad tiene fechas capturadas
        if (prop.disponibleDesde && prop.disponibleHasta) {
          // parse de la fecha (recordar que viene en string YYYY-MM-DD del input type="date")
          /* Al parsear directo puede tener desfases de timezone dependiendo el navegador,
             para una fecha sencilla YYYY-MM-DD podemos hacer un append del T00:00:00 */
          const startD = new Date(`${prop.disponibleDesde}T00:00:00`)
          const endD = new Date(`${prop.disponibleHasta}T23:59:59`) // Al final del día para que cuente ese día
          
          data.push({
            id: doc.id,
            title: prop.nombre,
            start: startD,
            end: endD,
            allDay: true,
            resource: prop
          })
        }
      })
      setEvents(data)
    })
    return unsub
  }, [])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.875rem", margin: 0, color: "#111827", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Calendario de Disponibilidad
        </h2>
        <span style={{ color: "#6B7280", fontSize: "0.95rem" }}>Muestra periodos libres de rentas</span>
      </div>

      <div style={{ height: "70vh", minHeight: "500px", background: "#FFF", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", border: "1px solid #E5E7EB" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          messages={{
            next: "Sig.",
            previous: "Ant.",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}
          style={{ height: "100%", fontFamily: "Inter, sans-serif" }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "#D4AF37",
              borderColor: "#BF9B2D",
              color: "#111827",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: "4px"
            }
          })}
        />
      </div>
    </div>
  )
}
