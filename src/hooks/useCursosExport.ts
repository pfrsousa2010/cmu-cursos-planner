import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Curso } from "@/types/calendario";

export const useCursosExport = () => {
  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  const formatDiasSemana = (diasSemana: string[]) => {
    if (!diasSemana || diasSemana.length === 0) return 'Não definido';

    // Se todos os dias da semana estão presentes, mostrar "segunda à sexta"
    const todosDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const temTodosDias = todosDias.every(dia => diasSemana.includes(dia));

    if (temTodosDias) {
      return 'Segunda à sexta';
    }

    // Caso contrário, mostrar os dias separados por vírgula
    const diasFormatados = diasSemana.map(dia => {
      const diasMap = {
        'segunda': 'Segunda',
        'terca': 'Terça',
        'quarta': 'Quarta',
        'quinta': 'Quinta',
        'sexta': 'Sexta'
      };
      return diasMap[dia as keyof typeof diasMap] || dia;
    });

    return diasFormatados.join(', ');
  };

  // Função para verificar se o curso está finalizado
  const isCursoFinalizado = (dataFim: string) => {
    const hoje = new Date();
    const fimCurso = new Date(dataFim + 'T00:00:00');

    // Normalizar as datas para comparar apenas o dia (sem horário)
    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimCursoNormalizado = new Date(fimCurso.getFullYear(), fimCurso.getMonth(), fimCurso.getDate());

    // Curso está finalizado apenas se a data fim for anterior ao dia atual
    return fimCursoNormalizado < hojeNormalizado;
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

  const exportToExcel = (
    filteredCursos: Curso[],
    searchTerm: string = "",
    selectedPeriodo: string = "todos",
    selectedUnidade: string = "todas",
    selectedSala: string = "todas",
    selectedYear: string = "todos",
    selectedStatus: string = "todos"
  ) => {
    if (!filteredCursos || filteredCursos.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    // Ordenar cursos por unidade, período e sala
    const cursosOrdenados = sortCursos(filteredCursos);

    // Criar dados para Excel
    const excelData = cursosOrdenados.map(curso => {
      const cursoFinalizado = isCursoFinalizado(curso.fim);
      const tituloComStatus = cursoFinalizado ? `${curso.titulo} (Finalizado)` : curso.titulo;

      return {
        'Título': tituloComStatus,
        'Professor': curso.professor,
        'Período': formatPeriodo(curso.periodo),
        'Dias da Semana': formatDiasSemana(curso.dia_semana),
        'Carga Horária': curso.carga_horaria || 0,
        'Total de Vagas': curso.vagas || 0,
        'Alunos Iniciaram': curso.qtd_alunos_iniciaram || 0,
        'Alunos Concluíram': curso.qtd_alunos_concluiram || 0,
        'Data Início': format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
        'Data Fim': format(new Date(curso.fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
        'Unidade': curso.unidades?.nome || 'Sem Unidade',
        'Sala': curso.salas?.nome || 'Sem Sala',
        'Total de Insumos': curso.total_insumos || 0,
        'Total de Matérias': curso.total_materias || 0
      };
    });

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Configurar largura das colunas
    const colWidths = [
      { wch: 35 }, // Título
      { wch: 25 }, // Professor
      { wch: 12 }, // Período
      { wch: 20 }, // Dias da Semana
      { wch: 15 }, // Carga Horária
      { wch: 15 }, // Total de Vagas
      { wch: 18 }, // Alunos Iniciaram
      { wch: 18 }, // Alunos Concluíram
      { wch: 12 }, // Data Início
      { wch: 12 }, // Data Fim
      { wch: 20 }, // Unidade
      { wch: 15 }, // Sala
      { wch: 18 }, // Total de Insumos
      { wch: 18 }  // Total de Matérias
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Cursos');

    // Gerar arquivo Excel
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;

    const fileName = `relatorio_cursos_${dataStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportToPDF = (
    filteredCursos: Curso[],
    searchTerm: string = "",
    selectedPeriodo: string = "todos",
    selectedUnidade: string = "todas",
    selectedSala: string = "todas",
    selectedYear: string = "todos",
    selectedStatus: string = "todos"
  ) => {
    if (!filteredCursos || filteredCursos.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    // Ordenar cursos por unidade, período e sala
    const cursosOrdenados = sortCursos(filteredCursos);

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Título principal
    doc.setFontSize(16);
    doc.text('Relatório de Cursos', 14, 20);

    // Informações do relatório
    doc.setFontSize(10);
    let infoY = 30;

    // Filtros aplicados
    const filtros = [];
    if (searchTerm) {
      filtros.push(`Busca: "${searchTerm}"`);
    }
    if (selectedPeriodo !== "todos") {
      filtros.push(`Período: ${formatPeriodo(selectedPeriodo)}`);
    }
    if (selectedUnidade !== "todas") {
      filtros.push(`Unidade: ${selectedUnidade}`);
    }
    if (selectedSala !== "todas") {
      filtros.push(`Sala: ${selectedSala}`);
    }
    if (selectedYear !== "todos") {
      filtros.push(`Ano: ${selectedYear}`);
    }
    if (selectedStatus !== "todos") {
      const statusLabels = {
        'previstos': 'Previstos',
        'em-andamento': 'Em andamento',
        'finalizados': 'Finalizados'
      };
      filtros.push(`Status: ${statusLabels[selectedStatus as keyof typeof statusLabels] || selectedStatus}`);
    }

    if (filtros.length > 0) {
      doc.text(`Filtros aplicados: ${filtros.join(' | ')}`, 14, infoY);
      infoY += 6;
    }

    // Data de emissão
    doc.text(`Data de emissão: ${dataAtual}`, 14, infoY);
    infoY += 6;

    // Total de cursos
    doc.text(`Total de cursos: ${cursosOrdenados.length}`, 14, infoY);
    infoY += 5;

    // Preparar dados da tabela
    const headers = [
      'Título',
      'Professor',
      'Período',
      'Dias da Semana',
      'Carga Horária',
      'Vagas',
      'Iniciaram',
      'Concluíram',
      'Data Início',
      'Data Fim',
      'Unidade',
      'Sala',
      'Insumos',
      'Matérias'
    ];

    const tableData = cursosOrdenados.map(curso => {
      const cursoFinalizado = isCursoFinalizado(curso.fim);
      const tituloComStatus = cursoFinalizado ? `${curso.titulo} (Finalizado)` : curso.titulo;

      return [
        tituloComStatus,
        curso.professor,
        formatPeriodo(curso.periodo),
        formatDiasSemana(curso.dia_semana),
        curso.carga_horaria?.toString() || '0',
        curso.vagas?.toString() || '0',
        curso.qtd_alunos_iniciaram?.toString() || '0',
        curso.qtd_alunos_concluiram?.toString() || '0',
        format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
        format(new Date(curso.fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }),
        curso.unidades?.nome || 'Sem Unidade',
        curso.salas?.nome || 'Sem Sala',
        curso.total_insumos?.toString() || '0',
        curso.total_materias?.toString() || '0'
      ];
    });

    // Configuração da tabela para orientação paisagem
    const columnStyles: any = {
      0: { cellWidth: 38, halign: 'center' as const }, // Título
      1: { cellWidth: 25, halign: 'center' as const }, // Professor
      2: { cellWidth: 14, halign: 'center' as const }, // Período
      3: { cellWidth: 25, halign: 'center' as const }, // Dias da Semana
      4: { cellWidth: 14, halign: 'center' as const }, // Carga Horária
      5: { cellWidth: 14, halign: 'center' as const }, // Vagas
      6: { cellWidth: 16, halign: 'center' as const }, // Alunos Iniciaram
      7: { cellWidth: 20, halign: 'center' as const }, // Alunos Concluíram
      8: { cellWidth: 18, halign: 'center' as const }, // Data Início
      9: { cellWidth: 18, halign: 'center' as const }, // Data Fim
      10: { cellWidth: 22, halign: 'center' as const }, // Unidade
      11: { cellWidth: 20, halign: 'center' as const }, // Sala
      12: { cellWidth: 15, halign: 'center' as const }, // Insumos
      13: { cellWidth: 15, halign: 'center' as const } // Matérias
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
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
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
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;

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
      doc.text(`Página ${pageNum} de ${finalTotalPages}`, 270, pageHeight - 10, { align: 'right' });
    }
  };

  return {
    exportToExcel,
    exportToPDF
  };
};