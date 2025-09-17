import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useUser } from "@/contexts/UserContext";

interface Insumo {
  id: string;
  nome: string;
  created_at: string;
}

interface CursoInsumo {
  id: string;
  quantidade: number;
  insumos?: {
    nome: string;
  };
}

export const useInsumosExport = () => {
  const { profile } = useUser();
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

  const exportCursoInsumosToPDF = (
    cursoInsumos: CursoInsumo[], 
    cursoTitulo: string, 
    professor: string, 
    cursoInfo: { sala?: string; unidade?: string },
    dataInicio?: string,
    dataFim?: string
  ) => {
    if (!cursoInsumos || cursoInsumos.length === 0) {
      toast.error("Nenhum insumo para exportar");
      return;
    }

    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString();
    
    // Título
    doc.setFontSize(14);
    doc.text(`Lista de Insumos`, 10, 15);
    
    // Informações do curso
    doc.setFontSize(11);
    let infoY = 25;
    doc.text(`Curso: ${cursoTitulo}`, 10, infoY);
    doc.text(`Professor: ${professor}`, 110, infoY);
    infoY += 7;
    doc.text(`Unidade: ${cursoInfo.unidade || '-'}`, 10, infoY);
    doc.text(`Sala: ${cursoInfo.sala || '-'}`, 110, infoY);
    infoY += 7;
    if (dataInicio || dataFim) {
      doc.text(`Período: ${dataInicio || 'N/A'} a ${dataFim || 'N/A'}`, 10, infoY);
      infoY += 7;
    }
    doc.text(`Data de emissão: ${dataAtual}`, 10, infoY);
    
    // Total de itens no canto direito
    doc.setFontSize(9);
    doc.text(`Total de itens: ${cursoInsumos.length}`, 200 - 10, infoY, { align: 'right' });
    doc.setFontSize(11);

    // Montar dados da tabela
    const tableData = cursoInsumos.map((insumo, idx) => [
      String(idx + 1),
      insumo.insumos?.nome || '-',
      String(insumo.quantidade)
    ]);

    // Definir largura das colunas
    const columnStyles = {
      0: { cellWidth: 15, halign: 'center' as const }, // Item
      1: { cellWidth: 136 }, // Descrição
      2: { cellWidth: 25, halign: 'center' as const }, // Quantidade
    };

    autoTable(doc, {
      head: [["Item", "Descrição", "Quantidade"]],
      body: tableData,
      startY: infoY + 10,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: 0, halign: 'center' },
      bodyStyles: { textColor: 0 },
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles,
      didDrawPage: function (data) {
        // Rodapé
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(10);
        doc.setTextColor(100);
        const username = profile?.nome || 'Usuário';
        doc.text(`Gestor de Cursos - CMU - Emitido por: ${username}`, 10, pageHeight - 10);
        const pageCount = doc.getNumberOfPages();
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 200 - 10, pageHeight - 10, { align: 'right' });
      }
    });

    // Nome do arquivo
    const sanitize = (str: string) => (str || '').normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const nomeCurso = sanitize(cursoTitulo);
    const sala = sanitize(cursoInfo.sala || '');
    const unidade = sanitize(cursoInfo.unidade || '');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    doc.save(`insumos_${nomeCurso}_${sala}_${unidade}_${dataStr}.pdf`);
  };

  const addPageNumbers = (doc: jsPDF) => {
    const finalTotalPages = doc.getNumberOfPages();
    
    for (let pageNum = 1; pageNum <= finalTotalPages; pageNum++) {
      doc.setPage(pageNum);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      const username = profile?.nome || 'Usuário';
      doc.text(`Gestor de Cursos - CMU - Emitido por: ${username}`, 14, pageHeight - 10);
      doc.text(`Página ${pageNum} de ${finalTotalPages}`, 180, pageHeight - 10, { align: 'right' });
    }
  };

  return { 
    exportToExcel, 
    exportToPDF,
    exportCursoInsumosToPDF
  };
};
