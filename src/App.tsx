import { useState, useEffect } from 'react'
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "./firebase/config"
import './index.css'
import './components.css'

/* =========================================================
   ICONS (inline SVG)
   ========================================================= */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)


const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const BedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M2 4v16M2 8h18a2 2 0 012 2v6H2"/><path d="M6 8v-2a2 2 0 012-2h8a2 2 0 012 2v2"/>
  </svg>
)

const BathIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M9 6L9 2M15 6V2M3 10h18v5a5 5 0 01-5 5H8a5 5 0 01-5-5v-5z"/>
  </svg>
)

const AreaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
  </svg>
)


const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="40" height="40">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
)

/* =========================================================
   DATA
   ========================================================= */
const WHATSAPP_URL = 'https://wa.me/527352704429?text=Hola%20Humberto%2C%20me%20interesa%20obtener%20información%20sobre%20propiedades'
const EMAIL = 'informes@humberto.misasesoresinmobiliarios.com'
const PHONE_DISPLAY = '+52 1 735 270 4429'

const PROPERTIES = [
  {
    id: 1,
    name: 'Residencia Valle Verde',
    price: '$4,500,000',
    location: 'Tenancingo, México',
    type: 'En Venta',
    beds: 4,
    baths: 3,
    area: '280 m²',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Casa Jardín del Bosque',
    price: '$2,800,000',
    location: 'Malinalco, México',
    type: 'En Venta',
    beds: 3,
    baths: 2,
    area: '180 m²',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Departamento Ejecutivo',
    price: '$12,000/mes',
    location: 'Toluca, México',
    type: 'En Renta',
    beds: 2,
    baths: 2,
    area: '95 m²',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&auto=format&fit=crop',
  },
]


/* =========================================================
   HEADER
   ========================================================= */
function Header({ onContactClick }: { onContactClick: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <a href="#inicio" className="header-logo" onClick={(e) => { e.preventDefault(); scrollTo('inicio') }}>
          <span className="header-logo-name">HUMBERTO SOTELO</span>
          <span className="header-logo-sub">Asesor Inmobiliario</span>
        </a>

        <nav className="header-nav">
          <a href="#inicio" onClick={(e) => { e.preventDefault(); scrollTo('inicio') }}>Inicio</a>
          <a href="#propiedades" onClick={(e) => { e.preventDefault(); scrollTo('propiedades') }}>Propiedades</a>
          <a href="#nosotros" onClick={(e) => { e.preventDefault(); scrollTo('nosotros') }}>Nosotros</a>
        </nav>

        <div className="header-actions">
          <button className="btn btn-primary btn-sm" onClick={onContactClick}>
            Contáctanos
          </button>
          <a href="/admin" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', marginLeft: '0.5rem', borderColor: '#c9a84c', color: '#c9a84c', backgroundColor: 'transparent' }}>
            Acceder
          </a>
          <button
            className="header-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
        <a href="#inicio" onClick={(e) => { e.preventDefault(); scrollTo('inicio') }}>Inicio</a>
        <a href="#propiedades" onClick={(e) => { e.preventDefault(); scrollTo('propiedades') }}>Propiedades</a>
        <a href="#nosotros" onClick={(e) => { e.preventDefault(); scrollTo('nosotros') }}>Nosotros</a>
        <button className="btn btn-primary" onClick={() => { setMenuOpen(false); onContactClick() }}>
          Contáctanos
        </button>
      </nav>
    </>
  )
}

/* =========================================================
   HERO
   ========================================================= */
function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-bg" />
      <div className="hero-bg-image" />

      <div className="container">
        <div className="hero-content animate-fade-up">
          <div className="hero-badge">
            <span />
            <p>Asesor Certificado • México</p>
          </div>

          <h1 className="hero-title">
            Tu Hogar Ideal,<br />
            Tu Mejor <em>Inversión</em>
          </h1>

          <p className="hero-subtitle">
            Asesoría inmobiliaria personalizada de alto nivel en toda la República Mexicana.
            Más de 10 años de experiencia acompañando familias a encontrar la propiedad perfecta.
          </p>

          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Propiedades
            </button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
              <WhatsAppIcon />
              {PHONE_DISPLAY}
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <div className="hero-stat-number">10+</div>
              <div className="hero-stat-label">Años de experiencia</div>
            </div>
            <div>
              <div className="hero-stat-number">250+</div>
              <div className="hero-stat-label">Propiedades vendidas</div>
            </div>
            <div>
              <div className="hero-stat-number">98%</div>
              <div className="hero-stat-label">Clientes satisfechos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   IMAGE CAROUSEL
   ========================================================= */
