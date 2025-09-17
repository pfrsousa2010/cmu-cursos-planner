import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

export interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: string;
  inicio: string;
  fim: string;
  status: string;
  carga_horaria?: number;
  qtd_alunos_iniciaram?: number;
  qtd_alunos_concluiram?: number;
  dia_semana?: string[];
  unidades?: { nome: string };
  salas?: { nome: string; capacidade?: number };
  curso_materias?: Array<{ materias?: { nome: string } }>;
  curso_insumos?: Array<{ insumos?: { nome: string }; quantidade: number }>;
}

export const useUpcomingCourses = () => {
  return useQuery({
    queryKey: ['cursos-proximos'],
    queryFn: async (): Promise<Curso[]> => {
      const hoje = new Date();
      const proximaSemana = addDays(hoje, 7);
      
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .gte('inicio', format(hoje, 'yyyy-MM-dd'))
        .lte('inicio', format(proximaSemana, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('inicio', { ascending: true });

      return data || [];
    }
  });
};

export const useEndingCourses = () => {
  return useQuery({
    queryKey: ['cursos-terminando'],
    queryFn: async (): Promise<Curso[]> => {
      const hoje = new Date();
      const proximaSemana = addDays(hoje, 7);
      
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .gte('fim', format(hoje, 'yyyy-MM-dd'))
        .lte('fim', format(proximaSemana, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('fim', { ascending: true });

      return data || [];
    }
  });
};

export const useWeeklyCourses = () => {
  return useQuery({
    queryKey: ['cursos-semana-dashboard'],
    queryFn: async (): Promise<Curso[]> => {
      const hoje = new Date();
      const startOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // segunda-feira
        return new Date(d.setDate(diff));
      };
      const endOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + 6; // sábado
        return new Date(d.setDate(diff));
      };
      const inicioSemana = startOfWeek(hoje);
      const fimSemana = endOfWeek(hoje);
      
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .lte('inicio', format(fimSemana, 'yyyy-MM-dd'))
        .gte('fim', format(inicioSemana, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('inicio', { ascending: true });
      
      return data || [];
    }
  });
};

export const useMonthlyCourses = () => {
  return useQuery({
    queryKey: ['cursos-mes-dashboard'],
    queryFn: async (): Promise<Curso[]> => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .lte('inicio', format(fimMes, 'yyyy-MM-dd'))
        .gte('fim', format(inicioMes, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('inicio', { ascending: true });
      
      return data || [];
    }
  });
};

export const useYearlyCourses = () => {
  const anoAtual = new Date().getFullYear();
  
  return useQuery({
    queryKey: ["cursos-ano", anoAtual],
    queryFn: async (): Promise<Curso[]> => {
      const inicioAno = `${anoAtual}-01-01`;
      const fimAno = `${anoAtual}-12-31`;
      const { data } = await supabase
        .from("cursos")
        .select(`*, unidades (nome)`)
        .or(`and(inicio.lte.${fimAno},fim.gte.${inicioAno})`);
      return data || [];
    },
  });
};

export const useCompleteCourses = () => {
  const anoAtual = new Date().getFullYear();
  
  return useQuery({
    queryKey: ["cursos-completos", anoAtual],
    queryFn: async (): Promise<Curso[]> => {
      const inicioAno = `${anoAtual}-01-01`;
      const fimAno = `${anoAtual}-12-31`;
      const { data } = await supabase
        .from("cursos")
        .select(`
          *,
          unidades (nome),
          salas (nome, capacidade),
          curso_materias (materias (nome)),
          curso_insumos (insumos (nome), quantidade)
        `)
        .or(`and(inicio.lte.${fimAno},fim.gte.${inicioAno})`);
      return data || [];
    },
  });
};
