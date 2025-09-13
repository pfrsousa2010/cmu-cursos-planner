import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Curso, Sala, ViewMode } from "@/types/calendario";
import { getCursoColorRGB } from "@/utils/calendarioUtils";

const cursoApareceNoDia = (curso: Curso, dia: Date): boolean => {
  const cursoStart = parseISO(curso.inicio);
  const cursoEnd = parseISO(curso.fim);
  
  if (dia < cursoStart || dia > cursoEnd) {
    return false;
  }
  
  const dayOfWeekMap = {
    'segunda': 1,
    'terca': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5
  };
  
  const currentDayOfWeek = dia.getDay();
  const cursoDaysOfWeek = curso.dia_semana.map(dia => dayOfWeekMap[dia]);
  
  return cursoDaysOfWeek.includes(currentDayOfWeek);
};

const formatPeriodo = (periodo: string) => {
  const periodos = {
    'manha': 'Manhã',
    'tarde': 'Tarde',
    'noite': 'Noite'
  };
  return periodos[periodo as keyof typeof periodos] || periodo;
};

const addPageNumbers = (doc: jsPDF) => {
  const finalTotalPages = doc.getNumberOfPages();
  
  for (let pageNum = 1; pageNum <= finalTotalPages; pageNum++) {
    doc.setPage(pageNum);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Sistema de Cursos - CMU', 14, pageHeight - 10);
    doc.text(`Página ${pageNum} de ${finalTotalPages}`, 280, pageHeight - 10, { align: 'right' });
  }
};

const createCalendarGrid = (currentWeek: Date) => {
  const startMonth = startOfMonth(currentWeek);
  const endMonth = endOfMonth(currentWeek);
  const totalDiasNoMes = getDate(endMonth);
  const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => new Date(currentWeek.getFullYear(), currentWeek.getMonth(), i + 1));
  const primeiroDiaDoMes = startMonth.getDay();
  const semanasCompletas = Math.ceil((totalDiasNoMes + primeiroDiaDoMes) / 7);
  
  const calendarioGrid: (Date | null)[][] = [];
  
  const primeiraSemana: (Date | null)[] = [];
  for (let i = 0; i < primeiroDiaDoMes; i++) {
    primeiraSemana.push(null);
  }
  
  for (let i = 0; i < 7 - primeiroDiaDoMes; i++) {
    if (i < totalDiasNoMes) {
      primeiraSemana.push(diasDoMes[i]);
    } else {
      primeiraSemana.push(null);
    }
  }
  calendarioGrid.push(primeiraSemana);
  
  let diaAtual = 7 - primeiroDiaDoMes;
  for (let semana = 1; semana < semanasCompletas; semana++) {
    const semanaAtual: (Date | null)[] = [];
    for (let dia = 0; dia < 7; dia++) {
      if (diaAtual < totalDiasNoMes) {
        semanaAtual.push(diasDoMes[diaAtual]);
        diaAtual++;
      } else {
        semanaAtual.push(null);
      }
    }
    calendarioGrid.push(semanaAtual);
  }
  
  return calendarioGrid;
};

const getCursosForDay = (cursosFiltrados: Curso[], salaId: string, dia: Date, periodo: string) => {
  return cursosFiltrados.filter(curso => 
    curso.sala_id === salaId &&
    curso.periodo === periodo &&
    cursoApareceNoDia(curso, dia)
  );
};

const createCellContent = (dia: Date, diaIndex: number, cursosFiltrados: Curso[], salaId: string) => {
  const isFimDeSemana = diaIndex === 0 || diaIndex === 6;
  
  if (isFimDeSemana) {
    return `${dia.getDate()}`;
  }
  
  const cursosManha = getCursosForDay(cursosFiltrados, salaId, dia, 'manha');
  const cursosTarde = getCursosForDay(cursosFiltrados, salaId, dia, 'tarde');
  const cursosNoite = getCursosForDay(cursosFiltrados, salaId, dia, 'noite');
  
  let conteudoCelula = `${dia.getDate()}\n`;
  
  conteudoCelula += cursosManha.length > 0 ? `\nManhã: ${cursosManha[0].titulo}\n` : `\nManhã: -\n`;
  conteudoCelula += cursosTarde.length > 0 ? `\nTarde: ${cursosTarde[0].titulo}\n` : `\nTarde: -\n`;
  conteudoCelula += cursosNoite.length > 0 ? `\nNoite: ${cursosNoite[0].titulo}\n` : `\nNoite: -`;
  
  return conteudoCelula;
};

