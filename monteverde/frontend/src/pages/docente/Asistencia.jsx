// src/pages/docente/Asistencia.jsx

import { useEffect, useMemo, useState } from 'react';
import Tabla from '../../components/Tabla';
import SelectSimple from '../../components/SelectSimple';
import BarraTitulo from '../../components/BarraTitulo';
import {
  getCursos,
  getEstudiantesPorCurso,
  getAsistenciaPorFecha,
  guardarAsistencia
} from '../../services/api';

const ESTADOS = [
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'JUSTIFICADO', label: 'Justificado' }
];

export default function Asistencia() {
  const [cursoId, setCursoId] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [estudiantes, setEstudiantes] = useState([]);
  const [marcas, setMarcas] = useState([]); // {estudianteId, fecha, estado}
  const [cursosOptions, setCursosOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar cursos al montar
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const cursos = await getCursos();
        console.log('Cursos cargados:', cursos);
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

  // Cargar estudiantes y asistencia cuando cambien cursoId o fecha
  useEffect(() => {
    if (!cursoId || !fecha) {
      setEstudiantes([]);
      setMarcas([]);
      return;
    }

    const cargarAsistencia = async () => {
      setLoading(true);
      try {
        const [est, lista] = await Promise.all([
          getEstudiantesPorCurso(cursoId),
          getAsistenciaPorFecha({ cursoId, fecha })
        ]);

        console.log('Estudiantes del curso:', est);
        console.log('Asistencia existente:', lista);

        setEstudiantes(est);

        // Crear un mapa de asistencia existente
        const mapa = new Map(lista.map(a => [a.estudianteId, a.estado]));

        // Generar marcas iniciales (usando PRESENTE como predeterminado)
        const marcasIniciales = est.map(e => ({
          estudianteId: e.id,
          fecha,
          estado: mapa.get(e.id) || 'PRESENTE'
        }));

        setMarcas(marcasIniciales);
      } catch (error) {
        console.error('Error al cargar asistencia:', error);
        alert('Error al cargar los datos de asistencia');
      } finally {
        setLoading(false);
      }
    };

    cargarAsistencia();
  }, [cursoId, fecha]);

  // Columnas de la tabla
  const columnas = useMemo(() => [
    { key: 'nombre', header: 'Estudiante' },
    {
      key: 'estado',
      header: 'Estado',
      render: (valor, fila) => {
        // Asegurarse de que fila tenga id
        if (!fila || !fila.id) {
          console.warn('Fila sin id:', fila);
          return null;
        }

        const idx = marcas.findIndex(m => m.estudianteId === fila.id);
        if (idx === -1) {
          console.warn('No se encontró marca para estudianteId:', fila.id);
          return null;
        }

        return (
          <select
            value={marcas[idx]?.estado}
            onChange={(e) => {
              const nuevasMarcas = [...marcas];
              nuevasMarcas[idx] = { ...nuevasMarcas[idx], estado: e.target.value };
              setMarcas(nuevasMarcas);
            }}
            disabled={loading}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              width: '100%'
            }}
          >
            {ESTADOS.map(es => (
              <option key={es.value} value={es.value}>
                {es.label}
              </option>
            ))}
          </select>
        );
      }
    }
  ], [marcas, loading]);

  const filas = useMemo(() => {
    // Combinar estudiantes con sus marcas (estado actual)
    return estudiantes.map(e => {
      const marca = marcas.find(m => m.estudianteId === e.id);
      return {
        id: e.id,
        nombre: e.nombre,
        estado: marca?.estado || 'PRESENTE' // Valor predeterminado
      };
    });
  }, [estudiantes, marcas]);

  const handleGuardar = async () => {
    try {
      const res = await guardarAsistencia(marcas);
      if (res.ok) {
        alert('Asistencia guardada correctamente');
      }
    } catch (error) {
      alert('Error al guardar asistencia: ' + error.message);
    }
  };

  return (
    <div>
      <BarraTitulo titulo="Control de Asistencia" subtitulo="Docente" />
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <SelectSimple
          value={cursoId}
          onChange={setCursoId}
          options={cursosOptions}
          etiqueta="Curso"
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          disabled={loading}
          style={{
            padding: '.5rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '1rem',
            width: '150px'
          }}
        />
        <button
          onClick={handleGuardar}
          disabled={loading}
          style={{
            padding: '.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Cargando...' : 'Guardar'}
        </button>
      </div>

      {loading ? (
        <p>Cargando estudiantes...</p>
      ) : (
        <Tabla columns={columnas} rows={filas} />
      )}
    </div>
  );
}