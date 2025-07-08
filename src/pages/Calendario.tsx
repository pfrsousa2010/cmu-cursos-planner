
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import CursoDetails from "@/components/CursoDetails";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string;
  unidades: { nome: string } | null;
  salas: { nome: string } | null;
}

const Calendario = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<string>("all");
  const [selectedSala, setSelectedSala] = useState<string>("all");
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Buscar unidades para filtro
  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data } = await supabase.from('unidades').select('*').order('nome');
      return data || [];
    }
  });

  // Buscar salas para filtro (filtradas por unidade)
  const { data: salas } = useQuery({
    queryKey: ['salas', selectedUnidade],
    queryFn: async () => {
      let query = supabase.from('salas').select('*, unidades(nome)').order('nome');
      
      if (selectedUnidade !== "all") {
        query = query.eq('unidade_id', selectedUnidade);
      }
      
      const { data } = await query;
      return data || [];
    }
  });

  // Buscar professores únicos (filtrados por unidade)
  const { data: professores } = useQuery({
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
  const { data: cursos } = useQuery({
    queryKey: ['cursos-semana', currentWeek, selectedUnidade, selectedProfessor, selectedSala],
    queryFn: async () => {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const endDate = endOfWeek(currentWeek, { weekStartsOn: 0 });

      let query = supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
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

  const handleCursoClick = (curso: Curso) => {
    setSelectedCurso(curso);
    setDialogOpen(true);
  };

  // Resetar filtros dependentes quando unidade muda
  const handleUnidadeChange = (value: string) => {
    setSelectedUnidade(value);
    setSelectedProfessor("all");
    setSelectedSala("all");
  };

  const salasToShow = salas?.filter(sala => {
    if (selectedSala !== "all") {
      return sala.id === selectedSala;
    }
    return true;
  }) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Cursos</h1>
            <p className="text-muted-foreground">
              Visualização semanal dos cursos por sala
            </p>
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
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Professor</label>
              <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
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
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Sala</label>
              <Select value={selectedSala} onValueChange={setSelectedSala}>
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
            </div>
          </CardContent>
        </Card>

        {/* Navegação da semana */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Semana Anterior
              </Button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {format(workDays[0], 'dd', { locale: ptBR })} - {format(workDays[5], 'dd MMM yyyy', { locale: ptBR })}
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                Próxima Semana
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tabela de cursos por sala */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
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
                  {salasToShow.map((sala) => (
                    <TableRow key={sala.id}>
                      <TableCell className="font-medium bg-gray-50 align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">{sala.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {sala.unidades?.nome}
                          </div>
                        </div>
                      </TableCell>
                      {workDays.map((day) => {
                        const cursosDay = getCursosForSalaAndDay(sala.id, day);
                        
                        return (
                          <TableCell key={day.toISOString()} className="align-top p-2">
                            <div className="space-y-2">
                              {cursosDay.map((curso) => (
                                <div
                                  key={curso.id}
                                  className="p-2 rounded border bg-white hover:shadow-md transition-shadow cursor-pointer text-xs"
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
                              ))}
                              {cursosDay.length === 0 && (
                                <div className="text-center text-muted-foreground text-xs py-2">
                                  -
                                </div>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {salasToShow.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        {selectedUnidade === "all" ? "Selecione uma unidade para visualizar as salas" : "Nenhuma sala encontrada"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de detalhes do curso */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Curso</DialogTitle>
            </DialogHeader>
            {selectedCurso && (
              <CursoDetails curso={selectedCurso} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Calendario;
