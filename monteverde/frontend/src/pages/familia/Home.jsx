import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import BarraTitulo from '../../components/BarraTitulo';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getFamiliaDashboard, getMensajesPorUsuario } from '../../services/api';

export default function FamiliaHome() {
  const { usuario } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?.id) {
        setMensaje('⚠️ Usuario no disponible');
        setLoading(false);
        return;
      }

      try {
        console.log('🏠 Cargando dashboard familiar para usuario:', usuario.id);
        
        const [dashboard, mensajes] = await Promise.all([
          getFamiliaDashboard(usuario.id),
          getMensajesPorUsuario(usuario.id).catch(err => {
            console.warn('No se pudieron cargar mensajes:', err);
            return [];
          })
        ]);
        
        console.log('🏠 Dashboard cargado:', dashboard);
        console.log('📧 Mensajes cargados:', mensajes);
        
        setDashboardData(dashboard);
        
        // Obtener último mensaje recibido
        if (mensajes && mensajes.length > 0) {
          const mensajesRecibidos = mensajes.filter(m => m.receptor_id === usuario.id);
          if (mensajesRecibidos.length > 0) {
            setUltimoMensaje(mensajesRecibidos[0]);
          }
        }
        
      } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);
        setMensaje('❌ Error al cargar información: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuario]);

  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Bienvenido" subtitulo="Cargando información..." />
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p>Cargando datos familiares...</p>
        </div>
      </div>
    );
  }

  const primerHijo = dashboardData?.hijos?.[0];
  const promedioGeneral = dashboardData?.hijos?.length > 0 
    ? (dashboardData.hijos.reduce((sum, hijo) => sum + (parseFloat(hijo.promedio) || 0), 0) / dashboardData.hijos.length)
    : 0;

  return (
    <div className="grid">
      <BarraTitulo 
        titulo={`¡Bienvenido, ${usuario?.nombre}!`}
        subtitulo="Información académica de tu familia"
        derecha={
          <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
            {dashboardData && (
              <>
                <div><strong>{dashboardData.total_hijos}</strong> {dashboardData.total_hijos === 1 ? 'hijo' : 'hijos'}</div>
                <div>Promedio familiar: <strong>{promedioGeneral.toFixed(1)}</strong></div>
              </>
            )}
          </div>
        }
      />

      {/* Mostrar mensajes de error */}
      {mensaje && (
        <div style={{ 
          padding: '0.75rem 1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      {/* Resumen de hijos */}
      {dashboardData?.hijos?.length > 0 ? (
        <>
          <div className="grid grid-3">
            {/* Promedio General */}
            <Card
              title="Promedio Familiar"
              action={<ButtonLink to="/familia/reporte" variant="primary">Ver boletín completo</ButtonLink>}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-2)' }}>
                {promedioGeneral.toFixed(1)}
              </div>
              <small style={{ color: 'var(--muted)' }}>
                Basado en {dashboardData.hijos.reduce((sum, h) => sum + (h.total_notas || 0), 0)} evaluaciones
              </small>
            </Card>

            {/* Mensajes */}
            <Card
              title="Comunicación Docente"
              action={<ButtonLink to="/familia/mensajes" variant="primary">Ver mensajes</ButtonLink>}
            >
              {ultimoMensaje ? (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📧 {ultimoMensaje.asunto}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {ultimoMensaje.cuerpo.substring(0, 80)}...
                  </div>
                  <small style={{ color: 'var(--muted)' }}>
                    {new Date(ultimoMensaje.fecha).toLocaleDateString('es-ES')}
                  </small>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                  <div>No hay mensajes recientes</div>
                  <small style={{ color: 'var(--muted)' }}>Contacta con el docente</small>
                </div>
              )}
            </Card>

            {/* Asistencia */}
            <Card
              title="Asistencia General"
              action={<ButtonLink to="/familia/asistencia" variant="primary">Ver detalle</ButtonLink>}
            >
              {primerHijo && primerHijo.asistencia_porcentaje !== undefined ? (
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#28a745' }}>
                    {parseFloat(primerHijo.asistencia_porcentaje || 0).toFixed(0)}%
                  </div>
                  <small style={{ color: 'var(--muted)' }}>
                    {primerHijo.dias_presentes || 0} de {primerHijo.total_dias || 0} días este mes
                  </small>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                  <div>Sin datos de asistencia</div>
                  <small style={{ color: 'var(--muted)' }}>Información próximamente</small>
                </div>
              )}
            </Card>
          </div>

          {/* Lista de hijos */}
          <Card title="Resumen por Estudiante">
            <div className="grid" style={{ gap: '1rem' }}>
              {dashboardData.hijos.map(hijo => (
                <div 
                  key={hijo.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--brand)' }}>
                        👨‍🎓 {hijo.nombre}
                      </h3>
                      <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        {hijo.curso} - {hijo.grado}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-2)' }}>
                        {parseFloat(hijo.promedio || 0).toFixed(1)}
                      </div>
                      <small style={{ color: '#666' }}>Promedio</small>
                    </div>
                  </div>
                  
                  <div className="grid grid-3" style={{ gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                      <strong>{hijo.total_notas || 0}</strong><br />
                      <small>📝 Evaluaciones</small>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                      <strong>{parseFloat(hijo.asistencia_porcentaje || 0).toFixed(0)}%</strong><br />
                      <small>✅ Asistencia</small>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                      <strong>{hijo.observaciones_mes || 0}</strong><br />
                      <small>📋 Observaciones</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍👩‍👧‍👦</div>
            <h3>No se encontraron estudiantes</h3>
            <p>No hay estudiantes asociados a esta cuenta familiar.</p>
            <small>Contacta con la institución para vincular los estudiantes a tu cuenta.</small>
          </div>
        </Card>
      )}

      {/* Noticias del colegio */}
      <Card title="📢 Noticias del Colegio">
        <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.9 }}>
          <li><strong>20/10:</strong> Reunión general de padres a las 6:00 PM en el auditorio.</li>
          <li><strong>25/10:</strong> Salida pedagógica al museo de ciencias naturales.</li>
          <li><strong>30/10:</strong> Celebración del día de los niños - jornada especial.</li>
          <li><strong>05/11:</strong> Entrega de boletines del segundo período.</li>
        </ul>
      </Card>
    </div>
  );
}
