// src/pages/familia/Home.jsx

import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCalificacionesPor } from '../../services/api';

export default function FamiliaHome() {
  const { usuario } = useAuth();
  const [promedio, setPromedio] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;

    const cargarPromedio = async () => {
      try {
        // Usar el mismo valor que en db.json: "Matematicas" (sin tilde)
        const cursoId = 1;
        const asignatura = "Matematicas"; // 👈 Corregido: sin tilde
        const periodo = "2025-P2";

        const data = await getCalificacionesPor({ cursoId, asignatura, periodo });

        console.log('Calificaciones encontradas:', data);

        if (data.length > 0) {
          const total = data.reduce((sum, c) => sum + c.nota, 0);
          setPromedio(total / data.length);
        }
      } catch (err) {
        console.error('Error al cargar promedio:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarPromedio();
  }, [usuario]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</div>;
  }

  return (
    <div className="grid">
      <h1 style={{ color: 'var(--brand)' }}>Bienvenido, {usuario?.nombre}</h1>
      <p>Aquí tienes un resumen de la información académica de tu hijo/a.</p>

      <div className="grid grid-3">
        <Card
          title="Promedio General"
          action={<ButtonLink to="/familia/reporte" variant="primary">Ver boletín completo</ButtonLink>}
        >
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--brand-2)' }}>
            {promedio.toFixed(2)}
          </div>
          <small style={{ color: 'var(--muted)' }}>Último periodo: 2025-P2</small>
        </Card>

        <Card
          title="Último Mensaje Docente"
          action={<ButtonLink to="/familia/mensajes" variant="primary">Leer mensaje</ButtonLink>}
        >
          <div>Falta de tareas</div>
          <small style={{ color: 'var(--muted)' }}>Recibido hoy</small>
        </Card>

        <Card title="Noticias del Colegio">
          <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.9 }}>
            <li><strong>10/09:</strong> Reunión general de padres a las 6:00 PM.</li>
            <li><strong>20/09:</strong> Salida pedagógica al museo de ciencias.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}