import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCursosExport } from "@/hooks/useCursosExport";
import { useOrientation } from "@/hooks/useOrientation";
import { Plus, Edit, Trash2, FileText, Download, Search, Filter, Copy, MoreHorizontal, FileSpreadsheet, FileImage } from "lucide-react";
import logoCmu from "/logo-cmu.png";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CursoForm from "@/components/CursoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CursoInsumosList from "@/components/CursoInsumosList";
import { Curso } from "@/types/calendario";

const Cursos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [duplicatingCurso, setDuplicatingCurso] = useState<Curso | null>(null);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [selectedCursoInsumos, setSelectedCursoInsumos] = useState<Curso | null>(null);
  const [relatorioDialogOpen, setRelatorioDialogOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState("todos");
  const [selectedUnidade, setSelectedUnidade] = useState("todas");
  const [selectedSala, setSelectedSala] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("todos");
  const [showFinalizados, setShowFinalizados] = useState(false);

  
  const { canManageCursos } = useUserRole();
  const queryClient = useQueryClient();
  const { exportToExcel, exportToPDF } = useCursosExport();
  const { width } = useOrientation();
  
  // Detectar se é dispositivo móvel/tablet (largura menor que 768px)
  const isMobile = width < 768;

  // Função para verificar se o curso está finalizado
  const isCursoFinalizado = (dataFim: string) => {
    const hoje = new Date();
    const fimCurso = new Date(dataFim + 'T00:00:00');
    
    // Normalizar as datas para comparar apenas o dia (sem horário)
    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimCursoNormalizado = new Date(fimCurso.getFullYear(), fimCurso.getMonth(), fimCurso.getDate());
    
    // Curso está finalizado apenas se a data fim for anterior ao dia atual
    return fimCursoNormalizado < hojeNormalizado;
  };

  // Buscar cursos
  const { data: cursos, isLoading } = useQuery<Curso[]>({
    queryKey: ['cursos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (id, nome),
          salas (id, nome),
          curso_insumos (id),
          curso_materias (id)
        `)
        .order('created_at', { ascending: false });
      
      // Processar os dados para incluir contagem de insumos e matérias
      const cursosComContagens = data?.map(curso => ({
        ...curso,
        total_insumos: curso.curso_insumos?.length || 0,
        total_materias: curso.curso_materias?.length || 0
      })) || [];
      
      return cursosComContagens;
    }
  });

  // Filtrar e agrupar cursos
  const { filteredCursos, groupedCursos } = useMemo(() => {
    if (!cursos) return { filteredCursos: [], groupedCursos: {} };
    
    const filtered = cursos.filter(curso => {
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
      
      // Filtro por cursos finalizados
      if (!showFinalizados && isCursoFinalizado(curso.fim)) return false;
      
      return true;
    });

    // Agrupar por unidade e depois por sala
    const grouped = filtered.reduce((acc, curso) => {
      const unidadeNome = curso.unidades?.nome || 'Sem Unidade';
      const salaNome = curso.salas?.nome || 'Sem Sala';
      
      if (!acc[unidadeNome]) {
        acc[unidadeNome] = {};
      }
      
      if (!acc[unidadeNome][salaNome]) {
        acc[unidadeNome][salaNome] = [];
      }
      
      acc[unidadeNome][salaNome].push(curso);
      return acc;
    }, {} as Record<string, Record<string, Curso[]>>);

    // Ordenar cursos dentro de cada sala por turno (Manhã, Tarde, Noite)
    Object.keys(grouped).forEach(unidadeNome => {
      Object.keys(grouped[unidadeNome]).forEach(salaNome => {
        grouped[unidadeNome][salaNome].sort((a, b) => {
          const turnoOrder = { 'manha': 1, 'tarde': 2, 'noite': 3 };
          const aOrder = turnoOrder[a.periodo as keyof typeof turnoOrder] || 4;
          const bOrder = turnoOrder[b.periodo as keyof typeof turnoOrder] || 4;
          return aOrder - bOrder;
        });
      });
    });

    return { filteredCursos: filtered, groupedCursos: grouped };
  }, [cursos, searchTerm, selectedPeriodo, selectedUnidade, selectedSala, selectedYear, showFinalizados]);

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

  // Obter salas únicas para filtro baseado na unidade selecionada
  const getSalas = () => {
    if (!cursos) return [];
    
    // Se nenhuma unidade específica está selecionada, mostrar todas as salas
    if (selectedUnidade === "todas") {
      return [...new Set(cursos.map(curso => curso.salas?.nome).filter(Boolean))];
    }
    
    // Filtrar salas apenas da unidade selecionada
    const salasDaUnidade = cursos
      .filter(curso => curso.unidades?.nome === selectedUnidade)
      .map(curso => curso.salas?.nome)
      .filter(Boolean);
    
    return [...new Set(salasDaUnidade)];
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
    setEditingCurso(curso);
    setDuplicatingCurso(null);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (curso: Curso) => {
    setDuplicatingCurso(curso);
    setEditingCurso(null);
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
    setDuplicatingCurso(null);
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



  const getPeriodoColor = (periodo: string) => {
    const colors = {
      'manha': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'tarde': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'noite': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return colors[periodo as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  // Gerar cor única para cada unidade
  const getUnidadeColor = (unidadeNome: string) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-emerald-100 text-emerald-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
      'bg-sky-100 text-sky-800',
      'bg-violet-100 text-violet-800',
      'bg-fuchsia-100 text-fuchsia-800',
      'bg-pink-100 text-pink-800',
      'bg-rose-100 text-rose-800',
      'bg-orange-100 text-orange-800',
      'bg-amber-100 text-amber-800',
      'bg-lime-100 text-lime-800'
    ];
    
    // Usar o nome da unidade para gerar um índice consistente
    let hash = 0;
    for (let i = 0; i < unidadeNome.length; i++) {
      hash = unidadeNome.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPeriodo("todos");
    setSelectedUnidade("todas");
    setSelectedSala("todas");
    setSelectedYear("todos");
    setShowFinalizados(false);
  };

  // Handlers para exportação
  const handleExportExcel = () => {
    exportToExcel(
      filteredCursos,
      searchTerm,
      selectedPeriodo,
      selectedUnidade,
      selectedSala,
      selectedYear,
      showFinalizados
    );
    setRelatorioDialogOpen(false);
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredCursos,
      searchTerm,
      selectedPeriodo,
      selectedUnidade,
      selectedSala,
      selectedYear,
      showFinalizados
    );
    setRelatorioDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <img src={logoCmu} alt="Logo CMU" className="h-32 w-auto animate-pulse" />
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
                  <DialogTitle>Exportar Relatório de Cursos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Selecione o formato para exportar o relatório dos cursos filtrados.
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
                    Total de cursos a serem exportados: {filteredCursos.length}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {canManageCursos && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setEditingCurso(null);
                      setDuplicatingCurso(null);
                    }}
                    size={isMobile ? "sm" : "default"}
                  >
                    <Plus className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                    {!isMobile && "Novo Curso"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0 pb-4">
                    <DialogTitle>
                      {editingCurso ? "Editar Curso" : duplicatingCurso ? "Duplicar Curso" : "Novo Curso"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <CursoForm 
                      curso={editingCurso}
                      cursoParaDuplicar={duplicatingCurso}
                      onSuccess={handleDialogClose}
                    />
                  </div>
                  <div className="flex gap-4 justify-end flex-shrink-0 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancelar
                    </Button>
                    <Button type="submit" form="curso-form">
                      {editingCurso ? "Atualizar" : duplicatingCurso ? "Duplicar" : "Criar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

              {/* Filtro por Unidade */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidade</label>
                <Select value={selectedUnidade} onValueChange={(value) => {
                  setSelectedUnidade(value);
                  // Resetar filtro de sala quando a unidade for alterada
                  setSelectedSala("todas");
                }}>
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

              {/* Filtro por Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar período">
                      {selectedPeriodo === "todos" ? (
                        "Todos os períodos"
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPeriodoColor(selectedPeriodo)}`}>
                          {formatPeriodo(selectedPeriodo)}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os períodos</SelectItem>
                    <SelectItem value="manha">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPeriodoColor('manha')}`}>
                          Manhã
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tarde">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPeriodoColor('tarde')}`}>
                          Tarde
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="noite">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPeriodoColor('noite')}`}>
                          Noite
                        </span>
                      </div>
                    </SelectItem>
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

              {/* Toggle para mostrar cursos finalizados */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cursos Finalizados</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showFinalizados"
                    checked={showFinalizados}
                    onCheckedChange={setShowFinalizados}
                  />
                  <label htmlFor="showFinalizados" className="text-sm text-muted-foreground">
                    Mostrar cursos finalizados
                  </label>
                </div>
              </div>

            </div>

            {/* Contador de resultados e Botão Limpar Filtros */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground space-y-1">
                {cursos && cursos.length > 0 && (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                      <span>Não finalizados: {cursos.filter(curso => !isCursoFinalizado(curso.fim)).length}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                      <span>Finalizados: {cursos.filter(curso => isCursoFinalizado(curso.fim)).length}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      <span>Total: {cursos.length}</span>
                    </span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size={isMobile ? "sm" : "sm"}
                className={isMobile ? "px-2" : ""}
              >
                <Filter className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                {!isMobile && "Limpar Filtros"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cursos Agrupados */}
        <div className="space-y-6">
          {filteredCursos && filteredCursos.length > 0 ? (
            Object.entries(groupedCursos).map(([unidadeNome, salas]) => (
              <Card key={unidadeNome}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUnidadeColor(unidadeNome)}`}>
                      {unidadeNome}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({Object.values(salas).flat().length} curso{Object.values(salas).flat().length !== 1 ? 's' : ''})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(salas).map(([salaNome, cursosSala]) => (
                      <div key={salaNome} className="border-l-2 border-muted pl-4">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Sala: {salaNome}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            ({cursosSala.length} curso{cursosSala.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {cursosSala.map((curso) => {
                            const cursoFinalizado = isCursoFinalizado(curso.fim);
                            return (
                              <div 
                                key={curso.id} 
                                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                  cursoFinalizado ? 'bg-destructive/10 border-destructive/20' : ''
                                }`}
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-2">
                                    <h5 className="font-medium">{curso.titulo}</h5>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <Badge variant="outline" className={getPeriodoColor(curso.periodo)}>
                                        {formatPeriodo(curso.periodo)}
                                      </Badge>
                                      {(() => {
                                        if (!curso.dia_semana || curso.dia_semana.length === 0) {
                                          return (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                              Sem dias
                                            </Badge>
                                          );
                                        }
                                        
                                        const todosOsDias: ('segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta')[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
                                        const temTodosOsDias = todosOsDias.every(dia => curso.dia_semana?.includes(dia));
                                        
                                        if (temTodosOsDias) {
                                          return (
                                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                              Todos os dias
                                            </Badge>
                                          );
                                        }
                                        
                                        const diaLabels = {
                                          'segunda': 'Seg',
                                          'terca': 'Ter',
                                          'quarta': 'Qua',
                                          'quinta': 'Qui',
                                          'sexta': 'Sex'
                                        };
                                        
                                        return curso.dia_semana.map(dia => (
                                          <Badge key={dia} variant="outline" className="bg-green-100 text-green-700">
                                            {diaLabels[dia as keyof typeof diaLabels] || dia}
                                          </Badge>
                                        ));
                                      })()}
                                      {cursoFinalizado && (
                                        <Badge variant="destructive">
                                          Finalizado
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Professor:</span> {curso.professor}
                                  </div>
                                  <div>
                                    <span className="font-medium">Início:</span> {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                  <div>
                                    <span className="font-medium">Fim:</span> {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                  <div>
                                    <span className="font-medium">Vagas:</span> {curso.vaga_inicio || 0} → {curso.vaga_fim || 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">Carga Horária:</span> {curso.carga_horaria ? `${curso.carga_horaria}h` : 'Não definida'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Matérias:</span> {curso.total_materias || 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">Insumos:</span> {curso.total_insumos || 0}
                                  </div>
                                </div>
                              </div>
                              
                              {canManageCursos && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Abrir menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewInsumos(curso)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Ver Insumos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicate(curso)}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicar curso
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(curso)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar curso
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(curso.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Apagar curso
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
                    <Button 
                      variant="outline" 
                      onClick={clearFilters} 
                      className={`mt-2 ${isMobile ? "px-2" : ""}`}
                      size={isMobile ? "sm" : "default"}
                    >
                      <Filter className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                      {!isMobile && "Limpar Filtros"}
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
