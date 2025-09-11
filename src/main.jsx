/**
 * Importamos todas las dependencias y recursos necesarios para la aplicación
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'

/**
 * CONFIGURACIÓN Y RENDERIZADO DE LA APLICACIÓN
 * Inicializa el punto de entrada principal de React y configura
 * los proveedores globales necesarios para toda la aplicación
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

/**
 * ESTRUCTURA DE COMPONENTES:
 * - React.StrictMode: Modo de desarrollo que detecta problemas potenciales
 * - BrowserRouter: Proveedor de enrutamiento para navegación SPA
 * - App: Componente raíz que contiene toda la lógica de la aplicación
 */
