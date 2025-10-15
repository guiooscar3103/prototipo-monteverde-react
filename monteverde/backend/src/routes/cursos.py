from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.utils.auth_helpers import role_required, get_current_user

cursos_bp = Blueprint('cursos', __name__, url_prefix='/cursos')

@cursos_bp.route('/', methods=['GET'])
@jwt_required()
def list_cursos():
    """Listar todos los cursos"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        cursos = Curso.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'cursos': [curso.to_dict() for curso in cursos.items],
            'pagination': {
                'page': cursos.page,
                'pages': cursos.pages,
                'per_page': cursos.per_page,
                'total': cursos.total,
                'has_next': cursos.has_next,
                'has_prev': cursos.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener cursos', 'error': str(e)}), 500

@cursos_bp.route('/<int:curso_id>', methods=['GET'])
@jwt_required()
def get_curso(curso_id):
    """Obtener curso específico con estudiantes"""
    try:
        curso = Curso.query.get_or_404(curso_id)
        estudiantes = Estudiante.query.filter_by(curso_id=curso_id).all()
        
        return jsonify({
            'curso': curso.to_dict(),
            'estudiantes': [est.to_dict() for est in estudiantes],
            'total_estudiantes': len(estudiantes)
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener curso', 'error': str(e)}), 500

@cursos_bp.route('/', methods=['POST'])
@role_required('admin')
def create_curso():
    """Crear nuevo curso (solo admin)"""
    try:
        data = request.get_json()
        
        # Validaciones
        if not data or not all(k in data for k in ('nombre', 'nivel', 'letra')):
            return jsonify({'message': 'Faltan campos: nombre, nivel, letra'}), 400
        
        curso = Curso(
            nombre=data['nombre'],
            nivel=data['nivel'],
            letra=data['letra']
        )
        
        db.session.add(curso)
        db.session.commit()
        
        return jsonify({
            'message': 'Curso creado exitosamente',
            'curso': curso.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al crear curso', 'error': str(e)}), 500

@cursos_bp.route('/<int:curso_id>', methods=['PUT'])
@role_required('admin')
def update_curso(curso_id):
    """Actualizar curso (solo admin)"""
    try:
        curso = Curso.query.get_or_404(curso_id)
        data = request.get_json()
        
        if 'nombre' in data:
            curso.nombre = data['nombre']
        if 'nivel' in data:
            curso.nivel = data['nivel']
        if 'letra' in data:
            curso.letra = data['letra']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Curso actualizado exitosamente',
            'curso': curso.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al actualizar curso', 'error': str(e)}), 500

@cursos_bp.route('/<int:curso_id>', methods=['DELETE'])
@role_required('admin')
def delete_curso(curso_id):
    """Eliminar curso (solo admin)"""
    try:
        curso = Curso.query.get_or_404(curso_id)
        
        # Verificar si tiene estudiantes
        estudiantes_count = Estudiante.query.filter_by(curso_id=curso_id).count()
        if estudiantes_count > 0:
            return jsonify({
                'message': f'No se puede eliminar. El curso tiene {estudiantes_count} estudiantes'
            }), 409
        
        db.session.delete(curso)
        db.session.commit()
        
        return jsonify({'message': 'Curso eliminado exitosamente'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al eliminar curso', 'error': str(e)}), 500
