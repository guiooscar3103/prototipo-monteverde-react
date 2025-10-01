const API_BASE_URL = 'http://localhost:3000';

/**
 * Obtiene todos los cursos
 */
export const getCursos = async () => {
  const res = await fetch(`${API_BASE_URL}/cursos`);
  if (!res.ok) throw new Error('Error al obtener cursos');
  return await res.json();
};

/**
 * Obtiene estudiantes por cursoId
 */
export const getEstudiantesPorCurso = async (cursoId) => {
  const res = await fetch(`${API_BASE_URL}/estudiantes?cursoId=${cursoId}`);
  if (!res.ok) throw new Error('Error al obtener estudiantes');
  return await res.json();
};

/**
 * Obtiene calificaciones filtradas por cursoId, asignatura y periodo
 */
export const getCalificacionesPor = async ({ cursoId, asignatura, periodo }) => {
  // Obtener los estudiantes del curso
  const estudiantes = await getEstudiantesPorCurso(cursoId);
  const estIds = estudiantes.map(e => e.id);

  // Obtener todas las calificaciones con esa asignatura y periodo
  const res = await fetch(
    `${API_BASE_URL}/calificaciones?asignatura=${encodeURIComponent(asignatura)}&periodo=${encodeURIComponent(periodo)}`
  );
  if (!res.ok) throw new Error('Error al obtener calificaciones');
  const todas = await res.json();

  // Filtrar solo las calificaciones de los estudiantes del curso
  const filtradas = todas.filter(c => estIds.includes(c.estudianteId));

  return filtradas;
};

/**
 * Obtiene calificaciones por estudianteId y periodo (NUEVA FUNCIÓN)
 */
export const getCalificacionesEstudiante = async ({ estudianteId, periodo }) => {
  let url = `${API_BASE_URL}/calificaciones?estudianteId=${estudianteId}`;
  
  if (periodo) {
    url += `&periodo=${encodeURIComponent(periodo)}`;
  }
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener calificaciones del estudiante');
  
  return await res.json();
};

/**
 * Obtiene todos los períodos únicos disponibles (NUEVA FUNCIÓN)
 */
export const getPeriodos = async () => {
  const res = await fetch(`${API_BASE_URL}/calificaciones`);
  if (!res.ok) throw new Error('Error al obtener calificaciones');
  
  const calificaciones = await res.json();
  
  // Extraer períodos únicos
  const periodos = [...new Set(calificaciones.map(c => c.periodo))];
  
  return periodos.sort();
};

/**
 * Guarda o actualiza calificaciones
 * @param {Array} nuevas - Lista de objetos { estudianteId, asignatura, periodo, nota }
 */
