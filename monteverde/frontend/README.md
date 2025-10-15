# 🏫 Plataforma Educativa MonteVerde - Prototipo React

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?logo=vite)
![JSON Server](https://img.shields.io/badge/JSON_Server-0.17.4-000000?logo=json)
![React Router](https://img.shields.io/badge/React_Router-7.8.2-CA4245?logo=react-router)

Prototipo de una plataforma educativa completa con **separación de roles** (docente, familia y administrador), **gestión académica**, **registro de asistencia**, **observaciones** y **mensajería en tiempo real**, utilizando **React + Vite** en el frontend y **JSON Server** como backend simulado.

## Características Principales

- **Autenticación por roles**: Sistema de login con validación de credenciales
- **Gestión de calificaciones**: Docentes registran notas por asignatura y periodo
- **Consulta académica**: Familias visualizan promedios y boletines de sus hijos
- **Control de asistencia**: Registro diario de asistencia por estudiante
- **Observador del alumno**: Registro de anotaciones positivas, llamados y seguimientos
- **Mensajería bidireccional**: Comunicación entre docentes y familias con notificaciones
- **Arquitectura limpia**: Separación completa frontend/backend con consumo de API REST

## Estructura del Proyecto

```
PROTOTIPO-MONTEVERDE-REACT/
├── monteverde-backend/    # Backend simulado con JSON Server
└── frontend/             # Aplicación React (este repositorio)
```

## Guía de Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/prototipo-monteverde-react.git
cd prototipo-monteverde-react
```

### 2. Configurar el Backend (JSON Server)

> **Nota**: El backend debe estar en una carpeta hermana llamada `monteverde-backend`

```bash
# Crear la carpeta del backend
mkdir ../monteverde-backend
cd ../monteverde-backend

# Inicializar el proyecto Node.js
npm init -y

# Instalar JSON Server
npm install json-server

# Crear el archivo de base de datos
# Copia el contenido de db.json desde la sección "Base de Datos de Ejemplo" más abajo
```

### 3. Iniciar el Backend

En la carpeta `monteverde-backend/`, crea el archivo `db.json` con la estructura de datos y luego ejecuta:

```bash
# Iniciar JSON Server en el puerto 3000
npx json-server --watch db.json --port 3000
```

> ✅ Verifica que el backend esté funcionando en: http://localhost:3000

### 4. Configurar el Frontend

Vuelve a la carpeta del frontend:

```bash
cd ../prototipo-monteverde-react
```

Instala las dependencias:

```bash
npm install
```

### 5. Ejecutar la Aplicación

```bash
# Iniciar el servidor de desarrollo
npm run dev
```

>  La aplicación estará disponible en: http://localhost:5173

##  Credenciales de Prueba

Una vez en la página de login, usa estas credenciales:

### 👩‍🏫 Docente
- **Email**: `maria@monteverde.edu`
- **Contraseña**: `docente123`

### 👨‍👩‍👧 Familia
- **Email**: `carlos@monteverde.edu`
- **Contraseña**: `familia123`

## 🗂️ Base de Datos de Ejemplo (`db.json`)

Crea este archivo en `monteverde-backend/db.json`:

```json
{
  "usuarios": [
    {
      "id": 1,
      "rol": "docente",
      "nombre": "María R.",
      "email": "maria@monteverde.edu",
      "password": "docente123"
    },
    {
      "id": 2,
      "rol": "familia",
      "nombre": "Carlos M.",
      "email": "carlos@monteverde.edu",
      "password": "familia123",
      "estudianteId": 101
    }
  ],
  "cursos": [
    { "id": 1, "nombre": "7°B", "nivel": "7", "letra": "B" }
  ],
  "estudiantes": [
    { "id": 101, "nombre": "Ana López", "cursoId": 1 }
  ],
  "calificaciones": [
    {
      "id": 1,
      "estudianteId": 101,
      "asignatura": "Matematicas",
      "periodo": "2025-P2",
      "nota": 4.5
    }
  ],
  "asistencia": [
    {
      "id": 1,
      "estudianteId": 101,
      "fecha": "2025-04-05",
      "estado": "presente"
    }
  ],
  "observaciones": [
    {
      "id": 1,
      "estudianteId": 101,
      "fecha": "2025-04-05",
      "tipo": "Positivo",
      "detalle": "Participación activa en clase"
    }
  ],
  "mensajes": [
    {
      "id": 1,
      "emisorId": 1,
      "receptorId": 2,
      "rolEmisor": "docente",
      "rolReceptor": "familia",
      "asunto": "Falta de tareas",
      "cuerpo": "Su hijo no ha entregado las últimas 3 tareas.",
      "fecha": "2025-04-05",
      "leido": false
    }
  ]
}
```

##  Funcionalidades por Rol

###  **Docente**
- ✅ Registrar calificaciones por asignatura y periodo
- ✅ Controlar asistencia diaria de estudiantes
- ✅ Registrar observaciones y anotaciones
- ✅ Enviar mensajes a familias
- ✅ Ver lista de cursos asignados

###  **Familia**
- ✅ Consultar promedio general del estudiante
- ✅ Ver boletín académico detallado
- ✅ Recibir y responder mensajes de docentes
- ✅ Ver historial de observaciones

##  Tecnologías Utilizadas

- **Frontend**: React 19, Vite, React Router DOM
- **Backend**: JSON Server (simulación de API REST)
- **Estilos**: CSS puro con variables personalizadas
- **Arquitectura**: Componentes reutilizables, Context API para autenticación, servicios separados para consumo de API