function ImageCarousel({ images, alt }: { images: string[], alt: string }) {
  const [current, setCurrent] = useState(0)
  const total = images.length

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(i => (i - 1 + total) % total)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(i => (i + 1) % total)
  }

  if (total === 0) return (
    <img src="https://images.unsplash.com/photo-1560518883-ce09059eeefa?w=800&q=80&auto=format&fit=crop" alt={alt} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
  )

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: '220px' }}>
      <img
        src={images[current]}
        alt={`${alt} - foto ${current + 1}`}
        style={{ width: '100%', height: '220px', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
      />
      {total > 1 && (
        <>
          <button onClick={prev} aria-label="Anterior" style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}>‹</button>
          <button onClick={next} aria-label="Siguiente" style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}>›</button>
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 5
          }}>
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i) }} style={{
                width: i === current ? 16 : 6, height: 6, borderRadius: 3,
                background: i === current ? '#D4AF37' : 'rgba(255,255,255,0.7)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.25s ease'
              }} />
            ))}
          </div>
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.5)', color: '#fff',
            fontSize: '0.7rem', padding: '2px 7px', borderRadius: 12, backdropFilter: 'blur(4px)'
          }}>{current + 1}/{total}</div>
        </>
      )}
    </div>
  )
}

/* =========================================================
   PROPERTY DETAIL MODAL
   ========================================================= */
