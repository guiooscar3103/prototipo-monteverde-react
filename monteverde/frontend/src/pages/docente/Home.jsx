import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCursos, getDocenteDashboard, getMensajes } from '../../services/api';

export default function DocenteHome() {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // =============================
        // Cargar cursos desde MySQL
        // =============================
        const cursosData = await getCursos();
        setCursos(cursosData);

        // =============================
        // Cargar datos del dashboard
        // =============================
        if (usuario?.id) {
          try {
            const dashData = await getDocenteDashboard(usuario.id);
            setDashboardData(dashData);
          } catch (err) {
            console.warn('Dashboard data no disponible, usando datos por defecto:', err);
          }

          // =============================
          // Cargar mensajes
          // =============================
          try {
            const mensajesData = await getMensajes(usuario.id);
            if (mensajesData && mensajesData.length > 0) {
              setUltimoMensaje(mensajesData[0]);
            }
          } catch (err) {
            console.warn('Mensajes no disponibles:', err);
          }
        }
        
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  // =====================================
  // Loader mientras carga la información
  // =====================================
  if (loading) {
    return (
      <div className="grid" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
        <p style={{ color: 'var(--muted)' }}>Cargando tu dashboard...</p>
      </div>
    );
  }

  // =====================================
  // Contenido principal del dashboard
  // =====================================
  return (
    <div className="grid">
      <h1 style={{ color: 'var(--brand)' }}>
        Bienvenido, {usuario?.nombre}
      </h1>
      <p>Aquí tienes un resumen de tus cursos y tareas pendientes.</p>

      <div className="grid grid-4">
        {/* ===================================================
            Tus Cursos - Conectado a MySQL
        =================================================== */}
        <Card
          title="Tus Cursos"
          action={
            <ButtonLink to="/docente/calificaciones" variant="primary">
              Ir a gestión académica
            </ButtonLink>
          }
        >
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {cursos.length > 0 ? (
              cursos.map(curso => (
                <li key={curso.id}>
                  {curso.nombre} – Matemáticas ({curso.total_estudiantes || 0} estudiantes)
                </li>
              ))
            ) : (
              <li>Cargando cursos...</li>
            )}
          </ul>
        </Card>

        {/* ===================================================
            Tareas Pendientes - Con datos reales
        =================================================== */}
        <Card title="Tareas Pendientes">
          <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.8 }}>
            {dashboardData?.tareas_pendientes ? (
              dashboardData.tareas_pendientes.map((tarea, index) => (
                <li key={index}>
                  {tarea.tipo === 'asistencia' && '📅'} 
                  {tarea.tipo === 'calificaciones' && '📝'} 
                  {tarea.tipo === 'boletines' && '📩'} 
                  {tarea.descripcion} – {tarea.curso} 
                  <strong>{tarea.urgencia === 'hoy' ? ' hoy' : ''}</strong>
                  <em>{tarea.urgencia !== 'hoy' ? ` (${tarea.urgencia})` : ''}</em>
                </li>
              ))
            ) : (
              <>
                <li>📅 Registrar asistencia – 7°B <strong>hoy</strong></li>
                <li>📝 Calificar tareas de 8°A – Matemáticas <em>(vence hoy)</em></li>
                <li>📩 Enviar boletines – 2025-P3 <em>(próximamente)</em></li>
              </>
            )}
          </ul>
        </Card>

        {/* ===================================================
            Último Mensaje - Conectado a MySQL
        =================================================== */}
        <Card 
          title="Último Mensaje" 
          action={
            <ButtonLink to="/docente/mensajes" variant="primary">
              Responder
            </ButtonLink>
          }
        >
          {ultimoMensaje ? (
            <div>
              <div>{ultimoMensaje.asunto}</div>
              <small style={{ color: 'var(--muted)' }}>
                De: {ultimoMensaje.emisor_nombre} -{' '}
                {ultimoMensaje.fecha ? new Date(ultimoMensaje.fecha).toLocaleDateString() : '—'}
              </small>
            </div>
          ) : (
            <div>
              <div>No hay mensajes nuevos</div>
              <small style={{ color: 'var(--muted)' }}>Todo al día ✅</small>
            </div>
          )}
        </Card>

        {/* ===================================================
            Accesos Rápidos
        =================================================== */}
        <Card title="Accesos Rápidos">
          <div className="grid">
            <ButtonLink to="/docente/calificaciones">✅ Gestionar Calificaciones</ButtonLink>
            <ButtonLink to="/docente/asistencia">🗓️ Registrar Asistencia</ButtonLink>
            <ButtonLink to="/docente/observador">📌 Registrar Observación</ButtonLink>
            <ButtonLink to="/docente/mensajes">💬 Mensajería</ButtonLink>
          </div>
        </Card>
      </div>

      {/* ===================================================
          Estadísticas - datos reales
      =================================================== */}
      {dashboardData?.estadisticas && (
        <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
          <div className="section-title">Tu Resumen</div>
          <div className="grid grid-3" style={{ gap: '1rem', textAlign: 'center' }}>
            <div>
              <strong style={{ color: 'var(--brand)', fontSize: '1.5rem' }}>
                {dashboardData.estadisticas.total_cursos}
              </strong>
              <br />
              <small>Cursos</small>
            </div>
            <div>
              <strong style={{ color: 'var(--blue)', fontSize: '1.5rem' }}>
                {dashboardData.estadisticas.estudiantes_total}
              </strong>
              <br />
              <small>Estudiantes</small>
            </div>
            <div>
              <strong style={{ color: 'var(--orange)', fontSize: '1.5rem' }}>
                {dashboardData.estadisticas.mensajes_no_leidos}
              </strong>
              <br />
              <small>Mensajes</small>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          Notificaciones del Colegio
      =================================================== */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-title">Notificaciones del Colegio</div>
        <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.9 }}>
          <li><strong>15/10:</strong> Reunión general de docentes a las 4:00 PM.</li>
          <li><strong>20/10:</strong> Entrega de boletines académicos (P3).</li>
          <li><strong>25/10:</strong> Salida pedagógica del grupo 8°A.</li>
        </ul>
      </div>
    </div>
  );
}
