import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string | null;
  unidade_id: string;
  unidades: { nome: string, id: string } | null;
  salas: { nome: string; id: string } | null;
  total_insumos?: number;
}

export const useCursosExport = () => {
  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  const sortCursos = (cursos: Curso[]) => {
    return [...cursos].sort((a, b) => {
      // Primeiro por unidade
      const unidadeA = a.unidades?.nome || 'Sem Unidade';
      const unidadeB = b.unidades?.nome || 'Sem Unidade';
      if (unidadeA !== unidadeB) {
        return unidadeA.localeCompare(unidadeB);
      }

      // Depois por período (Manhã, Tarde, Noite)
      const turnoOrder = { 'manha': 1, 'tarde': 2, 'noite': 3 };
      const aOrder = turnoOrder[a.periodo as keyof typeof turnoOrder] || 4;
      const bOrder = turnoOrder[b.periodo as keyof typeof turnoOrder] || 4;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Por último por sala
      const salaA = a.salas?.nome || 'Sem Sala';
      const salaB = b.salas?.nome || 'Sem Sala';
      return salaA.localeCompare(salaB);
    });
  };

  const exportToExcel = (filteredCursos: Curso[]) => {
    if (!filteredCursos || filteredCursos.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    // Ordenar cursos por unidade, período e sala
    const cursosOrdenados = sortCursos(filteredCursos);

    // Criar dados para Excel
    const excelData = cursosOrdenados.map(curso => ({
      'Título': curso.titulo,
      'Professor': curso.professor,
      'Período': formatPeriodo(curso.periodo),
      'Data Início': format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
      'Data Fim': format(new Date(curso.fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
      'Unidade': curso.unidades?.nome || 'Sem Unidade',
      'Sala': curso.salas?.nome || 'Sem Sala',
      'Total de Insumos': curso.total_insumos || 0
    }));

    // Converter para CSV
    const headers = Object.keys(excelData[0]);
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_cursos_${format(new Date(), 'dd-MM-yyyy HH:mm:ss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportToPDF = (filteredCursos: Curso[]) => {
    if (!filteredCursos || filteredCursos.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    // Ordenar cursos por unidade, período e sala
    const cursosOrdenados = sortCursos(filteredCursos);

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Título principal
    doc.setFontSize(16);
    doc.text('Relatório de Cursos', 14, 20);
    
    // Informações do relatório
    doc.setFontSize(10);
    let infoY = 30;
    
    // Data de emissão
    doc.text(`Data de emissão: ${dataAtual}`, 14, infoY);
    infoY += 6;
    
    // Total de cursos
    doc.text(`Total de cursos: ${cursosOrdenados.length}`, 14, infoY);
    infoY += 8;
    
    // Preparar dados da tabela
    const headers = [
      'Título',
      'Professor', 
      'Período',
      'Data Início',
      'Data Fim',
      'Unidade',
      'Sala',
      'Insumos'
    ];
    
    const tableData = cursosOrdenados.map(curso => [
      curso.titulo,
      curso.professor,
      formatPeriodo(curso.periodo),
      format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
      format(new Date(curso.fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
      curso.unidades?.nome || 'Sem Unidade',
      curso.salas?.nome || 'Sem Sala',
      curso.total_insumos?.toString() || '0'
    ]);
    
    // Configuração da tabela
    const columnStyles: any = {
      0: { cellWidth: 35, halign: 'center' as const }, // Título
      1: { cellWidth: 25, halign: 'center' as const }, // Professor
      2: { cellWidth: 15, halign: 'center' as const }, // Período
      3: { cellWidth: 20, halign: 'center' as const }, // Data Início
      4: { cellWidth: 20, halign: 'center' as const }, // Data Fim
      5: { cellWidth: 25, halign: 'center' as const }, // Unidade
      6: { cellWidth: 20, halign: 'center' as const }, // Sala
      7: { cellWidth: 15, halign: 'center' as const } // Insumos
    };
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: infoY + 3,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { 
        fillColor: [74, 144, 226], 
        textColor: 255, 
        halign: 'center',
        fontSize: 9,
        fontStyle: 'bold'
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
          data.cell.styles.minCellHeight = 8;
        }
        
        // Aplicar cores para período
        if (data.section === 'body' && data.column.index === 2) {
          const periodo = data.cell.text[0];
          if (periodo === 'Manhã') {
            data.cell.styles.fillColor = [254, 243, 199] as [number, number, number];
            data.cell.styles.textColor = [146, 64, 14] as [number, number, number];
          } else if (periodo === 'Tarde') {
            data.cell.styles.fillColor = [254, 215, 170] as [number, number, number];
            data.cell.styles.textColor = [234, 88, 12] as [number, number, number];
          } else if (periodo === 'Noite') {
            data.cell.styles.fillColor = [219, 234, 254] as [number, number, number];
            data.cell.styles.textColor = [30, 64, 175] as [number, number, number];
          }
        }
      }
    });
    
    addPageNumbers(doc);
    
    // Nome do arquivo
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `relatorio_cursos_${dataStr}.pdf`;
    doc.save(fileName);
    
    toast.success("Relatório PDF gerado com sucesso!");
  };

  const addPageNumbers = (doc: jsPDF) => {
    const finalTotalPages = doc.getNumberOfPages();
    
    for (let pageNum = 1; pageNum <= finalTotalPages; pageNum++) {
      doc.setPage(pageNum);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Sistema de Cursos - CMU', 14, pageHeight - 10);
      doc.text(`Página ${pageNum} de ${finalTotalPages}`, 180, pageHeight - 10, { align: 'right' });
    }
  };

  return { 
    exportToExcel, 
    exportToPDF 
  };
};
