import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import { 
  getMensajesPorUsuario, 
  getConversacion, 
  enviarMensaje, 
  marcarComoLeido,
  getUsuariosPorRol,
  getUsuarioPorId 
} from '../../services/api';

export default function MensajesDocente() {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [familias, setFamilias] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar conversaciones y familias
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        console.log('📧 Cargando mensajes para usuario:', usuario?.id);
        
        const [mensajes, usuariosFamilia] = await Promise.all([
          getMensajesPorUsuario(usuario.id),
          getUsuariosPorRol('familia')
        ]);

        console.log('📧 Mensajes obtenidos:', mensajes);
        console.log('👨‍👩‍👧‍👦 Familias obtenidas:', usuariosFamilia);

        setFamilias(usuariosFamilia);
        await procesarConversaciones(mensajes);
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        setMensaje('❌ Error al cargar mensajes: ' + error.message);
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
          console.error('❌ Error al obtener contacto:', error);
          continue;
        }
      }
      
      // Contar mensajes no leídos recibidos
      if (mensaje.receptorId == usuario.id && !mensaje.leido) {
        conversacionesMap[contactoId].noLeidos++;
      }
      
      // Mantener el mensaje más reciente
      if (!conversacionesMap[contactoId].ultimoMensaje || 
          new Date(mensaje.fecha) > new Date(conversacionesMap[contactoId].ultimoMensaje.fecha)) {
        conversacionesMap[contactoId].ultimoMensaje = mensaje;
      }
    }
    
    setConversaciones(Object.values(conversacionesMap).sort((a, b) => 
      new Date(b.ultimoMensaje.fecha) - new Date(a.ultimoMensaje.fecha)
    ));
  };

  const abrirConversacion = async (contacto) => {
    setContactoSeleccionado(contacto);
    setAsunto('');
    
    try {
      console.log('💬 Abriendo conversación con:', contacto.nombre);
      
      const mensajes = await getConversacion(usuario.id, contacto.id);
      console.log('💬 Mensajes de conversación:', mensajes);
      
      setConversacionActual(mensajes);
      
      // Marcar como leídos los mensajes recibidos
      const mensajesNoLeidos = mensajes.filter(m => 
        m.receptorId == usuario.id && !m.leido
      );
      
      for (const mensajeNoLeido of mensajesNoLeidos) {
        await marcarComoLeido(mensajeNoLeido.id);
      }
      
      // Actualizar contador de no leídos
      setConversaciones(prev => prev.map(conv => 
        conv.contacto.id === contacto.id 
          ? { ...conv, noLeidos: 0 }
          : conv
      ));
    } catch (error) {
      console.error('❌ Error al cargar conversación:', error);
      setMensaje('❌ Error al cargar conversación: ' + error.message);
    }
  };

  const enviarNuevoMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !contactoSeleccionado) return;
    
    setEnviando(true);
    setMensaje('');
    
    try {
      const mensajeData = {
        emisorId: usuario.id,
        receptorId: contactoSeleccionado.id,
        asunto: asunto || 'Mensaje del docente',
        cuerpo: nuevoMensaje.trim()
      };
      
      console.log('📤 Enviando mensaje:', mensajeData);
      
      const mensajeEnviado = await enviarMensaje(mensajeData);
      console.log('✅ Mensaje enviado:', mensajeEnviado);
      
      // Actualizar conversación actual
      setConversacionActual(prev => [...prev, mensajeEnviado]);
      
      // Limpiar formulario
      setNuevoMensaje('');
      setAsunto('');
      
      // Actualizar lista de conversaciones
      const mensajesActualizados = await getMensajesPorUsuario(usuario.id);
      await procesarConversaciones(mensajesActualizados);
      
      setMensaje('✅ Mensaje enviado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      setMensaje('❌ Error al enviar mensaje: ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Mensajes" subtitulo="Cargando..." />
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Cargando mensajes...</p>
          </div>
        </Card>
      </div>
    );
  }

  const totalNoLeidos = conversaciones.reduce((sum, conv) => sum + conv.noLeidos, 0);

  return (
    <div className="grid">
      <BarraTitulo 
        titulo="Mensajes" 
        subtitulo="Comunicación con familias"
        derecha={
          <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
            <div><strong>{conversaciones.length}</strong> conversaciones</div>
            {totalNoLeidos > 0 && (
              <div style={{ color: '#dc3545' }}>
                <strong>{totalNoLeidos}</strong> no leídos
              </div>
            )}
          </div>
        }
      />

      {/* Mensajes de estado */}
      {mensaje && (
        <div style={{ 
          padding: '0.75rem 1rem',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
          color: mensaje.includes('✅') ? '#155724' : '#721c24',
          border: '1px solid',
          borderColor: mensaje.includes('✅') ? '#c3e6cb' : '#f5c6cb',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '350px 1fr', 
        gap: '1rem', 
        height: '70vh'
      }}>
        {/* Lista de conversaciones */}
        <Card title="Contactos" style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
          {/* Familias disponibles */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              💬 Nuevas conversaciones ({familias.length})
            </h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {familias.map(familia => (
                <div
                  key={`nuevo-${familia.id}`}
                  onClick={() => abrirConversacion(familia)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    backgroundColor: contactoSeleccionado?.id === familia.id ? '#e3f2fd' : '#f9f9f9',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    👨‍👩‍👧‍👦 {familia.nombre}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    {familia.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Conversaciones activas */}
          {conversaciones.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                💭 Conversaciones activas ({conversaciones.length})
              </h4>
              {conversaciones.map(conv => (
                <div
                  key={conv.contacto.id}
                  onClick={() => abrirConversacion(conv.contacto)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid',
                    borderColor: contactoSeleccionado?.id === conv.contacto.id ? '#2196f3' : '#ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    backgroundColor: contactoSeleccionado?.id === conv.contacto.id ? '#e3f2fd' : 'white',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      👨‍👩‍👧‍👦 {conv.contacto.nombre}
                    </div>
                    {conv.noLeidos > 0 && (
                      <span style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {conv.noLeidos}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                    📧 {conv.ultimoMensaje.asunto}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                    {conv.ultimoMensaje.cuerpo.substring(0, 60)}
                    {conv.ultimoMensaje.cuerpo.length > 60 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#999' }}>
                    🕐 {new Date(conv.ultimoMensaje.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        {/* Área de conversación */}
        <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {contactoSeleccionado ? (
            <>
              {/* Header de la conversación */}
              <div style={{ 
                padding: '1rem', 
                borderBottom: '2px solid #eee',
                backgroundColor: '#f8f9fa'
              }}>
                <h3 style={{ margin: 0, color: 'var(--brand)', fontSize: '1.2rem' }}>
                  💬 Conversación con {contactoSeleccionado.nombre}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  📧 {contactoSeleccionado.email} • 👤 {contactoSeleccionado.rol}
                </p>
              </div>
              
              {/* Mensajes */}
              <div style={{ 
                flex: 1, 
                padding: '1rem', 
                overflowY: 'auto',
                backgroundColor: '#fafafa'
              }}>
                {conversacionActual.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    padding: '2rem',
                    fontSize: '0.9rem'
                  }}>
                    💭 No hay mensajes aún. ¡Envía el primero!
                  </div>
                ) : (
                  conversacionActual.map(mensajeItem => (
                    <div
                      key={mensajeItem.id}
                      style={{
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: mensajeItem.emisorId == usuario.id ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '1rem',
                          borderRadius: '16px',
                          backgroundColor: mensajeItem.emisorId == usuario.id ? '#2196f3' : '#ffffff',
                          color: mensajeItem.emisorId == usuario.id ? 'white' : 'black',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: mensajeItem.emisorId != usuario.id ? '1px solid #e0e0e0' : 'none'
                        }}
                      >
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.85rem', 
                          marginBottom: '0.5rem',
                          opacity: 0.9
                        }}>
                          📧 {mensajeItem.asunto}
                        </div>
                        <div style={{ 
                          fontSize: '0.95rem', 
                          lineHeight: '1.4',
                          marginBottom: '0.5rem'
                        }}>
                          {mensajeItem.cuerpo}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          opacity: 0.7,
                          textAlign: 'right'
                        }}>
                          🕐 {new Date(mensajeItem.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Formulario de envío */}
              <form 
                onSubmit={enviarNuevoMensaje}
                style={{ 
                  padding: '1rem', 
                  borderTop: '2px solid #eee',
                  backgroundColor: '#ffffff'
                }}
              >
                <input
                  type="text"
                  placeholder="📧 Asunto del mensaje"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <textarea
                    placeholder="✍️ Escribe tu mensaje aquí..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      resize: 'none',
                      fontSize: '0.9rem',
                      minHeight: '80px',
                      fontFamily: 'inherit'
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
                      backgroundColor: enviando ? '#ccc' : 'var(--brand)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: enviando ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      minWidth: '100px'
                    }}
                  >
                    {enviando ? '📤 Enviando...' : '📤 Enviar'}
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
              color: '#666',
              textAlign: 'center',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <strong>Selecciona una familia para comenzar</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: '#999' }}>
                Haz clic en cualquier contacto de la izquierda para iniciar una conversación
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