export const guardarCalificaciones = async (nuevas) => {
  const resultados = [];

  for (const item of nuevas) {
    // Buscamos si ya existe una calificación con esos criterios
    const resTodas = await fetch(`${API_BASE_URL}/calificaciones`);
    if (!resTodas.ok) throw new Error('Error al obtener calificaciones');
    const todas = await resTodas.json();

    const existente = todas.find(c =>
      c.estudianteId === item.estudianteId &&
      c.asignatura === item.asignatura &&
      c.periodo === item.periodo
    );

    if (existente) {
      // Actualizar (PUT)
      const res = await fetch(`${API_BASE_URL}/calificaciones/${existente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existente, nota: item.nota })
      });
      if (!res.ok) throw new Error('Error al actualizar calificación');
      resultados.push(await res.json());
    } else {
      // Crear (POST)
      const res = await fetch(`${API_BASE_URL}/calificaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Error al crear calificación');
      resultados.push(await res.json());
    }
  }

  return { ok: true, resultados };
};

/**
 * Obtiene asistencia por cursoId y fecha
 */
export const getAsistenciaPorFecha = async ({ cursoId, fecha }) => {
  const estudiantes = await getEstudiantesPorCurso(cursoId);
  const estIds = estudiantes.map(e => e.id);

  const res = await fetch(`${API_BASE_URL}/asistencia?fecha=${fecha}`);
  if (!res.ok) throw new Error('Error al obtener asistencia');
  const todas = await res.json();

  const filtradas = todas.filter(a => estIds.includes(a.estudianteId));
  return filtradas;
};

/**
 * Guarda o actualiza asistencia
 * @param {Array} lista - [{ estudianteId, fecha, estado }]
 */
export const guardarAsistencia = async (lista) => {
  const resultados = [];

  for (const item of lista) {
    const resTodas = await fetch(`${API_BASE_URL}/asistencia`);
    if (!resTodas.ok) throw new Error('Error al obtener asistencia');
    const todas = await resTodas.json();

    const existente = todas.find(a =>
      a.estudianteId === item.estudianteId &&
      a.fecha === item.fecha
    );

    if (existente) {
      // Actualizar (PUT)
      const res = await fetch(`${API_BASE_URL}/asistencia/${existente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existente, estado: item.estado })
      });
      if (!res.ok) throw new Error('Error al actualizar asistencia');
      resultados.push(await res.json());
    } else {
      // Crear (POST)
      const res = await fetch(`${API_BASE_URL}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Error al crear asistencia');
      resultados.push(await res.json());
    }
  }

  return { ok: true, resultados };
};

/**
 * Obtiene observaciones por cursoId
 */
export const getObservadorPorCurso = async (cursoId) => {
  const estudiantes = await getEstudiantesPorCurso(cursoId);
  const estIds = estudiantes.map(e => e.id);

  const res = await fetch(`${API_BASE_URL}/observaciones`);
  if (!res.ok) throw new Error('Error al obtener observaciones');
  const todas = await res.json();

  const filtradas = todas.filter(o => String(estIds).includes(String(o.estudianteId)));
  return filtradas;
};

/**
 * Agrega una nueva anotación al observador
 */
export const agregarAnotacion = async (anotacion) => {
  const res = await fetch(`${API_BASE_URL}/observaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(anotacion)
  });
  if (!res.ok) throw new Error('Error al agregar anotación');
  return { ok: true, resultado: await res.json() };
};

/**
 * Obtiene todos los estudiantes (útil para admin)
 */
export const getEstudiantes = async () => {
  const res = await fetch(`${API_BASE_URL}/estudiantes`);
  if (!res.ok) throw new Error('Error al obtener estudiantes');
  return await res.json();
};

/**
 * Obtiene mensajes por usuario (enviados y recibidos)
 */
export const getMensajesPorUsuario = async (usuarioId) => {
  const res = await fetch(`${API_BASE_URL}/mensajes`);
  if (!res.ok) throw new Error('Error al obtener mensajes');
  
  const todos = await res.json();
  
  // Filtrar mensajes donde el usuario es emisor o receptor
  const filtrados = todos.filter(m => 
    m.emisorId == usuarioId || m.receptorId == usuarioId
  );
  
  return filtrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

/**
 * Obtiene conversación entre dos usuarios
 */
export const getConversacion = async (usuario1Id, usuario2Id) => {
  const res = await fetch(`${API_BASE_URL}/mensajes`);
  if (!res.ok) throw new Error('Error al obtener mensajes');
  
  const todos = await res.json();
  
  const conversacion = todos.filter(m => 
    (m.emisorId == usuario1Id && m.receptorId == usuario2Id) ||
    (m.emisorId == usuario2Id && m.receptorId == usuario1Id)
  );
  
  return conversacion.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

/**
 * Envía un nuevo mensaje
 */
export const enviarMensaje = async (mensaje) => {
  const nuevoMensaje = {
    ...mensaje,
    fecha: new Date().toISOString().split('T')[0],
    leido: false
  };
  
  const res = await fetch(`${API_BASE_URL}/mensajes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoMensaje)
  });
  
  if (!res.ok) throw new Error('Error al enviar mensaje');
  return await res.json();
};

/**
 * Marca un mensaje como leído
 */
export const marcarComoLeido = async (mensajeId) => {
  const res = await fetch(`${API_BASE_URL}/mensajes/${mensajeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leido: true })
  });
  
  if (!res.ok) throw new Error('Error al marcar mensaje como leído');
  return await res.json();
};

/**
 * Obtiene usuarios por rol (para listar destinatarios)
 */
export const getUsuariosPorRol = async (rol) => {
  const res = await fetch(`${API_BASE_URL}/usuarios?rol=${rol}`);
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return await res.json();
};

/**
 * Obtiene información de un usuario por ID
 */
export const getUsuarioPorId = async (usuarioId) => {
  const res = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}`);
  if (!res.ok) throw new Error('Error al obtener usuario');
  return await res.json();
};
