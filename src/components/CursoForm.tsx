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
import { X, ChevronDown, ChevronRight } from "lucide-react";

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

interface CursoFormProps {
  curso?: Curso;
  onSuccess: () => void;
}

const CursoForm = ({ curso, onSuccess }: CursoFormProps) => {
  const [titulo, setTitulo] = useState("");
  const [professor, setProfessor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [unidadeNome, setUnidadeNome] = useState("");
  const [salaId, setSalaId] = useState("");
  const [salaNome, setSalaNome] = useState("");
  const [status, setStatus] = useState("ativo");
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [selectedInsumos, setSelectedInsumos] = useState<{id: string, quantidade: number}[]>([]);
  const [insumosExpanded, setInsumosExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Query adicional para buscar salas quando não há unidadeId (para edição)
  const { data: salasCurso } = useQuery({
    queryKey: ['salas-curso', curso?.salas?.id],
    queryFn: async () => {
      if (!curso?.salas?.id) return [];
      const { data } = await supabase
        .from('salas')
        .select('*')
        .eq('id', curso.salas.id);
      return data || [];
    },
    enabled: !!curso?.salas?.id
  });

  // Loading de 1 segundos sempre que o modal for aberto
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [curso]);

  // Carregar dados do curso para edição
  useEffect(() => {
    if (curso) {
      console.log('curso is edição', curso);
      console.log('curso.unidades:', curso.unidades);
      console.log('curso.salas:', curso.salas);
      setTitulo(curso.titulo || "");
      setProfessor(curso.professor || "");
      setInicio(curso.inicio || "");
      setFim(curso.fim || "");
      setPeriodo(curso.periodo || "");
      setUnidadeId(curso.unidades?.id || "");
      setUnidadeNome(curso.unidades?.nome || "");
      setSalaId(curso.salas?.id || "");
      setSalaNome(curso.salas?.nome || "");
      setStatus(curso.status || "ativo");

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
    } else {
      console.log('curso is novo');
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
      setStatus("ativo");
      setSelectedMaterias([]);
      setSelectedInsumos([]);
    }
  }, [curso]);

  // Garantir que os nomes sejam atualizados quando as queries carregarem
  useEffect(() => {
    console.log('useEffect unidades - curso:', curso?.unidades?.id);
    console.log('useEffect unidades - unidades:', unidades);
    console.log('useEffect unidades - unidadeId atual:', unidadeId);
    
    // Só atualizar se não houver uma seleção manual do usuário
    if (curso && unidades && unidades.length > 0 && curso.unidades?.id && !unidadeId) {
      const unidade = unidades.find(u => u.id === curso.unidades.id);
      if (unidade) {
        console.log('Encontrou unidade:', unidade.nome);
        setUnidadeNome(unidade.nome);
        setUnidadeId(unidade.id);
      }
    }
  }, [curso, unidades, unidadeId]);

  useEffect(() => {
    console.log('useEffect salas - curso:', curso?.salas?.id);
    console.log('useEffect salas - salas:', salas);
    console.log('useEffect salas - salasCurso:', salasCurso);
    console.log('useEffect salas - salaId atual:', salaId);
    
    // Só atualizar se não houver uma seleção manual do usuário
    if (curso && !salaId) {
      // Tentar encontrar a sala nas salas da unidade
      if (salas && salas.length > 0 && curso.salas?.id) {
        const sala = salas.find(s => s.id === curso.salas.id);
        if (sala) {
          console.log('Encontrou sala nas salas da unidade:', sala.nome);
          setSalaNome(sala.nome);
          setSalaId(sala.id);
          return;
        }
      }
      
      // Se não encontrou, tentar nas salas do curso
      if (salasCurso && salasCurso.length > 0 && curso.salas?.id) {
        const sala = salasCurso.find(s => s.id === curso.salas.id);
        if (sala) {
          console.log('Encontrou sala nas salas do curso:', sala.nome);
          setSalaNome(sala.nome);
          setSalaId(sala.id);
        }
      }
    }
  }, [curso, salas, salasCurso, salaId]);

  // Atualizar unidadeNome quando unidadeId mudar (seleção manual do usuário)
  useEffect(() => {
    if (unidadeId && unidades && unidades.length > 0) {
      const unidade = unidades.find(u => u.id === unidadeId);
      if (unidade) {
        console.log('Usuário selecionou unidade:', unidade.nome);
        setUnidadeNome(unidade.nome);
      }
    }
  }, [unidadeId, unidades]);

  // Atualizar salaNome quando salaId mudar (seleção manual do usuário)
  useEffect(() => {
    if (salaId && salas && salas.length > 0) {
      const sala = salas.find(s => s.id === salaId);
      if (sala) {
        console.log('Usuário selecionou sala:', sala.nome);
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
        // Criar novo curso
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
      toast.success(curso ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      console.error('Erro ao salvar curso:', error);
      toast.error("Erro ao salvar curso: " + error.message);
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
      sala_id: salaId || null,
      status
    };

    console.log('Enviando dados do curso:', data);
    mutation.mutate(data);
  };

  const handleMateriaToggle = (materiaId: string) => {
    setSelectedMaterias(prev => 
      prev.includes(materiaId) 
        ? prev.filter(id => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const handleInsumoAdd = (insumoId: string) => {
    if (!selectedInsumos.find(i => i.id === insumoId)) {
      setSelectedInsumos(prev => [{ id: insumoId, quantidade: 1 }, ...prev]);
      setInsumosExpanded(true); // Expandir automaticamente quando adicionar um insumo
    }
  };

  const handleInsumoRemove = (insumoId: string) => {
    setSelectedInsumos(prev => prev.filter(i => i.id !== insumoId));
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
      status !== "" &&
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
    status,
    unidadeId,
    salaId,
    selectedMaterias
  ]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Indicador de validação */}
      {!isFormValid && !isLoading && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          <p className="font-medium mb-2">⚠️ Campos obrigatórios não preenchidos ou inválidos:</p>
          <ul className="list-disc list-inside space-y-1">
            {!titulo.trim() && <li>Título do curso</li>}
            {!professor.trim() && <li>Professor</li>}
            {!inicio && <li>Data de início</li>}
            {!fim && <li>Data de fim</li>}
            {inicio && fim && new Date(fim) <= new Date(inicio) && (
              <li>Data de fim deve ser posterior à data de início</li>
            )}
            {!periodo && <li>Período</li>}
            {!status && <li>Status</li>}
            {!unidadeId && <li>Unidade</li>}
            {!salaId && <li>Sala</li>}
            {selectedMaterias.length === 0 && <li>Pelo menos uma matéria</li>}
          </ul>
        </div>
      )}

      {/* Loading de 2 segundos */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <img src="/Logo%20CMU.png" alt="Logo CMU" className="h-32 w-auto animate-pulse mx-auto" />
            <p className="text-lg font-medium text-muted-foreground">Carregando formulário...</p>
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
          <Label htmlFor="periodo" className={!periodo ? "text-red-600" : ""}>
            Período *
          </Label>
          <Select value={periodo} onValueChange={setPeriodo} required>
            <SelectTrigger className={!periodo ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manha">Manhã</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
              <SelectItem value="noite">Noite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className={!status ? "text-red-600" : ""}>
            Status *
          </Label>
          <Select value={status} onValueChange={setStatus} required>
            <SelectTrigger className={!status ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
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
          <Select value={salaId} onValueChange={setSalaId} required>
            <SelectTrigger className={!salaId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
              <SelectValue placeholder="Selecione a sala" />
            </SelectTrigger>
            <SelectContent>
                              {salas?.map(sala => (
                  <SelectItem key={sala.id} value={sala.id}>
                    {sala.nome} (Cap. {sala.capacidade})
                  </SelectItem>
                ))}
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
          <Select onValueChange={handleInsumoAdd}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar insumo" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const insumosDisponiveis = insumos?.filter(insumo => !selectedInsumos.find(i => i.id === insumo.id)) || [];
                
                if (insumosDisponiveis.length === 0) {
                  return (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      Todos os insumos foram adicionados
                    </div>
                  );
                }
                
                return insumosDisponiveis.map(insumo => (
                  <SelectItem key={insumo.id} value={insumo.id}>
                    {insumo.nome}
                  </SelectItem>
                ));
              })()}
            </SelectContent>
          </Select>

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
                      onClick={() => handleInsumoRemove(item.id)}
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

      <div className="flex gap-4">
        <Button type="submit" disabled={mutation.isPending || !isFormValid}>
          {mutation.isPending ? "Salvando..." : (curso ? "Atualizar" : "Criar")}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
      </div>
        </>
      )}
    </form>
  );
};

export default CursoForm;
