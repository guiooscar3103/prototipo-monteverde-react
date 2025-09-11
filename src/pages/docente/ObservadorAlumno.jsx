import { useEffect, useMemo, useState } from 'react'
import { apiFake } from '../../services/apiFake'
import Tabla from '../../components/Tabla'
import SelectSimple from '../../components/SelectSimple'
import BarraTitulo from '../../components/BarraTitulo'

export default function ObservadorAlumno() {
  const [cursoId, setCursoId] = useState('')
  const [anotaciones, setAnotaciones] = useState([])
  const [form, setForm] = useState({ estudianteId:'', fecha: new Date().toISOString().slice(0,10), tipo:'Positivo', detalle:'' })

  const cursosOptions = useMemo(()=> apiFake.cursos.map(c=>({value:c.id, label:c.nombre})), [])
  const [estOptions, setEstOptions] = useState([])

  useEffect(()=>{
    (async()=>{
      if (!cursoId) { setAnotaciones([]); setEstOptions([]); return }
      const lista = await apiFake.observadorPorCurso(cursoId)
      setAnotaciones(lista)
      const ests = await apiFake.estudiantesPorCurso(cursoId)
      setEstOptions(ests.map(e=>({value:String(e.id), label:e.nombre})))
    })()
  },[cursoId])

  const columnas = [
    { key:'fecha', header:'Fecha' },
    { key:'estudiante', header:'Estudiante' },
    { key:'tipo', header:'Tipo' },
    { key:'detalle', header:'Detalle' }
  ]

  const filas = anotaciones.map(a=>{
    const est = apiFake.estudiantes.find(e=>e.id===a.estudianteId)
    return ({...a, estudiante: est?.nombre ?? a.estudianteId})
  })

  const agregar = async ()=>{
    if (!cursoId || !form.estudianteId || !form.detalle.trim()) {
      alert('Completa curso, estudiante y detalle.')
      return
    }
    await apiFake.agregarAnotacion({
      estudianteId: Number(form.estudianteId),
      fecha: form.fecha,
      tipo: form.tipo,
      detalle: form.detalle
    })
    const lista = await apiFake.observadorPorCurso(cursoId)
    setAnotaciones(lista)
    setForm(f => ({...f, detalle:''}))
  }

  return (
    <div>
      <BarraTitulo titulo="Observador del Alumno" subtitulo="Docente" />
      <div style={{display:'flex', gap:'.5rem', marginBottom:'1rem'}}>
        <SelectSimple value={cursoId} onChange={setCursoId} options={cursosOptions} etiqueta="Curso" />
      </div>

      <Tabla columns={columnas} rows={filas} />

      <div style={{marginTop:'1rem', borderTop:'1px solid #eee', paddingTop:'1rem'}}>
        <h3>Agregar anotación</h3>
        <div style={{display:'grid', gap:'.5rem', maxWidth:640}}>
          <SelectSimple value={form.estudianteId} onChange={(v)=>setForm({...form, estudianteId:v})} options={estOptions} etiqueta="Estudiante" />
          <div>
            <label style={{marginRight:'.5rem'}}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})} />
          </div>
          <div>
            <label style={{marginRight:'.5rem'}}>Tipo</label>
            <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
              <option>Positivo</option>
              <option>Llamado</option>
              <option>Seguimiento</option>
            </select>
          </div>
          <textarea rows={3} placeholder="Detalle..." value={form.detalle} onChange={e=>setForm({...form, detalle:e.target.value})}/>
          <button onClick={agregar} style={{padding:'.5rem 1rem', width:'fit-content'}}>Agregar</button>
        </div>
      </div>
    </div>
  )
}
