import { useEffect, useMemo, useState } from 'react'
import { apiFake } from '../../services/apiFake'
import Tabla from '../../components/Tabla'
import CampoNumero from '../../components/CampoNumero'
import SelectSimple from '../../components/SelectSimple'
import BarraTitulo from '../../components/BarraTitulo'

export default function RegistroCalificaciones() {
  const [cursoId, setCursoId] = useState('')
  const [asignatura, setAsignatura] = useState('Matemáticas')
  const [periodo, setPeriodo] = useState(2)
  const [estudiantes, setEstudiantes] = useState([])
  const [notas, setNotas] = useState([]) // {estudianteId, nota}

  const cursosOptions = useMemo(()=> apiFake.cursos.map(c=>({value:c.id, label:c.nombre})), [])

  useEffect(()=>{
    if (!cursoId) { setEstudiantes([]); setNotas([]); return }
    (async()=>{
      const est = await apiFake.estudiantesPorCurso(cursoId)
      setEstudiantes(est)
      const califs = await apiFake.calificacionesPor({cursoId, asignatura, periodo})
      const mapa = new Map(califs.map(c => [c.estudianteId, c.nota]))
      setNotas(est.map(e => ({estudianteId:e.id, asignatura, periodo, nota: mapa.get(e.id) ?? ''})))
    })()
  },[cursoId, asignatura, periodo])

  const columnas = [
    { key:'nombre', header:'Estudiante' },
    { key:'nota', header:'Nota', render: (fila) => {
        const idx = notas.findIndex(n => n.estudianteId===fila.id)
        return (
          <CampoNumero
            value={notas[idx]?.nota}
            onChange={(v)=>{
              const copia = [...notas]
              copia[idx] = {...copia[idx], nota: v}
              setNotas(copia)
            }}
          />
        )
      }
    }
  ]

  const filas = estudiantes.map(e => ({id:e.id, nombre:e.nombre}))

  const guardar = async () => {
    const limpias = notas.filter(n=> n.nota!=='' && !Number.isNaN(n.nota))
    const res = await apiFake.guardarCalificaciones(limpias)
    if (res.ok) alert('Calificaciones guardadas (simulado).')
  }

  return (
    <div>
      <BarraTitulo titulo="Registro de Calificaciones" subtitulo="Docente" />
      <div style={{display:'flex', gap:'.5rem', marginBottom:'1rem'}}>
        <SelectSimple value={cursoId} onChange={setCursoId} options={cursosOptions} etiqueta="Curso" />
        <SelectSimple value={asignatura} onChange={setAsignatura} options={[
          {value:'Matemáticas',label:'Matemáticas'},
          {value:'Español',label:'Español'},
          {value:'Ciencias',label:'Ciencias'}
        ]} etiqueta="Asignatura" />
        <SelectSimple value={String(periodo)} onChange={(v)=>setPeriodo(Number(v))} options={[
          {value:'1',label:'Periodo 1'},
          {value:'2',label:'Periodo 2'},
          {value:'3',label:'Periodo 3'},
          {value:'4',label:'Periodo 4'}
        ]} etiqueta="Periodo" />
        <button onClick={guardar} style={{padding:'.5rem 1rem'}}>Guardar</button>
      </div>
      <Tabla columns={columnas} rows={filas} />
    </div>
  )
}
