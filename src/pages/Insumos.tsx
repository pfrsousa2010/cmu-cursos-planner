
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Download, FileSpreadsheet, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useUserRole } from "@/hooks/useUserRole";
import { useInsumosExport } from "@/hooks/useInsumosExport";


interface Insumo {
  id: string;
  nome: string;
  created_at: string;
}

const Insumos = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [relatorioDialogOpen, setRelatorioDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const { canViewOnly, userRole, loading: userRoleLoading } = useUserRole();
  const { exportToExcel, exportToPDF } = useInsumosExport();

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
    if (confirm("Tem certeza que deseja excluir este insumo? Esta ação não pode ser desfeita e pode causar impactos em cursos que possuem esse insumo.")) {
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

  // Handlers para exportação
  const handleExportExcel = () => {
    exportToExcel(filteredInsumos);
    setRelatorioDialogOpen(false);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredInsumos);
    setRelatorioDialogOpen(false);
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
          <Plus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Acesso restrito</h3>
          <p className="mt-1 text-sm text-gray-500">
            Apenas editores e administradores podem gerenciar insumos.
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
            <h1 className="text-3xl font-bold text-gray-900">Insumos</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botão de Relatório */}
            <Dialog open={relatorioDialogOpen} onOpenChange={setRelatorioDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Exportar Relatório de Insumos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Selecione o formato para exportar o relatório dos insumos.
                  </p>
                  <div className="grid gap-3">
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      className="h-auto p-4 flex items-center justify-start gap-3"
                    >
                      <FileSpreadsheet className="h-6 w-6 text-green-600" />
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
                      <FileImage className="h-6 w-6 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium">Exportar para PDF</div>
                        <div className="text-sm text-muted-foreground">
                          Documento PDF para impressão
                        </div>
                      </div>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total de insumos a serem exportados: {filteredInsumos.length}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
        </div>

        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          {filteredInsumos.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {searchTerm ? "Nenhum insumo encontrado para a busca" : "Nenhum insumo encontrado"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredInsumos.map((insumo) => (
                <div key={insumo.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{insumo.nome}</h3>
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

export default Insumos;
