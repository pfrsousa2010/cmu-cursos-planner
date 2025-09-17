
import { useState } from "react";
import { useCursoInsumos } from "@/hooks/useCursoInsumos";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Download } from "lucide-react";
import { toast } from "sonner";
import CursoInsumosEdit from "./CursoInsumosEdit";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useInsumosExport } from "@/hooks/useInsumosExport";

interface CursoInsumosListProps {
  cursoId: string;
  cursoTitulo: string;
  professor: string;
}

const CursoInsumosList = ({ cursoId, cursoTitulo, professor }: CursoInsumosListProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: insumos, isLoading, error } = useCursoInsumos(cursoId);
  const { profile } = useUser();
  const { exportCursoInsumosToPDF } = useInsumosExport();

  // Buscar dados do curso para sala, unidade e datas
  const [cursoInfo, setCursoInfo] = useState<{ 
    sala?: string; 
    unidade?: string; 
    dataInicio?: string; 
    dataFim?: string; 
  }>({});
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cursos')
        .select('salas (nome), unidades (nome), inicio, fim')
        .eq('id', cursoId)
        .single();
      
      // Formatar datas para exibição
      const formatarData = (data: string) => {
        if (!data) return '';
        return new Date(data).toLocaleDateString('pt-BR');
      };
      
      setCursoInfo({
        sala: data?.salas?.nome || '',
        unidade: data?.unidades?.nome || '',
        dataInicio: formatarData(data?.inicio),
        dataFim: formatarData(data?.fim)
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
    exportCursoInsumosToPDF(
      insumos, 
      cursoTitulo, 
      professor, 
      { sala: cursoInfo.sala, unidade: cursoInfo.unidade },
      cursoInfo.dataInicio,
      cursoInfo.dataFim
    );
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
        {(cursoInfo.dataInicio || cursoInfo.dataFim) && (
          <span>
            Período: {cursoInfo.dataInicio || 'N/A'} a {cursoInfo.dataFim || 'N/A'}
          </span>
        )}
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
        {(cursoInfo.dataInicio || cursoInfo.dataFim) && (
          <span>
            Período: {cursoInfo.dataInicio || 'N/A'} a {cursoInfo.dataFim || 'N/A'}
          </span>
        )}
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
          onClick={handleDownloadPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Lista
        </Button>
      </div>
    </div>
  );
};

export default CursoInsumosList;
