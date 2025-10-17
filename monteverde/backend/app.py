from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
from src.extensions import db
from config import Config
from sqlalchemy import extract, and_, func

# ✅ IMPORTS DIRECTOS (más seguro)
from src.models.mensaje import Mensaje
from src.models.usuario import Usuario
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.models.calificacion import Calificacion
from src.models.asistencia import Asistencia
from src.models.observacion import Observacion

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Inicializar extensiones
    db.init_app(app)
    
    # CORS SIMPLE Y DIRECTO
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    return app

app = create_app()

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
    """Verificación rápida de conexión."""
    try:
        count = Usuario.query.count()
        users = Usuario.query.limit(3).all()
        return jsonify({
            'success': True,
            'usuarios_count': count,
            'sample_users': [{'email': u.email, 'rol': u.rol} for u in users]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# AUTENTICACIÓN
# =====================================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login con SQLAlchemy."""
    try:
        print("🔐 Login request recibido")
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data'}), 400
            
        email = data.get('email')
        password = data.get('password')
        print(f"📧 Email: {email}")
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email y password requeridos'}), 400

        user = Usuario.query.filter_by(email=email).first()
        print(f"👤 Usuario encontrado: {user}")
        
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 401
        
        # Verificar password (simple por ahora)
        if str(user.password) == str(password):
            user_data = user.to_dict()
            
            token = jwt.encode({
                'user_id': user.id,
                'email': user.email,
                'rol': user.rol,
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            print("✅ Login exitoso")
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': user_data,
                'token': token
            })
        else:
            return jsonify({'success': False, 'message': 'Password incorrecto'}), 401
            
    except Exception as e:
        print(f"❌ Error login: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# CURSOS
# =====================================================
@app.route('/api/cursos', methods=['GET'])
def get_cursos():
    """Obtener cursos con conteo de estudiantes."""
    try:
        cursos = db.session.query(
            Curso.id,
            Curso.nombre,
            Curso.nivel,
            Curso.letra,
            func.count(Estudiante.id).label('total_estudiantes')
        ).outerjoin(Estudiante).group_by(Curso.id).order_by(Curso.nivel, Curso.letra).all()
        
        cursos_data = []
        for curso in cursos:
            cursos_data.append({
                'id': curso.id,
                'nombre': curso.nombre,
                'nivel': curso.nivel,
                'letra': curso.letra,
                'total_estudiantes': curso.total_estudiantes
            })
            
        return jsonify({'success': True, 'data': cursos_data})
    except Exception as e:
        print(f"❌ Error cursos: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# DASHBOARD DOCENTE
# =====================================================
@app.route('/api/docente/dashboard/<int:docente_id>', methods=['GET'])
def get_docente_dashboard(docente_id):
    """Dashboard del docente."""
    try:
        # Obtener cursos con conteo de estudiantes
        cursos = db.session.query(
            Curso.id,
            Curso.nombre,
            Curso.nivel,
            Curso.letra,
            func.count(Estudiante.id).label('total_estudiantes')
        ).outerjoin(Estudiante).group_by(Curso.id).order_by(Curso.nivel, Curso.letra).limit(5).all()
        
        cursos_data = [{'id': c.id, 'nombre': c.nombre, 'nivel': c.nivel, 'letra': c.letra, 'total_estudiantes': c.total_estudiantes} for c in cursos]
        
        # Mensajes no leídos para el docente
        mensajes = Mensaje.query.filter_by(receptor_id=docente_id, leido=False).join(Usuario, Mensaje.emisor_id == Usuario.id).limit(3).all()
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            msg_dict['emisor'] = emisor.nombre if emisor else 'Desconocido'
            mensajes_data.append(msg_dict)
        
        # Tareas pendientes estáticas
        tareas_pendientes = [
            {'tipo': 'asistencia', 'curso': '7°B', 'descripcion': 'Registrar asistencia', 'urgencia': 'hoy'},
            {'tipo': 'calificaciones', 'curso': '8°A', 'descripcion': 'Calificar tareas de Matemáticas', 'urgencia': 'vence hoy'},
            {'tipo': 'boletines', 'curso': 'Todos', 'descripcion': 'Enviar boletines 2025-P2', 'urgencia': 'próximamente'}
        ]
        
        payload = {
            'cursos': cursos_data,
            'mensajes_pendientes': mensajes_data,
            'tareas_pendientes': tareas_pendientes,
            'estadisticas': {
                'total_cursos': len(cursos_data),
                'mensajes_no_leidos': len(mensajes_data),
                'estudiantes_total': sum(c['total_estudiantes'] for c in cursos_data)
            }
        }
        return jsonify({'success': True, 'data': payload})
    except Exception as e:
        print(f"❌ Error dashboard docente: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# MENSAJES (100% SQLAlchemy)
# =====================================================
@app.route('/api/mensajes/<int:usuario_id>', methods=['GET'])
def get_mensajes(usuario_id):
    """Obtener mensajes usando SQLAlchemy ORM."""
    try:
        print(f"🔍 Obteniendo mensajes para usuario: {usuario_id}")
        
        mensajes = Mensaje.query.filter(
            (Mensaje.receptor_id == usuario_id) | (Mensaje.emisor_id == usuario_id)
        ).order_by(Mensaje.fecha.desc()).all()
        
        print(f"📧 Mensajes encontrados: {len(mensajes)}")

        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            receptor = Usuario.query.get(msg.receptor_id)
            msg_dict['emisor_nombre'] = emisor.nombre if emisor else None
            msg_dict['receptor_nombre'] = receptor.nombre if receptor else None
            mensajes_data.append(msg_dict)

        return jsonify({'success': True, 'data': mensajes_data})
    except Exception as e:
        print(f"❌ Error get_mensajes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/conversacion/<int:usuario1>/<int:usuario2>', methods=['GET'])
def get_conversacion_entre_usuarios(usuario1, usuario2):
    """Conversación entre dos usuarios."""
    try:
        mensajes = Mensaje.query.filter(
            ((Mensaje.emisor_id == usuario1) & (Mensaje.receptor_id == usuario2)) |
            ((Mensaje.emisor_id == usuario2) & (Mensaje.receptor_id == usuario1))
        ).order_by(Mensaje.fecha.asc()).all()
        
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            receptor = Usuario.query.get(msg.receptor_id)
            msg_dict['emisor_nombre'] = emisor.nombre if emisor else None
            msg_dict['receptor_nombre'] = receptor.nombre if receptor else None
            mensajes_data.append(msg_dict)
            
        return jsonify({'success': True, 'data': mensajes_data})
    except Exception as e:
        print(f"❌ Error conversación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mensajes/enviar', methods=['POST'])
def enviar_mensaje_nuevo():
    """Enviar nuevo mensaje."""
    try:
        data = request.get_json()
        emisor_id = data.get('emisorId')
        receptor_id = data.get('receptorId')
        asunto = data.get('asunto', 'Sin asunto')
        cuerpo = data.get('cuerpo')
        
        if not all([emisor_id, receptor_id, cuerpo]):
            return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400
            
        mensaje = Mensaje(
            emisor_id=emisor_id,
            receptor_id=receptor_id,
            asunto=asunto,
            cuerpo=cuerpo,
            fecha=datetime.now(),
            leido=False
        )
        
        db.session.add(mensaje)
        db.session.commit()
        
        print(f"✅ Mensaje creado con ID: {mensaje.id}")
        return jsonify({'success': True, 'data': mensaje.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error enviar mensaje: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mensajes/marcar-leido/<int:mensaje_id>', methods=['PUT'])
def marcar_mensaje_como_leido(mensaje_id):
    """Marcar mensaje como leído."""
    try:
        mensaje = Mensaje.query.get(mensaje_id)
        if not mensaje:
            return jsonify({'success': False, 'message': 'Mensaje no encontrado'}), 404
            
        mensaje.leido = True
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Mensaje marcado como leído'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error marcar leído: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# USUARIOS
# =====================================================
@app.route('/api/usuarios/familia', methods=['GET'])
def get_familias():
    """Obtener usuarios familia."""
    try:
        print("👨‍👩‍👧‍👦 Solicitando familias...")
        familias = Usuario.query.filter_by(rol='familia').order_by(Usuario.nombre).all()
        print(f"✅ Familias encontradas: {len(familias)}")
        return jsonify({'success': True, 'data': [f.to_dict() for f in familias]})
    except Exception as e:
        print(f"❌ Error familias: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/usuarios/docentes', methods=['GET'])
def get_docentes():
    """Obtener usuarios docentes."""
    try:
        docentes = Usuario.query.filter_by(rol='docente').order_by(Usuario.nombre).all()
        return jsonify({'success': True, 'data': [d.to_dict() for d in docentes]})
    except Exception as e:
        print(f"❌ Error docentes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/usuario/<int:usuario_id>', methods=['GET'])
def get_usuario_por_id_simple(usuario_id):
    """Obtener usuario por ID."""
    try:
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        return jsonify({'success': True, 'data': usuario.to_dict()})
    except Exception as e:
        print(f"❌ Error usuario por ID: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# ESTUDIANTES
# =====================================================
@app.route('/api/estudiantes/por-curso/<int:curso_id>', methods=['GET'])
def get_estudiantes_por_curso(curso_id):
    """Estudiantes de un curso."""
    try:
        estudiantes = db.session.query(Estudiante, Curso).join(Curso).filter(Estudiante.curso_id == curso_id).order_by(Estudiante.nombre).all()
        
        estudiantes_data = []
        for estudiante, curso in estudiantes:
            est_dict = estudiante.to_dict()
            est_dict['curso_nombre'] = curso.nombre
            est_dict['nivel'] = curso.nivel
            est_dict['letra'] = curso.letra
            estudiantes_data.append(est_dict)
            
        return jsonify({'success': True, 'data': estudiantes_data})
    except Exception as e:
        print(f"❌ Error estudiantes por curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# CALIFICACIONES
# =====================================================
@app.route('/api/calificaciones/buscar', methods=['GET'])
def get_calificaciones_por():
    """Buscar calificaciones con filtros."""
    try:
        curso_id = request.args.get('cursoId')
        asignatura = request.args.get('asignatura')
        periodo = request.args.get('periodo')
        print(f"🔍 Buscando calificaciones: curso={curso_id}, asignatura={asignatura}, periodo={periodo}")
        
        query = db.session.query(Calificacion, Estudiante).join(Estudiante)
        
        if curso_id:
            query = query.filter(Estudiante.curso_id == curso_id)
        if asignatura:
            query = query.filter(Calificacion.asignatura == asignatura)
        if periodo:
            query = query.filter(Calificacion.periodo == periodo)
            
        calificaciones = query.order_by(Estudiante.nombre).all()
        
        calificaciones_data = []
        for calificacion, estudiante in calificaciones:
            cal_dict = calificacion.to_dict()
            cal_dict['estudiante_nombre'] = estudiante.nombre
            calificaciones_data.append(cal_dict)
            
        print(f"📊 Calificaciones encontradas: {len(calificaciones_data)}")
        return jsonify({'success': True, 'data': calificaciones_data})
    except Exception as e:
        print(f"❌ Error buscar calificaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/calificaciones/guardar', methods=['POST'])
def guardar_calificaciones():
    """Guardar/actualizar calificaciones."""
    try:
        data = request.get_json()
        calificaciones = data.get('calificaciones', [])
        
        if not calificaciones:
            return jsonify({'success': False, 'message': 'No hay calificaciones para guardar'}), 400
            
        print(f"💾 Guardando {len(calificaciones)} calificaciones")
        
        for calif in calificaciones:
            estudiante_id = calif.get('estudianteId')
            asignatura = calif.get('asignatura')
            periodo = calif.get('periodo')
            nota = calif.get('nota')
            
            existing = Calificacion.query.filter_by(
                estudiante_id=estudiante_id,
                asignatura=asignatura,
                periodo=periodo
            ).first()
            
            if existing:
                existing.nota = nota
                existing.fecha_registro = datetime.now()
                print(f"📝 Actualizada calificación para estudiante {estudiante_id}")
            else:
                nueva_cal = Calificacion(
                    estudiante_id=estudiante_id,
                    asignatura=asignatura,
                    periodo=periodo,
                    nota=nota,
                    fecha_registro=datetime.now()
                )
                db.session.add(nueva_cal)
                print(f"✅ Nueva calificación para estudiante {estudiante_id}")
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'Se guardaron {len(calificaciones)} calificaciones correctamente'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error guardar calificaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# ASISTENCIA
# =====================================================
@app.route('/api/asistencia/por-fecha', methods=['GET'])
def get_asistencia_por_fecha():
    """Asistencia por curso y fecha."""
    try:
        curso_id = request.args.get('cursoId')
        fecha = request.args.get('fecha')
        print(f"🔍 Buscando asistencia: curso={curso_id}, fecha={fecha}")
        
        if not curso_id or not fecha:
            return jsonify({'success': False, 'message': 'cursoId y fecha son requeridos'}), 400
            
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        
        asistencias = db.session.query(Asistencia, Estudiante).join(Estudiante).filter(
            Estudiante.curso_id == curso_id,
            Asistencia.fecha == fecha_obj
        ).order_by(Estudiante.nombre).all()
        
        asistencia_data = []
        for asistencia, estudiante in asistencias:
            asist_dict = {
                'id': asistencia.id,
                'estudianteId': asistencia.estudiante_id,
                'fecha': asistencia.fecha.isoformat() if asistencia.fecha else None,
                'estado': asistencia.estado,
                'estudiante_nombre': estudiante.nombre
            }
            asistencia_data.append(asist_dict)
            
        print(f"📊 Registros de asistencia encontrados: {len(asistencia_data)}")
        return jsonify({'success': True, 'data': asistencia_data})
    except Exception as e:
        print(f"❌ Error asistencia por fecha: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/asistencia/guardar', methods=['POST'])
def guardar_asistencia():
    """Guardar/actualizar asistencia."""
    try:
        data = request.get_json()
        marcas = data.get('marcas', [])
        
        if not marcas:
            return jsonify({'success': False, 'message': 'No hay registros de asistencia para guardar'}), 400
            
        print(f"💾 Guardando {len(marcas)} registros de asistencia")
        
        for marca in marcas:
            estudiante_id = marca.get('estudianteId')
            fecha = marca.get('fecha')
            estado = marca.get('estado')
            
            if not all([estudiante_id, fecha, estado]):
                continue
                
            fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
            
            existing = Asistencia.query.filter_by(
                estudiante_id=estudiante_id,
                fecha=fecha_obj
            ).first()
            
            if existing:
                existing.estado = estado
                print(f"📝 Actualizada asistencia para estudiante {estudiante_id}")
            else:
                nueva_asist = Asistencia(
                    estudiante_id=estudiante_id,
                    fecha=fecha_obj,
                    estado=estado
                )
                db.session.add(nueva_asist)
                print(f"✅ Nueva asistencia para estudiante {estudiante_id}")
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'Se guardaron {len(marcas)} registros de asistencia correctamente'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error guardar asistencia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/asistencia/estadisticas', methods=['GET'])
def get_estadisticas_asistencia():
    """Estadísticas de asistencia."""
    try:
        curso_id = request.args.get('cursoId')
        fecha = request.args.get('fecha')
        
        if not curso_id or not fecha:
            return jsonify({'success': False, 'message': 'cursoId y fecha son requeridos'}), 400
            
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        
        total_estudiantes = Estudiante.query.filter_by(curso_id=curso_id).count()
        
        estadisticas = db.session.query(
            Asistencia.estado,
            func.count(Asistencia.id).label('cantidad')
        ).join(Estudiante).filter(
            Estudiante.curso_id == curso_id,
            Asistencia.fecha == fecha_obj
        ).group_by(Asistencia.estado).all()
        
        por_estado = {est.estado: est.cantidad for est in estadisticas}
        registrados = sum(por_estado.values())
        
        stats = {
            'total_estudiantes': total_estudiantes,
            'por_estado': por_estado,
            'registrados': registrados,
            'pendientes': total_estudiantes - registrados
        }
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        print(f"❌ Error estadísticas asistencia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# OBSERVACIONES ✅ CORREGIDO
# =====================================================
@app.route('/api/observaciones/por-curso/<int:curso_id>', methods=['GET'])
def get_observaciones_por_curso(curso_id):
    """Observaciones por curso - CONSULTA CORREGIDA."""
    try:
        print(f"🔍 Obteniendo observaciones para curso: {curso_id}")
        
        # ✅ CONSULTA EXPLÍCITA Y CORREGIDA
        observaciones = db.session.query(
            Observacion,
            Estudiante,
            Usuario
        ).join(
            Estudiante, Observacion.estudiante_id == Estudiante.id
        ).outerjoin(
            Usuario, Observacion.docente_id == Usuario.id  
        ).filter(
            Estudiante.curso_id == curso_id
        ).order_by(
            Observacion.fecha.desc(), 
            Observacion.id.desc()
        ).all()
        
        observaciones_data = []
        for observacion, estudiante, docente in observaciones:
            obs_dict = {
                'id': observacion.id,
                'estudianteId': observacion.estudiante_id,
                'docenteId': observacion.docente_id,
                'fecha': observacion.fecha.isoformat() if observacion.fecha else None,
                'tipo': observacion.tipo,
                'detalle': observacion.detalle,
                'estudiante_nombre': estudiante.nombre,
                'docente_nombre': docente.nombre if docente else None
            }
            observaciones_data.append(obs_dict)
        
        print(f"📊 Observaciones encontradas para curso {curso_id}: {len(observaciones_data)}")
        return jsonify({'success': True, 'data': observaciones_data})
        
    except Exception as e:
        print(f"❌ Error observaciones por curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/observaciones/agregar', methods=['POST'])
def agregar_observacion():
    """Agregar nueva observación - ENDPOINT NUEVO."""
    try:
        print("📝 Recibiendo nueva observación...")
        data = request.get_json()
        
        estudiante_id = data.get('estudianteId')
        docente_id = data.get('docenteId')  
        fecha = data.get('fecha')
        tipo = data.get('tipo')
        detalle = data.get('detalle')
        
        print(f"Datos recibidos: {data}")
        
        if not all([estudiante_id, docente_id, fecha, tipo, detalle]):
            return jsonify({
                'success': False, 
                'message': 'Faltan campos requeridos: estudianteId, docenteId, fecha, tipo, detalle'
            }), 400
        
        # Crear la observación
        obs = Observacion(
            estudiante_id=estudiante_id,
            docente_id=docente_id,
            fecha=datetime.strptime(fecha, '%Y-%m-%d').date(),  # ✅ .date() para que coincida con el modelo
            tipo=tipo,
            detalle=detalle
        )
        
        db.session.add(obs)
        db.session.commit()
        
        print(f"✅ Observación creada con ID: {obs.id}")
        return jsonify({'success': True, 'data': obs.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error agregar observación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# FAMILIA - DASHBOARD Y REPORTES
# =====================================================
@app.route('/api/familia/dashboard/<int:familia_id>', methods=['GET'])
def get_familia_dashboard(familia_id):
    """Dashboard familiar."""
    try:
        # Obtener el usuario familia y su estudiante asociado
        familia = Usuario.query.get(familia_id)
        if not familia or familia.rol != 'familia':
            return jsonify({'success': False, 'message': 'Familia no encontrada'}), 404
            
        if not familia.estudiante_id:
            return jsonify({'success': True, 'data': {'hijos': [], 'total_hijos': 0}})
            
        estudiante = Estudiante.query.get(familia.estudiante_id)
        if not estudiante:
            return jsonify({'success': True, 'data': {'hijos': [], 'total_hijos': 0}})
            
        curso = Curso.query.get(estudiante.curso_id)
        
        print(f"🏠 Estudiantes encontrados para familia {familia_id}: 1")
        
        # Calcular estadísticas del estudiante
        calificaciones = Calificacion.query.filter_by(estudiante_id=estudiante.id).all()
        promedio = sum(c.nota for c in calificaciones) / len(calificaciones) if calificaciones else 0
        
        # Asistencia del mes actual
        asistencias_mes = Asistencia.query.filter(
            Asistencia.estudiante_id == estudiante.id,
            extract('month', Asistencia.fecha) == datetime.now().month,
            extract('year', Asistencia.fecha) == datetime.now().year
        ).all()
        
        dias_presentes = len([a for a in asistencias_mes if a.estado == 'Presente'])
        total_dias = len(asistencias_mes)
        asistencia_porcentaje = (dias_presentes / total_dias * 100) if total_dias > 0 else 100
        
        # Observaciones recientes (último mes)
        observaciones_mes = Observacion.query.filter(
            and_(
                Observacion.estudiante_id == estudiante.id,
                Observacion.fecha >= datetime.now().date() - timedelta(days=30)
            )
        ).count()
        
        hijo_data = {
            'id': estudiante.id,
            'nombre': estudiante.nombre,
            'grado': f"{curso.nivel}{curso.letra}" if curso and curso.nivel and curso.letra else 'Sin grado',
            'curso': curso.nombre if curso else 'Sin curso',
            'curso_id': estudiante.curso_id,
            'promedio': float(promedio),
            'total_notas': len(calificaciones),
            'asistencia_porcentaje': asistencia_porcentaje,
            'dias_presentes': dias_presentes,
            'total_dias': total_dias,
            'observaciones_mes': observaciones_mes
        }
        
        print(f"✅ Dashboard familia generado: {[hijo_data]}")
        return jsonify({
            'success': True,
            'data': {
                'hijos': [hijo_data],
                'total_hijos': 1
            }
        })
    except Exception as e:
        print(f"❌ Error dashboard familia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/familia/hijo-calificaciones/<int:estudiante_id>', methods=['GET'])
def get_calificaciones_hijo(estudiante_id):
    """Calificaciones de un hijo."""
    try:
        calificaciones = Calificacion.query.filter_by(estudiante_id=estudiante_id).order_by(
            Calificacion.fecha_registro.desc(), Calificacion.asignatura
        ).all()
        
        calificaciones_data = []
        for cal in calificaciones:
            cal_dict = {
                'id': cal.id,
                'asignatura': cal.asignatura,
                'periodo': cal.periodo,
                'nota': cal.nota,
                'fecha': cal.fecha_registro.isoformat() if cal.fecha_registro else None
            }
            calificaciones_data.append(cal_dict)
        
        print(f"📊 Calificaciones encontradas para estudiante {estudiante_id}: {len(calificaciones_data)}")
        return jsonify({'success': True, 'data': calificaciones_data})
    except Exception as e:
        print(f"❌ Error calificaciones hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/familia/hijo-asistencia/<int:estudiante_id>', methods=['GET'])
def get_asistencia_hijo(estudiante_id):
    """Asistencia de un hijo."""
    try:
        asistencias = Asistencia.query.filter_by(estudiante_id=estudiante_id).order_by(Asistencia.fecha.desc()).all()
        
        asistencias_data = []
        for asist in asistencias:
            asist_dict = {
                'id': asist.id,
                'fecha': asist.fecha.isoformat() if asist.fecha else None,
                'estado': asist.estado
            }
            asistencias_data.append(asist_dict)
            
        return jsonify({'success': True, 'data': asistencias_data})
    except Exception as e:
        print(f"❌ Error asistencia hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/familia/hijo-observaciones/<int:estudiante_id>', methods=['GET'])
def get_observaciones_hijo(estudiante_id):
    """Observaciones de un hijo."""
    try:
        observaciones = db.session.query(Observacion, Usuario).outerjoin(
            Usuario, Observacion.docente_id == Usuario.id
        ).filter(
            Observacion.estudiante_id == estudiante_id
        ).order_by(Observacion.fecha.desc()).all()
        
        observaciones_data = []
        for observacion, docente in observaciones:
            obs_dict = {
                'id': observacion.id,
                'fecha': observacion.fecha.isoformat() if observacion.fecha else None,
                'tipo': observacion.tipo,
                'detalle': observacion.detalle,
                'docente_nombre': docente.nombre if docente else 'Desconocido'
            }
            observaciones_data.append(obs_dict)
            
        return jsonify({'success': True, 'data': observaciones_data})
    except Exception as e:
        print(f"❌ Error observaciones hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# MAIN
# =====================================================
if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()  # Crear tablas si no existen
            print("✅ Tablas creadas/verificadas")
        except Exception as e:
            print(f"⚠️ Error creando tablas: {e}")
    
    print("🚀 MonteVerde API iniciando...")
    print("🌐 http://localhost:5000")
    print("🔗 CORS permitido: http://localhost:5173")
    app.run(debug=True, port=5000, host='localhost')
