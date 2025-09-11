import { useMemo, useState } from 'react'
import BarraTitulo from '../../components/BarraTitulo'
import Tabla from '../../components/Tabla'
import { apiFake } from '../../services/apiFake'
import califs from '../../mocks/calificaciones.json'

export default function ReporteAcademico() {
  const estudianteId = 1
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos')

  const est = useMemo(
    () => apiFake.estudiantes.find(e => e.id === estudianteId),
    []
  )

  // -> Convierte los periodos a string y quita duplicados
  const periodosDisponibles = useMemo(() => {
    const periodos = Array.from(new Set(califs.map(n => String(n.periodo))))
    return ['todos', ...periodos] 
  }, [])

  const filas = useMemo(() => {
    return (califs || [])
      .filter(n => n.estudianteId === estudianteId)
      // compara como string para que coincida con el select
      .filter(n => periodoSeleccionado === 'todos' || String(n.periodo) === periodoSeleccionado)
      .map(n => ({
        asignatura: n.asignatura,
        periodo: n.periodo,
        nota: n.nota
      }))
  }, [periodoSeleccionado])

  return (
    <div>
      <BarraTitulo
        titulo="Reporte Académico"
        subtitulo={`Padre/Estudiante — ${est?.nombre || 'Estudiante'}`}
      />

      <div style={{ marginBottom: '1.5rem', padding: '0 1rem' }}>
        <label htmlFor="periodo" style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>
          Seleccionar un periodo:
        </label>
        <select
          id="periodo"
          value={periodoSeleccionado}
          onChange={(e) => setPeriodoSeleccionado(e.target.value)}  
          style={{ padding: '.5rem', borderRadius: 6, border: '1px solid #ccc', minWidth: 200 }}
        >
          {periodosDisponibles.map(p => (
            <option key={p} value={p}>
              {p === 'todos' ? 'Todos los periodos' : `Periodo ${p}`}
            </option>
          ))}
        </select>
      </div>

      <Tabla
        columns={[
          { key: 'asignatura', header: 'Asignatura' },
          { key: 'periodo', header: 'Periodo' },
          { key: 'nota', header: 'Nota' }
        ]}
        rows={filas}
      />
    </div>
  )
}
