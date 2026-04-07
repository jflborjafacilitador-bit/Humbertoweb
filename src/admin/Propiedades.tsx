import { useState, useEffect, useRef } from "react"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { db, storage } from "../firebase/config"

// ─── Google Maps PlaceAutocompleteElement ────────────────────────────────────
function PlacesInput({ value, onChange, style }: {
  value: string
  onChange: (address: string) => void
  style?: React.CSSProperties
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cleanup = false
    const init = async () => {
      const waitForGoogle = () => new Promise<void>((resolve) => {
        if ((window as any).google?.maps?.importLibrary) return resolve()
        const t = setInterval(() => {
          if ((window as any).google?.maps?.importLibrary) { clearInterval(t); resolve() }
        }, 200)
      })
      await waitForGoogle()
      if (cleanup || !containerRef.current) return
      try {
        const { PlaceAutocompleteElement } = await (window as any).google.maps.importLibrary("places") as any
        if (cleanup || !containerRef.current) return
        const autocompleteEl = new PlaceAutocompleteElement({
          types: ["geocode", "establishment"],
          componentRestrictions: { country: "mx" }
        })
        containerRef.current.innerHTML = ""
        containerRef.current.appendChild(autocompleteEl)
        setReady(true)
        autocompleteEl.addEventListener("gmp-placeselect", async (event: any) => {
          if (cleanup) return
          const { place } = event
          await place.fetchFields({ fields: ["formattedAddress", "displayName"] })
          onChange(place.formattedAddress || place.displayName?.text || "")
        })
      } catch (err) {
        setReady(false)
      }
    }
    init()
    return () => { cleanup = true }
  }, [])

  if (!ready && containerRef.current?.children.length === 0) {
    return (
      <input
        ref={inputRef}
        style={style}
        defaultValue={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ej: Colonia Las Brisas, Veracruz"
      />
    )
  }
  return <div ref={containerRef} style={{ width: "100%", minHeight: "42px" }} />
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const AMENIDADES_DISPONIBLES = [
  "Alberca 🏊‍♀️", "Gimnasio 🏋️", "Seguridad 24/7 🛡️", "Roof Garden 🏙️",
  "Elevador 🛗", "Amueblado 🛋️", "Balcón / Terraza 🌅", "Mascotas Permitidas 🐾",
  "Cuarto de Servicio 🧹", "Salón Multiusos 🎉"
]

const AMENIDADES_EVENTO = [
  "Alberca 🏊‍♀️", "Asador / BBQ 🍖", "Área de Juegos 🎮", "Jardín Amplio 🌿",
  "Estacionamiento Amplio 🚗", "Sonido / Bocinas 🔊", "Proyector / Pantalla 📽️",
  "Área de Kids 👶", "Bar 🍹", "Fogata / Chimenea 🔥", "Wifi 📶",
  "Cuartos para hospedarse 🛏️", "Cocina Equipada 🍳", "Generador Eléctrico ⚡"
]

const DIAS_SEMANA = [
  { label: "Lun", value: 1 }, { label: "Mar", value: 2 }, { label: "Mié", value: 3 },
  { label: "Jue", value: 4 }, { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 }, { label: "Dom", value: 0 }
]

const TIPOS_EVENTO = ["Casa de campo", "Hacienda", "Rancho", "Villa", "Salón de eventos", "Cabaña", "Glamping", "Finca", "Jardín", "Otro"]

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal steps: null | "selector" | "form"
  const [modalStep, setModalStep] = useState<null | "selector" | "form">(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Upload
  const [uploading, setUploading] = useState(false)
  const [imagenesArchivos, setImagenesArchivos] = useState<File[]>([])

  const initialState = {
    nombre: "", precio: "", ubicacion: "", descripcion: "",
    recamaras: "0", banos: "0",
    m2Terreno: "", m2Construccion: "",
    salas: "0", comedores: "0", cocinas: "0", estacionamientos: "0",
    status: "Disponible", tipo: "Casa", operacion: "Venta",
    amenidades: [] as string[], imagenes: [] as string[],
    // Campos exclusivos de Renta por Evento
    tipoEvento: "Casa de campo",
    diasDisponibles: [] as number[],
    horaEntrada: "14:00",
    horaSalida: "12:00",
    capacidadPersonas: "",
    precioEvento: "",
    notasEvento: ""
  }
  const [formData, setFormData] = useState(initialState)
  const isEvento = formData.operacion === "Evento"

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "propiedades"), (snap) => {
      const data: any[] = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setPropiedades(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const openSelector = () => {
    setEditingId(null)
    setFormData(initialState)
    setImagenesArchivos([])
    setModalStep("selector")
  }

  const openForm = (prop?: any, tipoForzado?: "Venta" | "Evento") => {
    if (prop) {
      setEditingId(prop.id)
      // Excluir campos no serializables de Firestore (Timestamp, id interno)
      // para evitar React error #130 "Element type is invalid: got object"
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...cleanProp } = prop
      setFormData({
        ...initialState, ...cleanProp,
        amenidades: Array.isArray(prop.amenidades) ? prop.amenidades : [],
        diasDisponibles: Array.isArray(prop.diasDisponibles) ? prop.diasDisponibles : [],
        imagenes: Array.isArray(prop.imagenes) ? prop.imagenes : []
      })
    } else {
      setEditingId(null)
      setFormData({ ...initialState, operacion: tipoForzado || "Venta" })
    }
    setImagenesArchivos([])
    setModalStep("form")
  }

  const toggleDia = (val: number) => {
    const current = formData.diasDisponibles
    setFormData({
      ...formData,
      diasDisponibles: current.includes(val)
        ? current.filter(d => d !== val)
        : [...current, val]
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImagenesArchivos(prev => [...prev, ...Array.from(e.target.files!)])
  }

  const removeImagenSubida = (index: number) => {
    const nuevas = [...(formData.imagenes || [])]
    nuevas.splice(index, 1)
    setFormData({ ...formData, imagenes: nuevas })
  }

  const removeArchivo = (index: number) => {
    const nuevos = [...imagenesArchivos]
    nuevos.splice(index, 1)
    setImagenesArchivos(nuevos)
  }

  const toggleAmenidad = (amenidad: string) => {
    const current = formData.amenidades || []
    setFormData({
      ...formData,
      amenidades: current.includes(amenidad)
        ? current.filter(a => a !== amenidad)
        : [...current, amenidad]
    })
  }

  const saveProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      let uploadedUrls: string[] = []
      for (const file of imagenesArchivos) {
        const fileRef = ref(storage, `propiedades/${Date.now()}_${file.name}`)
        await uploadBytesResumable(fileRef, file)
        uploadedUrls.push(await getDownloadURL(fileRef))
      }
      const finalImagenes = [...(formData.imagenes || []), ...uploadedUrls]
      const finalData = { ...formData, imagenes: finalImagenes }
      if (editingId) {
        await updateDoc(doc(db, "propiedades", editingId), finalData)
      } else {
        await addDoc(collection(db, "propiedades"), { ...finalData, createdAt: new Date() })
      }
      setModalStep(null)
    } catch (error) {
      console.error("Error al guardar propiedad:", error)
      alert("Error al guardar. Verifica permisos de Firebase Storage.")
    } finally {
      setUploading(false)
    }
  }

  const deleteProperty = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta propiedad?")) {
      await deleteDoc(doc(db, "propiedades", id))
    }
  }

  // ─── Estilos base ───────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0",
    borderRadius: "6px", background: "#FAFAFA", color: "#1A1A1A",
    fontSize: "0.9rem", boxSizing: "border-box", marginBottom: "0.5rem"
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.8rem", color: "#555555",
    marginBottom: "0.4rem", fontWeight: 600
  }
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "1.05rem", color: "#111827", fontWeight: 700,
    margin: "1.5rem 0 1rem 0", paddingBottom: "0.5rem",
    borderBottom: "1px solid #E5E7EB"
  }

  if (loading) return <div style={{ color: "#1A1A1A", padding: "2rem" }}>Cargando propiedades...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.875rem", margin: 0, color: "#111827", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Inventario de Propiedades
        </h2>
        <button
          onClick={openSelector}
          style={{ background: "linear-gradient(135deg, #D4AF37 0%, #BF9B2D 100%)", color: "#111827", border: "none", padding: "0.875rem 1.75rem", borderRadius: "8px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(212,175,55,0.25)", transition: "all 0.2s" }}
        >
          + Agregar Propiedad
        </button>
      </div>

      {/* Grid de propiedades */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
        {propiedades.map(p => {
          const esEvento = p.operacion === "Evento"
          return (
            <div key={p.id} style={{ background: "#FFFFFF", border: `1px solid ${esEvento ? "#FDE68A" : "#E5E7EB"}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "180px", background: "#F3F4F6", position: "relative" }}>
                {p.imagenes?.length > 0 ? (
                  <img src={p.imagenes[0]} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#9CA3AF", fontSize: "2rem" }}>{esEvento ? "🎉" : "🏠"}</span>
                  </div>
                )}
                {/* Badge tipo operación */}
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  background: esEvento ? "linear-gradient(135deg, #D4AF37, #F59E0B)" : "#111827",
                  color: esEvento ? "#111827" : "#FFF",
                  padding: "4px 12px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700
                }}>
                  {esEvento ? "🎉 EVENTO" : "🏷️ VENTA"}
                </div>
              </div>

              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#111827", fontWeight: 600 }}>{p.nombre}</h3>

                <div style={{ display: "flex", gap: "8px", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", background: "#F3F4F6", color: "#4B5563", fontWeight: 600 }}>
                    {esEvento ? (p.tipoEvento || "Evento") : (p.tipo || "Casa")}
                  </span>
                  <span style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: p.status === "Disponible" ? "1px solid #A7F3D0" : "1px solid #FECACA", background: p.status === "Disponible" ? "#ECFDF5" : "#FEF2F2", color: p.status === "Disponible" ? "#059669" : "#DC2626", fontWeight: 600 }}>
                    {p.status}
                  </span>
                </div>

                <div style={{ color: "#BF9B2D", fontSize: "1.35rem", fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: "0.75rem" }}>
                  {esEvento ? (p.precioEvento ? `$${Number(p.precioEvento).toLocaleString()} / evento` : p.precio) : p.precio}
                </div>

                {/* Info según tipo */}
                {esEvento ? (
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {p.capacidadPersonas && <span>👥 Hasta {p.capacidadPersonas} personas</span>}
                    {p.horaEntrada && <span>🕐 Check-in {p.horaEntrada}</span>}
                    {p.horaSalida && <span>🚪 Check-out {p.horaSalida}</span>}
                    {p.diasDisponibles?.length > 0 && (
                      <span>📅 {p.diasDisponibles.map((d: number) => DIAS_SEMANA.find(ds => ds.value === d)?.label).filter(Boolean).join(", ")}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    <span>🛏️ {p.recamaras || "0"} Rec.</span>
                    <span>🛁 {p.banos || "0"} Baños</span>
                    <span>🚗 {p.estacionamientos || "0"} Est.</span>
                    {p.m2Terreno && <span>🏔️ {p.m2Terreno}m²</span>}
                  </div>
                )}

                {p.amenidades?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {p.amenidades.slice(0, 3).map((am: string, i: number) => (
                      <span key={i} style={{ fontSize: "0.65rem", padding: "3px 6px", background: esEvento ? "#FEF3C7" : "#EFF6FF", color: esEvento ? "#92400E" : "#2563EB", borderRadius: "4px", fontWeight: 600 }}>
                        {am.split(" ")[0]}
                      </span>
                    ))}
                    {p.amenidades.length > 3 && <span style={{ fontSize: "0.65rem", color: "#6B7280" }}>+{p.amenidades.length - 3}</span>}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "auto" }}>
                  <button onClick={() => openForm(p)} style={{ padding: "0.6rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", cursor: "pointer", color: "#4B5563", fontWeight: 500 }}>Editar</button>
                  <button onClick={() => deleteProperty(p.id)} style={{ padding: "0.6rem", background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "8px", cursor: "pointer", color: "#DC2626", fontWeight: 500 }}>Eliminar</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL STEP 0 — Selector de tipo
      ══════════════════════════════════════════════════════════════════════ */}
      {modalStep === "selector" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "640px", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#111827", fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              ¿Qué tipo de propiedad vas a registrar?
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: "0 0 2rem 0" }}>
              El formulario se adapta automáticamente según el tipo que elijas.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              {/* Card Venta */}
              <button
                type="button"
                onClick={() => openForm(undefined, "Venta")}
                className="tipo-card"
                style={{
                  padding: "2rem 1.5rem", border: "2px solid #E5E7EB", borderRadius: "16px",
                  background: "#FAFAFA", cursor: "pointer", textAlign: "left", transition: "all 0.2s"
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = "2px solid #111827"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "2px solid #E5E7EB"; (e.currentTarget as HTMLElement).style.background = "#FAFAFA" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏷️</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Venta / Renta Mensual</div>
                <div style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5 }}>
                  Para propiedades en venta, renta mensual tradicional o uso comercial.
                </div>
              </button>

              {/* Card Evento */}
              <button
                type="button"
                onClick={() => openForm(undefined, "Evento")}
                style={{
                  padding: "2rem 1.5rem", border: "2px solid #FDE68A", borderRadius: "16px",
                  background: "#FFFBEB", cursor: "pointer", textAlign: "left", transition: "all 0.2s"
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = "2px solid #D4AF37"; (e.currentTarget as HTMLElement).style.background = "#FEF3C7" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "2px solid #FDE68A"; (e.currentTarget as HTMLElement).style.background = "#FFFBEB" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#92400E", marginBottom: "0.5rem" }}>Renta por Evento</div>
                <div style={{ fontSize: "0.82rem", color: "#78350F", lineHeight: 1.5 }}>
                  Para espacios que se alquilan por día o fin de semana: fincas, haciendas, cabañas, ranchos…
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setModalStep(null)}
              style={{ width: "100%", padding: "0.85rem", background: "#F3F4F6", border: "none", borderRadius: "8px", cursor: "pointer", color: "#6B7280", fontWeight: 600 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL STEP 1 — Formulario completo
      ══════════════════════════════════════════════════════════════════════ */}
      {modalStep === "form" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "880px", borderRadius: "16px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>

            {/* Header del formulario */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "2rem" }}>{isEvento ? "🎉" : "🏷️"}</span>
              <h3 style={{ margin: 0, color: "#111827", fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {editingId ? "Editar Inmueble" : isEvento ? "Alta de Espacio para Evento" : "Alta de Inmueble"}
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
              <span style={{
                padding: "4px 14px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                background: isEvento ? "linear-gradient(135deg, #D4AF37, #F59E0B)" : "#111827",
                color: isEvento ? "#111827" : "#FFF"
              }}>
                {isEvento ? "🎉 RENTA POR EVENTO" : "🏷️ VENTA / RENTA MENSUAL"}
              </span>
              {!editingId && (
                <button type="button" onClick={() => setModalStep("selector")} style={{ background: "none", border: "none", color: "#6B7280", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline" }}>
                  ← Cambiar tipo
                </button>
              )}
            </div>

            <form onSubmit={saveProperty}>

              {/* ── Sección 1: Datos Principales ── */}
              <h4 style={sectionTitleStyle}>1. Datos Principales</h4>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>{isEvento ? "Nombre del espacio" : "Título de la propiedad"}</label>
                  <input style={inputStyle} required value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder={isEvento ? "Ej: Finca Las Magnolias" : "Ej: Residencia de lujo en Lomas"} />
                </div>
                <div>
                  <label style={labelStyle}>{isEvento ? "Precio por Evento ($)" : "Precio"}</label>
                  <input style={inputStyle} required
                    value={isEvento ? formData.precioEvento : formData.precio}
                    onChange={e => setFormData(isEvento
                      ? { ...formData, precioEvento: e.target.value }
                      : { ...formData, precio: e.target.value }
                    )}
                    placeholder={isEvento ? "Ej: 8000" : "$"} />
                </div>
              </div>

              {/* Campos condicionales de tipo */}
              {isEvento ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>Tipo de Espacio</label>
                    <select style={inputStyle} value={formData.tipoEvento}
                      onChange={e => setFormData({ ...formData, tipoEvento: e.target.value })}>
                      {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Estatus</label>
                    <select style={inputStyle} value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Disponible">Disponible</option>
                      <option value="En Pausa">En Pausa</option>
                      <option value="Rentada">Rentada</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>Operación</label>
                    <select style={inputStyle} value={formData.operacion}
                      onChange={e => setFormData({ ...formData, operacion: e.target.value })}>
                      <option value="Venta">Venta</option>
                      <option value="Renta">Renta Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tipo de Inmueble</label>
                    <select style={inputStyle} value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                      <option>Casa</option><option>Departamento</option><option>Terreno</option>
                      <option>Local Comercial</option><option>Oficina</option><option>Bodega</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Estatus</label>
                    <select style={inputStyle} value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Disponible">Disponible</option>
                      <option value="Vendida">Vendida</option>
                      <option value="Rentada">Rentada</option>
                      <option value="En Pausa">En Pausa</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── Sección 2: Ubicación ── */}
              <h4 style={sectionTitleStyle}>2. Ubicación & Superficie</h4>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Ubicación Exacta (Google Maps)</label>
                <PlacesInput style={inputStyle} value={formData.ubicacion}
                  onChange={(address) => setFormData({ ...formData, ubicacion: address })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>Superficie de Terreno (m²)</label>
                  <input style={inputStyle} value={formData.m2Terreno}
                    onChange={e => setFormData({ ...formData, m2Terreno: e.target.value })} placeholder="Ej: 2500" />
                </div>
                <div>
                  <label style={labelStyle}>Metros de Construcción (m²)</label>
                  <input style={inputStyle} value={formData.m2Construccion}
                    onChange={e => setFormData({ ...formData, m2Construccion: e.target.value })} placeholder="Ej: 600" />
                </div>
              </div>

              {/* ── Sección EVENTO: Disponibilidad ── */}
              {isEvento && (
                <>
                  <h4 style={{ ...sectionTitleStyle, color: "#92400E", borderColor: "#FDE68A" }}>3. Disponibilidad & Horarios 📅</h4>

                  {/* Días de la semana */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={labelStyle}>Días disponibles para reservar</label>
                    <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: "-0.2rem 0 0.75rem 0" }}>
                      Selecciona los días que aparecerán disponibles en el calendario
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {DIAS_SEMANA.map(dia => {
                        const selected = formData.diasDisponibles.includes(dia.value)
                        return (
                          <button
                            key={dia.value}
                            type="button"
                            onClick={() => toggleDia(dia.value)}
                            style={{
                              padding: "0.6rem 1rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem",
                              border: selected ? "2px solid #D4AF37" : "2px solid #E5E7EB",
                              background: selected ? "linear-gradient(135deg, #D4AF37, #F59E0B)" : "#F9FAFB",
                              color: selected ? "#111827" : "#6B7280",
                              cursor: "pointer", transition: "all 0.15s"
                            }}
                          >
                            {dia.label}
                          </button>
                        )
                      })}
                    </div>
                    {/* Acceso rápido */}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button type="button" onClick={() => setFormData({ ...formData, diasDisponibles: [6, 0] })}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "6px", cursor: "pointer", color: "#92400E", fontWeight: 600 }}>
                        Solo fines de semana
                      </button>
                      <button type="button" onClick={() => setFormData({ ...formData, diasDisponibles: [1, 2, 3, 4, 5] })}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", color: "#4B5563", fontWeight: 600 }}>
                        Entre semana
                      </button>
                      <button type="button" onClick={() => setFormData({ ...formData, diasDisponibles: [0, 1, 2, 3, 4, 5, 6] })}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", color: "#4B5563", fontWeight: 600 }}>
                        Todos los días
                      </button>
                      <button type="button" onClick={() => setFormData({ ...formData, diasDisponibles: [] })}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#FFF", border: "1px solid #FCA5A5", borderRadius: "6px", cursor: "pointer", color: "#DC2626", fontWeight: 600 }}>
                        Limpiar
                      </button>
                    </div>
                  </div>

                  {/* Horarios */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={labelStyle}>🕐 Hora de Llegada (Check-in)</label>
                      <input type="time" style={inputStyle} value={formData.horaEntrada}
                        onChange={e => setFormData({ ...formData, horaEntrada: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>🚪 Hora de Salida (Check-out)</label>
                      <input type="time" style={inputStyle} value={formData.horaSalida}
                        onChange={e => setFormData({ ...formData, horaSalida: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>👥 Capacidad Máxima (personas)</label>
                      <input type="number" min="1" style={inputStyle} value={formData.capacidadPersonas}
                        onChange={e => setFormData({ ...formData, capacidadPersonas: e.target.value })}
                        placeholder="Ej: 50" />
                    </div>
                  </div>

                  {/* Notas del evento */}
                  <div>
                    <label style={labelStyle}>📝 Políticas & Notas del Espacio</label>
                    <textarea style={{ ...inputStyle, height: "80px", resize: "vertical" }}
                      value={formData.notasEvento}
                      onChange={e => setFormData({ ...formData, notasEvento: e.target.value })}
                      placeholder="Ej: Mínimo 2 noches en fines de semana, no se permiten eventos con más de 100 personas..." />
                  </div>
                </>
              )}

              {/* ── Sección: Distribución (solo venta) ── */}
              {!isEvento && (
                <>
                  <h4 style={sectionTitleStyle}>3. Distribución Base</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1.25rem" }}>
                    {[
                      { label: "Recámaras", key: "recamaras", opts: ["0","1","2","3","4","5+"] },
                      { label: "Baños", key: "banos", opts: ["0","1","1.5","2","2.5","3+"] },
                      { label: "Estacionamiento", key: "estacionamientos", opts: ["0","1","2","3","4+"] },
                      { label: "Salas", key: "salas", opts: ["0","1","2","3+"] },
                      { label: "Comedores", key: "comedores", opts: ["0","1","2","3+"] },
                      { label: "Cocinas", key: "cocinas", opts: ["0","1","2","3+"] },
                    ].map(({ label, key, opts }) => (
                      <div key={key}>
                        <label style={labelStyle}>{label}</label>
                        <select style={inputStyle} value={(formData as any)[key]}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value })}>
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Sección: Amenidades ── */}
              <h4 style={{ ...sectionTitleStyle, ...(isEvento ? { color: "#92400E", borderColor: "#FDE68A" } : {}) }}>
                {isEvento ? "4." : "4."} Amenidades {isEvento ? "del Espacio" : "y Extras"}
              </h4>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "-0.5rem 0 1rem 0" }}>
                Selecciona todas las amenidades disponibles.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {(isEvento ? AMENIDADES_EVENTO : AMENIDADES_DISPONIBLES).map(am => {
                  const isSelected = formData.amenidades?.includes(am)
                  return (
                    <button
                      type="button" key={am}
                      onClick={() => toggleAmenidad(am)}
                      style={{
                        padding: "0.6rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600,
                        border: isSelected ? (isEvento ? "1px solid #D4AF37" : "1px solid #D4AF37") : "1px solid #E5E7EB",
                        background: isSelected ? (isEvento ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.15)") : "#FFFFFF",
                        color: isSelected ? (isEvento ? "#92400E" : "#9b7e25") : "#4B5563",
                        cursor: "pointer", transition: "all 0.2s ease"
                      }}
                    >
                      {am}
                    </button>
                  )
                })}
              </div>

              {/* ── Sección: Descripción & Fotos ── */}
              <h4 style={sectionTitleStyle}>{isEvento ? "5." : "5."} Descripción & Fotografías</h4>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>{isEvento ? "Descripción del espacio" : "Descripción extendida"}</label>
                <textarea style={{ ...inputStyle, height: "100px", resize: "vertical" }}
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder={isEvento
                    ? "Describe el ambiente, la capacidad, qué eventos son ideales, accesos, servicios…"
                    : "Describe los beneficios de la zona, equipamiento o datos relevantes del peritaje…"
                  } />
              </div>

              <div style={{ background: "#F9FAFB", border: "1px dashed #9CA3AF", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <label style={{ ...labelStyle, color: "#111827", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                  FOTOGRAFÍAS DEL ESPACIO
                </label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange}
                  style={{ display: "block", marginBottom: "1rem", color: "#4B5563" }} />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {formData.imagenes?.map((url, i) => (
                    <div key={`url-${i}`} style={{ position: "relative", width: "80px", height: "80px" }}>
                      <img src={url} alt={`Imagen ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                      <button type="button" onClick={() => removeImagenSubida(i)}
                        style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}>
                        X
                      </button>
                    </div>
                  ))}
                  {imagenesArchivos.map((file, i) => (
                    <div key={`file-${i}`} style={{ position: "relative", width: "80px", height: "80px" }}>
                      <img src={URL.createObjectURL(file)} alt={`Archivo ${i}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", opacity: 0.6 }} />
                      <button type="button" onClick={() => removeArchivo(i)}
                        style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}>
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones finales */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", borderTop: "1px solid #E5E7EB", paddingTop: "1.5rem" }}>
                <button type="button" onClick={() => setModalStep(null)}
                  style={{ flex: 1, padding: "1rem", background: "#F3F4F6", border: "none", borderRadius: "8px", cursor: "pointer", color: "#4B5563", fontWeight: 600, fontSize: "1rem" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={uploading}
                  style={{
                    flex: 2, padding: "1rem", border: "none", borderRadius: "8px", cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: "1rem",
                    background: uploading ? "#9CA3AF" : isEvento
                      ? "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)"
                      : "linear-gradient(135deg, #D4AF37 0%, #BF9B2D 100%)",
                    color: "#111827",
                    boxShadow: uploading ? "none" : "0 8px 20px rgba(212,175,55,0.3)"
                  }}>
                  {uploading ? "💾 Guardando..." : isEvento ? "🎉 PUBLICAR ESPACIO" : "✨ PUBLICAR PROPIEDAD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
