import React, { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit, Download, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isWithinInterval, parseISO, startOfMonth, endOfMonth, getDate, getMonth, getYear, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import CursoDetails from "@/components/CursoDetails";
import CursoForm from "@/components/CursoForm";
import CursoInsumosList from "@/components/CursoInsumosList";
import { toast } from "sonner";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string;
  unidade_id: string;
  status: 'ativo' | 'finalizado';
  unidades: { nome: string; id: string } | null;
  salas: { nome: string; id: string } | null;
}

const Calendario = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<string>("all");
  const [selectedSala, setSelectedSala] = useState<string>("all");
  const [isChangingWeek, setIsChangingWeek] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCursoInsumos, setSelectedCursoInsumos] = useState<Curso | null>(null);
  const [cursoToEdit, setCursoToEdit] = useState<Curso | null>(null);
  const [viewMode, setViewMode] = useState<'semana' | 'mes'>('semana');

  const queryClient = useQueryClient();

  // Buscar cursos da semana ou mês (filtrados por unidade, sala, professor)
  const { data: cursos, isLoading: loadingCursos } = useQuery({
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
        // visão mensal
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

  // Extrair dados únicos dos cursos para os filtros (sempre todas as opções disponíveis)
  const unidades = React.useMemo(() => {
    if (!cursos) return [];
    const uniqueUnidades = new Map();
    cursos.forEach(curso => {
      if (curso.unidades) {
        uniqueUnidades.set(curso.unidades.id, curso.unidades);
      }
    });
    return Array.from(uniqueUnidades.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cursos]);

  const salas = React.useMemo(() => {
    if (!cursos) return [];
    const uniqueSalas = new Map();
    cursos.forEach(curso => {
      if (curso.salas) {
        uniqueSalas.set(curso.salas.id, {
          id: curso.salas.id,
          nome: curso.salas.nome,
          unidade_id: curso.unidade_id,
          unidades: curso.unidades
        });
      }
    });
    return Array.from(uniqueSalas.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cursos]);

  const professores = React.useMemo(() => {
    if (!cursos) return [];
    const uniqueProfessores = [...new Set(cursos.map(curso => curso.professor))];
    return uniqueProfessores.sort();
  }, [cursos]);

  // Filtrar cursos baseado nos filtros selecionados
  const cursosFiltrados = React.useMemo(() => {
    if (!cursos) return [];
    
    return cursos.filter(curso => {
      if (selectedUnidade !== "all" && curso.unidade_id !== selectedUnidade) return false;
      if (selectedProfessor !== "all" && curso.professor !== selectedProfessor) return false;
      if (selectedSala !== "all" && curso.sala_id !== selectedSala) return false;
      return true;
    });
  }, [cursos, selectedUnidade, selectedProfessor, selectedSala]);

  // Estados de loading baseados apenas na query de cursos
  const loadingUnidades = loadingCursos;
  const loadingSalas = loadingCursos;
  const loadingProfessores = loadingCursos;

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 0 })
  });

  // Mostrar todos os dias da semana (domingo a sábado)
  const weekDaysFull = weekDays; // [domingo, ..., sábado]

  // Cálculo para visão mensal
  const ano = currentWeek.getFullYear();
  const mes = currentWeek.getMonth();
  const startMonth = startOfMonth(currentWeek);
  const endMonth = endOfMonth(currentWeek);
  const totalDiasNoMes = getDate(endMonth);
  const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => new Date(ano, mes, i + 1));

  const getCursosForSalaAndDay = (salaId: string, day: Date) => {
    return cursosFiltrados?.filter(curso => {
      if (curso.sala_id !== salaId) return false;
      
      const cursoStart = parseISO(curso.inicio);
      const cursoEnd = parseISO(curso.fim);
      return isWithinInterval(day, { start: cursoStart, end: cursoEnd });
    }) || [];
  };

  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  const getPeriodoColor = (periodo: string) => {
    const colors = {
      'manha': 'bg-yellow-100 text-yellow-800',
      'tarde': 'bg-orange-100 text-orange-800',
      'noite': 'bg-blue-100 text-blue-800'
    };
    return colors[periodo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Função para gerar cor sutil baseada no nome da unidade
  const getUnidadeColor = (unidadeNome: string) => {
    const colors = [
      'bg-blue-50/50 border-l-4 border-l-blue-300',
      'bg-green-50/50 border-l-4 border-l-green-300',
      'bg-purple-50/50 border-l-4 border-l-purple-300',
      'bg-orange-50/50 border-l-4 border-l-orange-300',
      'bg-pink-50/50 border-l-4 border-l-pink-300',
      'bg-indigo-50/50 border-l-4 border-l-indigo-300',
      'bg-teal-50/50 border-l-4 border-l-teal-300',
      'bg-amber-50/50 border-l-4 border-l-amber-300',
      'bg-cyan-50/50 border-l-4 border-l-cyan-300',
      'bg-emerald-50/50 border-l-4 border-l-emerald-300'
    ];
    
    // Gerar índice baseado no nome da unidade (hash simples)
    let hash = 0;
    for (let i = 0; i < unidadeNome.length; i++) {
      hash = ((hash << 5) - hash) + unidadeNome.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Função para obter cor do texto da unidade
  const getUnidadeTextColor = (unidadeNome: string) => {
    const colors = [
      'text-blue-700',
      'text-green-700',
      'text-purple-700',
      'text-orange-700',
      'text-pink-700',
      'text-indigo-700',
      'text-teal-700',
      'text-amber-700',
      'text-cyan-700',
      'text-emerald-700'
    ];
    
    let hash = 0;
    for (let i = 0; i < unidadeNome.length; i++) {
      hash = ((hash << 5) - hash) + unidadeNome.charCodeAt(i);
      hash = hash & hash;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleCursoClick = (curso: Curso) => {
    setSelectedCurso(curso);
    setDialogOpen(true);
  };

  const handleEditCurso = (curso: Curso) => {
    console.log('Curso selecionado para edição:', curso);
    setCursoToEdit(curso);
    setEditDialogOpen(true);
    setDialogOpen(false);
  };

  const handleViewInsumos = (curso: Curso) => {
    setSelectedCursoInsumos(curso);
    setInsumosDialogOpen(true);
    setDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
    // Invalidar a query de cursos
    queryClient.invalidateQueries({ queryKey: ['cursos-semana'] });
    queryClient.invalidateQueries({ queryKey: ['cursos-mes'] });
    toast.success("Curso atualizado com sucesso!");
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
  };

  // Resetar filtros dependentes quando unidade muda
  const handleUnidadeChange = (value: string) => {
    setSelectedUnidade(value);
    setSelectedSala("all");
    setSelectedProfessor("all");
  };

  // Handlers com loading visual
  const handleProfessorChange = (value: string) => {
    setSelectedProfessor(value);
  };

  const handleSalaChange = (value: string) => {
    setSelectedSala(value);
  };

  const handlePreviousWeek = () => {
    setIsChangingWeek(true);
    setCurrentWeek(subWeeks(currentWeek, 1));
    // Simular um pequeno delay para mostrar o loading
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleNextWeek = () => {
    setIsChangingWeek(true);
    setCurrentWeek(addWeeks(currentWeek, 1));
    // Simular um pequeno delay para mostrar o loading
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  // Data de hoje para referência do mês atual
  const [today] = useState(new Date());

  const handlePreviousMonth = () => {
    setIsChangingWeek(true);
    setCurrentWeek(subMonths(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleNextMonth = () => {
    setIsChangingWeek(true);
    setCurrentWeek(addMonths(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleCurrentMonth = () => {
    setCurrentWeek(today);
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    setSelectedUnidade('all');
    setSelectedSala('all');
    setSelectedProfessor('all');
  };

  // Mostrar apenas salas com cursos na semana/mês
  let salasToShow: typeof salas = [];
  if (salas) {
    if (viewMode === 'semana') {
      salasToShow = salas.filter(sala => {
        return weekDaysFull.some(day => {
          return (cursosFiltrados || []).some(curso => curso.sala_id === sala.id && isWithinInterval(day, { start: parseISO(curso.inicio), end: parseISO(curso.fim) }));
        });
      });
    } else {
      // Mensal: pelo menos um curso no mês
      salasToShow = salas.filter(sala => {
        return (cursosFiltrados || []).some(curso => {
          if (curso.sala_id !== sala.id) return false;
          const inicio = parseISO(curso.inicio);
          const fim = parseISO(curso.fim);
          return fim >= startMonth && inicio <= endMonth;
        });
      });
    }
    // Filtro por sala específico
    if (selectedSala !== "all") {
      salasToShow = salasToShow.filter(sala => sala.id === selectedSala);
    }
  }

  // Estado de loading geral
  const isLoading = loadingCursos || isChangingWeek;

  // Paleta de cores pastel para cursos
  const cursoColors = [
    'bg-blue-200 border-blue-400',
    'bg-green-200 border-green-400',
    'bg-pink-200 border-pink-400',
    'bg-yellow-200 border-yellow-400',
    'bg-purple-200 border-purple-400',
    'bg-orange-200 border-orange-400',
    'bg-cyan-200 border-cyan-400',
    'bg-amber-200 border-amber-400',
    'bg-lime-200 border-lime-400',
    'bg-rose-200 border-rose-400',
    'bg-indigo-200 border-indigo-400',
    'bg-teal-200 border-teal-400',
  ];
  // Função para pegar cor baseada no id do curso
  function getCursoColor(cursoId: string) {
    let hash = 0;
    for (let i = 0; i < cursoId.length; i++) {
      hash = ((hash << 5) - hash) + cursoId.charCodeAt(i);
      hash = hash & hash;
    }
    return cursoColors[Math.abs(hash) % cursoColors.length];
  }

  // Função para pegar cor baseada no turno (para barras do mensal)
  const getTurnoBarColor = (periodo: string) => {
    switch (periodo) {
      case 'manha':
        return 'bg-yellow-200 border-yellow-400';
      case 'tarde':
        return 'bg-green-200 border-green-400';
      case 'noite':
        return 'bg-blue-200 border-blue-400';
      default:
        return 'bg-gray-200 border-gray-400';
    }
  };

  // Geração das linhas da tabela mensal (corrige erro de sintaxe)
  const linhasMensais = (salasToShow || []).flatMap((sala) => {
    const turnos = ['manha', 'tarde', 'noite'];
    return turnos.map((turno, turnoIdx) => {
      const cursosTurno = (cursosFiltrados || []).filter(curso =>
        curso.sala_id === sala.id &&
        curso.periodo === turno &&
        parseISO(curso.inicio) <= endMonth &&
        parseISO(curso.fim) >= startMonth
      ).sort((a, b) => parseISO(a.inicio).getTime() - parseISO(b.inicio).getTime());
      if (cursosTurno.length === 0) return null;
      const cells = [];
      let currentDay = 0;
      for (const curso of cursosTurno) {
        const inicio = parseISO(curso.inicio);
        const fim = parseISO(curso.fim);
        const startIdx = Math.max(0, inicio.getMonth() === mes ? inicio.getDate() - 1 : 0);
        const endIdx = Math.min(totalDiasNoMes - 1, fim.getMonth() === mes ? fim.getDate() - 1 : totalDiasNoMes - 1);
        if (startIdx > currentDay) {
          for (let i = currentDay; i < startIdx; i++) {
            cells.push(<TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-top p-1 h-[56px]"></TableCell>);
          }
        }
        cells.push(
          <TableCell
            key={`curso-${curso.id}`}
            colSpan={endIdx - startIdx + 1}
            className={`align-middle p-0 text-center font-medium whitespace-nowrap ${getTurnoBarColor(curso.periodo)} border cursor-pointer`}
            style={{ minWidth: (endIdx - startIdx + 1) * 20 }}
            onClick={() => handleCursoClick(curso)}
          >
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: 24 }}>
              <span className="block w-full truncate" style={{ fontSize: '0.8rem' }}>
                {curso.titulo} - {curso.professor} <br />
                <span className="text-xs">{format(parseISO(curso.inicio), 'dd/MM')} - {format(parseISO(curso.fim), 'dd/MM')}</span>
              </span>
            </div>
          </TableCell>
        );
        currentDay = endIdx + 1;
      }
      if (currentDay < totalDiasNoMes) {
        for (let i = currentDay; i < totalDiasNoMes; i++) {
          cells.push(<TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-top p-1 h-[56px]"></TableCell>);
        }
      }
      return (
        <TableRow key={sala.id + '-' + turno} className={getUnidadeColor(sala.unidades?.nome || '') + ' h-[56px]'}>
          {turnoIdx === 0 ? (
            <TableCell rowSpan={turnos.filter(t => (cursosFiltrados || []).some(curso => curso.sala_id === sala.id && curso.periodo === t && parseISO(curso.inicio) <= endMonth && parseISO(curso.fim) >= startMonth)).length} className="font-medium align-middle h-full" style={{ height: '100%' }}>
              <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                <div className="font-semibold text-sm">{sala.nome}</div>
                <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>{sala.unidades?.nome}</div>
              </div>
            </TableCell>
          ) : null}
          <TableCell className="font-medium align-middle w-16 text-right pr-2 h-[56px]">{formatPeriodo(turno)}</TableCell>
          {cells}
        </TableRow>
      );
    });
  }).filter(Boolean);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Cursos</h1>            
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant={viewMode === 'semana' ? 'default' : 'outline'}
              size="sm"
              disabled={isLoading}
              onClick={() => setViewMode('semana')}
            >
              Visão Semanal
            </Button>
            <Button
              variant={viewMode === 'mes' ? 'default' : 'outline'}
              size="sm"
              disabled={isLoading}
              onClick={() => setViewMode('mes')}
            >
              Visão Mensal
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Unidade</label>
              {loadingUnidades ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedUnidade} onValueChange={handleUnidadeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unidades?.map(unidade => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Sala</label>
              {loadingSalas ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedSala} onValueChange={handleSalaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as salas</SelectItem>
                    {salas?.map(sala => (
                      <SelectItem key={sala.id} value={sala.id}>
                        {sala.nome} - {sala.unidades?.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Professor</label>
              {loadingProfessores ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedProfessor} onValueChange={handleProfessorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os professores</SelectItem>
                    {professores?.map(professor => (
                      <SelectItem key={professor} value={professor}>
                        {professor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimparFiltros}
              className="self-end"
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* Navegação da semana/mês */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={viewMode === 'semana' ? handlePreviousWeek : () => handlePreviousMonth()}
                disabled={isChangingWeek}
              >
                <ChevronLeft className="h-4 w-4" />
                {viewMode === 'semana' ? 'Semana Anterior' : 'Mês Anterior'}
              </Button>
              <div className="text-center">
                {isChangingWeek ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <Skeleton className="h-6 w-32" />
                  </div>
                ) : viewMode === 'semana' ? (
                  <h2 className="text-lg font-semibold">
                    {format(weekDaysFull[0], 'dd', { locale: ptBR })} - {format(weekDaysFull[6], 'dd MMM yyyy', { locale: ptBR })}
                  </h2>
                ) : (
                  <h2 className="text-lg font-semibold">
                    {format(startMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={viewMode === 'semana' ? handleNextWeek : () => handleNextMonth()}
                disabled={isChangingWeek}
              >
                {viewMode === 'semana' ? 'Próxima Semana' : 'Próximo Mês'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tabela de cursos por sala - visão semanal ou mensal */}
        {viewMode === 'semana' ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Calendário Semanal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="table-fixed" style={{ minWidth: '100%' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-semibold">SALAS</TableHead>
                      {weekDaysFull.map((day) => (
                        <TableHead key={day.toISOString()} className="text-center min-w-[200px] font-semibold">
                          <div className="flex flex-col">
                            <span className="capitalize text-sm">
                              {format(day, 'EEEE', { locale: ptBR })}
                            </span>
                            <span className="text-lg font-bold">
                              {format(day, 'dd/MM')}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSalas ? (
                      // Loading skeleton para as salas
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium bg-gray-50 align-top">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </TableCell>
                          {weekDaysFull.map((day) => (
                            <TableCell key={day.toISOString()} className="align-top p-2">
                              <div className="space-y-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-12 w-full" />
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : salasToShow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                          {"Nenhuma sala com cursos encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      salasToShow.map((sala) => (
                        <TableRow key={sala.id} className={getUnidadeColor(sala.unidades?.nome || '')}>
                          <TableCell className="font-medium align-middle">
                            <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                              <div className="font-semibold text-sm">{sala.nome}</div>
                              <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                                {sala.unidades?.nome}
                              </div>
                            </div>
                          </TableCell>
                          {weekDaysFull.map((day) => {
                            const periodoOrder = ['manha', 'tarde', 'noite'];
                            const cursosDay = [...getCursosForSalaAndDay(sala.id, day)].sort((a, b) => periodoOrder.indexOf(a.periodo) - periodoOrder.indexOf(b.periodo));
                            return (
                              <TableCell key={day.toISOString()} className="align-top p-2">
                                <div className="space-y-2">
                                  {loadingCursos ? (
                                    // Loading skeleton para os cursos
                                    Array.from({ length: 2 }).map((_, index) => (
                                      <Skeleton key={index} className="h-16 w-full" />
                                    ))
                                  ) : (
                                    cursosDay.map((curso) => (
                                      <div
                                        key={curso.id}
                                        className={`p-2 rounded border bg-white hover:shadow-md transition-shadow cursor-pointer text-xs ${getUnidadeColor(curso.unidades?.nome || '')}`}
                                        onClick={() => handleCursoClick(curso)}
                                      >
                                        <div className="space-y-1">
                                          <div className="font-medium leading-tight">{curso.titulo}</div>
                                          <div className="text-muted-foreground">{curso.professor}</div>
                                          <Badge 
                                            variant="secondary" 
                                            className={getPeriodoColor(curso.periodo) + " text-xs px-1 py-0"}
                                          >
                                            {formatPeriodo(curso.periodo)}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                  {!loadingCursos && cursosDay.length === 0 && (
                                    <div className="text-center text-muted-foreground text-xs py-2">
                                      -
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Calendário Mensal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div>
                <Table className="table-fixed" style={{ minWidth: '100%' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-semibold">Sala/Unidade</TableHead>
                      <TableHead className="w-16 font-semibold">Turno</TableHead>
                      {diasDoMes.map((dia, i) => (
                        <TableHead key={i} className="text-center font-semibold" style={{ minWidth: 30, fontSize: '0.8rem', padding: 0 }}>
                          {String(i + 1).padStart(2, '0')}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSalas ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium bg-gray-50 align-top">
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          {diasDoMes.map((_, i) => (
                            <TableCell key={i} className="align-top p-2">
                              <Skeleton className="h-8 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : salasToShow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={totalDiasNoMes + 2} className="text-center py-4 text-muted-foreground">
                          {"Nenhuma sala com cursos encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      linhasMensais
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}

        {/* Detalhes do Curso (se selecionado) */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            {selectedCurso && (
              <CursoDetails curso={selectedCurso} onEdit={handleEditCurso} onViewInsumos={handleViewInsumos} />
            )}
          </DialogContent>
        </Dialog>

        {/* Insumos do Curso (se selecionado) */}
        <Dialog open={insumosDialogOpen} onOpenChange={setInsumosDialogOpen}>
          <DialogContent>
            {selectedCursoInsumos && (
              <CursoInsumosList 
                cursoId={selectedCursoInsumos.id}
                cursoTitulo={selectedCursoInsumos.titulo}
                professor={selectedCursoInsumos.professor}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Formulário de Edição de Curso (se selecionado) */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {cursoToEdit && (
              <CursoForm 
                curso={cursoToEdit}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Calendario;