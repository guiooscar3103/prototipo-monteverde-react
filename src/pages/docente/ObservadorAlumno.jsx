// src/pages/docente/ObservadorAlumno.jsx

import { useEffect, useMemo, useState } from 'react';
import Tabla from '../../components/Tabla';
import SelectSimple from '../../components/SelectSimple';
import BarraTitulo from '../../components/BarraTitulo';
import {
  getCursos,
  getEstudiantesPorCurso,
  getObservadorPorCurso,
  agregarAnotacion
} from '../../services/api';

export default function ObservadorAlumno() {
  const [cursoId, setCursoId] = useState('');
  const [anotaciones, setAnotaciones] = useState([]);
  const [form, setForm] = useState({
    estudianteId: '',
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'Positivo',
    detalle: ''
  });

  const [cursosOptions, setCursosOptions] = useState([]);
  const [estOptions, setEstOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar cursos al montar
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const cursos = await getCursos();
        setCursosOptions(cursos.map(c => ({ value: c.id, label: c.nombre })));
        if (cursos.length > 0) {
          setCursoId(cursos[0].id);
        }
      } catch (error) {
        console.error('Error al cargar cursos:', error);
      }
    };
    cargarCursos();
  }, []);

  // Cargar anotaciones y estudiantes cuando cambie el curso
  useEffect(() => {
    const cargarDatos = async () => {
      if (!cursoId) {
        setAnotaciones([]);
        setEstOptions([]);
        return;
      }

      setLoading(true);
      try {
        const [anotacionesData, estudiantesData] = await Promise.all([
          getObservadorPorCurso(cursoId),
          getEstudiantesPorCurso(cursoId)
        ]);

        setAnotaciones(anotacionesData);
        setEstOptions(estudiantesData.map(e => ({ value: String(e.id), label: e.nombre })));
      } catch (error) {
        console.error('Error al cargar datos del curso:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [cursoId]);

  // Preparar filas para la tabla
  const filas = useMemo(() => {
    return anotaciones.map(a => {
      // Buscar el nombre del estudiante en estOptions
      const estOption = estOptions.find(opt => opt.value === String(a.estudianteId));
      return {
        ...a,
        estudiante: estOption?.label || `ID: ${a.estudianteId}`
      };
    });
  }, [anotaciones, estOptions]);

  const columnas = [
    { key: 'fecha', header: 'Fecha' },
    { key: 'estudiante', header: 'Estudiante' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'detalle', header: 'Detalle' }
  ];

  const agregar = async () => {
    if (!cursoId || !form.estudianteId || !form.detalle.trim()) {
      alert('Completa curso, estudiante y detalle.');
      return;
    }

    try {
      await agregarAnotacion({
        estudianteId: Number(form.estudianteId),
        fecha: form.fecha,
        tipo: form.tipo,
        detalle: form.detalle
      });

      // Recargar anotaciones
      const nuevasAnotaciones = await getObservadorPorCurso(cursoId);
      setAnotaciones(nuevasAnotaciones);
      setForm(prev => ({ ...prev, detalle: '' }));
      alert('Anotación agregada correctamente');
    } catch (error) {
      alert('Error al agregar anotación: ' + error.message);
    }
  };

  return (
    <div>
      <BarraTitulo titulo="Observador del Alumno" subtitulo="Docente" />
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        <SelectSimple
          value={cursoId}
          onChange={setCursoId}
          options={cursosOptions}
          etiqueta="Curso"
        />
      </div>

      {loading ? (
        <p>Cargando anotaciones...</p>
      ) : (
        <Tabla columns={columnas} rows={filas} />
      )}

      <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <h3>Agregar anotación</h3>
        <div style={{ display: 'grid', gap: '.5rem', maxWidth: 640 }}>
          <SelectSimple
            value={form.estudianteId}
            onChange={(v) => setForm({ ...form, estudianteId: v })}
            options={estOptions}
            etiqueta="Estudiante"
          />
          <div>
            <label style={{ marginRight: '.5rem' }}>Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div>
            <label style={{ marginRight: '.5rem' }}>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option>Positivo</option>
              <option>Llamado</option>
              <option>Seguimiento</option>
            </select>
          </div>
          <textarea
            rows={3}
            placeholder="Detalle..."
            value={form.detalle}
            onChange={(e) => setForm({ ...form, detalle: e.target.value })}
          />
          <button
            onClick={agregar}
            style={{
              padding: '.5rem 1rem',
              width: 'fit-content',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}