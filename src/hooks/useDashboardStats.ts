import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  cursos: number;
  unidades: number;
  salas: number;
  usuarios: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [cursosRes, unidadesRes, salasRes, usuariosRes] = await Promise.all([
        supabase.from('cursos').select('*', { count: 'exact' }),
        supabase.from('unidades').select('*', { count: 'exact' }),
        supabase.from('salas').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' })
      ]);

      return {
        cursos: cursosRes.count || 0,
        unidades: unidadesRes.count || 0,
        salas: salasRes.count || 0,
        usuarios: usuariosRes.count || 0
      };
    }
  });
};
