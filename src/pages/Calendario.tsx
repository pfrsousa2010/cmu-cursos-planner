import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Info } from "lucide-react";
import { toast } from "sonner";
import { useOrientation } from "@/hooks/useOrientation";

// Hooks personalizados
import { 
  useCalendarioCursos, 
  useCalendarioFiltros, 
  useCalendarioNavegacao, 
  useCalendarioExport 
} from "@/hooks";
import { useUserRole } from "@/hooks/useUserRole";

// Componentes
import { 
  CalendarioFiltros, 
  CalendarioNavegacao, 
  CalendarioSemanal, 
  CalendarioMensal 
} from "@/components/calendario";
import CursoDetails from "@/components/CursoDetails";
import CursoForm from "@/components/CursoForm";
import CursoInsumosList from "@/components/CursoInsumosList";

// Tipos
import { Curso, ViewMode } from "@/types/calendario";

// Utilitários
import { getSalasToShow } from "@/utils/calendarioUtils";

const Calendario = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCursoInsumos, setSelectedCursoInsumos] = useState<Curso | null>(null);
  const [cursoToEdit, setCursoToEdit] = useState<Curso | null>(null);
  const [novoCursoDialogOpen, setNovoCursoDialogOpen] = useState(false);
  const [novoCursoData, setNovoCursoData] = useState<{
    salaId: string;
    dia: Date;
    periodo: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { isPortrait } = useOrientation();

  // Hooks personalizados
  const { currentWeek, isChangingWeek, navigateByViewMode } = useCalendarioNavegacao();
  const { canViewOnly } = useUserRole();
  const { data: cursos, isLoading: loadingCursos } = useCalendarioCursos(currentWeek, viewMode);
  const {
    selectedUnidade,
    selectedProfessor,
    selectedSala,
    unidades,
    salas,
    salasFiltradas,
    professoresFiltrados,
    cursosFiltrados,
    setSelectedProfessor,
    setSelectedSala,
    handleUnidadeChange,
    handleLimparFiltros
  } = useCalendarioFiltros(cursos);
  const { handleExportPDF } = useCalendarioExport();

  // Estados de loading
  const loadingUnidades = loadingCursos;
  const loadingSalas = loadingCursos;
  const loadingProfessores = loadingCursos;

  // Mostrar apenas salas que têm cursos após a aplicação dos filtros
  const salasToShow = getSalasToShow(salas, cursosFiltrados, selectedSala);

  // Estado de loading geral
  const isLoading = loadingCursos || isChangingWeek;

  // Handlers
  const handleCursoClick = (curso: Curso) => {
    setSelectedCurso(curso);
    setDialogOpen(true);
  };

  const handleEditCurso = (curso: Curso) => {
    setCursoToEdit(curso);
    setEditDialogOpen(true);
    setDialogOpen(false);
  };

  const handleViewInsumos = (curso: Curso) => {
    setSelectedCursoInsumos(curso);
    setInsumosDialogOpen(true);
    setDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
    queryClient.invalidateQueries({ queryKey: ['cursos-semana'] });
    queryClient.invalidateQueries({ queryKey: ['cursos-mes'] });
    toast.success("Curso atualizado com sucesso!");
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
  };

  const handleAddCurso = (salaId: string, dia: Date, periodo: string) => {
    setNovoCursoData({ salaId, dia, periodo });
    setNovoCursoDialogOpen(true);
  };

  // Função para mapear o dia da semana
  const getDiaSemanaFromDate = (date: Date): 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' => {
    const dayMap = {
      1: 'segunda' as const,
      2: 'terca' as const, 
      3: 'quarta' as const,
      4: 'quinta' as const,
      5: 'sexta' as const
    };
    return dayMap[date.getDay() as keyof typeof dayMap] || 'segunda';
  };

  // Função para formatar data para input date
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleNovoCursoSuccess = () => {
    setNovoCursoDialogOpen(false);
    setNovoCursoData(null);
    queryClient.invalidateQueries({ queryKey: ['cursos-semana'] });
    queryClient.invalidateQueries({ queryKey: ['cursos-mes'] });
    toast.success("Curso criado com sucesso!");
  };

  const handleNovoCursoCancel = () => {
    setNovoCursoDialogOpen(false);
    setNovoCursoData(null);
  };

  const handleExport = () => {
    handleExportPDF(
      viewMode,
      currentWeek,
      cursosFiltrados,
      salasToShow,
      selectedUnidade,
      selectedSala,
      selectedProfessor,
      unidades,
      salas
    );
  };

  const handlePrevious = () => {
    navigateByViewMode(viewMode, 'previous');
  };

  const handleNext = () => {
    navigateByViewMode(viewMode, 'next');
  };

  // Layout sempre em paisagem - remover verificação de orientação retrato

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Cursos</h1>
            {viewMode === 'semana' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>O calendário semanal mostra apenas de segunda a sexta.<br />Fins de semana não são exibidos.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || !cursosFiltrados || cursosFiltrados.length === 0}
            >
              <Download className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Baixar Calendário</span>
            </Button>
            <span className="text-sm font-medium">Visão Semanal</span>
            <Switch
              checked={viewMode === 'mes'}
              onCheckedChange={(checked) => setViewMode(checked ? 'mes' : 'semana')}
              disabled={isLoading}
            />
            <span className="text-sm font-medium">Visão Mensal</span>
          </div>
        </div>

        {/* Filtros */}
        <CalendarioFiltros
          selectedUnidade={selectedUnidade}
          selectedProfessor={selectedProfessor}
          selectedSala={selectedSala}
          unidades={unidades}
          salasFiltradas={salasFiltradas}
          professoresFiltrados={professoresFiltrados}
          loadingUnidades={loadingUnidades}
          loadingSalas={loadingSalas}
          loadingProfessores={loadingProfessores}
          onUnidadeChange={handleUnidadeChange}
          onProfessorChange={setSelectedProfessor}
          onSalaChange={setSelectedSala}
          onLimparFiltros={handleLimparFiltros}
        />

        {/* Navegação da semana/mês */}
        <CalendarioNavegacao
          currentWeek={currentWeek}
          viewMode={viewMode}
          isChangingWeek={isChangingWeek}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />

        {/* Tabela de cursos por sala - visão semanal ou mensal */}
        {viewMode === 'semana' ? (
          <CalendarioSemanal
            currentWeek={currentWeek}
            salasToShow={salasToShow}
            cursosFiltrados={cursosFiltrados}
            loadingSalas={loadingSalas}
            loadingCursos={loadingCursos}
            onCursoClick={handleCursoClick}
            onAddCurso={handleAddCurso}
          />
        ) : (
          <CalendarioMensal
            currentWeek={currentWeek}
            salasToShow={salasToShow}
            cursosFiltrados={cursosFiltrados}
            loadingSalas={loadingSalas}
            onCursoClick={handleCursoClick}
            onAddCurso={handleAddCurso}
          />
          )}

        {/* Detalhes do Curso (se selecionado) */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            {selectedCurso && (
              <CursoDetails 
                curso={{
                  ...selectedCurso,
                  status: 'ativo' as const,
                  unidades: selectedCurso.unidades ? { nome: selectedCurso.unidades.nome, id: selectedCurso.unidades.id } : null
                }} 
                onEdit={(curso) => handleEditCurso(selectedCurso)} 
                onViewInsumos={(curso) => handleViewInsumos(selectedCurso)}
                showActions={!canViewOnly}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Insumos do Curso (se selecionado) */}
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

        {/* Formulário de Edição de Curso (se selecionado) */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle>Editar Curso</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0">
              {cursoToEdit && (
                <CursoForm 
                  curso={cursoToEdit}
                  onSuccess={handleEditSuccess}
                />
              )}
            </div>
            <div className="flex gap-4 justify-end flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleEditCancel}>
                Cancelar
              </Button>
              <Button type="submit" form="curso-form">
                Atualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Formulário de Novo Curso */}
        <Dialog open={novoCursoDialogOpen} onOpenChange={setNovoCursoDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle>Novo Curso</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0">
              <CursoForm 
                onSuccess={handleNovoCursoSuccess}
                cursoParaDuplicar={novoCursoData ? (() => {
                  const salaSelecionada = salasToShow.find(s => s.id === novoCursoData.salaId);
                  return {
                    id: '',
                    titulo: '',
                    professor: '',
                    periodo: novoCursoData.periodo as 'manha' | 'tarde' | 'noite',
                    inicio: formatDateForInput(novoCursoData.dia),
                    fim: '',
                    sala_id: novoCursoData.salaId,
                    unidade_id: salaSelecionada?.unidade_id || '',
                    unidades: salaSelecionada?.unidades ? { 
                      id: salaSelecionada.unidade_id, 
                      nome: salaSelecionada.unidades.nome 
                    } : null,
                    salas: salaSelecionada || null,
                    dia_semana: [getDiaSemanaFromDate(novoCursoData.dia)]
                  };
                })() : undefined}
              />
            </div>
            <div className="flex gap-4 justify-end flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleNovoCursoCancel}>
                Cancelar
              </Button>
              <Button type="submit" form="curso-form">
                Criar Curso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Calendario;