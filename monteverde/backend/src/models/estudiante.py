from src.extensions import db

class Estudiante(db.Model):
    __tablename__ = 'estudiantes'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'), nullable=False)
    
    # Relaciones
    curso = db.relationship('Curso', backref='estudiantes')
    asistencias = db.relationship('Asistencia', backref='estudiante')
    calificaciones = db.relationship('Calificacion', backref='estudiante')
    observaciones = db.relationship('Observacion', backref='estudiante')
    
    def __repr__(self):
        return f'<Estudiante {self.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'curso_id': self.curso_id
        }
