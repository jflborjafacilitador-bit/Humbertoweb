import { useState, useEffect } from "react"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { db, storage } from "../firebase/config"
import { usePlacesWidget } from "react-google-autocomplete"

const AMENIDADES_DISPONIBLES = [
  "Alberca 🏊‍♀️", "Gimnasio 🏋️", "Seguridad 24/7 🛡️", "Roof Garden 🏙️", 
  "Elevador 🛗", "Amueblado 🛋️", "Balcón / Terraza 🌅", "Mascotas Permitidas 🐾", 
  "Cuarto de Servicio 🧹", "Salón Multiusos 🎉"
]

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // States Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // States Upload
  const [uploading, setUploading] = useState(false)
  const [imagenesArchivos, setImagenesArchivos] = useState<File[]>([])

  const { ref: placesRef } = usePlacesWidget({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    options: { types: ["geocode", "establishment"] },
    onPlaceSelected: (place: any) => {
      if (place && place.formatted_address) {
        setFormData(prev => ({...prev, ubicacion: place.formatted_address}))
      }
    }
  })

  const initialState = {
    nombre: "", precio: "", ubicacion: "", descripcion: "", recamaras: "0", banos: "0", 
    m2Terreno: "", m2Construccion: "", 
    salas: "0", comedores: "0", cocinas: "0", estacionamientos: "0",
    status: "Disponible", tipo: "Casa", operacion: "Venta", 
    amenidades: [] as string[], imagenes: [] as string[]
  }
  const [formData, setFormData] = useState(initialState)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "propiedades"), (snap) => {
      const data: any[] = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setPropiedades(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const openForm = (prop?: any) => {
    if (prop) {
      setEditingId(prop.id)
      setFormData({ ...initialState, ...prop, amenidades: prop.amenidades || [] })
    } else {
      setEditingId(null)
      setFormData(initialState)
    }
    setImagenesArchivos([])
    setIsModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files)
      setImagenesArchivos(prev => [...prev, ...filesArr])
    }
  }

  const removeImagenSubida = (index: number) => {
    const nuevas = [...(formData.imagenes || [])]
    nuevas.splice(index, 1)
    setFormData({...formData, imagenes: nuevas})
  }

  const removeArchivo = (index: number) => {
    const nuevos = [...imagenesArchivos]
    nuevos.splice(index, 1)
    setImagenesArchivos(nuevos)
  }

  const toggleAmenidad = (amenidad: string) => {
    const current = formData.amenidades || []
    if (current.includes(amenidad)) {
      setFormData({ ...formData, amenidades: current.filter(a => a !== amenidad) })
    } else {
      setFormData({ ...formData, amenidades: [...current, amenidad] })
    }
  }

  const saveProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let uploadedUrls: string[] = []

      for (const file of imagenesArchivos) {
        const fileRef = ref(storage, `propiedades/${Date.now()}_${file.name}`)
        await uploadBytesResumable(fileRef, file)
        const url = await getDownloadURL(fileRef)
        uploadedUrls.push(url)
      }

      const finalImagenes = [...(formData.imagenes || []), ...uploadedUrls]
      const finalData = { ...formData, imagenes: finalImagenes }

      if (editingId) {
        await updateDoc(doc(db, "propiedades", editingId), finalData)
      } else {
        await addDoc(collection(db, "propiedades"), { ...finalData, createdAt: new Date() })
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error al guardar propiedad:", error)
      alert("Error CORS o de permisos en Firebase. Por favor, asegúrate de haber subido el archivo cors.json a tu Google Cloud.")
    } finally {
      setUploading(false)
    }
  }

  const deleteProperty = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta propiedad?")) {
      await deleteDoc(doc(db, "propiedades", id))
    }
  }

  const inputStyle = { width: "100%", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "6px", background: "#FAFAFA", color: "#1A1A1A", fontSize: "0.9rem", boxSizing: "border-box" as const, marginBottom: "0.5rem" }
  const labelStyle = { display: "block", fontSize: "0.8rem", color: "#555555", marginBottom: "0.4rem", fontWeight: 600 }
  const sectionTitleStyle = { fontSize: "1.1rem", color: "#111827", fontWeight: 700, margin: "1.5rem 0 1rem 0", paddingBottom: "0.5rem", borderBottom: "1px solid #E5E7EB" }

  if (loading) return <div style={{ color: "#1A1A1A", padding: "2rem" }}>Cargando propiedades...</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.875rem", margin: 0, color: "#111827", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Inventario de Propiedades</h2>
        <button 
          onClick={() => openForm()}
          style={{ background: "linear-gradient(135deg, #D4AF37 0%, #BF9B2D 100%)", color: "#111827", border: "none", padding: "0.875rem 1.75rem", borderRadius: "8px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(212,175,55,0.25)", transition: "all 0.2s" }}
        >
          + Agregar Propiedad
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
        {propiedades.map(p => (
          <div key={p.id} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "180px", background: "#F3F4F6", position: "relative" }}>
              {p.imagenes && p.imagenes.length > 0 ? (
                <img src={p.imagenes[0]} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #E5E7EB" }}>
                  <span style={{ color: "#9CA3AF", fontSize: "0.9rem", fontWeight: 500 }}>🖼️ Sin imagen</span>
                </div>
              )}
              <div style={{ position: "absolute", top: "12px", right: "12px", background: "#111827", color: "#FFF", padding: "4px 12px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 600 }}>
                {p.operacion?.toUpperCase() || "VENTA"}
              </div>
            </div>
            <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#111827", fontWeight: 600, lineHeight: 1.3 }}>{p.nombre}</h3>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", background: "#F3F4F6", color: "#4B5563", fontWeight: 600 }}>{p.tipo || "Casa"}</span>
                <span style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: p.status==="Disponible"?"1px solid #A7F3D0":"1px solid #FECACA", background: p.status==="Disponible"?"#ECFDF5":"#FEF2F2", color: p.status==="Disponible"?"#059669":"#DC2626", fontWeight: 600 }}>{p.status}</span>
              </div>
              <div style={{ color: "#BF9B2D", fontSize: "1.35rem", fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: "0.75rem" }}>{p.precio}</div>
              
              <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", fontWeight: 500 }}>
                <span>🛏️ {p.recamaras || "0"} Rec.</span> 
                <span>🛁 {p.banos || "0"} Baños</span> 
                <span>🚗 {p.estacionamientos || "0"} Est.</span>
                {p.m2Terreno && <span style={{color: "#374151"}}>🏔️ Terr: {p.m2Terreno}m²</span>}
                {p.m2Construccion && <span style={{color: "#374151"}}>🏗️ Const: {p.m2Construccion}m²</span>}
              </div>

              {p.amenidades && p.amenidades.length > 0 && (
                <div style={{ marginBottom: "1.5rem", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {p.amenidades.slice(0, 3).map((am: string, i: number) => (
                    <span key={i} style={{ fontSize: "0.65rem", padding: "3px 6px", background: "#EFF6FF", color: "#2563EB", borderRadius: "4px", fontWeight: 600 }}>{am.split(" ")[0]}</span>
                  ))}
                  {p.amenidades.length > 3 && <span style={{ fontSize: "0.65rem", padding: "3px 6px", color: "#6B7280" }}>+{p.amenidades.length - 3}</span>}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "auto" }}>
                <button onClick={() => openForm(p)} style={{ padding: "0.6rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", cursor: "pointer", color: "#4B5563", fontWeight: 500 }}>Editar</button>
                <button onClick={() => deleteProperty(p.id)} style={{ padding: "0.6rem", background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "8px", cursor: "pointer", color: "#DC2626", fontWeight: 500 }}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "850px", borderRadius: "16px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#111827", fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{editingId ? "Editar Inmueble" : "Alta de Nuevo Inmueble"}</h3>
            <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: "0 0 2rem 0" }}>Completa las secciones para estructurar perfectamente la información hacia tus clientes.</p>
            
            <form onSubmit={saveProperty}>
              
              <h4 style={sectionTitleStyle}>1. Datos Principales</h4>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>Título de la propiedad</label>
                  <input style={inputStyle} required value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Residencia de lujo en Lomas" />
                </div>
                <div>
                  <label style={labelStyle}>Precio</label>
                  <input style={inputStyle} required value={formData.precio} onChange={e=>setFormData({...formData, precio: e.target.value})} placeholder="$" />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>Operación</label>
                  <select style={inputStyle} value={formData.operacion} onChange={e=>setFormData({...formData, operacion: e.target.value})}>
                    <option value="Venta">Venta</option>
                    <option value="Renta">Renta</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tipo de Inmueble</label>
                  <select style={inputStyle} value={formData.tipo} onChange={e=>setFormData({...formData, tipo: e.target.value})}>
                    <option value="Casa">Casa</option><option value="Departamento">Departamento</option><option value="Terreno">Terreno</option><option value="Local Comercial">Local Comercial</option><option value="Oficina">Oficina</option><option value="Bodega">Bodega</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Estatus Actual</label>
                  <select style={inputStyle} value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                    <option value="Disponible">Disponible</option><option value="Vendida">Vendida</option><option value="Rentada">Rentada</option><option value="En Pausa">En Pausa</option>
                  </select>
                </div>
              </div>

              <h4 style={sectionTitleStyle}>2. Ubicación & Superficie</h4>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Plaza / Ubicación Exacta (Motor de Google)</label>
                <input ref={placesRef as any} style={inputStyle} value={formData.ubicacion} onChange={(e: any) => setFormData({...formData, ubicacion: e.target.value})} placeholder="Busca la colonia, calle o ciudad..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>Superficie de Terreno (m²)</label>
                  <input style={inputStyle} value={formData.m2Terreno} onChange={e=>setFormData({...formData, m2Terreno: e.target.value})} placeholder="Ej: 300" />
                </div>
                <div>
                  <label style={labelStyle}>Metros de Construcción (m²)</label>
                  <input style={inputStyle} value={formData.m2Construccion} onChange={e=>setFormData({...formData, m2Construccion: e.target.value})} placeholder="Ej: 220" />
                </div>
              </div>

              <h4 style={sectionTitleStyle}>3. Distribución Base</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>Recámaras</label>
                  <select style={inputStyle} value={formData.recamaras} onChange={e=>setFormData({...formData, recamaras: e.target.value})}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5+">5+</option></select>
                </div>
                <div>
                  <label style={labelStyle}>Baños</label>
                  <select style={inputStyle} value={formData.banos} onChange={e=>setFormData({...formData, banos: e.target.value})}><option value="0">0</option><option value="1">1</option><option value="1.5">1.5</option><option value="2">2</option><option value="2.5">2.5</option><option value="3+">3+</option></select>
                </div>
                <div>
                  <label style={labelStyle}>Estacionamiento</label>
                  <select style={inputStyle} value={formData.estacionamientos} onChange={e=>setFormData({...formData, estacionamientos: e.target.value})}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4+">4+</option></select>
                </div>
                <div>
                  <label style={labelStyle}>Salas</label>
                  <select style={inputStyle} value={formData.salas} onChange={e=>setFormData({...formData, salas: e.target.value})}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3+">3+</option></select>
                </div>
                <div>
                  <label style={labelStyle}>Comedores</label>
                  <select style={inputStyle} value={formData.comedores} onChange={e=>setFormData({...formData, comedores: e.target.value})}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3+">3+</option></select>
                </div>
                <div>
                  <label style={labelStyle}>Cocinas</label>
                  <select style={inputStyle} value={formData.cocinas} onChange={e=>setFormData({...formData, cocinas: e.target.value})}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3+">3+</option></select>
                </div>
              </div>

              <h4 style={sectionTitleStyle}>4. Amenidades y Extras (Modo Vela)</h4>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "-0.5rem 0 1rem 0" }}>Selecciona todas las amenidades con las que cuenta el desarrollo o propiedad.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {AMENIDADES_DISPONIBLES.map(am => {
                  const isSelected = formData.amenidades?.includes(am);
                  return (
                    <button
                      type="button"
                      key={am}
                      onClick={() => toggleAmenidad(am)}
                      style={{
                        padding: "0.6rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600,
                        border: isSelected ? "1px solid #D4AF37" : "1px solid #E5E7EB",
                        background: isSelected ? "rgba(212, 175, 55, 0.15)" : "#FFFFFF",
                        color: isSelected ? "#9b7e25" : "#4B5563",
                        cursor: "pointer", transition: "all 0.2s ease"
                      }}
                    >
                      {am}
                    </button>
                  )
                })}
              </div>

              <h4 style={sectionTitleStyle}>5. Exposición Final</h4>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Descripción extendida del lugar</label>
                <textarea style={{...inputStyle, height: "100px", resize: "vertical"}} value={formData.descripcion} onChange={e=>setFormData({...formData, descripcion: e.target.value})} placeholder="Describe los beneficios de la zona, equipamiento o datos relevantes del peritaje..." />
              </div>

              <div style={{ background: "#F9FAFB", border: "1px dashed #9CA3AF", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <label style={{...labelStyle, color: "#111827", fontSize: "0.95rem", marginBottom: "0.75rem"}}>FOTOGRAFÍAS A SUBIR (Galería de Portafolio)</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: "block", marginBottom: "1rem", color: "#4B5563" }} />
                
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {formData.imagenes && formData.imagenes.map((url, i) => (
                    <div key={`url-${i}`} style={{ position: "relative", width: "80px", height: "80px" }}>
                      <img src={url} alt={`Imagen ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                      <button type="button" onClick={() => removeImagenSubida(i)} style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}>X</button>
                    </div>
                  ))}
                  {imagenesArchivos.map((file, i) => (
                    <div key={`file-${i}`} style={{ position: "relative", width: "80px", height: "80px" }}>
                      <img src={URL.createObjectURL(file)} alt={`Archivo ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", opacity: 0.6 }} />
                      <button type="button" onClick={() => removeArchivo(i)} style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}>X</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones Finales */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", borderTop: "1px solid #E5E7EB", paddingTop: "1.5rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "1rem", background: "#F3F4F6", border: "none", borderRadius: "8px", cursor: "pointer", color: "#4B5563", fontWeight: 600, fontSize: "1rem" }}>Cancelar Abortar</button>
                <button type="submit" disabled={uploading} style={{ flex: 2, padding: "1rem", background: uploading ? "#9CA3AF" : "linear-gradient(135deg, #D4AF37 0%, #BF9B2D 100%)", border: "none", borderRadius: "8px", cursor: uploading ? "not-allowed" : "pointer", color: "#111827", fontWeight: 700, fontSize: "1rem", boxShadow: uploading ? "none" : "0 8px 20px rgba(212,175,55,0.3)" }}>
                  {uploading ? "💾 Asegurando archivos en las nubes..." : "✨ PUBLICAR PROPIEDAD"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
