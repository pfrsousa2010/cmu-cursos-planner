
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCursoInsumos = (cursoId: string | null) => {
  return useQuery({
    queryKey: ['curso-insumos', cursoId],
    queryFn: async () => {
      if (!cursoId) return [];
      
      const { data, error } = await supabase
        .from('curso_insumos')
        .select(`
          *,
          insumos (
            id,
            nome
          )
        `)
        .eq('curso_id', cursoId);
      
      if (error) {
        console.error('Erro ao buscar insumos do curso:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!cursoId
  });
};
