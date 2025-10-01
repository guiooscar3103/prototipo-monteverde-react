// src/pages/docente/RegistroCalificaciones.jsx

import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import SelectSimple from '../../components/SelectSimple';
import CampoNumero from '../../components/CampoNumero';
import Tabla from '../../components/Tabla';
import { getCursos, getEstudiantesPorCurso, getCalificacionesPor, guardarCalificaciones } from '../../services/api';

export default function RegistroCalificaciones() {
  const [cursos, setCursos] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]); 
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState('Matematicas');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2025-P2');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Definir las opciones de asignaturas y periodos
  const asignaturas = [
    { value: 'Matematicas', label: 'Matemáticas' },
    { value: 'Lenguaje', label: 'Lenguaje' },
    { value: 'Ciencias', label: 'Ciencias' }
  ];

  const periodos = [
    { value: '2025-P1', label: '2025-P1' },
    { value: '2025-P2', label: '2025-P2' },
    { value: '2025-P3', label: '2025-P3' }
  ];

  useEffect(() => {
    const cargarCursos = async () => {
      const data = await getCursos();
      console.log('Cursos cargados:', data);
      setCursos(data);
      if (data.length > 0) {
        setCursoSeleccionado(data[0].id);
      }
    };
    cargarCursos();
  }, []);

  useEffect(() => {
    if (cursoSeleccionado) {
      const cargarEstudiantesYCalif = async () => {
        setLoading(true);
        try {
          // Obtenemos los estudiantes del curso
          const estudiantes = await getEstudiantesPorCurso(cursoSeleccionado);
          console.log('Estudiantes del curso:', estudiantes);

          // Obtenemos las calificaciones existentes
          const califs = await getCalificacionesPor({
            cursoId: cursoSeleccionado,
            asignatura: asignaturaSeleccionada,
            periodo: periodoSeleccionado
          });
          console.log('Calificaciones encontradas:', califs);

          // Crear un mapa de calificaciones por estudianteId
          const califMap = {};
          califs.forEach(c => {
            califMap[c.estudianteId] = c;
          });

          // Combinar estudiantes con sus calificaciones
          const estudiantesConCalif = estudiantes.map(e => ({
            ...e,
            nota: califMap[e.id]?.nota || ''
          }));

          console.log('Estudiantes con calificaciones:', estudiantesConCalif);
          setCalificaciones(estudiantesConCalif);
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };
      cargarEstudiantesYCalif();
    }
  }, [cursoSeleccionado, asignaturaSeleccionada, periodoSeleccionado]);

  const handleNotaChange = (estudianteId, valor) => {
    setCalificaciones(prev =>
      prev.map(est =>
        est.id === estudianteId ? { ...est, nota: valor } : est
      )
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const nuevas = calificaciones
        .filter(est => est.nota !== '')
        .map(est => ({
          estudianteId: est.id,
          asignatura: asignaturaSeleccionada,
          periodo: periodoSeleccionado,
          nota: parseFloat(est.nota)
        }));

      console.log('Guardando calificaciones:', nuevas);
      await guardarCalificaciones(nuevas);
      alert('Calificaciones guardadas correctamente');
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const columnas = [
    { key: 'nombre', label: 'Estudiante' },
    {
      key: 'nota',
      label: 'Nota',
      render: (valor, fila) => (
        <CampoNumero
          value={valor}
          onChange={(v) => handleNotaChange(fila.id, v)}
          min="0"
          max="5"
          step="0.1"
        />
      )
    }
  ];

  return (
    <div className="grid">
      <h1>Gestión de Calificaciones</h1>

      <Card>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <SelectSimple
            label="Curso"
            value={cursoSeleccionado}
            onChange={(e) => {
              console.log('Curso seleccionado:', e);
              setCursoSeleccionado(e);
            }}
            options={cursos.map(c => ({ value: c.id, label: c.nombre }))}
          />
          <SelectSimple
            label="Asignatura"
            value={asignaturaSeleccionada}
            onChange={(e) => {
              console.log('Asignatura seleccionada:', e);
              setAsignaturaSeleccionada(e);
            }}
            options={asignaturas}
          />
          <SelectSimple
            label="Periodo"
            value={periodoSeleccionado}
            onChange={(e) => {
              console.log('Periodo seleccionado:', e);
              setPeriodoSeleccionado(e);
            }}
            options={periodos}
          />
        </div>
      </Card>

      {loading ? (
        <p>Cargando estudiantes...</p>
      ) : (
        <>
          <Card>
            <Tabla
              columns={columnas}
              rows={calificaciones}
            />
          </Card>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: guardando ? 'not-allowed' : 'pointer'
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar Calificaciones'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}