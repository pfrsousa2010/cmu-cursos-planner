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
import CursoInsumosList from "@/components/CursoInsumosList";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string | null;
  unidade_id: string;
  status: 'ativo' | 'finalizado';
  unidades: { nome: string, id: string } | null;
  salas: { nome: string; id: string } | null;
}

const Cursos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [selectedCursoInsumos, setSelectedCursoInsumos] = useState<Curso | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState("todos");
  const [selectedUnidade, setSelectedUnidade] = useState("todas");
  const [selectedSala, setSelectedSala] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  
  const { canManageCursos } = useUserRole();
  const queryClient = useQueryClient();

  // Buscar cursos
  const { data: cursos, isLoading } = useQuery<Curso[]>({
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
      
      // Filtro por período
      if (selectedPeriodo !== "todos" && curso.periodo !== selectedPeriodo) return false;
      
      // Filtro por unidade
      if (selectedUnidade !== "todas" && curso.unidades?.nome !== selectedUnidade) return false;
      
      // Filtro por sala
      if (selectedSala !== "todas" && curso.salas?.nome !== selectedSala) return false;
      
      // Filtro por ano
      if (selectedYear !== "todos") {
        const cursoYear = new Date(curso.inicio).getFullYear().toString();
        if (cursoYear !== selectedYear) return false;
      }
      
      // Filtro por status
      if (selectedStatus !== "todos" && curso.status !== selectedStatus) return false;
      
      return true;
    });
  }, [cursos, searchTerm, selectedPeriodo, selectedUnidade, selectedSala, selectedYear, selectedStatus]);

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

  // Obter salas únicas para filtro
  const getSalas = () => {
    if (!cursos) return [];
    return [...new Set(cursos.map(curso => curso.salas?.nome).filter(Boolean))];
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

  const handleEdit = (curso: Curso) => {
    console.log(curso);
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

  const handleViewInsumos = (curso: Curso) => {
    setSelectedCursoInsumos(curso);
    setInsumosDialogOpen(true);
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
    return status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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
    setSelectedPeriodo("todos");
    setSelectedUnidade("todas");
    setSelectedSala("todas");
    setSelectedYear("todos");
    setSelectedStatus("todos");
  };

  if (isLoading) {
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

              {/* Filtro por Sala */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sala</label>
                <Select value={selectedSala} onValueChange={setSelectedSala}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar sala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as salas</SelectItem>
                    {getSalas().map(sala => (
                      <SelectItem key={sala} value={sala}>
                        {sala}
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


            </div>

            {/* Contador de resultados e Botão Limpar Filtros */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredCursos.length} de {cursos?.length || 0} cursos
              </div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="sm"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Cursos */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCursos && filteredCursos.length > 0 ? (
            filteredCursos.map((curso: Curso) => (
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        <span className="font-medium">Início:</span> {format(new Date(curso.inicio  + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div>
                        <span className="font-medium">Fim:</span> {format(new Date(curso.fim  + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
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
            {selectedCursoInsumos && (
              <CursoInsumosList 
                cursoId={selectedCursoInsumos.id}
                cursoTitulo={selectedCursoInsumos.titulo}
                professor={selectedCursoInsumos.professor}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Cursos;
