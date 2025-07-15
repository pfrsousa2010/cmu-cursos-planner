
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface CursoInsumosEditProps {
  cursoId: string;
  onSave: () => void;
  onCancel: () => void;
}

interface InsumoItem {
  id: string;
  insumo_id: string;
  quantidade: number;
  insumos?: {
    id: string;
    nome: string;
  };
}

const CursoInsumosEdit = ({ cursoId, onSave, onCancel }: CursoInsumosEditProps) => {
  const [editedInsumos, setEditedInsumos] = useState<InsumoItem[]>([]);
  const queryClient = useQueryClient();

  // Buscar insumos do curso
  const { data: cursoInsumos, isLoading: isLoadingCursoInsumos } = useQuery({
    queryKey: ['curso-insumos', cursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curso_insumos')
        .select(`
          *,
          insumos (
            id,
            nome
          )
        `)
        .eq('curso_id', cursoId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!cursoId
  });

  // Buscar todos os insumos disponíveis
  const { data: allInsumos, isLoading: isLoadingInsumos } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Inicializar lista editável quando os dados chegarem
  useEffect(() => {
    if (cursoInsumos) {
      setEditedInsumos(cursoInsumos);
    }
  }, [cursoInsumos]);

  // Mutation para salvar alterações
  const saveMutation = useMutation({
    mutationFn: async (insumos: InsumoItem[]) => {
      // Primeiro, deletar todos os insumos existentes do curso
      const { error: deleteError } = await supabase
        .from('curso_insumos')
        .delete()
        .eq('curso_id', cursoId);
      
      if (deleteError) throw deleteError;

      // Depois, inserir os novos insumos
      if (insumos.length > 0) {
        const insumosToInsert = insumos.map(insumo => ({
          curso_id: cursoId,
          insumo_id: insumo.insumo_id,
          quantidade: insumo.quantidade
        }));

        const { error: insertError } = await supabase
          .from('curso_insumos')
          .insert(insumosToInsert);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curso-insumos'] });
      toast.success("Lista de insumos salva com sucesso!");
      onSave();
    },
    onError: (error) => {
      toast.error("Erro ao salvar lista de insumos: " + error.message);
    }
  });

  const handleAddInsumo = () => {
    const newInsumo: InsumoItem = {
      id: `temp-${Date.now()}`,
      insumo_id: '',
      quantidade: 1
    };
    setEditedInsumos([...editedInsumos, newInsumo]);
  };

  const handleRemoveInsumo = (index: number) => {
    setEditedInsumos(editedInsumos.filter((_, i) => i !== index));
  };

  const handleInsumoChange = (index: number, field: 'insumo_id' | 'quantidade', value: string | number) => {
    const updated = editedInsumos.map((insumo, i) => {
      if (i === index) {
        const updatedInsumo = { ...insumo, [field]: value };
        
        // Se mudou o insumo, atualizar o nome também
        if (field === 'insumo_id' && allInsumos) {
          const selectedInsumo = allInsumos.find(ins => ins.id === value);
          if (selectedInsumo) {
            updatedInsumo.insumos = {
              id: selectedInsumo.id,
              nome: selectedInsumo.nome
            };
          }
        }
        
        return updatedInsumo;
      }
      return insumo;
    });
    setEditedInsumos(updated);
  };

  const handleSave = () => {
    // Validar se todos os insumos têm valores válidos
    const validInsumos = editedInsumos.filter(insumo => 
      insumo.insumo_id && insumo.quantidade > 0
    );
    
    if (validInsumos.length !== editedInsumos.length) {
      toast.error("Por favor, preencha todos os campos corretamente");
      return;
    }

    saveMutation.mutate(validInsumos);
  };

  if (isLoadingCursoInsumos || isLoadingInsumos) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Editar Lista de Insumos</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddInsumo}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Insumo
        </Button>
      </div>

      {editedInsumos.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Item</TableHead>
              <TableHead>Insumo</TableHead>
              <TableHead className="w-32">Quantidade</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editedInsumos.map((insumo, index) => (
              <TableRow key={insumo.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <Select
                    value={insumo.insumo_id}
                    onValueChange={(value) => handleInsumoChange(index, 'insumo_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {allInsumos?.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={insumo.quantidade}
                    onChange={(e) => handleInsumoChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveInsumo(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum insumo adicionado.</p>
          <p>Clique em "Adicionar Insumo" para começar.</p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default CursoInsumosEdit;
