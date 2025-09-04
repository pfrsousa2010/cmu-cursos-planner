import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

interface Unidade {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  created_at: string;
  salas: Sala[];
}

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  observacoes: string | null;
  unidade_id: string;
}

export const useUnidadeSalasExport = () => {
  const sortUnidades = (unidades: Unidade[]) => {
    return [...unidades].sort((a, b) => {
      // Ordenar por nome da unidade
      return a.nome.localeCompare(b.nome);
    });
  };

  const sortSalas = (salas: (Sala & { unidade_nome: string })[]) => {
    return [...salas].sort((a, b) => {
      // Primeiro por unidade
      const unidadeA = a.unidade_nome;
      const unidadeB = b.unidade_nome;
      if (unidadeA !== unidadeB) {
        return unidadeA.localeCompare(unidadeB);
      }

      // Depois por nome da sala
      return a.nome.localeCompare(b.nome);
    });
  };

  const exportToExcel = (unidades: Unidade[]) => {
    if (!unidades || unidades.length === 0) {
      toast.error("Nenhuma unidade encontrada para exportar");
      return;
    }

    // Ordenar unidades
    const unidadesOrdenadas = sortUnidades(unidades);

    // Criar dados para Excel - Unidades
    const unidadesData = unidadesOrdenadas.map(unidade => ({
      'Nome da Unidade': unidade.nome,
      'Endereço': unidade.endereco,
      'Telefone': unidade.telefone,
      'Total de Salas': unidade.salas.length,
      'Data de Criação': format(new Date(unidade.created_at), 'dd/MM/yyyy', { locale: ptBR })
    }));

    // Criar dados para Excel - Salas (todas as salas de todas as unidades)
    const todasSalas = unidadesOrdenadas.flatMap(unidade => 
      unidade.salas.map(sala => ({
        ...sala,
        unidade_nome: unidade.nome
      }))
    );

    const salasOrdenadas = sortSalas(todasSalas);

    // Converter para formato de dados do Excel
    const salasData = salasOrdenadas.map(sala => ({
      'Nome da Sala': sala.nome,
      'Unidade': (sala as any).unidade_nome,
      'Capacidade': sala.capacidade,
      'Observações': sala.observacoes || 'Sem observações'
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Worksheet de Unidades
    const wsUnidades = XLSX.utils.json_to_sheet(unidadesData);
    const colWidthsUnidades = [
      { wch: 50 }, // Nome da Unidade
      { wch: 70 }, // Endereço
      { wch: 20 }, // Telefone
      { wch: 15 }, // Total de Salas
      { wch: 20 }  // Data de Criação
    ];
    wsUnidades['!cols'] = colWidthsUnidades;
    XLSX.utils.book_append_sheet(wb, wsUnidades, 'Unidades');

    // Worksheet de Salas
    const wsSalas = XLSX.utils.json_to_sheet(salasData);
    const colWidthsSalas = [
      { wch: 50 }, // Nome da Sala
      { wch: 50 }, // Unidade
      { wch: 15 }, // Capacidade
      { wch: 70 }  // Observações
    ];
    wsSalas['!cols'] = colWidthsSalas;
    XLSX.utils.book_append_sheet(wb, wsSalas, 'Salas');

    // Gerar arquivo Excel
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `relatorio_unidades_salas_${dataStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportToPDF = (unidades: Unidade[]) => {
    if (!unidades || unidades.length === 0) {
      toast.error("Nenhuma unidade encontrada para exportar");
      return;
    }

    // Ordenar unidades
    const unidadesOrdenadas = sortUnidades(unidades);

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Título principal
    doc.setFontSize(16);
    doc.text('Relatório de Unidades e Salas', 14, 20);
    
    // Informações do relatório
    doc.setFontSize(10);
    let infoY = 30;
    
    // Data de emissão
    doc.text(`Data de emissão: ${dataAtual}`, 14, infoY);
    infoY += 6;
    
    // Total de unidades e salas
    const totalSalas = unidadesOrdenadas.reduce((acc, unidade) => acc + unidade.salas.length, 0);
    doc.text(`Total de unidades: ${unidadesOrdenadas.length}`, 14, infoY);
    infoY += 6;
    doc.text(`Total de salas: ${totalSalas}`, 14, infoY);
    infoY += 10;

    // Seção de Unidades
    doc.setFontSize(14);
    doc.text('UNIDADES', 14, infoY);
    infoY += 8;

    // Preparar dados da tabela de unidades
    const headersUnidades = [
      'Nome da Unidade',
      'Endereço',
      'Telefone',
      'Total de Salas',
      'Data de Criação'
    ];
    
    const tableDataUnidades = unidadesOrdenadas.map(unidade => [
      unidade.nome,
      unidade.endereco,
      unidade.telefone,
      unidade.salas.length.toString(),
      format(new Date(unidade.created_at), 'dd/MM/yyyy', { locale: ptBR })
    ]);
    
    // Configuração da tabela de unidades
    const columnStylesUnidades: any = {
      0: { cellWidth: 40, halign: 'center' as const }, // Nome da Unidade
      1: { cellWidth: 70, halign: 'left' as const },  // Endereço
      2: { cellWidth: 25, halign: 'center' as const }, // Telefone
      3: { cellWidth: 20, halign: 'center' as const }, // Total de Salas
      4: { cellWidth: 25, halign: 'center' as const }  // Data de Criação
    };
    
    autoTable(doc, {
      head: [headersUnidades],
      body: tableDataUnidades,
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
      columnStyles: columnStylesUnidades,
      didParseCell: function (data) {
        if (data.section === 'body') {
          data.cell.styles.minCellHeight = 8;
        }
      }
    });

    // Seção de Salas na mesma página
    const finalY = (doc as any).lastAutoTable.finalY || infoY + 50;
    infoY = finalY + 10;

    // Seção de Salas
    doc.setFontSize(14);
    doc.text('SALAS', 14, infoY);
    infoY += 8;

    // Preparar dados da tabela de salas
    const todasSalas = unidadesOrdenadas.flatMap(unidade => 
      unidade.salas.map(sala => ({
        ...sala,
        unidade_nome: unidade.nome
      }))
    );

    const salasOrdenadas = sortSalas(todasSalas);

    const headersSalas = [
      'Nome da Sala',
      'Unidade',
      'Capacidade',
      'Observações'
    ];
    
    const tableDataSalas = salasOrdenadas.map(sala => [
      sala.nome,
      (sala as any).unidade_nome,
      sala.capacidade.toString(),
      sala.observacoes || 'Sem observações'
    ]);
    
    // Configuração da tabela de salas
    const columnStylesSalas: any = { //170
      0: { cellWidth: 40, halign: 'center' as const }, // Nome da Sala
      1: { cellWidth: 40, halign: 'center' as const }, // Unidade
      2: { cellWidth: 20, halign: 'center' as const }, // Capacidade
      3: { cellWidth: 80, halign: 'left' as const }    // Observações
    };
    
    autoTable(doc, {
      head: [headersSalas],
      body: tableDataSalas,
      startY: infoY + 3,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { 
        fillColor: [34, 197, 94], 
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
      columnStyles: columnStylesSalas,
      didParseCell: function (data) {
        if (data.section === 'body') {
          data.cell.styles.minCellHeight = 8;
        }
      }
    });
    
    addPageNumbers(doc);
    
    // Nome do arquivo
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `relatorio_unidades_salas_${dataStr}.pdf`;
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
