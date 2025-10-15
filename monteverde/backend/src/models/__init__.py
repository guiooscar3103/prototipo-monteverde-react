# Solo importar modelos que SÍ existen
try:
    from .usuario import Usuario
except ImportError:
    pass

try:
    from .estudiante import Estudiante  
except ImportError:
    pass

try:
    from .curso import Curso
except ImportError:
    pass

# Agregar más según tengas los archivos
