
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
  const [filteredMaterias, setFilteredMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { canViewOnly, userRole, loading: userRoleLoading } = useUserRole();

  const [formData, setFormData] = useState({
    nome: ""
  });

  useEffect(() => {
    fetchMaterias();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMaterias(materias);
    } else {
      const filtered = materias.filter(materia =>
        materia.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaterias(filtered);
    }
  }, [materias, searchTerm]);

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
    if (confirm("Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita e pode causar impactos em cursos que possuem essa matéria.")) {
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

  if (loading || userRoleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <img src="/Logo%20CMU.png" alt="Logo CMU" className="h-32 w-auto animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (userRole === 'visualizador') {
    return (
      <Layout>
        <div className="text-center py-12">
          <Edit className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Acesso restrito</h3>
          <p className="mt-1 text-sm text-gray-500">
            Apenas editores e administradores podem gerenciar matérias.
          </p>
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
                      className="mt-1"
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

        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          {filteredMaterias.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {searchTerm ? "Nenhuma matéria encontrada para a busca" : "Nenhuma matéria encontrada"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMaterias.map((materia) => (
                <div key={materia.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{materia.nome}</h3>
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Materias;
