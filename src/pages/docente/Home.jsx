import Card from '../../components/Card'
import ButtonLink from '../../components/ButtonLink'

export default function DocenteHome() {
  return (
    <div className="grid">
      <h1 style={{color:'var(--brand)'}}>Bienvenido, María R.</h1>
      <p>Aquí tienes un resumen de tus cursos y tareas pendientes.</p>

      <div className="grid grid-4">
        <Card
          title="Tus Cursos"
          action={<ButtonLink to="/docente/calificaciones" variant="primary">Ir a gestión académica</ButtonLink>}
        >
          <ul style={{margin:0, paddingLeft:'1rem'}}>
            <li>7°B – Matemáticas (28 estudiantes)</li>
          </ul>
        </Card>

        <Card title="Tareas Pendientes">
          <ul style={{margin:0, paddingLeft:'1rem', lineHeight:1.8}}>
            <li>📅 Registrar asistencia – 7°B <strong>hoy</strong></li>
            <li>📝 Calificar tareas de 8°A – Matemáticas <em>(vence hoy)</em></li>
            <li>📩 Enviar boletines – 2025-P2 <em>(próximamente)</em></li>
          </ul>
        </Card>

        <Card title="Último Mensaje Docente" action={<ButtonLink to="/docente/mensajes" variant="primary">Responder</ButtonLink>}>
          <div>Falta de tareas</div>
          <small style={{color:'var(--muted)'}}>Recibido hoy</small>
        </Card>

        <Card title="Accesos Rápidos">
          <div className="grid">
            <ButtonLink to="/docente/calificaciones">✅ Gestionar Calificaciones</ButtonLink>
            <ButtonLink to="/docente/asistencia">🗓️ Registrar Asistencia</ButtonLink>
            <ButtonLink to="/docente/observador">📌 Registrar Observación</ButtonLink>
            <ButtonLink to="/docente/mensajes">💬 Mensajería</ButtonLink>
          </div>
        </Card>
      </div>

      <div className="card" style={{marginTop:'1rem'}}>
        <div className="section-title">Notificaciones del Colegio</div>
        <ul style={{margin:0, paddingLeft:'1rem', lineHeight:1.9}}>
          <li><strong>10/09:</strong> Reunión general de docentes a las 4:00 PM.</li>
          <li><strong>15/09:</strong> Entrega de boletines académicos (P2).</li>
          <li><strong>20/09:</strong> Salida pedagógica del grupo 8°A.</li>
        </ul>
      </div>
    </div>
  )
}
