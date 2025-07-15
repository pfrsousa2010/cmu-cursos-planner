
import { useState } from "react";
import { useCursoInsumos } from "@/hooks/useCursoInsumos";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Download } from "lucide-react";
import { toast } from "sonner";
import CursoInsumosEdit from "./CursoInsumosEdit";

interface CursoInsumosListProps {
  cursoId: string;
  cursoTitulo: string;
  professor: string;
}

const CursoInsumosList = ({ cursoId, cursoTitulo, professor }: CursoInsumosListProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: insumos, isLoading, error } = useCursoInsumos(cursoId);

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
        <div className="text-sm text-muted-foreground">
          Professor: {professor}
        </div>
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
      <div className="text-sm text-muted-foreground">
        Professor: {professor}
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-2">Insumos Necessários:</h4>
        {insumos && insumos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Item</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right w-24">Quantidade</TableHead>
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
          onClick={() => toast.success("Função de download será implementada em breve")}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </div>
    </div>
  );
};

export default CursoInsumosList;