const createTableData = (calendarioGrid: (Date | null)[][], cursosFiltrados: Curso[], salaId: string) => {
  const tableData: any[] = [];
  
  calendarioGrid.forEach(semana => {
    const row: any[] = [];
    
    semana.forEach((dia, diaIndex) => {
      if (dia) {
        row.push(createCellContent(dia, diaIndex, cursosFiltrados, salaId));
      } else {
        row.push('');
      }
    });
    
    tableData.push(row);
  });
  
  return tableData;
};

const createColumnStyles = (diasDaSemana: string[]) => {
  const columnStyles: any = {};
  diasDaSemana.forEach((_, i) => {
    columnStyles[i] = { cellWidth: 46, halign: 'left' as const };
  });
  return columnStyles;
};

const createTableConfig = (headers: string[], tableData: any[], columnStyles: any) => ({
  head: [headers],
  body: tableData,
  margin: { left: 14, right: 14 },
  theme: 'grid' as const,
  headStyles: { 
    fillColor: [74, 144, 226] as [number, number, number], 
    textColor: 255, 
    halign: 'center' as const,
    fontSize: 9,
    fontStyle: 'bold' as const
  },
  bodyStyles: { 
    textColor: 0,
    fontSize: 7,
    cellPadding: 3
  },
  styles: { 
    fontSize: 7,
    cellPadding: 2
  },
  columnStyles,
  didParseCell: function (data: any) {
    if (data.section === 'body') {
      data.cell.styles.minCellHeight = 25;
      data.cell.styles.halign = 'left';
      data.cell.styles.valign = 'top';
      
      if (data.column.index === 6 || data.column.index === 0) {
        data.cell.styles.fillColor = [240, 240, 240] as [number, number, number];
        data.cell.styles.cellWidth = 21;
      }
    }
  }
});

const exportSemanal = (doc: jsPDF, infoY: number, currentWeek: Date, salasToShow: Sala[], cursosFiltrados: Curso[]) => {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  }).filter(day => day.getDay() !== 0 && day.getDay() !== 6);

  const headers = ['Turno', 'Unidade\nSala'];
  weekDays.forEach(day => {
    const dayName = format(day, 'EEEE', { locale: ptBR });
    const shortDayName = dayName.replace('-feira', '');
    headers.push(`${shortDayName} ${format(day, 'dd/MM')}`);
  });
  
  let tableData: any[] = [];
  salasToShow.forEach(sala => {
    const turnos = ['manha', 'tarde', 'noite'];
    turnos.forEach(turno => {
      const row = [formatPeriodo(turno), `${sala.unidades?.nome}\n${sala.nome}`];
      
      weekDays.forEach(day => {
        const cursosDay = cursosFiltrados.filter(curso => 
          curso.sala_id === sala.id && 
          curso.periodo === turno &&
          cursoApareceNoDia(curso, day)
        );
        
        if (cursosDay.length > 0) {
          const curso = cursosDay[0];
          row.push(`${curso.titulo}\n${curso.professor}\n(Início: ${format(parseISO(curso.inicio), 'dd/MM')} - Fim: ${format(parseISO(curso.fim), 'dd/MM')})`);
        } else {
          row.push('-');
        }
      });
      
      tableData.push(row);
    });
  });
  
  const columnStyles: any = {
    0: { cellWidth: 15, halign: 'center' as const },
    1: { cellWidth: 35, halign: 'center' as const }
  };
  
  weekDays.forEach((_, index) => {
    columnStyles[index + 2] = { cellWidth: 45, halign: 'center' as const };
  });
  
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: infoY + 3,
    margin: { left: 14, right: 20 },
    theme: 'grid',
    headStyles: { 
      fillColor: [74, 144, 226], 
      textColor: 255, 
      halign: 'center',
      fontSize: 9
    },
    bodyStyles: { 
      textColor: 0,
      fontSize: 8,
      cellPadding: 2
    },
    styles: { 
      fontSize: 8,
      cellPadding: 1
    },
    columnStyles,
    didParseCell: function (data: any) {
      if (data.section === 'body') {
        data.cell.styles.minCellHeight = 10;
      }
      
      if (data.section === 'body' && data.column.index === 0 && data.row.index >= 0) {
        const currentValue = tableData[data.row.index][0];
        const prevValue = data.row.index > 0 ? tableData[data.row.index - 1][0] : null;
        
        if (prevValue === currentValue) {
          data.cell.rowSpan = 1;
          data.cell.styles.cellPadding = 0;
          data.cell.styles.fillColor = [255, 255, 255];
        } else {
          let rowSpan = 1;
          for (let i = data.row.index + 1; i < tableData.length; i++) {
            if (tableData[i][0] === currentValue) {
              rowSpan++;
            } else {
              break;
            }
          }
          data.cell.rowSpan = rowSpan;
          data.cell.styles.valign = 'middle';
        }
      }
      
      if (data.section === 'body' && data.column.index === 1 && data.row.index >= 0) {
        const currentValue = tableData[data.row.index][1];
        
        let isFirstOccurrence = true;
        for (let i = data.row.index - 1; i >= 0; i--) {
          if (tableData[i][1] === currentValue) {
            isFirstOccurrence = false;
            break;
          }
        }
        
        if (isFirstOccurrence) {
          let rowSpan = 1;
          for (let i = data.row.index + 1; i < tableData.length; i++) {
            if (tableData[i][1] === currentValue) {
              rowSpan++;
            } else {
              break;
            }
          }
          
          data.cell.rowSpan = rowSpan;
          data.cell.styles.valign = 'middle';
        } else {
          data.cell.rowSpan = 1;
          data.cell.styles.cellPadding = 0;
          data.cell.styles.fillColor = [255, 255, 255];
        }
      }
    }
  });
  
  addPageNumbers(doc);
};

