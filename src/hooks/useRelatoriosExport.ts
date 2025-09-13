import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Curso } from "@/types/calendario";
import { PeriodoRelatorio } from "./useRelatoriosCursos";

export const useRelatoriosExport = () => {
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

    const todosDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const temTodosDias = todosDias.every(dia => diasSemana.includes(dia));

    if (temTodosDias) {
      return 'Segunda à sexta';
    }

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

  const isCursoFinalizado = (dataFim: string) => {
    const hoje = new Date();
    const fimCurso = new Date(dataFim + 'T00:00:00');

    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimCursoNormalizado = new Date(fimCurso.getFullYear(), fimCurso.getMonth(), fimCurso.getDate());

    return fimCursoNormalizado < hojeNormalizado;
  };

  const sortCursos = (cursos: Curso[]) => {
    return [...cursos].sort((a, b) => {
      const unidadeA = a.unidades?.nome || 'Sem Unidade';
      const unidadeB = b.unidades?.nome || 'Sem Unidade';
      if (unidadeA !== unidadeB) {
        return unidadeA.localeCompare(unidadeB);
      }

      const turnoOrder = { 'manha': 1, 'tarde': 2, 'noite': 3 };
      const aOrder = turnoOrder[a.periodo as keyof typeof turnoOrder] || 4;
      const bOrder = turnoOrder[b.periodo as keyof typeof turnoOrder] || 4;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      const salaA = a.salas?.nome || 'Sem Sala';
      const salaB = b.salas?.nome || 'Sem Sala';
      return salaA.localeCompare(salaB);
    });
  };

  const exportToExcel = (
    cursos: Curso[],
    periodoRelatorio: PeriodoRelatorio,
    periodoLabel: string,
    estatisticas: any
  ) => {
    if (!cursos || cursos.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    const cursosOrdenados = sortCursos(cursos);

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

    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Planilha principal com dados dos cursos
    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
      { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 18 }
    ];
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Cursos');

    // Planilha de estatísticas
    if (estatisticas) {
      const statsData = [
        ['Período do Relatório', periodoLabel],
        ['Total de Cursos', estatisticas.totalCursos],
        ['Total de Vagas', estatisticas.totalVagas],
        ['Total de Alunos Iniciaram', estatisticas.totalAlunosIniciaram],
        ['Total de Alunos Concluíram', estatisticas.totalAlunosConcluiram],
        ['Taxa de Conclusão (%)', estatisticas.taxaConclusao.toFixed(2)],
        ['Total de Carga Horária', estatisticas.totalCargaHoraria],
        [''],
        ['Cursos por Período do Dia', ''],
        ['Manhã', estatisticas.cursosPorPeriodo.manha || 0],
        ['Tarde', estatisticas.cursosPorPeriodo.tarde || 0],
        ['Noite', estatisticas.cursosPorPeriodo.noite || 0],
        [''],
        ['Cursos por Unidade', ''],
        ...Object.entries(estatisticas.cursosPorUnidade).map(([unidade, qtd]) => [unidade, qtd])
      ];

      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      wsStats['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');
    }

    // Gerar arquivo Excel
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;

    const fileName = `relatorio_cursos_${periodoRelatorio}_${dataStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportToPDF = (
    cursos: Curso[],
    periodoRelatorio: PeriodoRelatorio,
    periodoLabel: string,
    estatisticas: any,
    filtros: { unidade: string; periodo: string; sala: string } = { unidade: 'todas', periodo: 'todos', sala: 'todas' }
  ) => {
    if (!cursos || cursos.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    const cursosOrdenados = sortCursos(cursos);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Título principal
    doc.setFontSize(18);
    doc.text('Relatório de Cursos', 14, 20);

    // Período do relatório
    doc.setFontSize(14);
    doc.text(`Período: ${periodoLabel}`, 14, 30);

    // Data de emissão
    doc.setFontSize(10);
    let infoY = 40;
    doc.text(`Data de emissão: ${dataAtual}`, 14, infoY);
    infoY += 6;

    // Filtros aplicados
    const filtrosAplicados = [];
    if (filtros.unidade !== 'todas') {
      filtrosAplicados.push(`Unidade: ${filtros.unidade}`);
    }
    if (filtros.periodo !== 'todos') {
      filtrosAplicados.push(`Período: ${formatPeriodo(filtros.periodo)}`);
    }
    if (filtros.sala !== 'todas') {
      filtrosAplicados.push(`Sala: ${filtros.sala}`);
    }

    if (filtrosAplicados.length > 0) {
      doc.text(`Filtros aplicados: ${filtrosAplicados.join(' | ')}`, 14, infoY);
      infoY += 6;
    }

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

    // Configuração da tabela
    const columnStyles: any = {
      0: { cellWidth: 38, halign: 'center' as const },
      1: { cellWidth: 25, halign: 'center' as const },
      2: { cellWidth: 14, halign: 'center' as const },
      3: { cellWidth: 25, halign: 'center' as const },
      4: { cellWidth: 14, halign: 'center' as const },
      5: { cellWidth: 14, halign: 'center' as const },
      6: { cellWidth: 16, halign: 'center' as const },
      7: { cellWidth: 20, halign: 'center' as const },
      8: { cellWidth: 18, halign: 'center' as const },
      9: { cellWidth: 18, halign: 'center' as const },
      10: { cellWidth: 22, halign: 'center' as const },
      11: { cellWidth: 20, halign: 'center' as const },
      12: { cellWidth: 15, halign: 'center' as const },
      13: { cellWidth: 15, halign: 'center' as const }
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

    // Adicionar página de resumo estatístico no final
    if (estatisticas) {
      addEstatisticasPage(doc, estatisticas, periodoLabel);
    }

    addPageNumbers(doc);

    // Nome do arquivo
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;

    const fileName = `relatorio_cursos_${periodoRelatorio}_${dataStr}.pdf`;
    doc.save(fileName);

    toast.success("Relatório PDF gerado com sucesso!");
  };

  const addEstatisticasPage = (doc: jsPDF, estatisticas: any, periodoLabel: string) => {
    doc.addPage();
    
    // Título da página
    doc.setFontSize(18);
    doc.text('Resumo Estatístico', 14, 20);
    
    // Período do relatório
    doc.setFontSize(14);
    doc.text(`Período: ${periodoLabel}`, 14, 30);
    
    // Data de emissão
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(10);
    doc.text(`Data de emissão: ${dataAtual}`, 14, 40);
    
    // Estatísticas principais
    let infoY = 60;
    doc.setFontSize(12);
    doc.text('Estatísticas Gerais', 14, infoY);
    infoY += 12;

    doc.setFontSize(11);
    doc.text(`Total de cursos: ${estatisticas.totalCursos}`, 14, infoY);
    infoY += 8;
    doc.text(`Total de vagas: ${estatisticas.totalVagas}`, 14, infoY);
    infoY += 8;
    doc.text(`Alunos iniciaram: ${estatisticas.totalAlunosIniciaram}`, 14, infoY);
    infoY += 8;
    doc.text(`Alunos concluíram: ${estatisticas.totalAlunosConcluiram}`, 14, infoY);
    infoY += 8;
    doc.text(`Taxa de conclusão: ${estatisticas.taxaConclusao.toFixed(2)}%`, 14, infoY);
    infoY += 8;
    doc.text(`Carga horária total: ${estatisticas.totalCargaHoraria}h`, 14, infoY);
    infoY += 20;    
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
