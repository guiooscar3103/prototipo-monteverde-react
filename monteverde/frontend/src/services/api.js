// src/services/api.js
const API_BASE_URL = 'http://localhost:5000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
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
// FUNCIONES BÁSICAS
// =====================================================

export const getCursos = async () => {
  return await apiRequest('/cursos');
};

export const getDocenteDashboard = async (docenteId) => {
  return await apiRequest(`/docente/dashboard/${docenteId}`);
};

export const getMensajes = async (usuarioId) => {
  return await apiRequest(`/mensajes/${usuarioId}`);
};

export const getEstudiantes = async (cursoId = null) => {
  const endpoint = cursoId ? `/estudiantes?curso_id=${cursoId}` : '/estudiantes';
  return await apiRequest(endpoint);
};

export const getEstudiantesPorCurso = async (cursoId) => {
  return await apiRequest(`/estudiantes/por-curso/${cursoId}`);
};

// =====================================================
// FUNCIONES PARA CALIFICACIONES
// =====================================================

export const getCalificaciones = async (estudianteId = null) => {
  const endpoint = estudianteId ? `/calificaciones?estudiante_id=${estudianteId}` : '/calificaciones';
  return await apiRequest(endpoint);
};

export const getCalificacionesPor = async ({ cursoId, asignatura, periodo }) => {
  const params = new URLSearchParams();
  
  if (cursoId) params.append('cursoId', cursoId);
  if (asignatura) params.append('asignatura', asignatura);
  if (periodo) params.append('periodo', periodo);
  
  return await apiRequest(`/calificaciones/buscar?${params.toString()}`);
};

export const guardarCalificaciones = async (calificaciones) => {
  return await apiRequest('/calificaciones/guardar', {
    method: 'POST',
    body: JSON.stringify({ calificaciones }),
  });
};

// =====================================================
// FUNCIONES PARA ASISTENCIA
// =====================================================

export const getAsistencia = async (fecha = null, cursoId = null) => {
  let endpoint = '/asistencia';
  const params = [];
  
  if (fecha) params.push(`fecha=${fecha}`);
  if (cursoId) params.push(`curso_id=${cursoId}`);
  
  if (params.length > 0) {
    endpoint += '?' + params.join('&');
  }
  
  return await apiRequest(endpoint);
};

export const getAsistenciaPorFecha = async ({ cursoId, fecha }) => {
  const params = new URLSearchParams();
  
  if (cursoId) params.append('cursoId', cursoId);
  if (fecha) params.append('fecha', fecha);
  
  return await apiRequest(`/asistencia/por-fecha?${params.toString()}`);
};

export const guardarAsistencia = async (marcas) => {
  return await apiRequest('/asistencia/guardar', {
    method: 'POST',
    body: JSON.stringify({ marcas }),
  });
};

export const getEstadisticasAsistencia = async ({ cursoId, fecha }) => {
  const params = new URLSearchParams();
  
  if (cursoId) params.append('cursoId', cursoId);
  if (fecha) params.append('fecha', fecha);
  
  return await apiRequest(`/asistencia/estadisticas?${params.toString()}`);
};

// =====================================================
// FUNCIONES PARA OBSERVACIONES
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

export const getEstadisticasObservaciones = async (cursoId) => {
  console.log('🌐 API: Obteniendo estadísticas para curso:', cursoId);
  return await apiRequest(`/observaciones/estadisticas/${cursoId}`);
};
