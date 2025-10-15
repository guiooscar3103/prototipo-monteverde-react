import { useAuth as useAuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  
  // Mantener compatibilidad con tu código existente
  return {
    usuario: context.user, // ← Mapear 'user' a 'usuario'
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    login: context.login,
    logout: context.logout,
    clearError: context.clearError
  };
};

// ✅ También exportar como default para compatibilidad
export default useAuth;
