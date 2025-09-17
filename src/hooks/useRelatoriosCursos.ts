import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Curso } from "@/types/calendario";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodoRelatorio = 'anual' | 'semestral' | 'mensal' | 'semanal';

export const useRelatoriosCursos = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoRelatorio>('anual');
  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), 0, 1); // Inicia com o ano atual
  });
  const [filtros, setFiltros] = useState({
    unidade: 'todas',
    periodo: 'todos',
    sala: 'todas'
  });

  // Função para ajustar a data quando o período muda
  const handlePeriodoChange = (novoPeriodo: PeriodoRelatorio) => {
    setPeriodoSelecionado(novoPeriodo);
    
    const hoje = new Date();
    let novaData: Date;
    
    switch (novoPeriodo) {
      case 'anual':
        novaData = new Date(hoje.getFullYear(), 0, 1);
        break;
      case 'semestral':
        // Se estamos no segundo semestre, manter o segundo semestre
        const semestreAtual = hoje.getMonth() < 6 ? 0 : 6;
        novaData = new Date(hoje.getFullYear(), semestreAtual, 1);
        break;
      case 'mensal':
        novaData = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'semanal':
        novaData = hoje;
        break;
      default:
        novaData = new Date(hoje.getFullYear(), 0, 1);
    }
    
    setDataInicio(novaData);
  };

  // Buscar todos os cursos
  const { data: cursos, isLoading } = useQuery<Curso[]>({
    queryKey: ['cursos-relatorios'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (id, nome),
          salas (id, nome, capacidade),
          curso_insumos (id),
          curso_materias (id)
        `)
        .order('inicio', { ascending: false });
      
      return data?.map(curso => ({
        ...curso,
        total_insumos: curso.curso_insumos?.length || 0,
        total_materias: curso.curso_materias?.length || 0
      })) || [];
    }
  });

  // Calcular período baseado na seleção
  const periodoCalculado = useMemo(() => {
    const hoje = new Date();
    
    switch (periodoSelecionado) {
      case 'anual':
        return {
          inicio: startOfYear(dataInicio),
          fim: endOfYear(dataInicio),
          label: `Ano ${dataInicio.getFullYear()}`
        };
      
      case 'semestral':
        const semestre = dataInicio.getMonth() < 6 ? 1 : 2;
        const ano = dataInicio.getFullYear();
        const inicioSemestre = semestre === 1 
          ? new Date(ano, 0, 1) 
          : new Date(ano, 6, 1);
        const fimSemestre = semestre === 1 
          ? new Date(ano, 5, 30) 
          : new Date(ano, 11, 31);
        return {
          inicio: inicioSemestre,
          fim: fimSemestre,
          label: `${semestre}º Semestre de ${ano}`
        };
      
      case 'mensal':
        return {
          inicio: startOfMonth(dataInicio),
          fim: endOfMonth(dataInicio),
          label: format(dataInicio, 'MMMM yyyy', { locale: ptBR })
        };
      
      case 'semanal':
        return {
          inicio: startOfWeek(dataInicio, { weekStartsOn: 1 }), // Segunda-feira
          fim: endOfWeek(dataInicio, { weekStartsOn: 1 }), // Domingo
          label: `Semana de ${format(startOfWeek(dataInicio, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(dataInicio, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`
        };
      
      default:
        return {
          inicio: startOfYear(hoje),
          fim: endOfYear(hoje),
          label: `Ano ${hoje.getFullYear()}`
        };
    }
  }, [periodoSelecionado, dataInicio]);

  // Filtrar cursos baseado no período e filtros
  const cursosFiltrados = useMemo(() => {
    if (!cursos) return [];

    return cursos.filter(curso => {
      // Filtro por período
      const dataInicioCurso = new Date(curso.inicio + 'T00:00:00');
      const dataFimCurso = new Date(curso.fim + 'T00:00:00');
      
      // Verificar se o curso tem interseção com o período selecionado
      const temIntersecao = isWithinInterval(dataInicioCurso, { start: periodoCalculado.inicio, end: periodoCalculado.fim }) ||
                           isWithinInterval(dataFimCurso, { start: periodoCalculado.inicio, end: periodoCalculado.fim }) ||
                           (dataInicioCurso <= periodoCalculado.inicio && dataFimCurso >= periodoCalculado.fim);

      if (!temIntersecao) return false;

      // Filtro por unidade
      if (filtros.unidade !== 'todas' && curso.unidades?.nome !== filtros.unidade) return false;

      // Filtro por período do dia
      if (filtros.periodo !== 'todos' && curso.periodo !== filtros.periodo) return false;

      // Filtro por sala
      if (filtros.sala !== 'todas' && curso.salas?.nome !== filtros.sala) return false;

      return true;
    });
  }, [cursos, periodoCalculado, filtros]);

  // Estatísticas do relatório
  const estatisticas = useMemo(() => {
    if (!cursosFiltrados.length) return null;

    // Filtrar apenas cursos finalizados para cálculo da taxa de conclusão
    const hoje = new Date();
    const cursosFinalizados = cursosFiltrados.filter(curso => {
      const fimCurso = new Date(curso.fim + 'T23:59:59-03:00');
      return fimCurso < hoje;
    });

    const totalCursos = cursosFiltrados.length;
    const totalVagas = cursosFiltrados.reduce((sum, curso) => sum + (curso.vagas || 0), 0);
    const totalCargaHoraria = cursosFiltrados.reduce((sum, curso) => sum + (curso.carga_horaria || 0), 0);
    
    // Para os cards de alunos, mostrar apenas dados de cursos finalizados
    const totalAlunosIniciaram = cursosFinalizados.reduce((sum, curso) => sum + (curso.qtd_alunos_iniciaram || 0), 0);
    const totalAlunosConcluiram = cursosFinalizados.reduce((sum, curso) => sum + (curso.qtd_alunos_concluiram || 0), 0);
    
    // Calcular taxa de conclusão apenas com cursos finalizados
    const totalAlunosIniciaramFinalizados = totalAlunosIniciaram;
    const totalAlunosConcluiramFinalizados = totalAlunosConcluiram;
    
    // Cursos por período do dia
    const cursosPorPeriodo = cursosFiltrados.reduce((acc, curso) => {
      acc[curso.periodo] = (acc[curso.periodo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Cursos por unidade
    const cursosPorUnidade = cursosFiltrados.reduce((acc, curso) => {
      const unidade = curso.unidades?.nome || 'Sem Unidade';
      acc[unidade] = (acc[unidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCursos,
      totalVagas,
      totalCursosFinalizados: cursosFinalizados.length,
      totalAlunosIniciaram,
      totalAlunosConcluiram,
      totalCargaHoraria,
      cursosPorPeriodo,
      cursosPorUnidade,
      taxaConclusao: totalAlunosIniciaramFinalizados > 0 ? (totalAlunosConcluiramFinalizados / totalAlunosIniciaramFinalizados) * 100 : 0
    };
  }, [cursosFiltrados]);

  // Obter dados únicos para filtros
  const unidades = useMemo(() => {
    if (!cursos) return [];
    return [...new Set(cursos.map(curso => curso.unidades?.nome).filter(Boolean))];
  }, [cursos]);

  const salas = useMemo(() => {
    if (!cursos) return [];
    return [...new Set(cursos.map(curso => curso.salas?.nome).filter(Boolean))];
  }, [cursos]);

  return {
    periodoSelecionado,
    setPeriodoSelecionado: handlePeriodoChange,
    dataInicio,
    setDataInicio,
    filtros,
    setFiltros,
    periodoCalculado,
    cursosFiltrados,
    estatisticas,
    unidades,
    salas,
    isLoading
  };
};
