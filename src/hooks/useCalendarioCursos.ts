import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Curso, ViewMode } from "@/types/calendario";

export const useCalendarioCursos = (currentWeek: Date, viewMode: ViewMode) => {
  return useQuery({
    queryKey: [
      viewMode === 'semana' ? 'cursos-semana' : 'cursos-mes',
      currentWeek,
      viewMode
    ],
    queryFn: async () => {
      let query = supabase
        .from('cursos')
        .select(`
          *,
          unidades (id, nome),
          salas (id, nome)
        `)
        .eq('status', 'ativo');

      if (viewMode === 'semana') {
        const startDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
        const endDate = endOfWeek(currentWeek, { weekStartsOn: 0 });
        query = query
          .lte('inicio', format(endDate, 'yyyy-MM-dd'))
          .gte('fim', format(startDate, 'yyyy-MM-dd'));
      } else {
        const startMonth = startOfMonth(currentWeek);
        const endMonth = endOfMonth(currentWeek);
        query = query
          .lte('inicio', format(endMonth, 'yyyy-MM-dd'))
          .gte('fim', format(startMonth, 'yyyy-MM-dd'));
      }

      const { data } = await query.order('inicio');
      return data || [];
    }
  });
};
