import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import logoCmu from "/logo-cmu.png";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string | null;
  unidade_id: string;
  unidades: { nome: string, id: string } | null;
  salas: { nome: string; id: string } | null;
}

interface CursoFormProps {
  curso?: Curso;
  cursoParaDuplicar?: Curso;
  onSuccess: () => void;
}

const CursoForm = ({ curso, cursoParaDuplicar, onSuccess }: CursoFormProps) => {
  const [titulo, setTitulo] = useState("");
  const [professor, setProfessor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [unidadeNome, setUnidadeNome] = useState("");
  const [salaId, setSalaId] = useState("");
  const [salaNome, setSalaNome] = useState("");

  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [selectedInsumos, setSelectedInsumos] = useState<{id: string, quantidade: number}[]>([]);
  const [insumosExpanded, setInsumosExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [insumosModalOpen, setInsumosModalOpen] = useState(false);
  const [tempSelectedInsumos, setTempSelectedInsumos] = useState<{id: string, quantidade: number}[]>([]);

  const queryClient = useQueryClient();

  // Buscar dados para os selects
  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data } = await supabase.from('unidades').select('*').order('nome');
      return data || [];
    }
  });

  const { data: materias } = useQuery({
    queryKey: ['materias'],
    queryFn: async () => {
      const { data } = await supabase.from('materias').select('*').order('nome');
      return data || [];
    }
  });

  const { data: insumos } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data } = await supabase.from('insumos').select('*').order('nome');
      return data || [];
    }
  });

  const { data: salas } = useQuery({
    queryKey: ['salas', unidadeId],
    queryFn: async () => {
      if (!unidadeId) return [];
      const { data } = await supabase
        .from('salas')
        .select('*')
        .eq('unidade_id', unidadeId)
        .order('nome');
      return data || [];
    },
    enabled: !!unidadeId
  });

  // Query adicional para buscar salas quando não há unidadeId (para edição ou duplicação)
  const { data: salasCurso } = useQuery({
    queryKey: ['salas-curso', curso?.salas?.id, cursoParaDuplicar?.salas?.id],
    queryFn: async () => {
      const salaId = curso?.salas?.id || cursoParaDuplicar?.salas?.id;
      if (!salaId) return [];
      const { data } = await supabase
        .from('salas')
        .select('*')
        .eq('id', salaId);
      return data || [];
    },
    enabled: !!(curso?.salas?.id || cursoParaDuplicar?.salas?.id)
  });

  // Loading sempre que o modal for aberto (edição, duplicação ou novo)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [curso, cursoParaDuplicar]);

  // Carregar dados do curso para edição ou duplicação
  useEffect(() => {
    if (curso) {
      setTitulo(curso.titulo || "");
      setProfessor(curso.professor || "");
      setInicio(curso.inicio || "");
      setFim(curso.fim || "");
      setPeriodo(curso.periodo || "");
      setUnidadeId(curso.unidades?.id || "");
      setUnidadeNome(curso.unidades?.nome || "");
      setSalaId(curso.salas?.id || "");
      setSalaNome(curso.salas?.nome || "");


      // Carregar matérias e insumos do curso
      const loadCursoData = async () => {
        try {
          const [materiasRes, insumosRes] = await Promise.all([
            supabase.from('curso_materias').select('materia_id').eq('curso_id', curso.id),
            supabase.from('curso_insumos').select('insumo_id, quantidade').eq('curso_id', curso.id)
          ]);

          if (materiasRes.data) {
            setSelectedMaterias(materiasRes.data.map(m => m.materia_id));
          }

          if (insumosRes.data) {
            setSelectedInsumos(insumosRes.data.map(i => ({
              id: i.insumo_id,
              quantidade: i.quantidade
            })));
          }
        } catch (error) {
          console.error('Erro ao carregar dados do curso:', error);
        }
      };

      loadCursoData();
    } else if (cursoParaDuplicar) {
      // Carregar dados do curso para duplicação
      setTitulo(`${cursoParaDuplicar.titulo}`);
      setProfessor(cursoParaDuplicar.professor || "");
      setInicio(cursoParaDuplicar.inicio || "");
      setFim(cursoParaDuplicar.fim || "");
      setPeriodo(cursoParaDuplicar.periodo || "");
      setUnidadeId(cursoParaDuplicar.unidades?.id || "");
      setUnidadeNome(cursoParaDuplicar.unidades?.nome || "");
      setSalaId(cursoParaDuplicar.salas?.id || "");
      setSalaNome(cursoParaDuplicar.salas?.nome || "");


      // Carregar matérias e insumos do curso para duplicação
      const loadCursoData = async () => {
        try {
          const [materiasRes, insumosRes] = await Promise.all([
            supabase.from('curso_materias').select('materia_id').eq('curso_id', cursoParaDuplicar.id),
            supabase.from('curso_insumos').select('insumo_id, quantidade').eq('curso_id', cursoParaDuplicar.id)
          ]);

          if (materiasRes.data) {
            setSelectedMaterias(materiasRes.data.map(m => m.materia_id));
          }

          if (insumosRes.data) {
            setSelectedInsumos(insumosRes.data.map(i => ({
              id: i.insumo_id,
              quantidade: i.quantidade
            })));
          }
        } catch (error) {
          console.error('Erro ao carregar dados do curso para duplicação:', error);
        }
      };

      loadCursoData();
    } else {
      // Limpar formulário para novo curso
      setTitulo("");
      setProfessor("");
      setInicio("");
      setFim("");
      setPeriodo("");
      setUnidadeId("");
      setUnidadeNome("");
      setSalaId("");
      setSalaNome("");

      setSelectedMaterias([]);
      setSelectedInsumos([]);
    }
  }, [curso, cursoParaDuplicar]);

  // Garantir que os nomes sejam atualizados quando as queries carregarem
  useEffect(() => {
    // Só atualizar se não houver uma seleção manual do usuário
    const cursoAtual = curso || cursoParaDuplicar;
    if (cursoAtual && unidades && unidades.length > 0 && cursoAtual.unidades?.id && !unidadeId) {
      const unidade = unidades.find(u => u.id === cursoAtual.unidades.id);
      if (unidade) {
        setUnidadeNome(unidade.nome);
        setUnidadeId(unidade.id);
      }
    }
  }, [curso, cursoParaDuplicar, unidades, unidadeId]);

  useEffect(() => {
    // Só atualizar se não houver uma seleção manual do usuário
    const cursoAtual = curso || cursoParaDuplicar;
    if (cursoAtual && !salaId) {
      // Tentar encontrar a sala nas salas da unidade
      if (salas && salas.length > 0 && cursoAtual.salas?.id) {
        const sala = salas.find(s => s.id === cursoAtual.salas.id);
        if (sala) {
          setSalaNome(sala.nome);
          setSalaId(sala.id);
          return;
        }
      }
      
      // Se não encontrou, tentar nas salas do curso
      if (salasCurso && salasCurso.length > 0 && cursoAtual.salas?.id) {
        const sala = salasCurso.find(s => s.id === cursoAtual.salas.id);
        if (sala) {
          setSalaNome(sala.nome);
          setSalaId(sala.id);
        }
      }
    }
  }, [curso, cursoParaDuplicar, salas, salasCurso, salaId]);

  // Atualizar unidadeNome quando unidadeId mudar (seleção manual do usuário)
  useEffect(() => {
    if (unidadeId && unidades && unidades.length > 0) {
      const unidade = unidades.find(u => u.id === unidadeId);
      if (unidade) {
        setUnidadeNome(unidade.nome);
        // Limpar sala quando mudar unidade
        setSalaId("");
        setSalaNome("");
      }
    }
  }, [unidadeId, unidades]);

  // Atualizar salaNome quando salaId mudar (seleção manual do usuário)
  useEffect(() => {
    if (salaId && salas && salas.length > 0) {
      const sala = salas.find(s => s.id === salaId);
      if (sala) {
        setSalaNome(sala.nome);
      }
    }
  }, [salaId, salas]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (curso) {
        // Atualizar curso
        const { error } = await supabase
          .from('cursos')
          .update(data)
          .eq('id', curso.id);
        if (error) throw error;
        return curso.id;
      } else {
        // Criar novo curso (novo ou duplicado)
        const { data: newCurso, error } = await supabase
          .from('cursos')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return newCurso.id;
      }
    },
    onSuccess: async (cursoId) => {
      // Gerenciar relacionamentos de matérias
      if (curso) {
        await supabase.from('curso_materias').delete().eq('curso_id', curso.id);
      }
      
      if (selectedMaterias.length > 0) {
        const materiasData = selectedMaterias.map(materiaId => ({
          curso_id: cursoId,
          materia_id: materiaId
        }));
        await supabase.from('curso_materias').insert(materiasData);
      }

      // Gerenciar relacionamentos de insumos
      if (curso) {
        await supabase.from('curso_insumos').delete().eq('curso_id', curso.id);
      }

      if (selectedInsumos.length > 0) {
        const insumosData = selectedInsumos.map(insumo => ({
          curso_id: cursoId,
          insumo_id: insumo.id,
          quantidade: insumo.quantidade
        }));
        await supabase.from('curso_insumos').insert(insumosData);
      }

      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['cursos-semana'] });
      
      if (curso) {
        toast.success("Curso atualizado com sucesso!");
      } else if (cursoParaDuplicar) {
        toast.success("Curso duplicado com sucesso!");
      } else {
        toast.success("Curso criado com sucesso!");
      }
      
      onSuccess();
    },
    onError: (error) => {
      console.error('Erro ao salvar curso:', error);
      const action = curso ? "atualizar" : cursoParaDuplicar ? "duplicar" : "criar";
      toast.error(`Erro ao ${action} curso: ` + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      titulo,
      professor,
      inicio,
      fim,
      periodo,
      unidade_id: unidadeId,
      sala_id: salaId || null
    };

    mutation.mutate(data);
  };

  const handleMateriaToggle = (materiaId: string) => {
    setSelectedMaterias(prev => 
      prev.includes(materiaId) 
        ? prev.filter(id => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const handleInsumoToggle = (insumoId: string) => {
    const isSelected = selectedInsumos.find(i => i.id === insumoId);
    if (isSelected) {
      // Remover insumo
      setSelectedInsumos(prev => prev.filter(i => i.id !== insumoId));
    } else {
      // Adicionar insumo
      setSelectedInsumos(prev => [{ id: insumoId, quantidade: 1 }, ...prev]);
      setInsumosExpanded(true); // Expandir automaticamente quando adicionar um insumo
    }
  };

  const handleOpenInsumosModal = () => {
    setTempSelectedInsumos([...selectedInsumos]);
    setInsumosModalOpen(true);
  };

  const handleCloseInsumosModal = () => {
    setInsumosModalOpen(false);
    setTempSelectedInsumos([]);
  };

  const handleTempInsumoToggle = (insumoId: string) => {
    const isSelected = tempSelectedInsumos.find(i => i.id === insumoId);
    if (isSelected) {
      // Remover insumo temporário
      setTempSelectedInsumos(prev => prev.filter(i => i.id !== insumoId));
    } else {
      // Adicionar insumo temporário
      setTempSelectedInsumos(prev => [{ id: insumoId, quantidade: 1 }, ...prev]);
    }
  };

  const handleConfirmInsumos = () => {
    setSelectedInsumos(tempSelectedInsumos);
    setInsumosModalOpen(false);
    setTempSelectedInsumos([]);
  };

  const handleQuantidadeChange = (insumoId: string, quantidade: number) => {
    setSelectedInsumos(prev =>
      prev.map(i => i.id === insumoId ? { ...i, quantidade } : i)
    );
  };

  // Validação dos campos obrigatórios
  const isFormValid = useMemo(() => {
    // Validação básica dos campos obrigatórios
    const basicValidation = (
      titulo.trim() !== "" &&
      professor.trim() !== "" &&
      inicio !== "" &&
      fim !== "" &&
      periodo !== "" &&

      unidadeId !== "" &&
      salaId !== "" &&
      selectedMaterias.length > 0
    );

    // Validação adicional das datas
    if (inicio && fim) {
      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);
      if (dataFim <= dataInicio) {
        return false;
      }
    }

    return basicValidation;
  }, [
    titulo,
    professor,
    inicio,
    fim,
    periodo,

    unidadeId,
    salaId,
    selectedMaterias
  ]);

  // Determinar o modo do formulário
  const isEditMode = !!curso;
  const isDuplicateMode = !!cursoParaDuplicar;
  const isNewMode = !curso && !cursoParaDuplicar;

  return (
    <form id="curso-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Indicador de validação */}
      {!isFormValid && !isLoading && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          <p className="font-medium mb-2">
            ⚠️ Campos obrigatórios não preenchidos ou inválidos
            {isDuplicateMode && " para duplicação"}:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {!titulo.trim() && <li>Título do curso</li>}
            {!professor.trim() && <li>Professor</li>}
            {!inicio && <li>Data de início</li>}
            {!fim && <li>Data de fim</li>}
            {inicio && fim && new Date(fim) <= new Date(inicio) && (
              <li>Data de fim deve ser posterior à data de início</li>
            )}
            {!unidadeId && <li>Unidade</li>}
            {!salaId && <li>Sala</li>}
            {!periodo && <li>Período</li>}
            {selectedMaterias.length === 0 && <li>Pelo menos uma matéria</li>}
          </ul>
        </div>
      )}

      {/* Loading de 2 segundos */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <img src={logoCmu} alt="Logo CMU" className="h-32 w-auto animate-pulse mx-auto" />
            <p className="text-lg font-medium text-muted-foreground">
              {isDuplicateMode ? "Carregando dados para duplicação..." : "Carregando formulário..."}
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo do formulário - só exibe quando não estiver loading */}
      {!isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titulo" className={!titulo.trim() ? "text-red-600" : ""}>
            Título do Curso *
          </Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className={!titulo.trim() ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="professor" className={!professor.trim() ? "text-red-600" : ""}>
            Professor *
          </Label>
          <Input
            id="professor"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            required
            className={!professor.trim() ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inicio" className={!inicio ? "text-red-600" : ""}>
            Data de Início *
          </Label>
          <Input
            id="inicio"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            required
            className={!inicio ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fim" className={!fim || (inicio && fim && new Date(fim) <= new Date(inicio)) ? "text-red-600" : ""}>
            Data de Fim *
          </Label>
          <Input
            id="fim"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            required
            className={!fim || (inicio && fim && new Date(fim) <= new Date(inicio)) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidade" className={!unidadeId ? "text-red-600" : ""}>
            Unidade *
          </Label>
          <Select value={unidadeId} onValueChange={setUnidadeId} required>
            <SelectTrigger className={!unidadeId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidades?.map(unidade => (
                <SelectItem key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sala" className={!salaId ? "text-red-600" : ""}>
            Sala *
          </Label>
          <Select value={salaId} onValueChange={setSalaId} required disabled={!unidadeId}>
            <SelectTrigger className={!salaId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
              <SelectValue placeholder={!unidadeId ? "Selecione a unidade para carregar as salas" : "Selecione a sala"} />
            </SelectTrigger>
            <SelectContent>
              {!unidadeId ? (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  Selecione uma unidade primeiro
                </div>
              ) : (
                salas?.map(sala => (
                  <SelectItem key={sala.id} value={sala.id}>
                    {sala.nome} (Cap. {sala.capacidade})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodo" className={!periodo ? "text-red-600" : ""}>
            Período *
          </Label>
          <Select value={periodo} onValueChange={setPeriodo} required>
            <SelectTrigger className={!periodo ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manha">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Manhã
                </span>
              </SelectItem>
              <SelectItem value="tarde">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Tarde
                </span>
              </SelectItem>
              <SelectItem value="noite">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Noite
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Matérias */}
      <div className="space-y-4">
        <Label className={selectedMaterias.length === 0 ? "text-red-600" : ""}>
          Matérias do Curso *
        </Label>
        <div className="grid gap-2 md:grid-cols-3">
          {materias?.map(materia => {
            const isSelected = selectedMaterias.includes(materia.id);
            return (
              <div
                key={materia.id}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleMateriaToggle(materia.id)}
              >
                <span className="text-sm">{materia.nome}</span>
              </div>
            );
          })}
        </div>
        
        {selectedMaterias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMaterias.map(materiaId => {
              const materia = materias?.find(m => m.id === materiaId);
              return (
                <Badge key={materiaId} variant="secondary">
                  {materia?.nome}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleMateriaToggle(materiaId)}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Insumos */}
      <Collapsible open={insumosExpanded} onOpenChange={setInsumosExpanded} className="space-y-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="secondary"
            className="flex items-center justify-between w-full p-3 h-auto font-medium text-left"
            type="button"
          >
            <Label className="cursor-pointer">
              Insumos do Curso {selectedInsumos.length > 0 && `(${selectedInsumos.length})`}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-normal">
                {insumosExpanded ? "Clique para fechar" : "Clique para ver"}
              </span>
              {insumosExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              type="button"
              variant="default"
              onClick={handleOpenInsumosModal}
              className="w-fit"
            >
              Adicionar Insumos
            </Button>
          </div>
          
          {selectedInsumos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInsumos.map(item => {
                const insumo = insumos?.find(i => i.id === item.id);
                return (
                  <Badge key={item.id} variant="secondary">
                    {insumo?.nome} ({item.quantidade})
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => handleInsumoToggle(item.id)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}

          {selectedInsumos.length > 0 && (
            <div className="space-y-2">
              {selectedInsumos.map(item => {
                const insumo = insumos?.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{insumo?.nome}</span>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleQuantidadeChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInsumoToggle(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

        </>
      )}

      {/* Modal de Seleção de Insumos */}
      <Dialog open={insumosModalOpen} onOpenChange={setInsumosModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Selecionar Insumos</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid gap-2 md:grid-cols-3">
              {insumos?.map(insumo => {
                const isSelected = tempSelectedInsumos.find(i => i.id === insumo.id);
                return (
                  <div
                    key={insumo.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTempInsumoToggle(insumo.id)}
                  >
                    <span className="text-sm">{insumo.nome}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 justify-end flex-shrink-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseInsumosModal}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmInsumos}
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default CursoForm;
