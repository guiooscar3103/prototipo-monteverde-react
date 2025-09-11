
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import DocenteLayout from './layouts/DocenteLayout.jsx'
import FamiliaLayout from './layouts/FamiliaLayout.jsx'
import DocenteHome from './pages/docente/Home.jsx'
import RegistroCalificaciones from './pages/docente/RegistroCalificaciones.jsx'
import Asistencia from './pages/docente/Asistencia.jsx'
import ObservadorAlumno from './pages/docente/ObservadorAlumno.jsx'
import MensajesDocente from './pages/docente/Mensajes.jsx'   // <- placeholder/módulo
import FamiliaHome from './pages/familia/Home.jsx'
import ReporteAcademico from './pages/familia/ReporteAcademico.jsx'
import MensajesFamilia from './pages/familia/Mensajes.jsx'   // <- placeholder/módulo

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 * Configura todas las rutas y la navegación del sistema educativo
 * Estructura: Login → Rutas por rol (Docente/Familia) → Redirección 404
 */
export default function App() {
  return (
    <Routes>
      {/* RUTA DE AUTENTICACIÓN */}
      <Route path="/" element={<Login />} />

      {/* MÓDULO DOCENTE - Rutas anidadas con layout específico */}
      <Route path="/docente" element={<DocenteLayout />}>
        <Route index element={<DocenteHome />} />
        <Route path="calificaciones" element={<RegistroCalificaciones />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="observador" element={<ObservadorAlumno />} />
        <Route path="mensajes" element={<MensajesDocente />} />
      </Route>

      {/* MÓDULO FAMILIA - Rutas anidadas con layout específico */}
      <Route path="/familia" element={<FamiliaLayout />}>
        <Route index element={<FamiliaHome />} />
        <Route path="reporte" element={<ReporteAcademico />} />
        <Route path="mensajes" element={<MensajesFamilia />} />
      </Route>

      {/* MANEJO DE RUTAS NO ENCONTRADAS */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
