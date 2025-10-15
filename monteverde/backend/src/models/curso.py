from src.extensions import db

class Curso(db.Model):
    __tablename__ = 'cursos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    nivel = db.Column(db.String(10), nullable=False)
    letra = db.Column(db.String(10), nullable=False)
    
    def __repr__(self):
        return f'<Curso {self.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'nivel': self.nivel,
            'letra': self.letra
        }
