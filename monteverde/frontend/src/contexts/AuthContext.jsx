import React, { createContext, useContext, useState, useEffect } from 'react'; // ← AGREGAR useEffect

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Verificar token al cargar (evita pérdida de sesión)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Verificar si el token es válido
          const response = await fetch('http://localhost:5000/health');
          if (response.ok) {
            // Decodificar el token para obtener datos del usuario
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              id: payload.user_id,
              email: payload.email,
              rol: payload.rol,
              nombre: payload.nombre || payload.email.split('@')[0]
            });
          }
        } catch (error) {
          console.error('Token inválido:', error);
          localStorage.removeItem('token');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async ({ email, password }) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return data.user;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
