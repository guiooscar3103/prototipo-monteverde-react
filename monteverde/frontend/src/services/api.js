// ============================================
// CONFIGURACIÓN BÁSICA Y HELPERS
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data.success ? data.data : data;
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
};

// =====================================================
// AUTENTICACIÓN
// =====================================================

export const login = async (credentials) => {
  console.log('🌐 API: Iniciando sesión...');
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

// =====================================================
// USUARIOS
// =====================================================

export const getUsuariosPorRol = async (rol) => {
  console.log('🌐 API: Obteniendo usuarios por rol:', rol);
  if (rol === 'familia') return await apiRequest('/usuarios/familia');
  if (rol === 'docente') return await apiRequest('/usuarios/docentes');
  return await apiRequest(`/usuarios/por-rol/${rol}`);
};

export const getUsuarioPorId = async (usuarioId) => {
  console.log('🌐 API: Obteniendo usuario por ID:', usuarioId);
  return await apiRequest(`/usuario/${usuarioId}`);
};

export const getUsuarios = async () => {
  console.log('🌐 API: Obteniendo todos los usuarios...');
  return await apiRequest('/usuarios');
};

export const crearUsuario = async (usuario) => {
  console.log('🌐 API: Creando usuario:', usuario);
  return await apiRequest('/usuarios', {
    method: 'POST',
    body: JSON.stringify(usuario),
  });
};

export const actualizarUsuario = async (usuarioId, datos) => {
  console.log('🌐 API: Actualizando usuario:', usuarioId);
  return await apiRequest(`/usuarios/${usuarioId}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
};

export const eliminarUsuario = async (usuarioId) => {
  console.log('🌐 API: Eliminando usuario:', usuarioId);
  return await apiRequest(`/usuarios/${usuarioId}`, {
    method: 'DELETE',
  });
};

// =====================================================
// CURSOS
// =====================================================

export const getCursos = async () => {
  console.log('🌐 API: Obteniendo cursos...');
  return await apiRequest('/cursos');
};

export const getEstudiantesPorCurso = async (cursoId) => {
  console.log('🌐 API: Obteniendo estudiantes del curso:', cursoId);
  return await apiRequest(`/estudiantes/por-curso/${cursoId}`);
};

// =====================================================
// DASHBOARD - EXACTAMENTE COMO LOS USAS
// =====================================================

export const getFamiliaDashboard = async (familiaId) => {
  console.log('🌐 API: Obteniendo dashboard familiar para:', familiaId);
  return await apiRequest(`/familia/dashboard/${familiaId}`);
};

export const getDocenteDashboard = async (docenteId) => {
  console.log('🌐 API: Obteniendo dashboard docente para:', docenteId);
  return await apiRequest(`/docente/dashboard/${docenteId}`);
};

// =====================================================
// MENSAJES - AMBAS VERSIONES PARA COMPATIBILIDAD
// =====================================================

export const getMensajesPorUsuario = async (usuarioId) => {
  console.log('🌐 API: Obteniendo mensajes para usuario:', usuarioId);
  return await apiRequest(`/mensajes/${usuarioId}`);
};

export const getMensajes = async (usuarioId) => {
  console.log('🌐 API: Obteniendo mensajes (alias):', usuarioId);
  return await apiRequest(`/mensajes/${usuarioId}`);
};

export const getConversacion = async (usuario1Id, usuario2Id) => {
  console.log('🌐 API: Obteniendo conversación entre:', usuario1Id, 'y', usuario2Id);
  return await apiRequest(`/conversacion/${usuario1Id}/${usuario2Id}`);
};

export const enviarMensaje = async (mensaje) => {
  console.log('🌐 API: Enviando mensaje:', mensaje);
  return await apiRequest('/mensajes/enviar', {
    method: 'POST',
    body: JSON.stringify(mensaje),
  });
};

export const marcarComoLeido = async (mensajeId) => {
  console.log('🌐 API: Marcando mensaje como leído:', mensajeId);
  return await apiRequest(`/mensajes/marcar-leido/${mensajeId}`, {
    method: 'PUT',
  });
};

// =====================================================
// CALIFICACIONES
// =====================================================

export const buscarCalificaciones = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.asignatura) queryParams.append('asignatura', params.asignatura);
  if (params.periodo) queryParams.append('periodo', params.periodo);
  
  console.log('🌐 API: Buscando calificaciones con:', params);
  return await apiRequest(`/calificaciones/buscar?${queryParams}`);
};

export const guardarCalificaciones = async (calificaciones) => {
  console.log('🌐 API: Guardando calificaciones:', calificaciones);
  return await apiRequest('/calificaciones/guardar', {
    method: 'POST',
    body: JSON.stringify({ calificaciones }),
  });
};

export const getCalificacionesHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo calificaciones del hijo:', estudianteId);
  return await apiRequest(`/familia/hijo-calificaciones/${estudianteId}`);
};

// =====================================================
// ASISTENCIA
// =====================================================

export const getAsistenciaPorFecha = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.fecha) queryParams.append('fecha', params.fecha);
  
  console.log('🌐 API: Obteniendo asistencia con:', params);
  return await apiRequest(`/asistencia/por-fecha?${queryParams}`);
};

export const guardarAsistencia = async (marcas) => {
  console.log('🌐 API: Guardando asistencia:', marcas);
  return await apiRequest('/asistencia/guardar', {
    method: 'POST',
    body: JSON.stringify({ marcas }),
  });
};

export const getEstadisticasAsistencia = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.fecha) queryParams.append('fecha', params.fecha);
  
  console.log('🌐 API: Obteniendo estadísticas asistencia:', params);
  return await apiRequest(`/asistencia/estadisticas?${queryParams}`);
};

export const getAsistenciaHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo asistencia del hijo:', estudianteId);
  return await apiRequest(`/familia/hijo-asistencia/${estudianteId}`);
};

// =====================================================
// OBSERVACIONES - COMPLETAMENTE FUNCIONALES
// =====================================================

export const getObservadorPorCurso = async (cursoId) => {
  console.log('🌐 API: Obteniendo observaciones para curso:', cursoId);
  return await apiRequest(`/observaciones/por-curso/${cursoId}`);
};

export const agregarAnotacion = async (observacion) => {
  console.log('🌐 API: Enviando observación:', observacion);
  return await apiRequest('/observaciones/agregar', {
    method: 'POST',
    body: JSON.stringify(observacion),
  });
};

export const getObservacionesHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo observaciones del hijo:', estudianteId);
  return await apiRequest(`/familia/hijo-observaciones/${estudianteId}`);
};

export const getEstadisticasObservaciones = async (cursoId) => {
  console.log('🌐 API: Obteniendo estadísticas observaciones para curso:', cursoId);
  // Función placeholder - puedes implementarla después en el backend
  return { 
    estadisticas: { 
      total: 0, 
      positivas: 0, 
      neutrales: 0, 
      negativas: 0 
    } 
  };
};

// =====================================================
// REPORTES ACADÉMICOS
// =====================================================

export const getReporteAcademico = async (estudianteId) => {
  console.log('🌐 API: Obteniendo reporte académico para:', estudianteId);
  return await apiRequest(`/familia/hijo-calificaciones/${estudianteId}`);
};

// =====================================================
// FUNCIONES DE ADMIN
// =====================================================

export const getEstadisticasGenerales = async () => {
  console.log('🌐 API: Obteniendo estadísticas generales...');
  return await apiRequest('/admin/estadisticas');
};

export const getConfiguracion = async () => {
  console.log('🌐 API: Obteniendo configuración...');
  return await apiRequest('/admin/configuracion');
};

// =====================================================
// UTILIDADES Y SALUD DEL SISTEMA
// =====================================================

export const testConexion = async () => {
  console.log('🌐 API: Probando conexión...');
  return await apiRequest('/test-db');
};

export const healthCheck = async () => {
  console.log('🌐 API: Verificando salud del sistema...');
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return await response.json();
  } catch (error) {
    console.error('Error en health check:', error);
    return { status: 'ERROR', message: error.message };
  }
};

export const ping = async () => {
  console.log('🌐 API: Ping al servidor...');
  return await fetch(`${API_BASE_URL.replace('/api', '')}/health`)
    .then(r => r.ok)
    .catch(() => false);
};

// =====================================================
// FUNCIONES UTILITARIAS PARA FECHAS Y FORMATOS
// =====================================================

export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const obtenerFechaHoy = () => {
  return new Date().toISOString().split('T')[0];
};

// =====================================================
// FUNCIONES DE MANEJO DE ERRORES
// =====================================================

export const manejarErrorApi = (error) => {
  console.error('Error en API:', error);
  
  if (error.message.includes('Failed to fetch')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }
  
  if (error.message.includes('404')) {
    return 'El recurso solicitado no fue encontrado.';
  }
  
  if (error.message.includes('401')) {
    return 'No tienes permisos para acceder a este recurso.';
  }
  
  if (error.message.includes('500')) {
    return 'Error interno del servidor. Intenta más tarde.';
  }
  
  return error.message || 'Error desconocido en la API';
};

// =====================================================
// FUNCIONES PARA MANEJO DE TOKENS
// =====================================================

export const guardarToken = (token) => {
  localStorage.setItem('token', token);
};

export const obtenerToken = () => {
  return localStorage.getItem('token');
};

export const eliminarToken = () => {
  localStorage.removeItem('token');
};

export const verificarToken = async () => {
  const token = obtenerToken();
  if (!token) return false;
  
  try {
    // Puedes implementar un endpoint de verificación en el backend
    await apiRequest('/auth/verify');
    return true;
  } catch {
    eliminarToken();
    return false;
  }
};

// =====================================================
// ✅ TODOS LOS ALIAS PARA COMPATIBILIDAD TOTAL
// =====================================================

// Para RegistroCalificaciones.jsx
export const getCalificacionesPor = buscarCalificaciones;

// Para dashboards (nombres alternativos)
export const getDashboardFamilia = getFamiliaDashboard;
export const getDashboardDocente = getDocenteDashboard;

// Para usuarios (nombres alternativos)
export const getUsuariosFamilia = () => getUsuariosPorRol('familia');
export const getUsuariosDocentes = () => getUsuariosPorRol('docente');

// Para reportes
export const getCalificacionesEstudiante = getCalificacionesHijo;
export const getAsistenciaEstudiante = getAsistenciaHijo;
export const getObservacionesEstudiante = getObservacionesHijo;

// Para cursos (nombres alternativos)
export const obtenerCursos = getCursos;
export const obtenerEstudiantes = getEstudiantesPorCurso;

// Para observaciones (nombres alternativos)
export const enviarObservacion = agregarAnotacion;
export const crearObservacion = agregarAnotacion;
export const obtenerObservaciones = getObservadorPorCurso;

// Para asistencia (nombres alternativos)
export const obtenerAsistencia = getAsistenciaPorFecha;
export const registrarAsistencia = guardarAsistencia;

// Para mensajes (nombres alternativos)
export const obtenerMensajes = getMensajesPorUsuario;
export const crearMensaje = enviarMensaje;

// Para calificaciones (nombres alternativos)
export const obtenerCalificaciones = buscarCalificaciones;
export const registrarCalificaciones = guardarCalificaciones;

// Funciones que podrían estar en otros archivos
export const getEstudiantePorId = async (estudianteId) => {
  console.log('🌐 API: Obteniendo estudiante por ID:', estudianteId);
  return await apiRequest(`/estudiantes/${estudianteId}`);
};

export const getCursoPorId = async (cursoId) => {
  console.log('🌐 API: Obteniendo curso por ID:', cursoId);
  return await apiRequest(`/cursos/${cursoId}`);
};

// Para debugging y desarrollo
export { API_BASE_URL };

// Función catch-all para cualquier export que pueda faltar
export const funcionGenerica = async (endpoint, options = {}) => {
  console.log('🌐 API: Función genérica para:', endpoint);
  return await apiRequest(endpoint, options);
};
