import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, getDate, parseISO } from "date-fns";
import { Curso, Sala } from "@/types/calendario";
import { 
  getUnidadeColor, 
  getUnidadeTextColor, 
  getUnidadeBorder, 
  getCursoColor, 
  formatPeriodo 
} from "@/utils/calendarioUtils";

interface CalendarioMensalProps {
  currentWeek: Date;
  salasToShow: Sala[];
  cursosFiltrados: Curso[];
  loadingSalas: boolean;
  onCursoClick: (curso: Curso) => void;
}

const CalendarioMensal: React.FC<CalendarioMensalProps> = ({
  currentWeek,
  salasToShow,
  cursosFiltrados,
  loadingSalas,
  onCursoClick
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
      let currentDay = 0;
      
      if (cursosTurno.length > 0) {
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
              className={`align-middle p-0 text-center font-medium whitespace-nowrap ${getCursoColor(curso.id, cursosFiltrados)} border cursor-pointer`}
              style={{ minWidth: (endIdx - startIdx + 1) * 20 }}
              onClick={() => onCursoClick(curso)}
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
      }
      
      if (currentDay < totalDiasNoMes) {
        for (let i = currentDay; i < totalDiasNoMes; i++) {
          cells.push(<TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-top p-1 h-[56px]"></TableCell>);
        }
      }
      
      return (
        <TableRow key={sala.id + '-' + turno} className={getUnidadeColor(sala.unidades?.nome || '') + ' h-[56px]'}>
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
          <TableCell className="font-medium align-middle w-16 text-right pr-2 h-[56px]">
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
                  {diasDoMes.map((_, i) => (
                    <TableHead key={i} className="text-center font-semibold" style={{ minWidth: 30, fontSize: '0.8rem', padding: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
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
                {diasDoMes.map((_, i) => (
                  <TableHead key={i} className="text-center font-semibold" style={{ minWidth: 30, fontSize: '0.8rem', padding: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </TableHead>
                ))}
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
