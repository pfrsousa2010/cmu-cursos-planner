
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useUserRole } from "@/hooks/useUserRole";

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  observacoes: string | null;
  unidade_id: string;
  unidades: {
    nome: string;
  };
}

interface Unidade {
  id: string;
  nome: string;
}

const Salas = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const { canViewOnly } = useUserRole();

  const [formData, setFormData] = useState({
    nome: "",
    capacidade: 0,
    observacoes: "",
    unidade_id: ""
  });

  useEffect(() => {
    fetchSalas();
    fetchUnidades();
  }, []);

  const fetchSalas = async () => {
    const { data, error } = await supabase
      .from('salas')
      .select(`
        *,
        unidades (nome)
      `)
      .order('nome');

    if (error) {
      toast.error("Erro ao carregar salas");
      console.error(error);
    } else {
      setSalas(data || []);
    }
    setLoading(false);
  };

  const fetchUnidades = async () => {
    const { data, error } = await supabase
      .from('unidades')
      .select('id, nome')
      .order('nome');

    if (error) {
      console.error("Erro ao carregar unidades:", error);
    } else {
      setUnidades(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSala) {
      const { error } = await supabase
        .from('salas')
        .update(formData)
        .eq('id', editingSala.id);

      if (error) {
        toast.error("Erro ao atualizar sala");
        console.error(error);
      } else {
        toast.success("Sala atualizada com sucesso!");
        fetchSalas();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('salas')
        .insert([formData]);

      if (error) {
        toast.error("Erro ao criar sala");
        console.error(error);
      } else {
        toast.success("Sala criada com sucesso!");
        fetchSalas();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta sala?")) {
      const { error } = await supabase
        .from('salas')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Erro ao excluir sala");
        console.error(error);
      } else {
        toast.success("Sala excluída com sucesso!");
        fetchSalas();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      capacidade: 0,
      observacoes: "",
      unidade_id: ""
    });
    setEditingSala(null);
    setDialogOpen(false);
  };

  const startEdit = (sala: Sala) => {
    setFormData({
      nome: sala.nome,
      capacidade: sala.capacidade,
      observacoes: sala.observacoes || "",
      unidade_id: sala.unidade_id
    });
    setEditingSala(sala);
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
            <h1 className="text-3xl font-bold text-gray-900">Salas</h1>
            <p className="text-gray-600">Gerencie as salas das unidades</p>
          </div>
          
          {!canViewOnly && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Sala
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSala ? "Editar Sala" : "Nova Sala"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSala ? "Edite os dados da sala" : "Adicione uma nova sala"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unidade">Unidade</Label>
                    <Select
                      value={formData.unidade_id}
                      onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.id}>
                            {unidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="capacidade">Capacidade</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingSala ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4">
          {salas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Nenhuma sala encontrada</p>
              </CardContent>
            </Card>
          ) : (
            salas.map((sala) => (
              <Card key={sala.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{sala.nome}</CardTitle>
                      <CardDescription>
                        {sala.unidades.nome} • Capacidade: {sala.capacidade} pessoas
                      </CardDescription>
                    </div>
                    
                    {!canViewOnly && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(sala)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sala.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {sala.observacoes && (
                  <CardContent>
                    <p className="text-sm text-gray-600">{sala.observacoes}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Salas;
