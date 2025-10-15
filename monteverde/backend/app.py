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
# NUEVOS ENDPOINTS: MENSAJES Y ESTUDIANTES
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
# NUEVOS ENDPOINTS: CALIFICACIONES
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
# MAIN
# =====================================================

if __name__ == '__main__':
    print("🚀 MonteVerde API iniciando...")
    print("🌐 http://localhost:5000")
    print("🔗 CORS permitido: http://localhost:5173")
    app.run(debug=True, port=5000, host='localhost')
