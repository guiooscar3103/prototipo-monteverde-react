import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCalificacionesEstudiante, getPeriodos } from '../../services/api';

export default function ReporteAcademico() {
  const { usuario } = useAuth();
  const [calificaciones, setCalificaciones] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar periodos disponibles al montar el componente
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const periodosData = await getPeriodos();
        setPeriodos(periodosData);
        
        // Seleccionar el período más reciente por defecto
        if (periodosData.length > 0) {
          setPeriodoSeleccionado(periodosData[periodosData.length - 1]);
        }
      } catch (err) {
        console.error('Error al cargar períodos:', err);
        setError('Error al cargar los períodos disponibles');
      }
    };

    cargarPeriodos();
  }, []);

  // Cargar calificaciones cuando cambia el usuario o el período seleccionado
  useEffect(() => {
    if (!usuario || !usuario.estudianteId || !periodoSeleccionado) {
      setLoading(false);
      return;
    }

    const cargarCalificaciones = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getCalificacionesEstudiante({
          estudianteId: usuario.estudianteId,
          periodo: periodoSeleccionado
        });
        
        setCalificaciones(data);
      } catch (err) {
        console.error('Error al cargar calificaciones:', err);
        setError('Error al cargar las calificaciones');
        setCalificaciones([]);
      } finally {
        setLoading(false);
      }
    };

    cargarCalificaciones();
  }, [usuario, periodoSeleccionado]);

  const handlePeriodoChange = (event) => {
    setPeriodoSeleccionado(event.target.value);
  };

  const calcularPromedio = () => {
    if (calificaciones.length === 0) return 0;
    const suma = calificaciones.reduce((acc, cal) => acc + parseFloat(cal.nota), 0);
    return (suma / calificaciones.length).toFixed(2);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Cargando reporte académico...</p>
      </div>
    );
  }

  if (!usuario || !usuario.estudianteId) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--error, #e74c3c)' }}>
          Error: No se pudo identificar el estudiante asociado
        </p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--brand)' }}>Reporte Académico</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="periodo-select" style={{ fontWeight: 'bold' }}>
            Período:
          </label>
          <select
            id="periodo-select"
            value={periodoSeleccionado}
            onChange={handlePeriodoChange}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="">Seleccionar período</option>
            {periodos.map(periodo => (
              <option key={periodo} value={periodo}>
                {periodo}
              </option>
            ))}
          </select>
        </div>
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

      {!periodoSeleccionado ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Selecciona un período para ver las calificaciones</p>
        </div>
      ) : (
        <>
          <p>
            <strong>Estudiante:</strong> {usuario.nombre} | 
            <strong> Período:</strong> {periodoSeleccionado}
          </p>

          <div className="card" style={{ marginTop: '1rem' }}>
            {calificaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No hay calificaciones registradas para este período</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ 
                    color: 'var(--brand)', 
                    margin: 0, 
                    fontSize: '1.1rem' 
                  }}>
                    Calificaciones del Período {periodoSeleccionado}
                  </h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '0.75rem', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold'
                      }}>
                        Asignatura
                      </th>
                      <th style={{ 
                        textAlign: 'center', 
                        padding: '0.75rem', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold'
                      }}>
                        Período
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '0.75rem', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold'
                      }}>
                        Nota
                      </th>
                      <th style={{ 
                        textAlign: 'center', 
                        padding: '0.75rem', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold'
                      }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {calificaciones.map((cal) => {
                      const nota = parseFloat(cal.nota);
                      const estado = nota >= 3.5 ? 'Aprobado' : 'Reprobado';
                      const colorEstado = nota >= 3.5 ? '#27ae60' : '#e74c3c';
                      
                      return (
                        <tr key={cal.id}>
                          <td style={{ 
                            padding: '0.75rem', 
                            borderBottom: '1px solid #eee',
                            fontWeight: '500'
                          }}>
                            {cal.asignatura}
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            borderBottom: '1px solid #eee',
                            textAlign: 'center'
                          }}>
                            {cal.periodo}
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '0.75rem', 
                            borderBottom: '1px solid #eee',
                            fontWeight: 'bold',
                            color: nota >= 3.5 ? '#27ae60' : '#e74c3c'
                          }}>
                            {nota.toFixed(1)}
                          </td>
                          <td style={{ 
                            textAlign: 'center', 
                            padding: '0.75rem', 
                            borderBottom: '1px solid #eee'
                          }}>
                            <span style={{
                              backgroundColor: colorEstado,
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 'bold' }}>
                    Total de Asignaturas: {calificaciones.length}
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Promedio General: {' '}
                    <span style={{ 
                      color: parseFloat(calcularPromedio()) >= 3.5 ? '#27ae60' : '#e74c3c' 
                    }}>
                      {calcularPromedio()}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
