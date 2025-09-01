
import { useUser } from '@/contexts/UserContext';

export const useUserRole = () => {
  const { user, loading, canManageUnidades, canManageCursos, canViewOnly } = useUser();

  return {
    userRole: user?.role || null,
    userId: user?.id || null,
    loading,
    canManageUnidades,
    canManageCursos,
    canViewOnly
  };
};
