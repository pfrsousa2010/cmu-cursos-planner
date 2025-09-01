
import { useUser } from '@/contexts/UserContext';

export const useUserRole = () => {
  const { profile, loading, canManageUnidades, canManageCursos, canViewOnly } = useUser();

  return {
    userRole: profile?.role || null,
    userId: profile?.id || null,
    loading,
    canManageUnidades,
    canManageCursos,
    canViewOnly
  };
};
