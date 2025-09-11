import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Curso, Sala } from "@/types/calendario";
import { 
  getCursosForSalaAndDay, 
  getUnidadeColor, 
  getUnidadeTextColor, 
  getUnidadeBorder,
  formatPeriodo 
} from "@/utils/calendarioUtils";

interface CalendarioSemanalProps {
  currentWeek: Date;
  salasToShow: Sala[];
  cursosFiltrados: Curso[];
  loadingSalas: boolean;
  loadingCursos: boolean;
  onCursoClick: (curso: Curso) => void;
  onAddCurso: (salaId: string, dia: Date, periodo: string) => void;
}

const CalendarioSemanal: React.FC<CalendarioSemanalProps> = ({
  currentWeek,
  salasToShow,
  cursosFiltrados,
  loadingSalas,
  loadingCursos,
  onCursoClick,
  onAddCurso
}) => {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  }).filter(day => day.getDay() !== 0 && day.getDay() !== 6); // Remove domingos (0) e sábados (6)

  if (loadingSalas) {
    return (
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
                  {weekDays.map((day) => (
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
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium bg-muted/50 align-top">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium bg-muted/50 align-top">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    {weekDays.map((day) => (
                      <TableCell key={day.toISOString()} className="align-top p-2">
                        <Skeleton className="h-16 w-full" />
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
          <CardTitle className="text-lg">Calendário Semanal</CardTitle>
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
        <CardTitle className="text-lg">Calendário Semanal</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="table-fixed" style={{ minWidth: '100%' }}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 font-semibold">Sala/Unidade</TableHead>
                <TableHead className="w-16 font-semibold">Turno</TableHead>
                {weekDays.map((day) => (
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
              {salasToShow.flatMap((sala) => {
                const turnos = ['manha', 'tarde', 'noite'];
                return turnos.map((turno, turnoIdx) => (
                  <TableRow key={sala.id + '-' + turno} className={getUnidadeColor(sala.unidades?.nome || '')}>
                    {turnoIdx === 0 ? (
                      <TableCell 
                        rowSpan={3} 
                        className={`font-medium align-middle ${getUnidadeBorder(sala.unidades?.nome || '')}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                          <div className="font-semibold text-sm">{sala.nome}</div>
                          <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                            {sala.unidades?.nome}
                          </div>
                        </div>
                      </TableCell>
                    ) : null}
                    <TableCell className="font-medium align-middle w-16 text-right pr-2">
                      {formatPeriodo(turno)}
                    </TableCell>
                    {weekDays.map((day) => {
                      const cursosTurno = getCursosForSalaAndDay(cursosFiltrados, sala.id, day)
                        .filter(curso => curso.periodo === turno);
                      
                      return (
                        <TableCell key={day.toISOString()} className="align-top p-2">
                          <div className="space-y-2">
                            {loadingCursos ? (
                              <Skeleton className="h-16 w-full" />
                            ) : (
                              cursosTurno.map((curso) => (
                                <div
                                  key={curso.id}
                                  className={`p-2 rounded border bg-card hover:shadow-md transition-shadow cursor-pointer text-xs ${getUnidadeColor(curso.unidades?.nome || '')}`}
                                  onClick={() => onCursoClick(curso)}
                                >
                                  <div className="space-y-1">
                                    <div className="font-medium leading-tight">{curso.titulo}</div>
                                    <div className="text-muted-foreground">{curso.professor}</div>
                                  </div>
                                </div>
                              ))
                            )}
                            {!loadingCursos && cursosTurno.length === 0 && (
                              (() => {
                                const diaSemana = day.getDay();
                                const isFimDeSemana = diaSemana === 0 || diaSemana === 6; // Domingo ou Sábado
                                
                                if (isFimDeSemana) {
                                  // Fins de semana: célula vazia sem interação
                                  return (
                                    <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded opacity-50">
                                      <span className="text-sm text-muted-foreground">-</span>
                                    </div>
                                  );
                                } else {
                                  // Dias úteis: mostrar card para adicionar curso
                                  return (
                                    <div 
                                      className="flex items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600"
                                      onClick={() => onAddCurso(sala.id, day, turno)}
                                      title="Adicionar novo curso"
                                    >
                                      <span className="text-lg font-bold">+</span>
                                    </div>
                                  );
                                }
                              })()
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarioSemanal;
