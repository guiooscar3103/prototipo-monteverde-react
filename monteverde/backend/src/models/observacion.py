from src.extensions import db
from datetime import datetime

class Observacion(db.Model):
    __tablename__ = 'observaciones'
    
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    docente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    detalle = db.Column(db.Text, nullable=False)
    
    # Relaciones
    docente = db.relationship('Usuario', backref='observaciones_creadas')
    
    def __repr__(self):
        return f'<Observacion {self.estudiante_id} - {self.tipo}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'docente_id': self.docente_id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'tipo': self.tipo,
            'detalle': self.detalle
        }