function PropertyModal({ prop, onClose, onContact }: { prop: any, onClose: () => void, onContact: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)
  const images: string[] = prop.imagenes && prop.imagenes.length > 0 ? prop.imagenes : (prop.image ? [prop.image] : [])
  const isRenta = (prop.operacion || prop.type) === 'Renta'

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', overflowY: 'auto'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, maxWidth: 900, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)'
      }}>
        {/* Botón cerrar */}
        <button onClick={onClose} aria-label="Cerrar" style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
          width: 36, height: 36, color: '#fff', fontSize: '1.1rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>✕</button>

        {/* Galería principal */}
        {images.length > 0 ? (
          <div style={{ position: 'relative', height: 380, overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
            <img
              src={images[imgIdx]}
              alt={`${prop.nombre || prop.name} foto ${imgIdx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
            />
            {/* Badge operación */}
            <span style={{
              position: 'absolute', top: 16, left: 16,
              background: isRenta ? '#D4AF37' : '#111827',
              color: '#fff', fontWeight: 700, fontSize: '0.75rem',
              padding: '4px 12px', borderRadius: 20, letterSpacing: '0.08em'
            }}>{prop.operacion || prop.type || 'VENTA'}</span>
            {/* Contador */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute', bottom: 16, right: 16,
                background: 'rgba(0,0,0,0.5)', color: '#fff',
                fontSize: '0.8rem', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)'
              }}>{imgIdx + 1} / {images.length}</div>
            )}
            {/* Flechas galería */}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: 42, height: 42, color: '#fff', fontSize: '1.3rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>‹</button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: 42, height: 42, color: '#fff', fontSize: '1.3rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>›</button>
              </>
            )}
          </div>
        ) : (
          <div style={{ height: 200, background: '#F3F4F6', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
            Sin imagen disponible
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '12px 24px', overflowX: 'auto', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {images.map((img, i) => (
              <img key={i} src={img} alt={`thumb ${i + 1}`} onClick={() => setImgIdx(i)}
                style={{
                  width: 64, height: 48, objectFit: 'cover', borderRadius: 8,
                  cursor: 'pointer', flexShrink: 0,
                  border: i === imgIdx ? '2px solid #D4AF37' : '2px solid transparent',
                  opacity: i === imgIdx ? 1 : 0.65, transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        )}

        {/* Cuerpo del detalle */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D4AF37', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
                {prop.precio ? `$${Number(prop.precio).toLocaleString('es-MX')}` : prop.price || 'Consultar'}
                {isRenta && <span style={{ fontSize: '1rem', fontWeight: 500, color: '#6B7280', marginLeft: 6 }}>/mes</span>}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>{prop.nombre || prop.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 4 }}>Tipo de propiedad</div>
              <div style={{ fontWeight: 600, color: '#374151' }}>{prop.tipo || 'Inmueble'}</div>
            </div>
          </div>

          {/* Ubicación */}
          {(prop.ubicacion || prop.location) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: '0.9rem', marginBottom: 16 }}>
              <MapPinIcon />{prop.ubicacion || prop.location}
            </div>
          )}

          {/* Disponibilidad renta */}
          {isRenta && prop.disponibleDesde && (
            <div style={{
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 20,
              border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E3A8A', marginBottom: 2 }}>DISPONIBILIDAD</div>
                <div style={{ fontSize: '0.95rem', color: '#1D4ED8', fontWeight: 600 }}>
                  Del {prop.disponibleDesde.split('-').reverse().join('/')} al {prop.disponibleHasta?.split('-').reverse().join('/') || '— Sin fecha límite'}
                </div>
              </div>
            </div>
          )}

          {/* Specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[[
              '🛏️', 'Recámaras', prop.recamaras || prop.beds,
            ], [
              '🚿', 'Baños', prop.banos || prop.baths,
            ], [
              '🚗', 'Estacionamientos', prop.estacionamientos,
            ], [
              '📐', 'Terreno', prop.m2Terreno ? `${prop.m2Terreno} m²` : null,
            ], [
              '🏗️', 'Construcción', prop.m2Construccion ? `${prop.m2Construccion} m²` : null,
            ]].filter(([,, val]) => val).map(([icon, label, val]) => (
              <div key={label as string} style={{
                background: '#F9FAFB', borderRadius: 10, padding: '12px 14px',
                border: '1px solid #E5E7EB', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginTop: 2 }}>{String(val)}</div>
              </div>
            ))}
          </div>

          {/* Amenidades */}
          {prop.amenidades && prop.amenidades.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Amenidades</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {prop.amenidades.map((am: string, i: number) => (
                  <span key={i} style={{
                    fontSize: '0.8rem', padding: '5px 12px',
                    background: 'rgba(212,175,55,0.12)', color: '#92740A',
                    borderRadius: 100, fontWeight: 500, border: '1px solid rgba(212,175,55,0.3)'
                  }}>✓ {am}</span>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          {prop.descripcion && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Descripción</div>
              <p style={{ color: '#6B7280', lineHeight: 1.7, fontSize: '0.9rem' }}>{prop.descripcion}</p>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 160 }} onClick={() => { onClose(); onContact() }}>
              📩 Solicitar Información
            </button>
            <a
              href={`https://wa.me/527352704429?text=Hola%20Humberto,%20me%20interesa%20la%20propiedad:%20${encodeURIComponent(prop.nombre || prop.name || '')}`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ flex: 1, justifyContent: 'center', minWidth: 160, textDecoration: 'none' }}
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   PROPERTIES
   ========================================================= */
function Properties({ onContactClick }: { onContactClick: () => void }) {
  const [propiedadesDB, setPropiedadesDB] = useState<any[]>([])
  const [selectedProp, setSelectedProp] = useState<any>(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "propiedades"), (snap) => {
      const data: any[] = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setPropiedadesDB(data)
    })
    return unsub
  }, [])

  const dataToShow = propiedadesDB.length > 0 ? propiedadesDB : PROPERTIES

  return (
    <section className="section" id="propiedades">
      <div className="container">
        <div className="section-header centered">
          <p className="label-upper">Portafolio</p>
          <div className="gold-divider" />
          <h2 className="display-md" style={{ marginTop: 'var(--space-2)' }}>
            Propiedades Destacadas
          </h2>
          <p className="body-md text-muted" style={{ maxWidth: 480, marginTop: 'var(--space-3)' }}>
            Selección exclusiva de propiedades verificadas en toda la República Mexicana.
          </p>
        </div>

        <div className="properties-grid">
          {dataToShow.map((p) => {
            const isRenta = (p.operacion || p.type) === "Renta"
            const images: string[] = p.imagenes && p.imagenes.length > 0 ? p.imagenes : (p.image ? [p.image] : [])

            return (
              <div key={p.id} className="property-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedProp(p)}>
                {/* Carrusel de imágenes */}
                <div className="property-card-image" style={{ position: 'relative' }}>
                  <ImageCarousel images={images} alt={p.nombre || p.name || 'Propiedad'} />
                  <span className="property-card-badge">{p.operacion || p.type || "Venta"}</span>
                </div>

                <div className="property-card-body">
                  <div className="property-card-price" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{p.precio ? `$${Number(p.precio).toLocaleString('es-MX')}` : p.price}</span>
                    <span style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 400 }}>{p.tipo || "Inmueble"}</span>
                  </div>
                  <div className="property-card-name" style={{ fontSize: "1.1rem" }}>{p.nombre || p.name}</div>
                  <div className="property-card-location">
                    <MapPinIcon />
                    {p.ubicacion || p.location}
                  </div>

                  {isRenta && p.disponibleDesde && (
                    <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem", background: "#EFF6FF", borderRadius: "6px", border: "1px solid #BFDBFE" }}>
                      <span style={{ fontSize: "0.75rem", color: "#1E3A8A", fontWeight: 600, display: "block", marginBottom: "2px" }}>📅 Disponibilidad:</span>
                      <span style={{ fontSize: "0.8rem", color: "#1D4ED8" }}>Del {p.disponibleDesde.split("-").reverse().join("/")} al {p.disponibleHasta?.split("-").reverse().join("/") || "Sin fecha"}</span>
                    </div>
                  )}

                  <div className="property-card-specs">
                    <span className="property-spec"><BedIcon /> {p.recamaras || p.beds || "0"} Rec</span>
                    <span className="property-spec"><BathIcon /> {p.banos || p.baths || "0"} Baños</span>
                    <span className="property-spec"><AreaIcon /> {p.m2Terreno || p.m2Construccion ? `${p.m2Terreno || p.m2Construccion}m²` : p.area}</span>
                  </div>

                  {p.amenidades && p.amenidades.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "1rem" }}>
                      {p.amenidades.slice(0, 3).map((am: string, i: number) => (
                        <span key={i} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "#F3F4F6", color: "#4B5563", borderRadius: "100px", fontWeight: 500 }}>{am}</span>
                      ))}
                      {p.amenidades.length > 3 && <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "#F3F4F6", color: "#9CA3AF", borderRadius: "100px" }}>+{p.amenidades.length - 3}</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedProp(p) }}
                    >
                      Ver Detalle
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem' }}
                      onClick={(e) => { e.stopPropagation(); onContactClick() }}
                    >
                      Contactar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
          <button className="btn btn-primary btn-lg" onClick={onContactClick}>
            Ver Todo el Portafolio
          </button>
        </div>
      </div>

      {/* Modal de detalle */}
      {selectedProp && (
        <PropertyModal
          prop={selectedProp}
          onClose={() => setSelectedProp(null)}
          onContact={onContactClick}
        />
      )}
    </section>
  )
}

