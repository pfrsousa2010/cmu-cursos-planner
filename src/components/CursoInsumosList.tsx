
import { useCursoInsumos } from "@/hooks/useCursoInsumos";
import { Skeleton } from "@/components/ui/skeleton";

interface CursoInsumosListProps {
  cursoId: string;
  cursoTitulo: string;
  professor: string;
}

const CursoInsumosList = ({ cursoId, cursoTitulo, professor }: CursoInsumosListProps) => {
  const { data: insumos, isLoading, error } = useCursoInsumos(cursoId);

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

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Professor: {professor}
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-2">Insumos Necessários:</h4>
        {insumos && insumos.length > 0 ? (
          <div className="space-y-2">
            {insumos.map((cursoInsumo) => (
              <div key={cursoInsumo.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="font-medium">{cursoInsumo.insumos?.nome}</span>
                <span className="text-muted-foreground">
                  Qtd: {cursoInsumo.quantidade}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Nenhum insumo cadastrado para este curso.
          </div>
        )}
      </div>
    </div>
  );
};

export default CursoInsumosList;
