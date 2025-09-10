
import { useState } from "react";
import { useCursoInsumos } from "@/hooks/useCursoInsumos";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Download } from "lucide-react";
import { toast } from "sonner";
import CursoInsumosEdit from "./CursoInsumosEdit";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface CursoInsumosListProps {
  cursoId: string;
  cursoTitulo: string;
  professor: string;
}

const CursoInsumosList = ({ cursoId, cursoTitulo, professor }: CursoInsumosListProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: insumos, isLoading, error } = useCursoInsumos(cursoId);

  // Buscar dados do curso para sala e unidade
  const [cursoInfo, setCursoInfo] = useState<{ sala?: string; unidade?: string }>({});
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cursos')
        .select('salas (nome), unidades (nome)')
        .eq('id', cursoId)
        .single();
      setCursoInfo({
        sala: data?.salas?.nome || '',
        unidade: data?.unidades?.nome || ''
      });
    })();
  }, [cursoId]);

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDownloadPDF = () => {
    if (!insumos || insumos.length === 0) {
      toast.error("Nenhum insumo para exportar");
      return;
    }
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString();
    doc.setFontSize(14);
    doc.text(`Lista de Insumos`, 10, 15);
    // Informações do curso em duas linhas, 2 itens por linha
    doc.setFontSize(11);
    let infoY = 25;
    doc.text(`Curso: ${cursoTitulo}`, 10, infoY);
    doc.text(`Professor: ${professor}`, 110, infoY);
    infoY += 7;
    doc.text(`Unidade: ${cursoInfo.unidade || '-'}`, 10, infoY);
    doc.text(`Sala: ${cursoInfo.sala || '-'}`, 110, infoY);
    infoY += 7;
    doc.text(`Data de emissão: ${dataAtual}`, 10, infoY);
    // Total de itens no canto direito, acima da coluna Quantidade
    doc.setFontSize(9);
    doc.text(`Total de itens: ${insumos.length}`, 200 - 10, infoY, { align: 'right' });
    doc.setFontSize(11);

    // Montar dados da tabela
    const tableData = insumos.map((insumo, idx) => [
      String(idx + 1),
      insumo.insumos?.nome || '-',
      String(insumo.quantidade)
    ]);

    // Definir largura das colunas: Item, Descrição, Quantidade
    const columnStyles = {
      0: { cellWidth: 15, halign: 'center' as const }, // Item
      1: { cellWidth: 136 }, // Descrição
      2: { cellWidth: 25, halign: 'center' as const }, // Quantidade (mais estreita e centralizada)
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
        doc.text('Sistema de Cursos - CMU', 10, pageHeight - 10);
        const pageCount = doc.getNumberOfPages();
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 200 - 10, pageHeight - 10, { align: 'right' });
      }
    });

    const sanitize = (str: string) => (str || '').normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const nomeCurso = sanitize(cursoTitulo);
    const sala = sanitize(cursoInfo.sala || '');
    const unidade = sanitize(cursoInfo.unidade || '');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    doc.save(`insumos_${nomeCurso}_${sala}_${unidade}_${dataStr}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Professor: {professor}
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Insumos Necessários:</h4>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Professor: {professor}
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Insumos Necessários:</h4>
          <div className="text-sm text-destructive">
            Erro ao carregar insumos. Tente novamente.
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 items-center">
        {cursoInfo.unidade && <span>Unidade: {cursoInfo.unidade}</span>}
        {cursoInfo.sala && <span>Sala: {cursoInfo.sala}</span>}
        <span>Professor: {professor}</span>
      </div>
      {insumos && insumos.length > 0 && (
        <div className="text-sm text-muted-foreground mb-2">Total de itens: {insumos.length}</div>
      )}
        <div className="border rounded-lg p-4">
          <CursoInsumosEdit 
            cursoId={cursoId}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 items-center">
        {cursoInfo.unidade && <span>Unidade: {cursoInfo.unidade}</span>}
        {cursoInfo.sala && <span>Sala: {cursoInfo.sala}</span>}
        <span>Professor: {professor}</span>
      </div>
      {insumos && insumos.length > 0 && (
        <div className="text-sm text-muted-foreground mb-2">Total de itens: {insumos.length}</div>
      )}
      <h4 className="font-medium mb-2">Insumos Necessários:</h4>
      <div className="border rounded-lg p-4">
        <div className="max-h-[400px] overflow-auto">
        {insumos && insumos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 sticky top-0 z-10 bg-background shadow border-b">Item</TableHead>
                <TableHead className="sticky top-0 z-10 bg-background shadow border-b">Descrição</TableHead>
                <TableHead className="text-right w-24 sticky top-0 z-10 bg-background shadow border-b">Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumos.map((cursoInsumo, index) => (
                <TableRow key={cursoInsumo.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{cursoInsumo.insumos?.nome}</TableCell>
                  <TableCell className="text-right">{cursoInsumo.quantidade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-sm text-muted-foreground">
            Nenhum insumo cadastrado para este curso.
          </div>
        )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Lista
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleDownloadPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </div>
    </div>
  );
};

export default CursoInsumosList;
