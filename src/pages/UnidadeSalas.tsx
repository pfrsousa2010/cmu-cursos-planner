import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useUnidadeSalasExport } from "@/hooks/useUnidadeSalasExport";
import { useOrientation } from "@/hooks/useOrientation";
import { Plus, Edit, Trash2, Building2, Phone, MapPin, DoorOpen, Users, Download, FileSpreadsheet, FileImage } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


interface Unidade {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  created_at: string;
}

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  observacoes: string | null;
  unidade_id: string;
}

const UnidadeSalas = () => {
  const [isUnidadeDialogOpen, setIsUnidadeDialogOpen] = useState(false);
  const [isSalaDialogOpen, setIsSalaDialogOpen] = useState(false);
  const [relatorioDialogOpen, setRelatorioDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>("");


  // Estados do formulário de unidade
  const [unidadeForm, setUnidadeForm] = useState({
    nome: "",
    endereco: "",
    telefone: ""
  });

  // Estados do formulário de sala
  const [salaForm, setSalaForm] = useState({
    nome: "",
    capacidade: 0,
    observacoes: ""
  });

  const { canManageUnidades, canViewOnly, userRole, loading: userRoleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const { exportToExcel, exportToPDF } = useUnidadeSalasExport();
  const { width } = useOrientation();
  
  // Detectar se é dispositivo móvel/tablet (largura menor que 768px)
  const isMobile = width < 768;

  // Buscar unidades com suas salas
  const { data: unidades, isLoading } = useQuery({
    queryKey: ['unidades-com-salas'],
    queryFn: async () => {
      const { data: unidadesData } = await supabase
        .from('unidades')
        .select('*')
        .order('created_at', { ascending: false });

      if (!unidadesData) return [];

      // Buscar salas para cada unidade
      const unidadesComSalas = await Promise.all(
        unidadesData.map(async (unidade) => {
          const { data: salasData } = await supabase
            .from('salas')
            .select('*')
            .eq('unidade_id', unidade.id)
            .order('nome');

          return {
            ...unidade,
            salas: salasData || []
          };
        })
      );

      return unidadesComSalas;
    }
  });

  // Criar/Atualizar unidade
  const unidadeMutation = useMutation({
    mutationFn: async (data: { nome: string; endereco: string; telefone: string }) => {
      if (editingUnidade) {
        const { error } = await supabase
          .from('unidades')
          .update(data)
          .eq('id', editingUnidade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('unidades').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-com-salas'] });
      toast.success(editingUnidade ? "Unidade atualizada com sucesso!" : "Unidade criada com sucesso!");
      handleUnidadeDialogClose();
    },
    onError: (error) => {
      toast.error("Erro ao salvar unidade: " + error.message);
    }
  });

  // Criar/Atualizar sala
  const salaMutation = useMutation({
    mutationFn: async (data: { nome: string; capacidade: number; observacoes: string; unidade_id: string }) => {
      if (editingSala) {
        const { error } = await supabase
          .from('salas')
          .update(data)
          .eq('id', editingSala.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('salas').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-com-salas'] });
      toast.success(editingSala ? "Sala atualizada com sucesso!" : "Sala criada com sucesso!");
      handleSalaDialogClose();
    },
    onError: (error) => {
      toast.error("Erro ao salvar sala: " + error.message);
    }
  });

  // Deletar unidade
  const deleteUnidadeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('unidades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-com-salas'] });
      toast.success("Unidade deletada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar unidade: " + error.message);
    }
  });

  // Deletar sala
  const deleteSalaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('salas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-com-salas'] });
      toast.success("Sala deletada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar sala: " + error.message);
    }
  });

  const handleUnidadeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unidadeMutation.mutate(unidadeForm);
  };

  const handleSalaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    salaMutation.mutate({ ...salaForm, unidade_id: selectedUnidadeId });
  };

  const handleEditUnidade = (unidade: Unidade) => {
    setEditingUnidade(unidade);
    setUnidadeForm({
      nome: unidade.nome,
      endereco: unidade.endereco,
      telefone: unidade.telefone
    });
    setIsUnidadeDialogOpen(true);
  };

  const handleEditSala = (sala: Sala) => {
    setEditingSala(sala);
    setSalaForm({
      nome: sala.nome,
      capacidade: sala.capacidade,
      observacoes: sala.observacoes || ""
    });
    setSelectedUnidadeId(sala.unidade_id);
    setIsSalaDialogOpen(true);
  };

  const handleDeleteUnidade = (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta unidade? Todas as salas e dados relacionados serão removidos.")) {
      deleteUnidadeMutation.mutate(id);
    }
  };

  const handleDeleteSala = (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta sala?")) {
      deleteSalaMutation.mutate(id);
    }
  };

  const handleUnidadeDialogClose = () => {
    setIsUnidadeDialogOpen(false);
    setEditingUnidade(null);
    setUnidadeForm({ nome: "", endereco: "", telefone: "" });
  };

  const handleSalaDialogClose = () => {
    setIsSalaDialogOpen(false);
    setEditingSala(null);
    setSalaForm({ nome: "", capacidade: 0, observacoes: "" });
    setSelectedUnidadeId("");
  };

  const handleAddSala = (unidadeId: string) => {
    setSelectedUnidadeId(unidadeId);
    setEditingSala(null);
    setSalaForm({ nome: "", capacidade: 0, observacoes: "" });
    setIsSalaDialogOpen(true);
  };

  // Handlers para exportação
  const handleExportExcel = () => {
    if (unidades) {
      exportToExcel(unidades);
      setRelatorioDialogOpen(false);
    }
  };

  const handleExportPDF = () => {
    if (unidades) {
      exportToPDF(unidades);
      setRelatorioDialogOpen(false);
    }
  };



  if (isLoading || userRoleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <img src="/logo-cmu.png" alt="Logo CMU" className="h-32 w-auto animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (userRole === 'visualizador') {
    return (
      <Layout>
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">Acesso restrito</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Apenas editores e administradores podem gerenciar unidades e salas.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unidades / Salas</h1>            
          </div>

          <div className={`flex items-center ${isMobile ? "gap-1" : "gap-2"}`}>
            {/* Botão de Relatório */}
            <Dialog open={relatorioDialogOpen} onOpenChange={setRelatorioDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size={isMobile ? "sm" : "default"}>
                  <Download className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                  {!isMobile && "Exportar"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Exportar Relatório de Unidades e Salas</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Selecione o formato para exportar o relatório das unidades e salas.
                  </p>
                  <div className="grid gap-3">
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      className="h-auto p-4 flex items-center justify-start gap-3"
                    >
                      <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                      <div className="text-left">
                        <div className="font-medium">Exportar para Excel</div>
                        <div className="text-sm text-muted-foreground">
                          Arquivo XLSX compatível com Excel
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      className="h-auto p-4 flex items-center justify-start gap-3"
                    >
                      <FileImage className="h-6 w-6 text-red-600 dark:text-red-400" />
                      <div className="text-left">
                        <div className="font-medium">Exportar para PDF</div>
                        <div className="text-sm text-muted-foreground">
                          Documento PDF para impressão
                        </div>
                      </div>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {unidades && (
                      <>
                        Total de unidades: {unidades.length} |
                        Total de salas: {unidades.reduce((acc, unidade) => acc + unidade.salas.length, 0)}
                      </>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {canManageUnidades && (
              <Dialog open={isUnidadeDialogOpen} onOpenChange={setIsUnidadeDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setEditingUnidade(null)}
                    size={isMobile ? "sm" : "default"}
                  >
                    <Plus className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                    {!isMobile && "Nova Unidade"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingUnidade ? "Editar Unidade" : "Nova Unidade"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUnidadeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Unidade</Label>
                      <Input
                        id="nome"
                        value={unidadeForm.nome}
                        onChange={(e) => setUnidadeForm({ ...unidadeForm, nome: e.target.value })}
                        required
                        placeholder="Ex: Unidade Centro"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={unidadeForm.endereco}
                        onChange={(e) => setUnidadeForm({ ...unidadeForm, endereco: e.target.value })}
                        required
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={unidadeForm.telefone}
                        onChange={(e) => setUnidadeForm({ ...unidadeForm, telefone: e.target.value })}
                        required
                        placeholder="Ex: (11) 1234-5678"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" disabled={unidadeMutation.isPending}>
                        {unidadeMutation.isPending ? "Salvando..." : (editingUnidade ? "Atualizar" : "Criar")}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleUnidadeDialogClose}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {unidades && unidades.length > 0 ? (
            unidades.map((unidade) => (
              <Card key={unidade.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {unidade.nome}
                    </CardTitle>

                    {canManageUnidades && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUnidade(unidade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUnidade(unidade.id)}
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{unidade.endereco}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{unidade.telefone}</span>
                    </div>

                    {/* Seção de Salas */}
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <DoorOpen className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Salas ({unidade.salas.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {unidade.salas.length > 0 ? (
                          unidade.salas.map((sala) => (
                            <div key={sala.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{sala.nome}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {sala.capacidade}
                                  </Badge>
                                </div>
                                {sala.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1">{sala.observacoes}</p>
                                )}
                              </div>
                              {!canViewOnly && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSala(sala)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSala(sala.id)}
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Nenhuma sala cadastrada
                          </p>
                        )}

                        {!canViewOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSala(unidade.id)}
                            className="w-full"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Sala
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Nenhuma unidade encontrada</h3>
                  <p className="text-muted-foreground">
                    {canManageUnidades
                      ? "Comece criando sua primeira unidade."
                      : "Não há unidades cadastradas no momento."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog para Salas */}
        <Dialog open={isSalaDialogOpen} onOpenChange={setIsSalaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSala ? "Editar Sala" : "Nova Sala"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSalaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sala-nome">Nome da Sala</Label>
                <Input
                  id="sala-nome"
                  value={salaForm.nome}
                  onChange={(e) => setSalaForm({ ...salaForm, nome: e.target.value })}
                  required
                  placeholder="Ex: Sala 101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input
                  id="capacidade"
                  type="number"
                  value={salaForm.capacidade}
                  onChange={(e) => setSalaForm({ ...salaForm, capacidade: parseInt(e.target.value) || 0 })}
                  required
                  placeholder="Ex: 30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={salaForm.observacoes}
                  onChange={(e) => setSalaForm({ ...salaForm, observacoes: e.target.value })}
                  placeholder="Ex: Sala com projetor e ar condicionado"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={salaMutation.isPending}>
                  {salaMutation.isPending ? "Salvando..." : (editingSala ? "Atualizar" : "Criar")}
                </Button>
                <Button type="button" variant="outline" onClick={handleSalaDialogClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default UnidadeSalas;
