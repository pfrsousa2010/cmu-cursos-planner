
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Plus, Edit, Trash2, FileText, Download, Search, Filter } from "lucide-react";
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
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedPeriodo, setSelectedPeriodo] = useState("todos");
  const [selectedUnidade, setSelectedUnidade] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("todos");
  
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

  // Filtrar cursos
  const filteredCursos = useMemo(() => {
    if (!cursos) return [];
    
    return cursos.filter(curso => {
      // Filtro de busca por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          curso.titulo.toLowerCase().includes(searchLower) ||
          curso.professor.toLowerCase().includes(searchLower) ||
          curso.unidades?.nome.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      
      // Filtro por status
      if (selectedStatus !== "todos" && curso.status !== selectedStatus) return false;
      
      // Filtro por período
      if (selectedPeriodo !== "todos" && curso.periodo !== selectedPeriodo) return false;
      
      // Filtro por unidade
      if (selectedUnidade !== "todas" && curso.unidades?.nome !== selectedUnidade) return false;
      
      // Filtro por ano
      if (selectedYear !== "todos") {
        const cursoYear = new Date(curso.inicio).getFullYear().toString();
        if (cursoYear !== selectedYear) return false;
      }
      
      return true;
    });
  }, [cursos, searchTerm, selectedStatus, selectedPeriodo, selectedUnidade, selectedYear]);

  // Obter dados únicos para filtros
  const getUnidades = () => {
    if (!cursos) return [];
    return [...new Set(cursos.map(curso => curso.unidades?.nome).filter(Boolean))];
  };

  const getAvailableYears = () => {
    if (!cursos) return [];
    const years = cursos.map(curso => new Date(curso.inicio).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("todos");
    setSelectedPeriodo("todos");
    setSelectedUnidade("todas");
    setSelectedYear("todos");
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

        {/* Seção de Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Busca por texto */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Título, professor, unidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Filtro por Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os períodos</SelectItem>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Unidade */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidade</label>
                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as unidades</SelectItem>
                    {getUnidades().map(unidade => (
                      <SelectItem key={unidade} value={unidade}>
                        {unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Ano */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ano</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    {getAvailableYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Limpar Filtros */}
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-0">Ações</label>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredCursos.length} de {cursos?.length || 0} cursos
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {filteredCursos && filteredCursos.length > 0 ? (
            filteredCursos.map((curso) => (
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
                  <h3 className="text-lg font-medium">
                    {cursos && cursos.length > 0 ? "Nenhum curso encontrado com os filtros aplicados" : "Nenhum curso encontrado"}
                  </h3>
                  <p className="text-muted-foreground">
                    {cursos && cursos.length > 0 
                      ? "Tente ajustar os filtros ou limpar todos os filtros para ver mais resultados."
                      : canManageCursos 
                        ? "Comece criando seu primeiro curso." 
                        : "Não há cursos cadastrados no momento."
                    }
                  </p>
                  {cursos && cursos.length > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="mt-2">
                      Limpar Filtros
                    </Button>
                  )}
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
