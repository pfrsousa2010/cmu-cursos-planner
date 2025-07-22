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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isWithinInterval, parseISO, startOfMonth, endOfMonth, getDate, getMonth, getYear, isSameMonth } from "date-fns";
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
  unidades: { nome: string } | null;
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

  // --- Drag to scroll states and logic ---
  const scrollRefSemana = useRef<HTMLDivElement>(null);
  const scrollRefMes = useRef<HTMLDivElement>(null);
  const [isDraggingSemana, setIsDraggingSemana] = useState(false);
  const [isDraggingMes, setIsDraggingMes] = useState(false);
  const [startXSemana, setStartXSemana] = useState(0);
  const [scrollLeftSemana, setScrollLeftSemana] = useState(0);
  const [startXMes, setStartXMes] = useState(0);
  const [scrollLeftMes, setScrollLeftMes] = useState(0);

  const queryClient = useQueryClient();

  // Buscar unidades para filtro
  const { data: unidades, isLoading: loadingUnidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data } = await supabase.from('unidades').select('*').order('nome');
      return data || [];
    }
  });

  // Buscar salas para filtro (filtradas por unidade)
  const { data: salas, isLoading: loadingSalas } = useQuery({
    queryKey: ['salas', selectedUnidade],
    queryFn: async () => {
      let query = supabase.from('salas').select('*, unidades(nome)').order('unidade_id').order('nome');
      
      if (selectedUnidade !== "all") {
        query = query.eq('unidade_id', selectedUnidade);
      }
      
      const { data } = await query;
      return data || [];
    }
  });

  // Buscar professores únicos (filtrados por unidade)
  const { data: professores, isLoading: loadingProfessores } = useQuery({
    queryKey: ['professores', selectedUnidade],
    queryFn: async () => {
      let query = supabase.from('cursos').select('professor');
      
      if (selectedUnidade !== "all") {
        query = query.eq('unidade_id', selectedUnidade);
      }
      
      const { data } = await query.order('professor');
      const uniqueProfessores = [...new Set(data?.map(item => item.professor) || [])];
      return uniqueProfessores;
    }
  });

  // Buscar cursos da semana (sempre filtrados por unidade)
  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos-semana', currentWeek, selectedUnidade, selectedProfessor, selectedSala],
    queryFn: async () => {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const endDate = endOfWeek(currentWeek, { weekStartsOn: 0 });

      let query = supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome, id)
        `)
        .lte('inicio', format(endDate, 'yyyy-MM-dd'))
        .gte('fim', format(startDate, 'yyyy-MM-dd'))
        .eq('status', 'ativo');

      // Sempre filtrar por unidade selecionada (obrigatório)
      if (selectedUnidade !== "all") {
        query = query.eq('unidade_id', selectedUnidade);
      }

      if (selectedProfessor !== "all") {
        query = query.eq('professor', selectedProfessor);
      }

      if (selectedSala !== "all") {
        query = query.eq('sala_id', selectedSala);
      }

      const { data } = await query.order('inicio');
      return data || [];
    }
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 0 })
  });

  // Filtrar apenas os dias úteis (segunda a sábado)
  const workDays = weekDays.slice(1, 7); // Remove domingo

  // Cálculo para visão mensal
  const ano = currentWeek.getFullYear();
  const mes = currentWeek.getMonth();
  const startMonth = startOfMonth(currentWeek);
  const endMonth = endOfMonth(currentWeek);
  const totalDiasNoMes = getDate(endMonth);
  const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => new Date(ano, mes, i + 1));

  const getCursosForSalaAndDay = (salaId: string, day: Date) => {
    return cursos?.filter(curso => {
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

  const handleDownloadPDF = () => {
    toast.success("Função de download será implementada em breve");
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
    queryClient.invalidateQueries({ queryKey: ['cursos-semana'] });
    toast.success("Curso atualizado com sucesso!");
  };

  // Resetar filtros dependentes quando unidade muda
  const handleUnidadeChange = (value: string) => {
    setSelectedUnidade(value);
    setSelectedProfessor("all");
    setSelectedSala("all");
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

  const salasToShow = salas?.filter(sala => {
    if (selectedSala !== "all") {
      return sala.id === selectedSala;
    }
    return true;
  }) || [];

  // Estado de loading geral
  const isLoading = loadingUnidades || loadingSalas || loadingProfessores || loadingCursos || isChangingWeek;

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

  // Handlers for semana
  const handleMouseDownSemana = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRefSemana.current) return;
    setIsDraggingSemana(true);
    setStartXSemana(e.pageX - scrollRefSemana.current.offsetLeft);
    setScrollLeftSemana(scrollRefSemana.current.scrollLeft);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingSemana) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollRefSemana.current) return;
      const x = e.pageX - scrollRefSemana.current.offsetLeft;
      const walk = x - startXSemana;
      scrollRefSemana.current.scrollLeft = scrollLeftSemana - walk;
    };
    const handleMouseUp = () => {
      setIsDraggingSemana(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSemana, startXSemana, scrollLeftSemana]);

  // Handlers for mes
  const handleMouseDownMes = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRefMes.current) return;
    setIsDraggingMes(true);
    setStartXMes(e.pageX - scrollRefMes.current.offsetLeft);
    setScrollLeftMes(scrollRefMes.current.scrollLeft);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingMes) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollRefMes.current) return;
      const x = e.pageX - scrollRefMes.current.offsetLeft;
      const walk = x - startXMes;
      scrollRefMes.current.scrollLeft = scrollLeftMes - walk;
    };
    const handleMouseUp = () => {
      setIsDraggingMes(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingMes, startXMes, scrollLeftMes]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Cursos</h1>
            <p className="text-muted-foreground">
              Visualização semanal ou mensal dos cursos por sala
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant={viewMode === 'semana' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('semana')}
            >
              Visão Semanal
            </Button>
            <Button
              variant={viewMode === 'mes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('mes')}
            >
              Visão Mensal
            </Button>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Carregando...
              </div>
            )}
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
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Unidade *</label>
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
          </CardContent>
        </Card>

        {/* Navegação da semana/mês */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={viewMode === 'semana' ? handlePreviousWeek : () => setCurrentWeek(subWeeks(startOfMonth(currentWeek), 4))}
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
                    {format(workDays[0], 'dd', { locale: ptBR })} - {format(workDays[5], 'dd MMM yyyy', { locale: ptBR })}
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
                onClick={viewMode === 'semana' ? handleNextWeek : () => setCurrentWeek(addWeeks(startOfMonth(currentWeek), 4))}
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
              <div
                className="overflow-x-auto"
                ref={scrollRefSemana}
                style={{ cursor: isDraggingSemana ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDownSemana}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-semibold">SALAS</TableHead>
                      {workDays.map((day) => (
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
                          {workDays.map((day) => (
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
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          {selectedUnidade === "all" ? "Selecione uma unidade para visualizar as salas" : "Nenhuma sala encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      salasToShow.map((sala) => (
                        <TableRow key={sala.id} className={getUnidadeColor(sala.unidades?.nome || '')}>
                          <TableCell className="font-medium align-top">
                            <div className="space-y-1">
                              <div className="font-semibold text-sm">{sala.nome}</div>
                              <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                                {sala.unidades?.nome}
                              </div>
                            </div>
                          </TableCell>
                          {workDays.map((day) => {
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
                      <TableHead className="w-32 font-semibold">Sala / Turno</TableHead>
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
                        ['manha', 'tarde', 'noite'].map(turno => (
                          <TableRow key={index + turno}>
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
                      ))
                    ) : salasToShow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={totalDiasNoMes + 1} className="text-center py-4 text-muted-foreground">
                          {selectedUnidade === "all" ? "Selecione uma unidade para visualizar as salas" : "Nenhuma sala encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      salasToShow.map((sala) => (
                        ['manha', 'tarde', 'noite'].map(turno => {
                          // Filtrar cursos deste turno/sala
                          const cursosTurno = (cursos || []).filter(curso =>
                            curso.sala_id === sala.id &&
                            curso.periodo === turno &&
                            (
                              // O curso precisa ter pelo menos um dia dentro do mês
                              (parseISO(curso.inicio) <= endMonth && parseISO(curso.fim) >= startMonth)
                            )
                          );
                          // Se não houver cursos, renderiza uma linha vazia
                          if (cursosTurno.length === 0) {
                            return (
                              <TableRow key={sala.id + turno} className={getUnidadeColor(sala.unidades?.nome || '')}>
                                <TableCell className="font-medium align-top">
                                  <div className="space-y-1">
                                    <div className="font-semibold text-sm">{sala.nome}</div>
                                    <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>{sala.unidades?.nome}</div>
                                    <div className="text-xs text-muted-foreground font-medium">{turno.charAt(0).toUpperCase() + turno.slice(1)}</div>
                                  </div>
                                </TableCell>
                                {diasDoMes.map((_, i) => (
                                  <TableCell key={i} className="align-top p-1">
                                    <span className="text-muted-foreground">-</span>
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          }
                          // Para sobreposição, cada curso vira uma linha
                          return cursosTurno.map((curso, idx) => {
                            // Índices do início e fim do curso no mês
                            const inicio = parseISO(curso.inicio);
                            const fim = parseISO(curso.fim);
                            const startIdx = Math.max(0, inicio.getMonth() === mes ? inicio.getDate() - 1 : 0);
                            const endIdx = Math.min(totalDiasNoMes - 1, fim.getMonth() === mes ? fim.getDate() - 1 : totalDiasNoMes - 1);
                            const before = startIdx;
                            const duration = endIdx - startIdx + 1;
                            const after = totalDiasNoMes - endIdx - 1;
                            return (
                              <TableRow key={sala.id + turno + curso.id} className={getUnidadeColor(sala.unidades?.nome || '')}>
                                <TableCell className="font-medium align-top">
                                  <div className="space-y-1">
                                    <div className="font-semibold text-sm">{sala.nome}</div>
                                    <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>{sala.unidades?.nome}</div>
                                    <div className="text-xs text-muted-foreground font-medium">{turno.charAt(0).toUpperCase() + turno.slice(1)}</div>
                                  </div>
                                </TableCell>
                                {/* Células antes da barra */}
                                {before > 0 && Array.from({ length: before }).map((_, i) => (
                                  <TableCell key={"before" + i} className="align-top p-1"></TableCell>
                                ))}
                                {/* Barra do curso */}
                                <TableCell
                                  colSpan={duration}
                                  className={`align-middle p-0 text-center font-medium whitespace-nowrap ${getCursoColor(curso.id)} border cursor-pointer`}
                                  style={{ minWidth: duration * 20 }}
                                  onClick={() => handleCursoClick(curso)}
                                >
                                  <div className="flex items-center justify-center h-full w-full" style={{ minHeight: 24 }}>
                                    <span className="block w-full truncate" style={{ fontSize: '0.8rem' }}>
                                      {curso.titulo} - {curso.professor}
                                    </span>
                                  </div>
                                </TableCell>
                                {/* Células depois da barra */}
                                {after > 0 && Array.from({ length: after }).map((_, i) => (
                                  <TableCell key={"after" + i} className="align-top p-1"></TableCell>
                                ))}
                              </TableRow>
                            );
                          });
                        })
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de detalhes do curso */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Curso</DialogTitle>
            </DialogHeader>
            {selectedCurso && (
              <CursoDetails 
                curso={selectedCurso} 
                onEdit={handleEditCurso}
                onViewInsumos={handleViewInsumos}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de edição do curso */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Curso</DialogTitle>
            </DialogHeader>
            {cursoToEdit && (
              <CursoForm 
                curso={cursoToEdit} 
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Insumos */}
        <Dialog open={insumosDialogOpen} onOpenChange={setInsumosDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lista de Insumos - {selectedCursoInsumos?.titulo}</DialogTitle>
            </DialogHeader>
            {selectedCursoInsumos && (
              <CursoInsumosList 
                cursoId={selectedCursoInsumos.id}
                cursoTitulo={selectedCursoInsumos.titulo}
                professor={selectedCursoInsumos.professor}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Calendario;
