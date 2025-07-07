
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
      const { error } = await supabase
        .from('insumos')
        .insert([formData]);

      if (error) {
        toast.error("Erro ao criar insumo");
        console.error(error);
      } else {
        toast.success("Insumo criado com sucesso!");
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
  };

  const startEdit = (insumo: Insumo) => {
    setFormData({ nome: insumo.nome });
    setEditingInsumo(insumo);
    setDialogOpen(true);
  };

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
            <p className="text-gray-600">Gerencie os insumos dos cursos</p>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insumos.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Nenhum insumo encontrado</p>
              </CardContent>
            </Card>
          ) : (
            insumos.map((insumo) => (
              <Card key={insumo.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{insumo.nome}</CardTitle>
                      <CardDescription>
                        Criado em {new Date(insumo.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    
                    {!canViewOnly && (
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
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Insumos;
