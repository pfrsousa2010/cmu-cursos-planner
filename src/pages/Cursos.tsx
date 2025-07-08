import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Plus, Edit, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CursoForm from "@/components/CursoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Cursos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any>(null);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [selectedCursoInsumos, setSelectedCursoInsumos] = useState<any>(null);
  const { canManageCursos } = useUserRole();
  const queryClient = useQueryClient();

  // Buscar cursos
  const { data: cursos, isLoading } = useQuery({
    queryKey: ['cursos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (id, nome),
          salas (id, nome)
        `)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Deletar curso
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cursos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast.success("Curso deletado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar curso: " + error.message);
    }
  });

  const handleEdit = (curso: any) => {
    setEditingCurso(curso);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este curso?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCurso(null);
  };

  const handleViewInsumos = (curso: any) => {
    setSelectedCursoInsumos(curso);
    setInsumosDialogOpen(true);
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar download do PDF
    toast.success("Função de download será implementada em breve");
  };

  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  const getStatusColor = (status: string) => {
    return status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getPeriodoColor = (periodo: string) => {
    const colors = {
      'manha': 'bg-yellow-100 text-yellow-800',
      'tarde': 'bg-orange-100 text-orange-800',
      'noite': 'bg-blue-100 text-blue-800'
    };
    return colors[periodo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
            <p className="text-muted-foreground">
              Gerencie os cursos da CMU
            </p>
          </div>

          {canManageCursos && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCurso(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCurso ? "Editar Curso" : "Novo Curso"}
                  </DialogTitle>
                </DialogHeader>
                <CursoForm 
                  curso={editingCurso} 
                  onSuccess={handleDialogClose}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6">
          {cursos && cursos.length > 0 ? (
            cursos.map((curso) => (
              <Card key={curso.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{curso.titulo}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(curso.status)}>
                          {curso.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                        </Badge>
                        <Badge variant="outline" className={getPeriodoColor(curso.periodo)}>
                          {formatPeriodo(curso.periodo)}
                        </Badge>
                      </div>
                    </div>
                    
                    {canManageCursos && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(curso)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(curso.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Professor:</span> {curso.professor}
                      </div>
                      <div>
                        <span className="font-medium">Unidade:</span> {curso.unidades?.nome}
                      </div>
                      <div>
                        <span className="font-medium">Sala:</span> {curso.salas?.nome || 'Não definida'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Início:</span> {format(new Date(curso.inicio), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div>
                        <span className="font-medium">Fim:</span> {format(new Date(curso.fim), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewInsumos(curso)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Ver Insumos
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
                  <p className="text-muted-foreground">
                    {canManageCursos 
                      ? "Comece criando seu primeiro curso." 
                      : "Não há cursos cadastrados no momento."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog de Insumos */}
        <Dialog open={insumosDialogOpen} onOpenChange={setInsumosDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lista de Insumos - {selectedCursoInsumos?.titulo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Professor: {selectedCursoInsumos?.professor}
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Insumos Necessários:</h4>
                <div className="text-sm text-muted-foreground">
                  Lista de insumos será implementada em breve...
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Lista
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Cursos;
