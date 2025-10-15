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
  const [estudiantes, setEstudiantes] = useState([]); // Cambiado para manejar datos completos
  const [form, setForm] = useState({
    estudianteId: '',
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'Positivo',
    detalle: ''
  });

  const [cursosOptions, setCursosOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar cursos al montar
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        setError(null);
        const cursos = await getCursos();
        const cursosOpts = cursos.map(c => ({ 
          value: String(c.id), // Convertir a string para consistencia
          label: c.nombre 
        }));
        
        setCursosOptions(cursosOpts);
        
        if (cursos.length > 0) {
          setCursoId(String(cursos[0].id));
        }
      } catch (error) {
        console.error('Error al cargar cursos:', error);
        setError('Error al cargar los cursos');
      }
    };
    cargarCursos();
  }, []);

  // Cargar anotaciones y estudiantes cuando cambie el curso
  useEffect(() => {
    const cargarDatos = async () => {
      if (!cursoId) {
        setAnotaciones([]);
        setEstudiantes([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('Cargando datos para curso:', cursoId); // Debug
        
        const [anotacionesData, estudiantesData] = await Promise.all([
          getObservadorPorCurso(Number(cursoId)), // Convertir a number para la API
          getEstudiantesPorCurso(Number(cursoId))
        ]);

        console.log('Anotaciones cargadas:', anotacionesData); // Debug
        console.log('Estudiantes cargados:', estudiantesData); // Debug

        setAnotaciones(anotacionesData || []);
        setEstudiantes(estudiantesData || []);

        // Limpiar formulario cuando cambie de curso
        setForm(prev => ({
          ...prev,
          estudianteId: '',
          detalle: ''
        }));

      } catch (error) {
        console.error('Error al cargar datos del curso:', error);
        setError('Error al cargar los datos del curso');
        setAnotaciones([]);
        setEstudiantes([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [cursoId]);

  // Opciones de estudiantes para el select
  const estOptions = useMemo(() => {
    return estudiantes.map(e => ({ 
      value: String(e.id), 
      label: e.nombre 
    }));
  }, [estudiantes]);

  // Preparar filas para la tabla - CORREGIDO
  const filas = useMemo(() => {
    if (!anotaciones.length || !estudiantes.length) {
      return [];
    }

    return anotaciones.map(a => {
      // Buscar el estudiante por ID, manejando tanto string como number
      const estudiante = estudiantes.find(est => 
        String(est.id) === String(a.estudianteId)
      );
      
      return {
        ...a,
        estudiante: estudiante ? estudiante.nombre : `ID: ${a.estudianteId}`
      };
    });
  }, [anotaciones, estudiantes]); // Dependencias correctas

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
      setError(null);
      
      await agregarAnotacion({
        estudianteId: Number(form.estudianteId), // Convertir a number
        fecha: form.fecha,
        tipo: form.tipo,
        detalle: form.detalle
      });

      // Recargar anotaciones
      const nuevasAnotaciones = await getObservadorPorCurso(Number(cursoId));
      setAnotaciones(nuevasAnotaciones || []);
      
      // Limpiar solo el detalle
      setForm(prev => ({ ...prev, detalle: '' }));
      
      alert('Anotación agregada correctamente');
    } catch (error) {
      console.error('Error al agregar anotación:', error);
      setError('Error al agregar anotación: ' + error.message);
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

      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Cargando anotaciones...</p>
      ) : (
        <>
          {filas.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <p>No hay observaciones registradas para este curso</p>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '1rem' }}>
                Se encontraron <strong>{filas.length}</strong> observaciones
              </p>
              <Tabla columns={columnas} rows={filas} />
            </>
          )}
        </>
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
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div>
            <label style={{ marginRight: '.5rem' }}>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option>Positivo</option>
              <option>Llamado</option>
              <option>Seguimiento</option>
            </select>
          </div>
          <textarea
            rows={3}
            placeholder="Detalle de la observación..."
            value={form.detalle}
            onChange={(e) => setForm({ ...form, detalle: e.target.value })}
            style={{ 
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
          <button
            onClick={agregar}
            disabled={!cursoId || !form.estudianteId || !form.detalle.trim()}
            style={{
              padding: '.75rem 1.5rem',
              width: 'fit-content',
              backgroundColor: (!cursoId || !form.estudianteId || !form.detalle.trim()) 
                ? '#ccc' 
                : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!cursoId || !form.estudianteId || !form.detalle.trim()) 
                ? 'not-allowed' 
                : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Agregar Observación
          </button>
        </div>
      </div>
    </div>
  );
}
