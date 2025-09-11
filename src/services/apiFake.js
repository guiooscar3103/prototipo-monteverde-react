import cursos from '../mocks/cursos.json'
import estudiantes from '../mocks/estudiantes.json'
import calificaciones from '../mocks/calificaciones.json'
import asistencia from '../mocks/asistencia.json'
import observador from '../mocks/observador.json'

export const apiFake = {
  cursos: async () => cursos,
  estudiantesPorCurso: async (cursoId) => estudiantes.filter(e => e.cursoId === cursoId),
  calificacionesPor: async ({cursoId, asignatura, periodo}) => {
    const estIds = estudiantes.filter(e => e.cursoId === cursoId).map(e => e.id)
    return calificaciones.filter(c => estIds.includes(c.estudianteId) && c.asignatura===asignatura && c.periodo===periodo)
  },
  guardarCalificaciones: async (nuevas) => {
    // Simulación: reemplaza por id de estudiante y asignatura/periodo
    nuevas.forEach(n => {
      const idx = calificaciones.findIndex(c => c.estudianteId===n.estudianteId && c.asignatura===n.asignatura && c.periodo===n.periodo)
      if (idx>=0) calificaciones[idx] = {...calificaciones[idx], nota:n.nota}
      else calificaciones.push({...n, id: Date.now()+Math.random()})
    })
    return {ok:true}
  },
  asistenciaPorFecha: async ({cursoId, fecha}) => {
    const estIds = estudiantes.filter(e => e.cursoId===cursoId).map(e=>e.id)
    return asistencia.filter(a => a.fecha===fecha && estIds.includes(a.estudianteId))
  },
  guardarAsistencia: async (lista) => {
    // Simulación: inserta/actualiza por estudianteId+fecha
    lista.forEach(item=>{
      const idx = asistencia.findIndex(a => a.estudianteId===item.estudianteId && a.fecha===item.fecha)
      if (idx>=0) asistencia[idx] = {...asistencia[idx], estado:item.estado}
      else asistencia.push({...item, id: Date.now()+Math.random()})
    })
    return {ok:true}
  },
  observadorPorCurso: async (cursoId) => {
    const estIds = estudiantes.filter(e => e.cursoId===cursoId).map(e=>e.id)
    return observador.filter(o => estIds.includes(o.estudianteId))
  },
  agregarAnotacion: async (anotacion) => {
    observador.push({...anotacion, id: Date.now()})
    return {ok:true}
  },
  estudiantes, cursos
}