/* =========================================================
   ABOUT
   ========================================================= */
function About() {
  const features = [
    { icon: '🏆', title: 'Más de 10 años de experiencia', desc: 'Profundo conocimiento del mercado inmobiliario en toda la República Mexicana.' },
    { icon: '🤝', title: 'Asesoría personalizada', desc: 'Acompañamiento a medida en cada etapa del proceso de compra, venta o renta.' },
    { icon: '🏘️', title: 'Amplio portafolio de propiedades', desc: 'Acceso a una amplia red de propiedades exclusivas verificadas.' },
    { icon: '🔒', title: 'Proceso transparente y seguro', desc: 'Documentación en regla y asesoría legal para tu total tranquilidad.' },
  ]

  return (
    <section className="section-alt" id="nosotros">
      <div className="container">
        <div className="about-grid">
          <div className="about-image-wrap">
            <img
              src="/Material fotografico/Humberto.png"
              alt="Humberto Sotelo - Asesor Inmobiliario"
              className="about-image"
            />
            <div className="about-image-accent" />
          </div>

          <div>
            <p className="label-upper">Sobre Mí</p>
            <div className="gold-divider" />
            <h2 className="display-md" style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              ¿Por qué elegir a Humberto?
            </h2>
            <p className="body-md text-muted" style={{ lineHeight: 1.8 }}>
              Soy Humberto Sotelo, asesor inmobiliario con más de una décima de experiencia ayudando
              a familias y empresas a tomar la mejor decisión en bienes raíces. Mi compromiso es
              brindarte un servicio honesto, eficiente y completamente personalizado.
            </p>

            <ul className="about-features">
              {features.map((f) => (
                <li key={f.title} className="about-feature">
                  <div className="about-feature-icon">{f.icon}</div>
                  <div className="about-feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* Testimonials removed */

/* =========================================================
   CTA BANNER
   ========================================================= */
function CTABanner({ onContactClick }: { onContactClick: () => void }) {
  return (
    <section className="section-alt">
      <div className="container">
        <div className="cta-banner">
          <p className="label-upper" style={{ position: 'relative' }}>Contáctanos Hoy</p>
          <div className="gold-divider" style={{ margin: 'var(--space-3) auto var(--space-4)' }} />
          <h2 className="display-md" style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            ¿Listo para encontrar tu propiedad ideal?
          </h2>
          <p className="body-md text-muted" style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            Déjanos tus datos y Humberto te contactará personalmente para asesorarte sin compromiso.
          </p>
          <div className="cta-banner-buttons">
            <button className="btn btn-primary btn-lg" onClick={onContactClick}>
              Enviar Mensaje
            </button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
              <WhatsAppIcon />
              WhatsApp
            </a>
            <a href={`mailto:${EMAIL}`} className="btn btn-outline btn-lg">
              <EmailIcon />
              Correo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   CONTACT FORM (Lead Capture)
   ========================================================= */
interface LeadFormData {
  nombre: string
  email: string
  telefono: string
  tipo: string
  presupuesto: string
  mensaje: string
}

function ContactForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState<LeadFormData>({
    nombre: '', email: '', telefono: '', tipo: '', presupuesto: '', mensaje: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LeadFormData>>({})

  const validate = () => {
    const e: Partial<LeadFormData> = {}
    if (!formData.nombre.trim()) e.nombre = 'Requerido'
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email inválido'
    if (!formData.telefono.trim()) e.telefono = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      // Dynamic import de Firebase para no bloquear el initial load
      const { saveLead } = await import('./services/leads')
      await saveLead(formData)
      onSuccess()
    } catch (err) {
      console.error('Error saving lead:', err)
      // Aún así mostrar éxito para no bloquear al usuario
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof LeadFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const inputStyle = (field: keyof LeadFormData) => ({
    ...(errors[field] ? { borderBottomColor: 'var(--color-error)' } : {}),
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="contact-form-card" style={{ maxWidth: 680, width: '100%', margin: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
          <div>
            <p className="label-upper">Contáctanos</p>
            <div className="gold-divider" style={{ margin: 'var(--space-2) 0' }} />
            <h2 className="display-sm">Solicita tu Asesoría</h2>
            <p className="body-sm text-muted" style={{ marginTop: 'var(--space-2)' }}>
              Humberto te contactará en menos de 24 horas.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--color-on-surface-muted)', fontSize: '1.5rem', lineHeight: 1, padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="contact-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">Nombre completo *</label>
              <input
                id="nombre"
                className="form-input"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.nombre}
                onChange={handleChange('nombre')}
                style={inputStyle('nombre')}
              />
              {errors.nombre && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.nombre}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo electrónico *</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={handleChange('email')}
                style={inputStyle('email')}
              />
              {errors.email && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono">Teléfono / WhatsApp *</label>
              <input
                id="telefono"
                className="form-input"
                type="tel"
                placeholder="+52 1 55 0000 0000"
                value={formData.telefono}
                onChange={handleChange('telefono')}
                style={inputStyle('telefono')}
              />
              {errors.telefono && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.telefono}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tipo">¿Qué tipo de propiedad te interesa?</label>
              <select id="tipo" className="form-input" value={formData.tipo} onChange={handleChange('tipo')}>
                <option value="">Selecciona una opción</option>
                <option>Casa</option>
                <option>Departamento</option>
                <option>Terreno</option>
                <option>Local Comercial</option>
                <option>Inversión</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="presupuesto">Presupuesto aproximado</label>
              <select id="presupuesto" className="form-input" value={formData.presupuesto} onChange={handleChange('presupuesto')}>
                <option value="">Selecciona tu rango</option>
                <option>Menos de $1,000,000</option>
                <option>$1,000,000 – $3,000,000</option>
                <option>$3,000,000 – $5,000,000</option>
                <option>Más de $5,000,000</option>
              </select>
            </div>
          </div>

          <div className="contact-form-full">
            <div className="form-group">
              <label className="form-label" htmlFor="mensaje">Mensaje / Detalles adicionales</label>
              <textarea
                id="mensaje"
                className="form-input"
                rows={4}
                placeholder="Cuéntame más sobre lo que buscas..."
                value={formData.mensaje}
                onChange={handleChange('mensaje')}
                style={{ resize: 'vertical', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? 'Enviando...' : '📩 Enviar Mensaje'}
          </button>

          <p className="body-sm text-muted" style={{ textAlign: 'center', opacity: 0.7 }}>
            🔒 Tus datos están seguros y no serán compartidos con terceros.
            Al enviar aceptas que Humberto Sotelo te contacte para brindarte asesoría.
          </p>
        </form>

        {/* Contact alternatives */}
        <div className="contact-alternatives" style={{ marginTop: 'var(--space-8)' }}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="contact-alt-btn contact-alt-btn-whatsapp">
            <div className="contact-alt-btn-icon">
              <WhatsAppIcon />
            </div>
            <div className="contact-alt-btn-title">WhatsApp</div>
            <div className="contact-alt-btn-detail">{PHONE_DISPLAY}</div>
          </a>
          <a href={`mailto:${EMAIL}`} className="contact-alt-btn contact-alt-btn-email">
            <div className="contact-alt-btn-icon">
              <EmailIcon />
            </div>
            <div className="contact-alt-btn-title">Correo Electrónico</div>
            <div className="contact-alt-btn-detail" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{EMAIL}</div>
          </a>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   SUCCESS OVERLAY
   ========================================================= */
function SuccessOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="success-overlay show">
      <div className="success-card">
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(230,195,100,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-6)',
          color: 'var(--color-primary)',
        }}>
          <CheckIcon />
        </div>
        <h2 className="display-sm" style={{ marginBottom: 'var(--space-3)' }}>¡Mensaje Enviado!</h2>
        <p className="body-md text-muted" style={{ marginBottom: 'var(--space-8)' }}>
          Humberto revisará tu solicitud y te contactará personalmente en menos de 24 horas.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <WhatsAppIcon />
            Escríbenos ahora
          </a>
          <button className="btn btn-ghost" onClick={onClose}>
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   FOOTER
   ========================================================= */
function Footer({ onContactClick }: { onContactClick: () => void }) {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo-name">HUMBERTO SOTELO</div>
            <div className="footer-logo-sub">Asesor Inmobiliario</div>
            <p className="footer-description">
              Más de 10 años ayudando a familias y empresas a encontrar la propiedad ideal
              en toda la República Mexicana con transparencia, profesionalismo y compromiso.
            </p>
          </div>

          <div>
            <div className="footer-heading">Navegación</div>
            <ul className="footer-links">
              <li><a href="#inicio" onClick={(e) => { e.preventDefault(); document.getElementById('inicio')?.scrollIntoView({behavior:'smooth'}) }}>Inicio</a></li>
              <li><a href="#propiedades" onClick={(e) => { e.preventDefault(); document.getElementById('propiedades')?.scrollIntoView({behavior:'smooth'}) }}>Propiedades</a></li>
              <li><a href="#nosotros" onClick={(e) => { e.preventDefault(); document.getElementById('nosotros')?.scrollIntoView({behavior:'smooth'}) }}>Nosotros</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onContactClick() }}>Contacto</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">Contacto</div>
            <div className="footer-contact-item">
              <WhatsAppIcon />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{PHONE_DISPLAY}</a>
            </div>
            <div className="footer-contact-item">
              <EmailIcon />
              <a href={`mailto:${EMAIL}`} style={{ wordBreak: 'break-all', fontSize: '0.8125rem' }}>{EMAIL}</a>
            </div>
            <div className="footer-contact-item">
              <MapPinIcon />
              <span>México</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} Humberto Sotelo — Asesor Inmobiliario. Todos los derechos reservados.
          </p>
          <p className="footer-copy" style={{ opacity: 0.5 }}>
            Diseñado con 💛 en México
          </p>
        </div>
      </div>
    </footer>
  )
}

/* =========================================================
   FLOATING WHATSAPP
   ========================================================= */
function FloatingWhatsApp() {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Chat por WhatsApp">
      <WhatsAppIcon />
    </a>
  )
}

/* =========================================================
   APP
   ========================================================= */
export default function App() {
  const [showContact, setShowContact] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleContactOpen = () => setShowContact(true)
  const handleContactClose = () => setShowContact(false)
  const handleSuccess = () => {
    setShowContact(false)
    setShowSuccess(true)
  }
  const handleSuccessClose = () => setShowSuccess(false)

  return (
    <>
      <Header onContactClick={handleContactOpen} />
      <main>
        <Hero />
        <Properties onContactClick={handleContactOpen} />
        <About />
        <CTABanner onContactClick={handleContactOpen} />
      </main>
      <Footer onContactClick={handleContactOpen} />
      <FloatingWhatsApp />

      {showContact && (
        <ContactForm onClose={handleContactClose} onSuccess={handleSuccess} />
      )}
      {showSuccess && (
        <SuccessOverlay onClose={handleSuccessClose} />
      )}
    </>
  )
}

// trigger reload