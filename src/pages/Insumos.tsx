
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useUserRole } from "@/hooks/useUserRole";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Insumo {
  id: string;
  nome: string;
  created_at: string;
}

const Insumos = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const { canViewOnly } = useUserRole();

  const [formData, setFormData] = useState({
    nome: ""
  });
  const [multiInsumos, setMultiInsumos] = useState([""]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .order('nome');

    if (error) {
      toast.error("Erro ao carregar insumos");
      console.error(error);
    } else {
      setInsumos(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingInsumo) {
      const { error } = await supabase
        .from('insumos')
        .update(formData)
        .eq('id', editingInsumo.id);

      if (error) {
        toast.error("Erro ao atualizar insumo");
        console.error(error);
      } else {
        toast.success("Insumo atualizado com sucesso!");
        fetchInsumos();
        resetForm();
      }
    } else {
      // Multi-inserção
      const nomes = multiInsumos.map(n => n.trim()).filter(Boolean);
      if (nomes.length === 0) {
        toast.error("Preencha pelo menos um nome de insumo");
        return;
      }
      const { error } = await supabase
        .from('insumos')
        .insert(nomes.map(nome => ({ nome })));

      if (error) {
        toast.error("Erro ao criar insumos");
        console.error(error);
      } else {
        toast.success(nomes.length > 1 ? "Insumos criados com sucesso!" : "Insumo criado com sucesso!");
        fetchInsumos();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este insumo?")) {
      const { error } = await supabase
        .from('insumos')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Erro ao excluir insumo");
        console.error(error);
      } else {
        toast.success("Insumo excluído com sucesso!");
        fetchInsumos();
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: "" });
    setEditingInsumo(null);
    setDialogOpen(false);
    setMultiInsumos([""]);
  };

  const startEdit = (insumo: Insumo) => {
    setFormData({ nome: insumo.nome });
    setEditingInsumo(insumo);
    setDialogOpen(true);
  };

  // Filtro de busca
  const filteredInsumos = insumos.filter(insumo =>
    insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insumos</h1>
          </div>
          
          {!canViewOnly && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Insumo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingInsumo ? "Editar Insumo" : "Novo Insumo"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingInsumo ? "Edite o nome do insumo" : "Adicione um novo insumo"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {editingInsumo ? (
                    <div>
                      <Label htmlFor="nome">Nome do Insumo</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                        placeholder="Ex: Papel A4, Canetas, Tesouras..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-auto p-2">
                      <Label>Nome dos Insumos</Label>
                      {multiInsumos.map((nome, idx) => (
                        <div key={idx} className="flex gap-2 mb-1">
                          <Input
                            value={nome}
                            onChange={e => {
                              const arr = [...multiInsumos];
                              arr[idx] = e.target.value;
                              setMultiInsumos(arr);
                            }}
                            placeholder="Ex: Papel A4, Canetas, Tesouras..."
                            required={idx === 0}
                          />
                          {multiInsumos.length > 1 && (
                            <Button type="button" variant="outline" onClick={() => setMultiInsumos(multiInsumos.filter((_, i) => i !== idx))}>
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="secondary" onClick={() => setMultiInsumos([...multiInsumos, ""])}>
                        Adicionar outro
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingInsumo ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Barra de busca centralizada */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl relative">
            <Input
              placeholder="Buscar insumo pelo nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-center pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Criado em</TableHead>
                  {!canViewOnly && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsumos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canViewOnly ? 2 : 3} className="text-center text-muted-foreground">Nenhum insumo encontrado</TableCell>
                  </TableRow>
                ) : (
                  filteredInsumos.map((insumo, idx) => (
                    <TableRow key={insumo.id} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                      <TableCell>{insumo.nome}</TableCell>
                      <TableCell>{new Date(insumo.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      {!canViewOnly && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(insumo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(insumo.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Insumos;
