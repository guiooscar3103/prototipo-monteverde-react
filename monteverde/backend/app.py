from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)

# ==========================================
# CORS SIMPLE Y DIRECTO
# ==========================================
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ==========================================
# CONFIGURACIONES
# ==========================================
app.config['SECRET_KEY'] = 'monteverde-secret-2025'

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'monteverde_db',
    'charset': 'utf8mb4'
}

def get_db_connection():
    """Crea y retorna una conexión a MySQL."""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as err:
        print(f"❌ Error BD: {err}")
        return None

# =====================================================
# RUTAS BÁSICAS / SALUD
# =====================================================

@app.route('/health', methods=['GET'])
def health():
    """Salud del servicio."""
    return jsonify({
        'status': 'OK',
        'message': 'API funcionando',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test-db', methods=['GET'])
def test_db():
    """Verificación rápida de conexión y una muestra de usuarios."""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'No conexión BD'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        count = cursor.fetchone()[0]

        cursor.execute("SELECT email, rol FROM usuarios LIMIT 3")
        users = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'usuarios_count': count,
            'sample_users': [{'email': u[0], 'rol': u[1]} for u in users]
        })

    except Exception as e:
        print(f"❌ Error test-db: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# AUTENTICACIÓN
# =====================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login simple (comparación directa de password por ahora)."""
    try:
        print("🔐 Login request recibido")

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data'}), 400

        email = data.get('email')
        password = data.get('password')

        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email y password requeridos'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        user = cursor.fetchone()

        print(f"👤 Usuario encontrado: {user}")

        if not user:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 401

        # ⚠️ Password simple por ahora (pendiente: hashing con bcrypt/werkzeug)
        if str(user['password']) == str(password):
            user_data = {
                'id': user['id'],
                'nombre': user['nombre'],
                'email': user['email'],
                'rol': user['rol']
            }

            token = jwt.encode({
                'user_id': user['id'],
                'email': user['email'],
                'rol': user['rol'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')

            if isinstance(token, bytes):
                token = token.decode('utf-8')

            cursor.close()
            conn.close()

            print("✅ Login exitoso")

            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': user_data,
                'token': token
            })
        else:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Password incorrecto'}), 401

    except Exception as e:
        print(f"❌ Error login: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# CURSOS
# =====================================================

@app.route('/api/cursos', methods=['GET'])
def get_cursos():
    """Obtener todos los cursos con total de estudiantes."""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                c.id,
                c.nombre,
                c.nivel,
                c.letra,
                COUNT(e.id) AS total_estudiantes
            FROM cursos c
            LEFT JOIN estudiantes e ON c.id = e.curso_id
            GROUP BY c.id, c.nombre, c.nivel, c.letra
            ORDER BY c.nivel, c.letra
        """)
        cursos = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': cursos})

    except Exception as e:
        print(f"❌ Error cursos: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# DASHBOARD DOCENTE
# =====================================================

@app.route('/api/docente/dashboard/<int:docente_id>', methods=['GET'])
def get_docente_dashboard(docente_id):
    """Obtener información del dashboard del docente."""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                c.id,
                c.nombre,
                c.nivel,
                c.letra,
                COUNT(e.id) AS total_estudiantes
            FROM cursos c
            LEFT JOIN estudiantes e ON c.id = e.curso_id
            GROUP BY c.id, c.nombre, c.nivel, c.letra
            ORDER BY c.nivel, c.letra
            LIMIT 5
        """)
        cursos = cursor.fetchall()

        cursor.execute("""
            SELECT 
                m.id,
                m.asunto,
                m.cuerpo,
                DATE_FORMAT(m.fecha, '%%Y-%%m-%%dT%%H:%%i:%%s') AS fecha,
                u.nombre AS emisor
            FROM mensajes m
            JOIN usuarios u ON m.emisor_id = u.id
            WHERE m.receptor_id = %s AND m.leido = 0
            ORDER BY m.fecha DESC
            LIMIT 3
        """, (docente_id,))
        mensajes = cursor.fetchall()

        cursor.close()
        conn.close()

        tareas_pendientes = [
            {'tipo': 'asistencia', 'curso': '7°B', 'descripcion': 'Registrar asistencia', 'urgencia': 'hoy'},
            {'tipo': 'calificaciones', 'curso': '8°A', 'descripcion': 'Calificar tareas de Matemáticas', 'urgencia': 'vence hoy'},
            {'tipo': 'boletines', 'curso': 'Todos', 'descripcion': 'Enviar boletines 2025-P2', 'urgencia': 'próximamente'}
        ]

        payload = {
            'cursos': cursos,
            'mensajes_pendientes': mensajes,
            'tareas_pendientes': tareas_pendientes,
            'estadisticas': {
                'total_cursos': len(cursos),
                'mensajes_no_leidos': len(mensajes),
                'estudiantes_total': sum(c['total_estudiantes'] for c in cursos) if cursos else 0
            }
        }

        return jsonify({'success': True, 'data': payload})

    except Exception as e:
        print(f"❌ Error dashboard docente: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# ENDPOINTS: MENSAJES Y ESTUDIANTES
# =====================================================

@app.route('/api/mensajes/<int:usuario_id>', methods=['GET'])
def get_mensajes(usuario_id):
    """Obtener mensajes de un usuario (entrantes y salientes)"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                m.id,
                m.emisor_id,
                m.receptor_id,
                m.asunto,
                m.cuerpo,
                m.leido,
                DATE_FORMAT(m.fecha, '%%Y-%%m-%%dT%%H:%%i:%%s') AS fecha,
                emisor.nombre   AS emisor_nombre,
                receptor.nombre AS receptor_nombre
            FROM mensajes m
            JOIN usuarios emisor   ON m.emisor_id = emisor.id
            JOIN usuarios receptor ON m.receptor_id = receptor.id
            WHERE m.receptor_id = %s OR m.emisor_id = %s
            ORDER BY m.fecha DESC
        """, (usuario_id, usuario_id))
        mensajes = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': mensajes})

    except Exception as e:
        print(f"❌ Error get_mensajes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
    """Obtener estudiantes con filtros opcionales (curso_id)."""
    try:
        curso_id = request.args.get('curso_id')

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)

        if curso_id:
            cursor.execute("""
                SELECT 
                    e.id, e.nombre, e.apellido, e.documento, e.curso_id,
                    c.nombre AS curso_nombre, c.nivel, c.letra
                FROM estudiantes e
                JOIN cursos c ON e.curso_id = c.id
                WHERE e.curso_id = %s
                ORDER BY e.nombre
            """, (curso_id,))
        else:
            cursor.execute("""
                SELECT 
                    e.id, e.nombre, e.apellido, e.documento, e.curso_id,
                    c.nombre AS curso_nombre, c.nivel, c.letra
                FROM estudiantes e
                JOIN cursos c ON e.curso_id = c.id
                ORDER BY c.nivel, c.letra, e.nombre
            """)

        estudiantes = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': estudiantes})

    except Exception as e:
        print(f"❌ Error get_estudiantes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# ENDPOINTS: CALIFICACIONES
# =====================================================

@app.route('/api/estudiantes/por-curso/<int:curso_id>', methods=['GET'])
def get_estudiantes_por_curso(curso_id):
    """Obtener estudiantes de un curso específico"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                e.id, e.nombre, e.curso_id,
                c.nombre AS curso_nombre, c.nivel, c.letra
            FROM estudiantes e
            JOIN cursos c ON e.curso_id = c.id
            WHERE e.curso_id = %s
            ORDER BY e.nombre
        """, (curso_id,))
        estudiantes = cursor.fetchall()
        conn.close()

        return jsonify({'success': True, 'data': estudiantes})

    except Exception as e:
        print(f"❌ Error estudiantes por curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/calificaciones/buscar', methods=['GET'])
def get_calificaciones_por():
    """Buscar calificaciones por curso, asignatura y periodo"""
    try:
        curso_id = request.args.get('cursoId')
        asignatura = request.args.get('asignatura')
        periodo = request.args.get('periodo')

        print(f"🔍 Buscando calificaciones: curso={curso_id}, asignatura={asignatura}, periodo={periodo}")

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                c.id, c.estudiante_id, c.asignatura, c.periodo, c.nota, c.fecha_registro,
                e.nombre AS estudiante_nombre
            FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE 1=1
        """
        params = []

        if curso_id:
            query += " AND e.curso_id = %s"
            params.append(curso_id)

        if asignatura:
            query += " AND c.asignatura = %s"
            params.append(asignatura)

        if periodo:
            query += " AND c.periodo = %s"
            params.append(periodo)

        query += " ORDER BY e.nombre"

        cursor.execute(query, params)
        calificaciones = cursor.fetchall()
        print(f"📊 Calificaciones encontradas: {len(calificaciones)}")
        conn.close()

        return jsonify({'success': True, 'data': calificaciones})

    except Exception as e:
        print(f"❌ Error buscar calificaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/calificaciones/guardar', methods=['POST'])
def guardar_calificaciones():
    """Guardar o actualizar calificaciones"""
    try:
        data = request.get_json()
        calificaciones = data.get('calificaciones', [])

        if not calificaciones:
            return jsonify({'success': False, 'message': 'No hay calificaciones para guardar'}), 400

        print(f"💾 Guardando {len(calificaciones)} calificaciones")

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor()

        for calif in calificaciones:
            estudiante_id = calif.get('estudianteId')
            asignatura = calif.get('asignatura')
            periodo = calif.get('periodo')
            nota = calif.get('nota')

            cursor.execute("""
                SELECT id FROM calificaciones 
                WHERE estudiante_id = %s AND asignatura = %s AND periodo = %s
            """, (estudiante_id, asignatura, periodo))
            existing = cursor.fetchone()

            if existing:
                cursor.execute("""
                    UPDATE calificaciones 
                    SET nota = %s, fecha_registro = CURDATE()
                    WHERE estudiante_id = %s AND asignatura = %s AND periodo = %s
                """, (nota, estudiante_id, asignatura, periodo))
                print(f"📝 Actualizada calificación para estudiante {estudiante_id}")
            else:
                cursor.execute("""
                    INSERT INTO calificaciones (estudiante_id, asignatura, periodo, nota, fecha_registro)
                    VALUES (%s, %s, %s, %s, CURDATE())
                """, (estudiante_id, asignatura, periodo, nota))
                print(f"✅ Nueva calificación para estudiante {estudiante_id}")

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Se guardaron {len(calificaciones)} calificaciones correctamente'
        })

    except Exception as e:
        print(f"❌ Error guardar calificaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    
# =====================================================
# ENDPOINTS: ASISTENCIA
# =====================================================

@app.route('/api/asistencia/por-fecha', methods=['GET'])
def get_asistencia_por_fecha():
    """Obtener asistencia por curso y fecha"""
    try:
        curso_id = request.args.get('cursoId')
        fecha = request.args.get('fecha')
        
        print(f"🔍 Buscando asistencia: curso={curso_id}, fecha={fecha}")

        if not curso_id or not fecha:
            return jsonify({'success': False, 'message': 'cursoId y fecha son requeridos'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                a.id,
                a.estudiante_id,
                a.fecha,
                a.estado,
                e.nombre AS estudiante_nombre
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE e.curso_id = %s AND a.fecha = %s
            ORDER BY e.nombre
        """, (curso_id, fecha))
        
        asistencia = cursor.fetchall()
        
        # Convertir a formato esperado por el frontend
        resultado = []
        for a in asistencia:
            resultado.append({
                'id': a['id'],
                'estudianteId': a['estudiante_id'],
                'fecha': a['fecha'].isoformat() if a['fecha'] else None,
                'estado': a['estado'],
                'estudiante_nombre': a['estudiante_nombre']
            })
        
        print(f"📊 Registros de asistencia encontrados: {len(resultado)}")
        conn.close()

        return jsonify({'success': True, 'data': resultado})

    except Exception as e:
        print(f"❌ Error asistencia por fecha: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/asistencia/guardar', methods=['POST'])
def guardar_asistencia():
    """Guardar o actualizar registros de asistencia"""
    try:
        data = request.get_json()
        marcas = data.get('marcas', [])
        
        if not marcas:
            return jsonify({'success': False, 'message': 'No hay registros de asistencia para guardar'}), 400
        
        print(f"💾 Guardando {len(marcas)} registros de asistencia")

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor()
        
        for marca in marcas:
            estudiante_id = marca.get('estudianteId')
            fecha = marca.get('fecha')
            estado = marca.get('estado')
            
            if not all([estudiante_id, fecha, estado]):
                continue
            
            # Verificar si ya existe un registro
            cursor.execute("""
                SELECT id FROM asistencia 
                WHERE estudiante_id = %s AND fecha = %s
            """, (estudiante_id, fecha))
            
            existing = cursor.fetchone()
            
            if existing:
                # Actualizar registro existente
                cursor.execute("""
                    UPDATE asistencia 
                    SET estado = %s
                    WHERE estudiante_id = %s AND fecha = %s
                """, (estado, estudiante_id, fecha))
                print(f"📝 Actualizada asistencia para estudiante {estudiante_id}")
            else:
                # Insertar nuevo registro
                cursor.execute("""
                    INSERT INTO asistencia (estudiante_id, fecha, estado)
                    VALUES (%s, %s, %s)
                """, (estudiante_id, fecha, estado))
                print(f"✅ Nueva asistencia para estudiante {estudiante_id}")
        
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Se guardaron {len(marcas)} registros de asistencia correctamente'
        })

    except Exception as e:
        print(f"❌ Error guardar asistencia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/asistencia/estadisticas', methods=['GET'])
def get_estadisticas_asistencia():
    """Obtener estadísticas de asistencia por curso y fecha"""
    try:
        curso_id = request.args.get('cursoId')
        fecha = request.args.get('fecha')
        
        if not curso_id or not fecha:
            return jsonify({'success': False, 'message': 'cursoId y fecha son requeridos'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        
        # Total de estudiantes en el curso
        cursor.execute("SELECT COUNT(*) as total FROM estudiantes WHERE curso_id = %s", (curso_id,))
        total_estudiantes = cursor.fetchone()['total']
        
        # Estadísticas por estado
        cursor.execute("""
            SELECT 
                a.estado,
                COUNT(*) as cantidad
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE e.curso_id = %s AND a.fecha = %s
            GROUP BY a.estado
        """, (curso_id, fecha))
        
        estadisticas_estado = cursor.fetchall()
        
        conn.close()
        
        # Crear resumen
        stats = {
            'total_estudiantes': total_estudiantes,
            'por_estado': {stat['estado']: stat['cantidad'] for stat in estadisticas_estado},
            'registrados': sum(stat['cantidad'] for stat in estadisticas_estado),
            'pendientes': total_estudiantes - sum(stat['cantidad'] for stat in estadisticas_estado)
        }

        return jsonify({'success': True, 'data': stats})

    except Exception as e:
        print(f"❌ Error estadísticas asistencia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# endpoints observaciones
# =====================================================

@app.route('/api/observaciones/por-curso/<int:curso_id>', methods=['GET'])
def get_observaciones_por_curso(curso_id):
    """Obtener observaciones de un curso específico"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        
        # ✅ Query CORREGIDA sin DATE_FORMAT problemático
        cursor.execute("""
            SELECT 
                o.id,
                o.estudiante_id,
                o.docente_id,
                o.fecha,
                o.tipo,
                o.detalle,
                e.nombre as estudiante_nombre,
                u.nombre as docente_nombre
            FROM observaciones o
            JOIN estudiantes e ON o.estudiante_id = e.id
            LEFT JOIN usuarios u ON o.docente_id = u.id
            WHERE e.curso_id = %s
            ORDER BY o.fecha DESC, o.id DESC
        """, (curso_id,))
        
        observaciones = cursor.fetchall()
        
        # ✅ Formatear fechas correctamente
        resultado = []
        for obs in observaciones:
            # Convertir fecha a string legible
            fecha_str = obs['fecha']
            if hasattr(obs['fecha'], 'strftime'):
                fecha_str = obs['fecha'].strftime('%Y-%m-%d')
            elif hasattr(obs['fecha'], 'isoformat'):
                fecha_str = obs['fecha'].isoformat()
            
            resultado.append({
                'id': obs['id'],
                'estudianteId': obs['estudiante_id'],
                'docenteId': obs['docente_id'],
                'fecha': fecha_str,
                'tipo': obs['tipo'],
                'detalle': obs['detalle'],
                'estudiante_nombre': obs['estudiante_nombre'],
                'docente_nombre': obs['docente_nombre']
            })
        
        print(f"📊 Observaciones encontradas para curso {curso_id}: {len(resultado)}")
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': resultado})

    except Exception as e:
        print(f"❌ Error observaciones por curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# MENSAJES DOCENTE
# =====================================================

@app.route('/api/usuarios/familia', methods=['GET'])
def get_familias():
    """Obtener usuarios familia"""
    try:
        print("👨‍👩‍👧‍👦 Solicitando familias...")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre, email, rol
            FROM usuarios
            WHERE rol = 'familia'
            ORDER BY nombre
        """)
        
        usuarios = cursor.fetchall()
        cursor.close()
        conn.close()

        print(f"✅ Familias encontradas: {len(usuarios)}")
        return jsonify({'success': True, 'data': usuarios})

    except Exception as e:
        print(f"❌ Error familias: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/usuario/<int:usuario_id>', methods=['GET'])
def get_usuario_por_id_simple(usuario_id):
    """Obtener usuario por ID"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre, email, rol FROM usuarios WHERE id = %s", (usuario_id,))
        
        usuario_data = cursor.fetchone()
        cursor.close()
        conn.close()

        if not usuario_data:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        return jsonify({'success': True, 'data': usuario_data})

    except Exception as e:
        print(f"❌ Error usuario por ID: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/conversacion/<int:usuario1>/<int:usuario2>', methods=['GET'])
def get_conversacion_entre_usuarios(usuario1, usuario2):
    """Obtener conversación entre dos usuarios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                m.id,
                m.emisor_id,
                m.receptor_id,
                m.asunto,
                m.cuerpo,
                m.leido,
                DATE_FORMAT(m.fecha, '%%Y-%%m-%%d %%H:%%i:%%s') as fecha,
                emisor.nombre as emisor_nombre,
                receptor.nombre as receptor_nombre
            FROM mensajes m
            JOIN usuarios emisor ON m.emisor_id = emisor.id
            JOIN usuarios receptor ON m.receptor_id = receptor.id
            WHERE (m.emisor_id = %s AND m.receptor_id = %s) 
               OR (m.emisor_id = %s AND m.receptor_id = %s)
            ORDER BY m.fecha ASC
        """, (usuario1, usuario2, usuario2, usuario1))
        
        mensajes = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': mensajes})

    except Exception as e:
        print(f"❌ Error conversación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mensajes/enviar', methods=['POST'])
def enviar_mensaje_nuevo():
    """Enviar nuevo mensaje"""
    try:
        data = request.get_json()
        
        emisor_id = data.get('emisorId')
        receptor_id = data.get('receptorId')
        asunto = data.get('asunto', 'Sin asunto')
        cuerpo = data.get('cuerpo')
        
        if not all([emisor_id, receptor_id, cuerpo]):
            return jsonify({
                'success': False, 
                'message': 'Faltan campos: emisorId, receptorId, cuerpo'
            }), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO mensajes (emisor_id, receptor_id, asunto, cuerpo, fecha, leido)
            VALUES (%s, %s, %s, %s, NOW(), 0)
        """, (emisor_id, receptor_id, asunto, cuerpo))
        
        conn.commit()
        mensaje_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # Retornar el mensaje recién creado
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                m.id,
                m.emisor_id as emisorId,
                m.receptor_id as receptorId,
                m.asunto,
                m.cuerpo,
                m.leido,
                DATE_FORMAT(m.fecha, '%%Y-%%m-%%d %%H:%%i:%%s') as fecha
            FROM mensajes m
            WHERE m.id = %s
        """, (mensaje_id,))
        
        mensaje_creado = cursor.fetchone()
        cursor.close()
        conn.close()

        print(f"✅ Mensaje creado con ID: {mensaje_id}")
        return jsonify({'success': True, 'data': mensaje_creado})

    except Exception as e:
        print(f"❌ Error enviar mensaje: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mensajes/marcar-leido/<int:mensaje_id>', methods=['PUT'])
def marcar_mensaje_como_leido(mensaje_id):
    """Marcar mensaje como leído"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor()
        cursor.execute("UPDATE mensajes SET leido = 1 WHERE id = %s", (mensaje_id,))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Mensaje marcado como leído'})

    except Exception as e:
        print(f"❌ Error marcar leído: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# FAMILIA - ENDPOINTS PARA PADRES DE FAMILIA
# =====================================================

@app.route('/api/familia/dashboard/<int:familia_id>', methods=['GET'])
def get_familia_dashboard(familia_id):
    """Dashboard para familia - resumen de sus hijos"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        
        # ✅ QUERY CORREGIDO para tu estructura real
        cursor.execute("""
            SELECT 
                e.id,
                e.nombre,
                e.curso_id,
                c.nombre as curso_nombre,
                c.nivel,
                c.letra
            FROM usuarios u
            JOIN estudiantes e ON u.estudiante_id = e.id
            JOIN cursos c ON e.curso_id = c.id
            WHERE u.id = %s AND u.rol = 'familia'
        """, (familia_id,))
        
        estudiantes = cursor.fetchall()
        
        print(f"🏠 Estudiantes encontrados para familia {familia_id}: {len(estudiantes)}")
        print(f"🏠 Datos: {estudiantes}")
        
        if not estudiantes:
            cursor.close()
            conn.close()
            return jsonify({
                'success': True, 
                'data': {
                    'hijos': [],
                    'total_hijos': 0
                }
            })
        
        # Para cada estudiante, obtener resumen de calificaciones
        resumen_hijos = []
        for estudiante in estudiantes:
            # Promedio de calificaciones
            cursor.execute("""
                SELECT AVG(nota) as promedio, COUNT(*) as total_notas
                FROM calificaciones
                WHERE estudiante_id = %s
            """, (estudiante['id'],))
            
            calificaciones = cursor.fetchone()
            
            # Asistencia del mes actual
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_dias,
                    SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) as dias_presentes
                FROM asistencia
                WHERE estudiante_id = %s 
                AND MONTH(fecha) = MONTH(CURDATE())
                AND YEAR(fecha) = YEAR(CURDATE())
            """, (estudiante['id'],))
            
            asistencia = cursor.fetchone()
            
            # Observaciones recientes
            cursor.execute("""
                SELECT COUNT(*) as total_observaciones
                FROM observaciones
                WHERE estudiante_id = %s
                AND DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            """, (estudiante['id'],))
            
            observaciones = cursor.fetchone()
            
            resumen_hijos.append({
                'id': estudiante['id'],
                'nombre': estudiante['nombre'],
                'grado': f"{estudiante['nivel']}{estudiante['letra']}" if estudiante['nivel'] and estudiante['letra'] else 'Sin grado',
                'curso': estudiante['curso_nombre'],
                'curso_id': estudiante['curso_id'],
                'promedio': float(calificaciones['promedio'] or 0),
                'total_notas': calificaciones['total_notas'] or 0,
                'asistencia_porcentaje': (
                    (asistencia['dias_presentes'] / asistencia['total_dias'] * 100) 
                    if asistencia['total_dias'] > 0 else 100
                ),
                'dias_presentes': asistencia['dias_presentes'] or 0,
                'total_dias': asistencia['total_dias'] or 0,
                'observaciones_mes': observaciones['total_observaciones'] or 0
            })
        
        cursor.close()
        conn.close()

        print(f"✅ Dashboard familia generado: {resumen_hijos}")

        return jsonify({
            'success': True, 
            'data': {
                'hijos': resumen_hijos,
                'total_hijos': len(resumen_hijos)
            }
        })

    except Exception as e:
        print(f"❌ Error dashboard familia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500



@app.route('/api/familia/hijo-calificaciones/<int:estudiante_id>', methods=['GET'])
def get_calificaciones_hijo(estudiante_id):
    """Obtener calificaciones específicas de un hijo"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                c.id,
                c.asignatura,
                c.periodo,
                c.nota,
                DATE_FORMAT(c.fecha_registro, '%%Y-%%m-%%d') as fecha
            FROM calificaciones c
            WHERE c.estudiante_id = %s
            ORDER BY c.fecha_registro DESC, c.asignatura
        """, (estudiante_id,))
        
        calificaciones = cursor.fetchall()
        
        print(f"📊 Calificaciones encontradas para estudiante {estudiante_id}: {len(calificaciones)}")
        print(f"📊 Datos: {calificaciones}")
        
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': calificaciones})

    except Exception as e:
        print(f"❌ Error calificaciones hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/familia/hijo-asistencia/<int:estudiante_id>', methods=['GET'])
def get_asistencia_hijo(estudiante_id):
    """Obtener asistencia específica de un hijo"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                a.id,
                DATE_FORMAT(a.fecha, '%%Y-%%m-%%d') as fecha,
                a.estado,
                a.observaciones
            FROM asistencia a
            WHERE a.estudiante_id = %s
            ORDER BY a.fecha DESC
        """, (estudiante_id,))
        
        asistencia = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': asistencia})

    except Exception as e:
        print(f"❌ Error asistencia hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/familia/hijo-observaciones/<int:estudiante_id>', methods=['GET'])
def get_observaciones_hijo(estudiante_id):
    """Obtener observaciones específicas de un hijo"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                o.id,
                DATE_FORMAT(o.fecha, '%%Y-%%m-%%d') as fecha,
                o.tipo,
                o.detalle,
                u.nombre as docente_nombre
            FROM observaciones o
            JOIN usuarios u ON o.docente_id = u.id
            WHERE o.estudiante_id = %s
            ORDER BY o.fecha DESC
        """, (estudiante_id,))
        
        observaciones = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': observaciones})

    except Exception as e:
        print(f"❌ Error observaciones hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/usuarios/docentes', methods=['GET'])
def get_docentes():
    """Obtener usuarios docentes para mensajes"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error BD'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre, email, rol
            FROM usuarios
            WHERE rol = 'docente'
            ORDER BY nombre
        """)
        
        docentes = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': docentes})

    except Exception as e:
        print(f"❌ Error docentes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# =====================================================
# MAIN
# =====================================================

if __name__ == '__main__':
    print("🚀 MonteVerde API iniciando...")
    print("🌐 http://localhost:5000")
    print("🔗 CORS permitido: http://localhost:5173")
    app.run(debug=True, port=5000, host='localhost')
