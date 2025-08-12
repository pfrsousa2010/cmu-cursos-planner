
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
import { Badge } from "@/components/ui/badge";

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

// Função para cor da unidade
const unidadeColors = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-yellow-100 text-yellow-800",
  "bg-green-100 text-green-800",
  "bg-orange-100 text-orange-800",
  "bg-red-100 text-red-800",
  "bg-cyan-100 text-cyan-800",
  "bg-teal-100 text-teal-800",
];
const getUnidadeColor = (nome: string) => {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  return unidadeColors[Math.abs(hash) % unidadeColors.length];
};

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
          <img src="/Logo%20CMU.png" alt="Logo CMU" className="h-32 w-auto animate-pulse" />
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <div className="flex flex-col gap-2">
                      <CardTitle>{sala.nome}</CardTitle>
                      <div className="flex flex-col gap-1">
                        <Badge className={getUnidadeColor(sala.unidades.nome)}>
                          {sala.unidades.nome}
                        </Badge>
                        <div className="flex items-center gap-2 mb-1">
                          <CardDescription>
                            <span>Capacidade: {sala.capacidade} pessoas</span>
                          </CardDescription>
                        </div>
                      </div>
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
