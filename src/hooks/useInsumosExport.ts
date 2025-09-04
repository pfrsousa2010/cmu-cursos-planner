import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

interface Insumo {
  id: string;
  nome: string;
  created_at: string;
}

export const useInsumosExport = () => {
  const sortInsumos = (insumos: Insumo[]) => {
    return [...insumos].sort((a, b) => {
      // Ordenar por nome do insumo
      return a.nome.localeCompare(b.nome);
    });
  };

  const exportToExcel = (insumos: Insumo[]) => {
    if (!insumos || insumos.length === 0) {
      toast.error("Nenhum insumo encontrado para exportar");
      return;
    }

    // Ordenar insumos
    const insumosOrdenados = sortInsumos(insumos);

    // Criar dados para Excel
    const excelData = insumosOrdenados.map(insumo => ({
      'Nome do Insumo': insumo.nome,
      'Data de Criação': format(new Date(insumo.created_at), 'dd/MM/yyyy', { locale: ptBR })
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Configurar largura das colunas
    const colWidths = [
      { wch: 50 }, // Nome do Insumo
      { wch: 20 }  // Data de Criação
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Insumos');

    // Gerar arquivo Excel
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `relatorio_insumos_${dataStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportToPDF = (insumos: Insumo[]) => {
    if (!insumos || insumos.length === 0) {
      toast.error("Nenhum insumo encontrado para exportar");
      return;
    }

    // Ordenar insumos
    const insumosOrdenados = sortInsumos(insumos);

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Título principal
    doc.setFontSize(16);
    doc.text('Relatório de Insumos', 14, 20);
    
    // Informações do relatório
    doc.setFontSize(10);
    let infoY = 30;
    
    // Data de emissão
    doc.text(`Data de emissão: ${dataAtual}`, 14, infoY);
    infoY += 6;
    
    // Total de insumos
    doc.text(`Total de insumos: ${insumosOrdenados.length}`, 14, infoY);
    infoY += 10;

    // Preparar dados da tabela
    const headers = [
      'Nome do Insumo',
      'Data de Criação'
    ];
    
    const tableData = insumosOrdenados.map(insumo => [
      insumo.nome,
      format(new Date(insumo.created_at), 'dd/MM/yyyy', { locale: ptBR })
    ]);
    
    // Configuração da tabela
    const columnStyles: any = {
      0: { cellWidth: 120, halign: 'left' as const }, // Nome do Insumo
      1: { cellWidth: 50, halign: 'center' as const }  // Data de Criação
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
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        textColor: 0,
        fontSize: 9,
        cellPadding: 3
      },
      styles: { 
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles,
      didParseCell: function (data) {
        if (data.section === 'body') {
          data.cell.styles.minCellHeight = 10;
        }
      }
    });
    
    addPageNumbers(doc);
    
    // Nome do arquivo
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `relatorio_insumos_${dataStr}.pdf`;
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
