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
  getPeriodoColor, 
  formatPeriodo 
} from "@/utils/calendarioUtils";

interface CalendarioSemanalProps {
  currentWeek: Date;
  salasToShow: Sala[];
  cursosFiltrados: Curso[];
  loadingSalas: boolean;
  loadingCursos: boolean;
  onCursoClick: (curso: Curso) => void;
}

const CalendarioSemanal: React.FC<CalendarioSemanalProps> = ({
  currentWeek,
  salasToShow,
  cursosFiltrados,
  loadingSalas,
  loadingCursos,
  onCursoClick
}) => {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 0 })
  });

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
                    <TableCell className="font-medium bg-gray-50 align-top">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    {weekDays.map((day) => (
                      <TableCell key={day.toISOString()} className="align-top p-2">
                        <div className="space-y-2">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
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
              {salasToShow.map((sala) => (
                <TableRow key={sala.id} className={getUnidadeColor(sala.unidades?.nome || '')}>
                  <TableCell className="font-medium align-middle">
                    <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                      <div className="font-semibold text-sm">{sala.nome}</div>
                      <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                        {sala.unidades?.nome}
                      </div>
                    </div>
                  </TableCell>
                  {weekDays.map((day) => {
                    const periodoOrder = ['manha', 'tarde', 'noite'];
                    const cursosDay = [...getCursosForSalaAndDay(cursosFiltrados, sala.id, day)]
                      .sort((a, b) => periodoOrder.indexOf(a.periodo) - periodoOrder.indexOf(b.periodo));
                    
                    return (
                      <TableCell key={day.toISOString()} className="align-top p-2">
                        <div className="space-y-2">
                          {loadingCursos ? (
                            Array.from({ length: 2 }).map((_, index) => (
                              <Skeleton key={index} className="h-16 w-full" />
                            ))
                          ) : (
                            cursosDay.map((curso) => (
                              <div
                                key={curso.id}
                                className={`p-2 rounded border bg-white hover:shadow-md transition-shadow cursor-pointer text-xs ${getUnidadeColor(curso.unidades?.nome || '')}`}
                                onClick={() => onCursoClick(curso)}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarioSemanal;
