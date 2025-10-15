from src.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.Enum('docente', 'familia', 'admin'), nullable=False)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=True)
    
    # Relación con estudiante (para familias)
    estudiante = db.relationship('Estudiante', backref='familia', foreign_keys=[estudiante_id])
    
    def __repr__(self):
        return f'<Usuario {self.email}>'
    
    def set_password(self, password):
        """Hashear la contraseña"""
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'estudiante_id': self.estudiante_id
        }
