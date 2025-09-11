import Card from '../../components/Card'
import ButtonLink from '../../components/ButtonLink'

export default function FamiliaHome() {
  return (
    <div className="grid">
      <h1 style={{color:'var(--brand)'}}>Bienvenido, Carlos M.</h1>
      <p>Aquí tienes un resumen de la información académica de tu hijo/a.</p>

      

      <div className="grid grid-3">
        <Card title="Promedio General"
          action={<ButtonLink to="/familia/reporte" variant="primary">Ver boletín completo</ButtonLink>}
        >
          <div style={{fontSize:'3rem', fontWeight:800, color:'var(--brand-2)'}}>4.50</div>
          <small style={{color:'var(--muted)'}}>Último periodo: 2025-P2</small>
        </Card>

        <Card title="Último Mensaje Docente"
          action={<ButtonLink to="/familia/mensajes" variant="primary">Leer mensaje</ButtonLink>}
        >
          <div>Falta de tareas</div>
          <small style={{color:'var(--muted)'}}>Recibido hoy</small>
        </Card>

        <Card title="Noticias del Colegio">
          <ul style={{margin:0, paddingLeft:'1rem', lineHeight:1.9}}>
            <li><strong>10/09:</strong> Reunión general de padres a las 6:00 PM.</li>
            <li><strong>20/09:</strong> Salida pedagógica al museo de ciencias.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
