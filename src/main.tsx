import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import App from "./App"
import AdminLogin from "./admin/AdminLogin"
import AdminLayout from "./admin/AdminLayout"
import Propiedades from "./admin/Propiedades"
import Leads from "./admin/Leads"
import "./index.css"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C" }}>Cargando...</div>
  if (!user) return <Navigate to="/admin" replace />
  return <>{children}</>
}

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin">
          <Route index element={<AdminLogin />} />
          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route path="propiedades" element={<Propiedades />} />
            <Route path="leads" element={<Leads />} />
          </Route>
        </Route>
        <Route path="*" element={
          <div style={{ background: "blue", color: "white", padding: "2rem", minHeight: "100vh" }}>
            <h1>ERROR DE RUTA O NO ENCONTRADA</h1>
            <p>Pathname actual detectado por el router: {window.location.pathname}</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

import React from "react"
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "red", color: "white", minHeight: "100vh" }}>
          <h1>Error de React</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>
)
