
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const Calendario = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<string>("all");

  // Buscar unidades para filtro
  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data } = await supabase.from('unidades').select('*').order('nome');
      return data || [];
    }
  });

  // Buscar professores únicos para filtro
  const { data: professores } = useQuery({
    queryKey: ['professores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cursos')
        .select('professor')
        .order('professor');
      
      const uniqueProfessores = [...new Set(data?.map(item => item.professor) || [])];
      return uniqueProfessores;
    }
  });

  // Buscar cursos da semana
  const { data: cursos } = useQuery({
    queryKey: ['cursos-semana', currentWeek, selectedUnidade, selectedProfessor],
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

      if (selectedUnidade !== "all") {
        query = query.eq('unidade_id', selectedUnidade);
      }

      if (selectedProfessor !== "all") {
        query = query.eq('professor', selectedProfessor);
      }

      const { data } = await query.order('inicio');
      return data || [];
    }
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 0 })
  });

  const getCursosForDay = (day: Date) => {
    return cursos?.filter(curso => {
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Cursos</h1>
            <p className="text-muted-foreground">
              Visualização semanal dos cursos agendados
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
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
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
                  {format(weekDays[0], 'dd', { locale: ptBR })} - {format(weekDays[6], 'dd MMM yyyy', { locale: ptBR })}
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

        {/* Grid do calendário */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const cursosDay = getCursosForDay(day);
            const dayName = format(day, 'EEEE', { locale: ptBR });
            const dayNumber = format(day, 'd');

            return (
              <Card key={day.toISOString()} className="min-h-[300px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center">
                    <div className="text-sm font-medium capitalize">{dayName}</div>
                    <div className="text-2xl font-bold">{dayNumber}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cursosDay.map((curso) => (
                    <div
                      key={curso.id}
                      className="p-2 rounded-lg border bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm leading-tight">{curso.titulo}</h4>
                        <p className="text-xs text-muted-foreground">{curso.professor}</p>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="secondary" 
                            className={getPeriodoColor(curso.periodo) + " text-xs"}
                          >
                            {formatPeriodo(curso.periodo)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {curso.unidades?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {curso.salas?.nome}
                        </p>
                      </div>
                    </div>
                  ))}
                  {cursosDay.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      Nenhum curso
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Calendario;
