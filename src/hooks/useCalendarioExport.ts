import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Curso, Sala, ViewMode } from "@/types/calendario";
import { getCursoColorRGB } from "@/utils/calendarioUtils";

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
    
    // Título principal
    doc.setFontSize(16);
    doc.text('Calendário de Cursos', 14, 20);
    
    // Informações dos filtros aplicados
    doc.setFontSize(10);
    let infoY = 30;
    
    // Filtros aplicados
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
    
    // Período da visualização e Data de emissão na mesma linha
    if (viewMode === 'semana') {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
      // Calcular a sexta-feira (4 dias após a segunda-feira)
      const sexta = new Date(startDate);
      sexta.setDate(startDate.getDate() + 4);
      doc.text(`Período: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(sexta, 'dd/MM/yyyy', { locale: ptBR })} (Segunda a Sexta)`, 14, infoY);
    } else {
      const startMonth = startOfMonth(currentWeek);
      doc.text(`Mês: ${format(startMonth, 'MMMM yyyy', { locale: ptBR })}`, 14, infoY);
    }
    
    // Data de emissão na mesma linha, com margem de aproximadamente 10px
    doc.text(`Data de emissão: ${dataAtual}`, 120, infoY);
    infoY += 8;
    
    if (viewMode === 'semana') {
      exportSemanal(doc, infoY, currentWeek, salasToShow, cursosFiltrados);
    } else {
      exportMensal(doc, infoY, currentWeek, salasToShow, cursosFiltrados);
    }
    
    // Nome do arquivo
    const sanitize = (str: string) => (str || '').normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const viewModeStr = viewMode === 'semana' ? 'semanal' : 'mensal';
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `calendario_${viewModeStr}_${dataStr}.pdf`;
    doc.save(fileName);
    
    toast.success("Calendário exportado com sucesso!");
  };

  const exportSemanal = (
    doc: jsPDF, 
    infoY: number, 
    currentWeek: Date, 
    salasToShow: Sala[], 
    cursosFiltrados: Curso[]
  ) => {
    const weekDays = eachDayOfInterval({
      start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
      end: endOfWeek(currentWeek, { weekStartsOn: 1 })
    }).filter(day => day.getDay() !== 0 && day.getDay() !== 6); // Remove domingos (0) e sábados (6)

    // Cabeçalho da tabela semanal
    const headers = ['Turno', 'Unidade\nSala'];
    weekDays.forEach(day => {
      const dayName = format(day, 'EEEE', { locale: ptBR });
      const shortDayName = dayName.replace('-feira', '');
      headers.push(`${shortDayName} ${format(day, 'dd/MM')}`);
    });
    
    // Para cada sala, adicionar os dados agrupados por turno
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
    
    // Configuração da tabela semanal
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
      didParseCell: function (data) {
        if (data.section === 'body') {
          data.cell.styles.minCellHeight = 10;
        }
        
        // Mesclar células da coluna Turno
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
        
        // Mesclar células da coluna Salas
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

  const exportMensal = (
    doc: jsPDF, 
    infoY: number, 
    currentWeek: Date, 
    salasToShow: Sala[], 
    cursosFiltrados: Curso[]
  ) => {
    const startMonth = startOfMonth(currentWeek);
    const endMonth = endOfMonth(currentWeek);
    const totalDiasNoMes = getDate(endMonth);
    const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => new Date(currentWeek.getFullYear(), currentWeek.getMonth(), i + 1));

    // Cabeçalho da tabela MENSAL
    const headers = ['Unidade\nSala', 'Turno'];
    diasDoMes.forEach((_, i) => {
      headers.push(String(i + 1).padStart(2, '0'));
    });
    
    // Dados da tabela mensal
    let tableData: any[] = [];
    salasToShow.forEach(sala => {
      const turnos = ['manha', 'tarde', 'noite'];
      turnos.forEach(turno => {
        const row = [
          `${sala.unidades?.nome}\n${sala.nome}`,
          formatPeriodo(turno)
        ];
        
        // Para cada dia do mês, verificar se há cursos
        for (let i = 0; i < totalDiasNoMes; i++) {
          const diaAtual = diasDoMes[i];
          const cursosDoDia = cursosFiltrados.filter(curso => 
            curso.sala_id === sala.id &&
            curso.periodo === turno &&
            cursoApareceNoDia(curso, diaAtual)
          );
          
          if (cursosDoDia.length > 0) {
            const curso = cursosDoDia[0];
            row[i + 2] = `${curso.titulo}\n${curso.professor}\n(Início: ${format(parseISO(curso.inicio), 'dd/MM')} - Fim: ${format(parseISO(curso.fim), 'dd/MM')})`;
          } else {
            // Verificar se é fim de semana
            const diaSemana = diaAtual.getDay();
            const isFimDeSemana = diaSemana === 0 || diaSemana === 6; // Domingo ou Sábado
            
            if (isFimDeSemana) {
              row[i + 2] = '-';
            } else {
              row[i + 2] = '';
            }
          }
        }
        
        tableData.push(row);
      });
    });
    
    // Configuração da tabela mensal
    const columnStyles: any = {
      0: { cellWidth: 18, halign: 'center' as const },
      1: { cellWidth: 10, halign: 'center' as const }
    };
    
    diasDoMes.forEach((_, i) => {
      columnStyles[i + 2] = { cellWidth: 8, halign: 'center' as const };
    });
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: infoY + 1,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        halign: 'center',
        fontSize: 8
      },
      bodyStyles: { 
        textColor: 0,
        fontSize: 6,
        cellPadding: 1
      },
      styles: { 
        fontSize: 6,
        cellPadding: 0.5
      },
      columnStyles,
      didParseCell: function (data) {
        if (data.section === 'body') {
          data.cell.styles.minCellHeight = 10;
        }
        
        // Mesclar células da coluna Salas
        if (data.section === 'body' && data.column.index === 0 && data.row.index >= 0) {
          const currentValue = tableData[data.row.index][0];
          
          let isFirstOccurrence = true;
          for (let i = data.row.index - 1; i >= 0; i--) {
            if (tableData[i][0] === currentValue) {
              isFirstOccurrence = false;
              break;
            }
          }
          
          if (isFirstOccurrence) {
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
          } else {
            data.cell.rowSpan = 1;
            data.cell.styles.cellPadding = 0;
            data.cell.styles.fillColor = [255, 255, 255];
          }
        }

        // Mesclar células da coluna Turno
        if (data.section === 'body' && data.column.index === 1 && data.row.index >= 0) {
          const currentValue = tableData[data.row.index][1];
          const prevValue = data.row.index > 0 ? tableData[data.row.index - 1][1] : null;
          
          if (prevValue === currentValue) {
            data.cell.rowSpan = 1;
            data.cell.styles.cellPadding = 0;
            data.cell.styles.fillColor = [255, 255, 255];
          } else {
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
          }
        }
        
        // Aplicar cores para células com cursos
        if (data.section === 'body' && data.column.index >= 2 && data.row.index >= 0) {
          const cellValue = tableData[data.row.index][data.column.index];
          
          if (cellValue && cellValue !== '' && cellValue !== '-') {
            const cursoInfo = cellValue.split('\n');
            const cursoTitulo = cursoInfo[0];
            
            const curso = cursosFiltrados.find(c => 
              c.titulo === cursoTitulo && 
              c.sala_id === salasToShow[Math.floor(data.row.index / 3)].id &&
              c.periodo === ['manha', 'tarde', 'noite'][data.row.index % 3]
            );
            
            if (curso) {
              const cursoColor = getCursoColorRGB(curso.id, cursosFiltrados);
              data.cell.styles.fillColor = cursoColor as [number, number, number];
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
            }
          } else if (cellValue === '-') {
            // Células de fim de semana
            data.cell.styles.fillColor = [240, 240, 240] as [number, number, number];
            data.cell.styles.halign = 'center';
            data.cell.styles.valign = 'middle';
          }
        }
      }
    });

    addPageNumbers(doc);
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

  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  const getCursosForSalaAndDay = (cursos: Curso[], salaId: string, day: Date) => {
    return cursos?.filter(curso => {
      if (curso.sala_id !== salaId) return false;
      
      const cursoStart = parseISO(curso.inicio);
      const cursoEnd = parseISO(curso.fim);
      return isWithinInterval(day, { start: cursoStart, end: cursoEnd });
    }) || [];
  };

  return { handleExportPDF };
};