const exportMensal = (doc: jsPDF, infoY: number, currentWeek: Date, salasToShow: Sala[], cursosFiltrados: Curso[]) => {
  const calendarioGrid = createCalendarGrid(currentWeek);
  const diasDaSemana = ['DOMINGO','SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  
  salasToShow.forEach((sala, salaIndex) => {
    if (salaIndex > 0) {
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${sala.unidades?.nome} - ${sala.nome}`, 14, 20);
      var currentY = 30;
    } else {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${sala.unidades?.nome} - ${sala.nome}`, 14, infoY + 5);
      var currentY = infoY + 10;
    }
    
    const headers = diasDaSemana.map(dia => dia);
    const tableData = createTableData(calendarioGrid, cursosFiltrados, sala.id);
    const columnStyles = createColumnStyles(diasDaSemana);
    const tableConfig = createTableConfig(headers, tableData, columnStyles);
    
    autoTable(doc, {
      ...tableConfig,
      startY: currentY
    });
  });

  addPageNumbers(doc);
};

export const useCalendarioExport = () => {
  const handleExportPDF = (
    viewMode: ViewMode,
    currentWeek: Date,
    cursosFiltrados: Curso[],
    salasToShow: Sala[],
    selectedUnidade: string,
    selectedSala: string,
    selectedProfessor: string,
    unidades: { id: string; nome: string }[],
    salas: { id: string; nome: string }[]
  ) => {
    if (!cursosFiltrados || cursosFiltrados.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    const doc = new jsPDF('landscape');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(16);
    doc.text('Calendário de Cursos', 14, 20);
    
    doc.setFontSize(10);
    let infoY = 30;
    
    const filtros = [];
    if (selectedUnidade !== 'all') {
      const unidadeNome = unidades.find(u => u.id === selectedUnidade)?.nome;
      filtros.push(`Unidade: ${unidadeNome}`);
    }
    if (selectedSala !== 'all') {
      const salaNome = salas.find(s => s.id === selectedSala)?.nome;
      filtros.push(`Sala: ${salaNome}`);
    }
    if (selectedProfessor !== 'all') {
      filtros.push(`Professor: ${selectedProfessor}`);
    }
    
    if (filtros.length > 0) {
      doc.text(`Filtros aplicados: ${filtros.join(' | ')}`, 14, infoY);
      infoY += 6;
    }
    
    if (viewMode === 'semana') {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const sexta = new Date(startDate);
      sexta.setDate(startDate.getDate() + 4);
      doc.text(`Período: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(sexta, 'dd/MM/yyyy', { locale: ptBR })} (Segunda a Sexta)`, 14, infoY);
    } else {
      const startMonth = startOfMonth(currentWeek);
      doc.text(`Mês: ${format(startMonth, 'MMMM yyyy', { locale: ptBR })}`, 14, infoY);
    }
    
    doc.text(`Data de emissão: ${dataAtual}`, 120, infoY);
    infoY += 8;
    
    if (viewMode === 'semana') {
      exportSemanal(doc, infoY, currentWeek, salasToShow, cursosFiltrados);
    } else {
      exportMensal(doc, infoY, currentWeek, salasToShow, cursosFiltrados);
    }
    
    const sanitize = (str: string) => (str || '').normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const viewModeStr = viewMode === 'semana' ? 'semanal' : 'mensal';
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `calendario_${viewModeStr}_${dataStr}.pdf`;
    doc.save(fileName);
    
    toast.success("Calendário exportado com sucesso!");
  };

  return { handleExportPDF };
};