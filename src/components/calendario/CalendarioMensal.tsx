import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfMonth, endOfMonth, getDate, parseISO } from "date-fns";
import { Curso, Sala } from "@/types/calendario";
import { 
  getUnidadeColor, 
  getUnidadeTextColor, 
  getUnidadeBorder, 
  getCursoColor, 
  formatPeriodo 
} from "@/utils/calendarioUtils";

// Função para verificar se um curso deve aparecer em um dia específico
const cursoApareceNoDia = (curso: Curso, dia: Date): boolean => {
  const cursoStart = parseISO(curso.inicio);
  const cursoEnd = parseISO(curso.fim);
  
  // Verifica se o dia está dentro do intervalo de datas do curso
  if (dia < cursoStart || dia > cursoEnd) {
    return false;
  }
  
  // Mapeia os dias da semana para números (0 = domingo, 1 = segunda, etc.)
  const dayOfWeekMap = {
    'segunda': 1,
    'terca': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5
  };
  
  // Verifica se o dia da semana atual está nos dias da semana do curso
  const currentDayOfWeek = dia.getDay();
  const cursoDaysOfWeek = curso.dia_semana.map(dia => dayOfWeekMap[dia]);
  
  return cursoDaysOfWeek.includes(currentDayOfWeek);
};

interface CalendarioMensalProps {
  currentWeek: Date;
  salasToShow: Sala[];
  cursosFiltrados: Curso[];
  loadingSalas: boolean;
  onCursoClick: (curso: Curso) => void;
  onAddCurso: (salaId: string, dia: Date, periodo: string) => void;
}

const CalendarioMensal: React.FC<CalendarioMensalProps> = ({
  currentWeek,
  salasToShow,
  cursosFiltrados,
  loadingSalas,
  onCursoClick,
  onAddCurso
}) => {
  const ano = currentWeek.getFullYear();
  const mes = currentWeek.getMonth();
  const startMonth = startOfMonth(currentWeek);
  const endMonth = endOfMonth(currentWeek);
  const totalDiasNoMes = getDate(endMonth);
  const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => new Date(ano, mes, i + 1));

  // Geração das linhas da tabela mensal
  const linhasMensais = (salasToShow || []).flatMap((sala) => {
    const turnos = ['manha', 'tarde', 'noite'];
    return turnos.map((turno, turnoIdx) => {
      const cursosTurno = (cursosFiltrados || []).filter(curso =>
        curso.sala_id === sala.id &&
        curso.periodo === turno &&
        parseISO(curso.inicio) <= endMonth &&
        parseISO(curso.fim) >= startMonth
      ).sort((a, b) => parseISO(a.inicio).getTime() - parseISO(b.inicio).getTime());
      
      const cells = [];
      
      // Para cada dia do mês, verificar se há cursos
      for (let i = 0; i < totalDiasNoMes; i++) {
        const diaAtual = diasDoMes[i];
        const cursosDoDia = cursosTurno.filter(curso => cursoApareceNoDia(curso, diaAtual));
        
        if (cursosDoDia.length > 0) {
          // Se há cursos neste dia, mostrar como cards
          cells.push(
            <TableCell key={`cursos-${sala.id}-${turno}-${i}`} className="align-middle p-1 h-[40px]">
              <div className="space-y-0.5">
                {cursosDoDia.map((curso) => (
                  <TooltipProvider key={curso.id} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`p-1 rounded border bg-card hover:shadow-md transition-shadow cursor-pointer text-xs ${getUnidadeColor(curso.unidades?.nome || '')} flex items-center justify-center min-h-[20px]`}
                          onClick={() => onCursoClick(curso)}
                        >
                          <span className="font-bold text-sm">
                            {curso.titulo.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="font-medium">{curso.titulo}</div>
                          <div className="text-sm text-muted-foreground">{curso.professor}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </TableCell>
          );
        } else {
          // Se não há cursos neste dia, verificar se é fim de semana
          const diaSemana = diaAtual.getDay();
          const isFimDeSemana = diaSemana === 0 || diaSemana === 6; // Domingo ou Sábado
          
          if (isFimDeSemana) {
            // Fins de semana: célula vazia sem interação
            cells.push(
              <TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-middle p-1 h-[40px]">
                <div className="h-full bg-gray-50 dark:bg-gray-800 rounded opacity-50"></div>
              </TableCell>
            );
          } else {
            // Dias úteis: mostrar card para adicionar curso
            cells.push(
              <TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-middle p-1 h-[40px]">
                <div 
                  className="flex items-center justify-center p-1 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600 h-full"
                  onClick={() => onAddCurso(sala.id, diaAtual, turno)}
                  title="Adicionar novo curso"
                >
                  <span className="text-lg font-bold">+</span>
                </div>
              </TableCell>
            );
          }
        }
      }
      
      return (
        <TableRow key={sala.id + '-' + turno} className={getUnidadeColor(sala.unidades?.nome || '') + ' h-[40px]'}>
          {turnoIdx === 0 ? (
            <TableCell 
              rowSpan={3} 
              className={`font-medium align-middle h-full ${getUnidadeBorder(sala.unidades?.nome || '')}`}
              style={{ height: '100%' }}
            >
              <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                <div className="font-semibold text-sm">{sala.nome}</div>
                <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                  {sala.unidades?.nome}
                </div>
              </div>
            </TableCell>
          ) : null}
          <TableCell className="font-medium align-middle w-16 text-right pr-2 h-[40px]">
            {formatPeriodo(turno)}
          </TableCell>
          {cells}
        </TableRow>
      );
    });
  });

  if (loadingSalas) {
    return (
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
                  {diasDoMes.map((dia, i) => {
                    const diaSemana = dia.getDay();
                    const isSabado = diaSemana === 6;
                    const isDomingo = diaSemana === 0;
                    
                    return (
                      <TableHead key={i} className="text-center font-semibold" style={{ minWidth: 30, fontSize: '0.8rem', padding: 0 }}>
                        <div className="flex flex-col">
                          {(isSabado || isDomingo) && (
                            <span className="text-xs text-muted-foreground mb-1">
                              {isSabado ? 'SAB' : 'DOM'}
                            </span>
                          )}
                          <span>{String(i + 1).padStart(2, '0')}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium bg-muted/50 align-top">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    {diasDoMes.map((_, i) => (
                      <TableCell key={i} className="align-top p-2">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (salasToShow.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Calendário Mensal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma sala com cursos encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                {diasDoMes.map((dia, i) => {
                  const diaSemana = dia.getDay();
                  const isSabado = diaSemana === 6;
                  const isDomingo = diaSemana === 0;
                  
                  return (
                    <TableHead key={i} className="text-center font-semibold" style={{ minWidth: 30, fontSize: '0.8rem', padding: 0 }}>
                      <div className="flex flex-col">
                        {(isSabado || isDomingo) && (
                          <span className="text-xs text-muted-foreground mb-1">
                            {isSabado ? 'SAB' : 'DOM'}
                          </span>
                        )}
                        <span>{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasMensais}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarioMensal;
