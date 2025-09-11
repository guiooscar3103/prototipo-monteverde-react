import { useEffect, useMemo, useState } from 'react'
import { apiFake } from '../../services/apiFake'
import Tabla from '../../components/Tabla'
import SelectSimple from '../../components/SelectSimple'
import BarraTitulo from '../../components/BarraTitulo'

const ESTADOS = ['PRESENTE','AUSENTE','TARDE','JUSTIFICADO']

export default function Asistencia() {
  const [cursoId, setCursoId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10))
  const [estudiantes, setEstudiantes] = useState([])
  const [marcas, setMarcas] = useState([]) // {estudianteId, fecha, estado}

  const cursosOptions = useMemo(()=> apiFake.cursos.map(c=>({value:c.id, label:c.nombre})), [])

  useEffect(()=>{
    if (!cursoId || !fecha) { setEstudiantes([]); setMarcas([]); return }
    (async()=>{
      const est = await apiFake.estudiantesPorCurso(cursoId)
      setEstudiantes(est)
      const lista = await apiFake.asistenciaPorFecha({cursoId, fecha})
      const mapa = new Map(lista.map(a => [a.estudianteId, a.estado]))
      setMarcas(est.map(e => ({estudianteId:e.id, fecha, estado: mapa.get(e.id) ?? 'PRESENTE'})))
    })()
  },[cursoId, fecha])

  const columnas = [
    { key:'nombre', header:'Estudiante' },
    { key:'estado', header:'Estado', render:(fila)=>{
        const idx = marcas.findIndex(m => m.estudianteId===fila.id)
        return (
          <select value={marcas[idx]?.estado} onChange={e=>{
            const copia = [...marcas]
            copia[idx] = {...copia[idx], estado:e.target.value}
            setMarcas(copia)
          }}>
            {ESTADOS.map(es => <option key={es} value={es}>{es}</option>)}
          </select>
        )
      }
    }
  ]
  const filas = estudiantes.map(e => ({id:e.id, nombre:e.nombre}))

  const guardar = async ()=> {
    const res = await apiFake.guardarAsistencia(marcas)
    if (res.ok) alert('Asistencia guardada (simulado).')
  }

  return (
    <div>
      <BarraTitulo titulo="Control de Asistencia" subtitulo="Docente" />
      <div style={{display:'flex', gap:'.5rem', marginBottom:'1rem'}}>
        <SelectSimple value={cursoId} onChange={setCursoId} options={cursosOptions} etiqueta="Curso" />
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
        <button onClick={guardar} style={{padding:'.5rem 1rem'}}>Guardar</button>
      </div>
      <Tabla columns={columnas} rows={filas} />
    </div>
  )
}
