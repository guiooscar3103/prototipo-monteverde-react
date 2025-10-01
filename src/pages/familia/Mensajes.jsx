import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getMensajesPorUsuario, 
  getConversacion, 
  enviarMensaje, 
  marcarComoLeido,
  getUsuariosPorRol,
  getUsuarioPorId 
} from '../../services/api';

export default function MensajesFamilia() {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Cargar conversaciones y docentes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [mensajes, usuariosDocente] = await Promise.all([
          getMensajesPorUsuario(usuario.id),
          getUsuariosPorRol('docente')
        ]);

        setDocentes(usuariosDocente);
        await procesarConversaciones(mensajes);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  const procesarConversaciones = async (mensajes) => {
    const conversacionesMap = {};
    
    for (const mensaje of mensajes) {
      const contactoId = mensaje.emisorId == usuario.id ? mensaje.receptorId : mensaje.emisorId;
      
      if (!conversacionesMap[contactoId]) {
        try {
          const contacto = await getUsuarioPorId(contactoId);
          conversacionesMap[contactoId] = {
            contacto,
            ultimoMensaje: mensaje,
            noLeidos: 0
          };
        } catch (error) {
          console.error('Error al obtener contacto:', error);
        }
      }
      
      // Contar mensajes no leídos recibidos
      if (mensaje.receptorId == usuario.id && !mensaje.leido) {
        conversacionesMap[contactoId].noLeidos++;
      }
    }
    
    setConversaciones(Object.values(conversacionesMap));
  };

  const abrirConversacion = async (contacto) => {
    setContactoSeleccionado(contacto);
    setAsunto('');
    
    try {
      const mensajes = await getConversacion(usuario.id, contacto.id);
      setConversacionActual(mensajes);
      
      // Marcar como leídos los mensajes recibidos
      const mensajesNoLeidos = mensajes.filter(m => 
        m.receptorId == usuario.id && !m.leido
      );
      
      for (const mensaje of mensajesNoLeidos) {
        await marcarComoLeido(mensaje.id);
      }
      
      // Actualizar contador de no leídos
      setConversaciones(prev => prev.map(conv => 
        conv.contacto.id === contacto.id 
          ? { ...conv, noLeidos: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error al cargar conversación:', error);
    }
  };

  const enviarNuevoMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !contactoSeleccionado) return;
    
    setEnviando(true);
    
    try {
      const mensaje = {
        emisorId: usuario.id,
        receptorId: contactoSeleccionado.id,
        rolEmisor: usuario.rol,
        rolReceptor: contactoSeleccionado.rol,
        asunto: asunto || 'Consulta familiar',
        cuerpo: nuevoMensaje.trim()
      };
      
      const mensajeEnviado = await enviarMensaje(mensaje);
      
      // Actualizar conversación actual
      setConversacionActual(prev => [...prev, mensajeEnviado]);
      
      // Limpiar formulario
      setNuevoMensaje('');
      setAsunto('');
      
      // Actualizar lista de conversaciones
      const mensajesActualizados = await getMensajesPorUsuario(usuario.id);
      await procesarConversaciones(mensajesActualizados);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Cargando mensajes...</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <h1 style={{ color: 'var(--brand)' }}>Mensajes - Familia</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '1rem', 
        height: '600px' 
      }}>
        {/* Lista de conversaciones */}
        <div className="card" style={{ padding: '1rem', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: 'var(--brand)' }}>Docentes</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
              Contactar docentes
            </h4>
            {docentes.map(docente => (
              <div
                key={`nuevo-${docente.id}`}
                onClick={() => abrirConversacion(docente)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  backgroundColor: contactoSeleccionado?.id === docente.id ? '#e8f5e8' : '#f9f9f9'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {docente.nombre}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {docente.email}
                </div>
              </div>
            ))}
          </div>
          
          {conversaciones.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
                Conversaciones activas
              </h4>
              {conversaciones.map(conv => (
                <div
                  key={conv.contacto.id}
                  onClick={() => abrirConversacion(conv.contacto)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    backgroundColor: contactoSeleccionado?.id === conv.contacto.id ? '#e8f5e8' : 'white',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {conv.contacto.nombre}
                    {conv.noLeidos > 0 && (
                      <span style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        marginLeft: '0.5rem'
                      }}>
                        {conv.noLeidos}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem' }}>
                    {conv.ultimoMensaje.cuerpo.substring(0, 50)}...
                  </div>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '0.25rem' }}>
                    {conv.ultimoMensaje.fecha}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Área de conversación */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {contactoSeleccionado ? (
            <>
              {/* Header de la conversación */}
              <div style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #eee',
                backgroundColor: '#f1f8e9'
              }}>
                <h3 style={{ margin: 0, color: 'var(--brand)' }}>
                  {contactoSeleccionado.nombre}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#666' }}>
                  {contactoSeleccionado.email}
                </p>
              </div>
              
              {/* Mensajes */}
              <div style={{ 
                flex: 1, 
                padding: '1rem', 
                overflowY: 'auto',
                maxHeight: '300px'
              }}>
                {conversacionActual.map(mensaje => (
                  <div
                    key={mensaje.id}
                    style={{
                      marginBottom: '1rem',
                      textAlign: mensaje.emisorId == usuario.id ? 'right' : 'left'
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        maxWidth: '70%',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        backgroundColor: mensaje.emisorId == usuario.id ? '#4caf50' : '#e0e0e0',
                        color: mensaje.emisorId == usuario.id ? 'white' : 'black'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '0.25rem' }}>
                        {mensaje.asunto}
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        {mensaje.cuerpo}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        marginTop: '0.5rem', 
                        opacity: 0.7 
                      }}>
                        {mensaje.fecha}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Formulario de envío */}
              <form 
                onSubmit={enviarNuevoMensaje}
                style={{ 
                  padding: '1rem', 
                  borderTop: '1px solid #eee',
                  backgroundColor: '#f1f8e9'
                }}
              >
                <input
                  type="text"
                  placeholder="Asunto del mensaje"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <textarea
                    placeholder="Escribe tu mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'none',
                      fontSize: '14px',
                      minHeight: '60px'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviarNuevoMensaje(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !nuevoMensaje.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: enviando ? '#ccc' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: enviando ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666'
            }}>
              <p>Selecciona un docente para comenzar a conversar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
