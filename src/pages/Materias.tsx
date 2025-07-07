
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

interface Materia {
  id: string;
  nome: string;
  created_at: string;
}

const Materias = () => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const { canViewOnly } = useUserRole();

  const [formData, setFormData] = useState({
    nome: ""
  });

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .order('nome');

    if (error) {
      toast.error("Erro ao carregar matérias");
      console.error(error);
    } else {
      setMaterias(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMateria) {
      const { error } = await supabase
        .from('materias')
        .update(formData)
        .eq('id', editingMateria.id);

      if (error) {
        toast.error("Erro ao atualizar matéria");
        console.error(error);
      } else {
        toast.success("Matéria atualizada com sucesso!");
        fetchMaterias();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('materias')
        .insert([formData]);

      if (error) {
        toast.error("Erro ao criar matéria");
        console.error(error);
      } else {
        toast.success("Matéria criada com sucesso!");
        fetchMaterias();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta matéria?")) {
      const { error } = await supabase
        .from('materias')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Erro ao excluir matéria");
        console.error(error);
      } else {
        toast.success("Matéria excluída com sucesso!");
        fetchMaterias();
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: "" });
    setEditingMateria(null);
    setDialogOpen(false);
  };

  const startEdit = (materia: Materia) => {
    setFormData({ nome: materia.nome });
    setEditingMateria(materia);
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
            <h1 className="text-3xl font-bold text-gray-900">Matérias</h1>
            <p className="text-gray-600">Gerencie as matérias dos cursos</p>
          </div>
          
          {!canViewOnly && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Matéria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMateria ? "Editar Matéria" : "Nova Matéria"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMateria ? "Edite o nome da matéria" : "Adicione uma nova matéria"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Matéria</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                      placeholder="Ex: Português, Matemática, Informática..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingMateria ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materias.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Nenhuma matéria encontrada</p>
              </CardContent>
            </Card>
          ) : (
            materias.map((materia) => (
              <Card key={materia.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{materia.nome}</CardTitle>
                      <CardDescription>
                        Criada em {new Date(materia.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    
                    {!canViewOnly && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(materia)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(materia.id)}
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

export default Materias;
