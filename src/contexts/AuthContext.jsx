// src/contexts/AuthContext.jsx

import { createContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const guardarUsuario = localStorage.getItem('usuario');
    if (guardarUsuario) {
      try {
        setUsuario(JSON.parse(guardarUsuario));
      } catch (e) {
        console.error('Error al parsear usuario', e);
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Exporta el contexto directamente si necesitas usarlo en otros lugares
export { AuthContext };