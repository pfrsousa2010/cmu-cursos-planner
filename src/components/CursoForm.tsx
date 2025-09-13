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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { X, ChevronDown, ChevronRight, Plus } from "lucide-react";
import logoCmu from "/logo-cmu.png";
import { Curso } from "@/types/calendario";

interface CursoFormProps {
  curso?: Curso;
  cursoParaDuplicar?: Curso;
  onSuccess: () => void;
  cursosExistentes?: Curso[];
}

const CursoForm = ({ curso, cursoParaDuplicar, onSuccess, cursosExistentes = [] }: CursoFormProps) => {
  const [titulo, setTitulo] = useState("");
  const [professor, setProfessor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [unidadeNome, setUnidadeNome] = useState("");
  const [salaId, setSalaId] = useState("");
  const [salaNome, setSalaNome] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [qtdAlunosIniciaram, setQtdAlunosIniciaram] = useState("");
  const [qtdAlunosConcluiram, setQtdAlunosConcluiram] = useState("");
  const [vagas, setVagas] = useState("");
  const [diasSemana, setDiasSemana] = useState<string[]>([]);

  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [selectedInsumos, setSelectedInsumos] = useState<{id: string, quantidade: number}[]>([]);
  const [insumosExpanded, setInsumosExpanded] = useState(true);
  const [materiasExpanded, setMateriasExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [insumosModalOpen, setInsumosModalOpen] = useState(false);
  const [tempSelectedInsumos, setTempSelectedInsumos] = useState<{id: string, quantidade: number}[]>([]);
  const [insumosSearchTerm, setInsumosSearchTerm] = useState("");
  const [novaMateriaModalOpen, setNovaMateriaModalOpen] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState("");
  const [materiasModalOpen, setMateriasModalOpen] = useState(false);
  const [tempSelectedMaterias, setTempSelectedMaterias] = useState<string[]>([]);
  const [materiasSearchTerm, setMateriasSearchTerm] = useState("");
  const [novoInsumoModalOpen, setNovoInsumoModalOpen] = useState(false);
  const [novoInsumoNome, setNovoInsumoNome] = useState("");

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

  // Filtrar insumos baseado no termo de busca
  const filteredInsumos = useMemo(() => {
    if (!insumos || !insumosSearchTerm.trim()) {
      return insumos || [];
    }
    
    return insumos.filter(insumo => 
      insumo.nome.toLowerCase().includes(insumosSearchTerm.toLowerCase())
    );
  }, [insumos, insumosSearchTerm]);

  // Filtrar matérias baseado no termo de busca
  const filteredMaterias = useMemo(() => {
    if (!materias || !materiasSearchTerm.trim()) {
      return materias || [];
    }
    
    return materias.filter(materia => 
      materia.nome.toLowerCase().includes(materiasSearchTerm.toLowerCase())
    );
  }, [materias, materiasSearchTerm]);

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
    if (curso && curso.id) {
      setTitulo(curso.titulo || "");
      setProfessor(curso.professor || "");
      setInicio(curso.inicio || "");
      setFim(curso.fim || "");
      setPeriodo(curso.periodo || "");
      setUnidadeId(curso.unidades?.id || "");
      setUnidadeNome(curso.unidades?.nome || "");
      setSalaId(curso.salas?.id || "");
      setSalaNome(curso.salas?.nome || "");
      setCargaHoraria(curso.carga_horaria?.toString() || "");
      setQtdAlunosIniciaram(curso.qtd_alunos_iniciaram?.toString() || "");
      setQtdAlunosConcluiram(curso.qtd_alunos_concluiram?.toString() || "");
      setVagas(curso.vagas?.toString() || "");
      setDiasSemana(curso.dia_semana || []);

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
          toast.error("Erro ao carregar dados do curso");
        }
      };

      loadCursoData();
    } else if (cursoParaDuplicar && cursoParaDuplicar.id) {
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
      setCargaHoraria(cursoParaDuplicar.carga_horaria?.toString() || "");
      setQtdAlunosIniciaram(cursoParaDuplicar.qtd_alunos_iniciaram?.toString() || "");
      setQtdAlunosConcluiram(cursoParaDuplicar.qtd_alunos_concluiram?.toString() || "");
      setVagas(cursoParaDuplicar.vagas?.toString() || "");
      setDiasSemana(cursoParaDuplicar.dia_semana || []);


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
          toast.error("Erro ao carregar dados do curso para duplicação");
        }
      };

      loadCursoData();
    } else if (cursoParaDuplicar && !cursoParaDuplicar.id) {
      // Caso especial: cursoParaDuplicar com ID vazio (do calendário)
      // Apenas definir os dados básicos sem carregar do banco
      setTitulo(cursoParaDuplicar.titulo || "");
      setProfessor(cursoParaDuplicar.professor || "");
      setInicio(cursoParaDuplicar.inicio || "");
      setFim(cursoParaDuplicar.fim || "");
      setPeriodo(cursoParaDuplicar.periodo || "");
      setUnidadeId(cursoParaDuplicar.unidades?.id || "");
      setUnidadeNome(cursoParaDuplicar.unidades?.nome || "");
      setSalaId(cursoParaDuplicar.salas?.id || "");
      setSalaNome(cursoParaDuplicar.salas?.nome || "");
      setCargaHoraria(cursoParaDuplicar.carga_horaria?.toString() || "");
      setQtdAlunosIniciaram(cursoParaDuplicar.qtd_alunos_iniciaram?.toString() || "");
      setQtdAlunosConcluiram(cursoParaDuplicar.qtd_alunos_concluiram?.toString() || "");
      setVagas(cursoParaDuplicar.vagas?.toString() || "");
      setDiasSemana(cursoParaDuplicar.dia_semana || []);
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
      setCargaHoraria("");
      setQtdAlunosIniciaram("");
      setQtdAlunosConcluiram("");
      setVagas("");
      setDiasSemana([]);

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
      const action = curso ? "atualizar" : cursoParaDuplicar ? "duplicar" : "criar";
      toast.error(`Erro ao ${action} curso: ${error.message}`);
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
      carga_horaria: cargaHoraria ? parseInt(cargaHoraria) : null,
      qtd_alunos_iniciaram: qtdAlunosIniciaram ? parseInt(qtdAlunosIniciaram) : null,
      qtd_alunos_concluiram: qtdAlunosConcluiram ? parseInt(qtdAlunosConcluiram) : null,
      vagas: vagas ? parseInt(vagas) : null,
      dia_semana: diasSemana
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
    setInsumosSearchTerm("");
    setInsumosModalOpen(true);
  };

  const handleOpenMateriasModal = () => {
    setTempSelectedMaterias([...selectedMaterias]);
    setMateriasSearchTerm("");
    setMateriasModalOpen(true);
  };

  const handleCloseInsumosModal = () => {
    setInsumosModalOpen(false);
    setTempSelectedInsumos([]);
    setInsumosSearchTerm("");
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
    setInsumosSearchTerm("");
  };

  const handleConfirmMaterias = () => {
    setSelectedMaterias(tempSelectedMaterias);
    setMateriasModalOpen(false);
    setTempSelectedMaterias([]);
    setMateriasSearchTerm("");
  };

  const handleMateriaToggleInModal = (materiaId: string) => {
    setTempSelectedMaterias(prev => 
      prev.includes(materiaId) 
        ? prev.filter(id => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const handleCreateMateria = async () => {
    if (!novaMateriaNome.trim()) {
      toast.error("Nome da matéria é obrigatório");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('materias')
        .insert([{ nome: novaMateriaNome.trim() }])
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar matéria");
        return;
      }

      toast.success("Matéria criada com sucesso!");
      setNovaMateriaNome("");
      setNovaMateriaModalOpen(false);
      
      // Recarregar a lista de matérias
      queryClient.invalidateQueries({ queryKey: ['materias'] });
      
      // Selecionar automaticamente a nova matéria na seleção temporária
      setTempSelectedMaterias(prev => [...prev, data.id]);
    } catch (error) {
      toast.error("Erro ao criar matéria");
    }
  };

  const handleCreateInsumo = async () => {
    if (!novoInsumoNome.trim()) {
      toast.error("Nome do insumo é obrigatório");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('insumos')
        .insert([{ nome: novoInsumoNome.trim() }])
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar insumo");
        return;
      }

      toast.success("Insumo criado com sucesso!");
      setNovoInsumoNome("");
      setNovoInsumoModalOpen(false);
      
      // Recarregar a lista de insumos
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      
      // Selecionar automaticamente o novo insumo na seleção temporária
      setTempSelectedInsumos(prev => [{ id: data.id, quantidade: 1 }, ...prev]);
    } catch (error) {
      toast.error("Erro ao criar insumo");
    }
  };

  const handleQuantidadeChange = (insumoId: string, quantidade: number) => {
    setSelectedInsumos(prev =>
      prev.map(i => i.id === insumoId ? { ...i, quantidade } : i)
    );
  };

  const handleDiaSemanaToggle = (dia: string) => {
    setDiasSemana(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const handleToggleAllDays = () => {
    const allDays = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const allSelected = allDays.every(dia => diasSemana.includes(dia));
    
    if (allSelected) {
      // Se todos estão selecionados, desmarca todos
      setDiasSemana([]);
    } else {
      // Se nem todos estão selecionados, marca todos
      setDiasSemana(allDays);
    }
  };

  // Função para obter a capacidade da sala selecionada
  const getSalaCapacidade = () => {
    if (!salaId) return null;
    
    // Procurar na lista de salas da unidade
    const sala = salas?.find(s => s.id === salaId);
    if (sala) return sala.capacidade;
    
    // Procurar nas salas do curso (para edição/duplicação)
    const salaCurso = salasCurso?.find(s => s.id === salaId);
    if (salaCurso) return salaCurso.capacidade;
    
    return null;
  };

  // Função para detectar conflitos entre cursos
  const detectarConflitos = useMemo(() => {
    if (!inicio || !fim || !salaId || !periodo || diasSemana.length === 0) {
      return [];
    }

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    
    // Mapeia os dias da semana para números
    const dayOfWeekMap = {
      'segunda': 1,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5
    };

    const conflitos = cursosExistentes.filter(cursoExistente => {
      // Ignora o próprio curso se estivermos editando
      if (curso && cursoExistente.id === curso.id) {
        return false;
      }

      // Verifica se é na mesma sala e período
      if (cursoExistente.sala_id !== salaId || cursoExistente.periodo !== periodo) {
        return false;
      }

      // Verifica se o curso existente está ativo (não finalizado)
      if (cursoExistente.status === 'finalizado') {
        return false;
      }

      const cursoInicio = new Date(cursoExistente.inicio);
      const cursoFim = new Date(cursoExistente.fim);

      // Verifica se há sobreposição de datas
      const temSobreposicaoDatas = !(dataFim < cursoInicio || dataInicio > cursoFim);
      
      if (!temSobreposicaoDatas) {
        return false;
      }

      // Verifica se há sobreposição de dias da semana
      const diasCursoExistente = cursoExistente.dia_semana.map(dia => dayOfWeekMap[dia]);
      const diasNovoCurso = diasSemana.map(dia => dayOfWeekMap[dia]);
      
      const temSobreposicaoDias = diasCursoExistente.some(dia => diasNovoCurso.includes(dia));
      
      return temSobreposicaoDias;
    });

    return conflitos;
  }, [inicio, fim, salaId, periodo, diasSemana, cursosExistentes, curso]);

  // Validação dos campos obrigatórios
  const isFormValid = useMemo(() => {
    // Validação básica dos campos obrigatórios
    const basicValidation = (
      titulo.trim() !== "" &&
      professor.trim() !== "" &&
      inicio !== "" &&
      fim !== "" &&
      periodo !== "" &&
      diasSemana.length > 0 &&
      unidadeId !== "" &&
      salaId !== "" &&
      selectedMaterias.length > 0
    );

    // Validação adicional das datas
    if (inicio && fim) {
      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);
      if (dataFim < dataInicio) {
        return false;
      }
    }

    // Validação de conflitos
    if (detectarConflitos.length > 0) {
      return false;
    }

    return basicValidation;
  }, [
    titulo,
    professor,
    inicio,
    fim,
    periodo,
    diasSemana,
    unidadeId,
    salaId,
    selectedMaterias,
    detectarConflitos
  ]);

  // Determinar o modo do formulário
  const isEditMode = !!curso;
  const isDuplicateMode = !!cursoParaDuplicar;
  const isNewMode = !curso && !cursoParaDuplicar;

  return (
    <form id="curso-form" onSubmit={handleSubmit} className="space-y-6 pl-2 pr-4">
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
            {inicio && fim && new Date(fim) < new Date(inicio) && (
              <li>Data de fim deve ser posterior ou igual à data de início</li>
            )}
            {!unidadeId && <li>Unidade</li>}
            {!salaId && <li>Sala</li>}
            {!periodo && <li>Período</li>}
            {diasSemana.length === 0 && <li>Pelo menos um dia da semana</li>}
            {selectedMaterias.length === 0 && <li>Pelo menos uma matéria</li>}
            {detectarConflitos.length > 0 && (
              <li className="text-red-600 font-medium">
                Conflito com cursos existentes:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  {detectarConflitos.map((cursoConflitante) => (
                    <li key={cursoConflitante.id} className="text-sm">
                      <span className="font-medium">{cursoConflitante.titulo}</span> - {cursoConflitante.professor}
                      <br />
                      <span className="text-xs text-gray-600">
                        {new Date(cursoConflitante.inicio).toLocaleDateString('pt-BR')} a {new Date(cursoConflitante.fim).toLocaleDateString('pt-BR')} | 
                        {cursoConflitante.periodo === 'manha' ? ' Manhã' : cursoConflitante.periodo === 'tarde' ? ' Tarde' : ' Noite'} | 
                        {cursoConflitante.dia_semana.map(dia => 
                          dia === 'segunda' ? ' Seg' :
                          dia === 'terca' ? ' Ter' :
                          dia === 'quarta' ? ' Qua' :
                          dia === 'quinta' ? ' Qui' : ' Sex'
                        ).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )}
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
          <Label htmlFor="fim" className={!fim || (inicio && fim && new Date(fim) < new Date(inicio)) ? "text-red-600" : ""}>
            Data de Fim *
          </Label>
          <Input
            id="fim"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            required
            className={!fim || (inicio && fim && new Date(fim) < new Date(inicio)) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={diasSemana.length === 0 ? "text-red-600" : ""}>
              Dias da Semana *
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="toggle-all-days"
                checked={['segunda', 'terca', 'quarta', 'quinta', 'sexta'].every(dia => diasSemana.includes(dia))}
                onCheckedChange={handleToggleAllDays}
              />
              <Label htmlFor="toggle-all-days" className="text-sm text-muted-foreground cursor-pointer">
                Todos os dias
              </Label>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {[
              { value: 'segunda', label: 'Segunda' },
              { value: 'terca', label: 'Terça' },
              { value: 'quarta', label: 'Quarta' },
              { value: 'quinta', label: 'Quinta' },
              { value: 'sexta', label: 'Sexta' }
            ].map(dia => {
              const isSelected = diasSemana.includes(dia.value);
              return (
                <div
                  key={dia.value}
                  className={`p-2 border rounded cursor-pointer transition-colors text-center ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleDiaSemanaToggle(dia.value)}
                >
                  <span className="text-xs">{dia.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carga Horária */}
        <div className="space-y-2">
          <Label htmlFor="carga_horaria">
            Carga Horária (horas)
          </Label>
          <Input
            id="carga_horaria"
            type="number"
            min="0"
            value={cargaHoraria}
            onChange={(e) => setCargaHoraria(e.target.value)}
            placeholder="Ex: 40"
          />
        </div>

        {/* Vagas */}
        <div className="space-y-2">
          <Label htmlFor="vagas" className="text-blue-600 font-medium">
            Total de Vagas {getSalaCapacidade() && `(Máx: ${getSalaCapacidade()})`}
          </Label>
          <div className="space-y-2">
            <Slider
              value={[parseInt(vagas) || 0]}
              onValueChange={(value) => setVagas(value[0].toString())}
              max={getSalaCapacidade() || 50}
              min={0}
              step={1}
              className="w-full [&_.slider-track]:bg-blue-200 [&_.slider-range]:bg-blue-500 [&_.slider-thumb]:bg-blue-600"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-blue-600">{vagas || 0}</span>
              <span>{getSalaCapacidade() || 50}</span>
            </div>
          </div>
        </div>

        {/* Alunos que Iniciaram */}
        <div className="space-y-2">
          <Label htmlFor="qtd_alunos_iniciaram" className="text-green-600 font-medium">
            Alunos que Iniciaram {vagas && `(Máx: ${vagas})`}
          </Label>
          <div className="space-y-2">
            <Slider
              value={[parseInt(qtdAlunosIniciaram) || 0]}
              onValueChange={(value) => setQtdAlunosIniciaram(value[0].toString())}
              max={parseInt(vagas) || 50}
              min={0}
              step={1}
              className="w-full [&_.slider-track]:bg-green-200 [&_.slider-range]:bg-green-500 [&_.slider-thumb]:bg-green-600"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-green-600">{qtdAlunosIniciaram || 0}</span>
              <span>{vagas || 50}</span>
            </div>
          </div>
        </div>

        {/* Alunos que Concluíram */}
        <div className="space-y-2">
          <Label htmlFor="qtd_alunos_concluiram" className="text-red-500 font-medium">
            Alunos que Concluíram {qtdAlunosIniciaram && `(Máx: ${qtdAlunosIniciaram})`}
          </Label>
          <div className="space-y-2">
            <Slider
              value={[parseInt(qtdAlunosConcluiram) || 0]}
              onValueChange={(value) => setQtdAlunosConcluiram(value[0].toString())}
              max={parseInt(qtdAlunosIniciaram) || 50}
              min={0}
              step={1}
              className="w-full [&_.slider-track]:bg-red-200 [&_.slider-range]:bg-red-400 [&_.slider-thumb]:bg-red-500"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-red-500">{qtdAlunosConcluiram || 0}</span>
              <span>{qtdAlunosIniciaram || 50}</span>
            </div>
          </div>
        </div>        
      </div>

      {/* Matérias */}
      <Collapsible open={materiasExpanded} onOpenChange={setMateriasExpanded} className="space-y-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="secondary"
            className="flex items-center justify-between w-full p-3 h-auto font-medium text-left"
            type="button"
          >
            <Label className={`cursor-pointer ${selectedMaterias.length === 0 ? "text-red-600" : ""}`}>
              Matérias do Curso * {selectedMaterias.length > 0 && `(${selectedMaterias.length})`}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-normal">
                {materiasExpanded ? "Recolher" : "Expandir"}
              </span>
              {materiasExpanded ? (
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
              onClick={handleOpenMateriasModal}
              className="w-fit"
            >
              Selecionar Matérias
            </Button>
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
        </CollapsibleContent>
      </Collapsible>

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
                {insumosExpanded ? "Recolher" : "Expandir"}
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
              Selecionar Insumos
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
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Selecionar Insumos</DialogTitle>
          </DialogHeader>
          
          {/* Barra de busca e botão de novo insumo */}
          <div className="flex-shrink-0 pb-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buscar insumos por nome..."
                value={insumosSearchTerm}
                onChange={(e) => setInsumosSearchTerm(e.target.value)}
                className="pr-8"
              />
              {insumosSearchTerm && (
                <button
                  type="button"
                  onClick={() => setInsumosSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNovoInsumoModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Novo Insumo</span>
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredInsumos && filteredInsumos.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-3">
                {filteredInsumos.map(insumo => {
                  const isSelected = tempSelectedInsumos.find(i => i.id === insumo.id);
                  return (
                    <div
                      key={insumo.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleTempInsumoToggle(insumo.id)}
                    >
                      <span className="text-sm">{insumo.nome}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <span>
                  {insumosSearchTerm.trim() 
                    ? `Nenhum insumo encontrado para "${insumosSearchTerm}"`
                    : "Nenhum insumo disponível"
                  }
                </span>
              </div>
            )}
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
              Confirmar ({tempSelectedInsumos.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção de Matérias */}
      <Dialog open={materiasModalOpen} onOpenChange={setMateriasModalOpen}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Selecionar Matérias</DialogTitle>
            <DialogDescription>
              Escolha as matérias que serão incluídas neste curso
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e botão de nova matéria */}
          <div className="flex-shrink-0 pb-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar matérias..."
                value={materiasSearchTerm}
                onChange={(e) => setMateriasSearchTerm(e.target.value)}
                className="pr-8"
              />
              {materiasSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMateriasSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNovaMateriaModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Nova Matéria</span>
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredMaterias && filteredMaterias.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-3">
                {filteredMaterias.map(materia => {
                  const isSelected = tempSelectedMaterias.includes(materia.id);
                  return (
                    <div
                      key={materia.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleMateriaToggleInModal(materia.id)}
                    >
                      <span className="text-sm">{materia.nome}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {materiasSearchTerm ? "Nenhuma matéria encontrada" : "Nenhuma matéria disponível"}
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 pt-4 border-t flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMateriasModalOpen(false);
                setTempSelectedMaterias([]);
                setMateriasSearchTerm("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMaterias}
            >
              Confirmar ({tempSelectedMaterias.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Matéria */}
      <Dialog open={novaMateriaModalOpen} onOpenChange={setNovaMateriaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Matéria</DialogTitle>
            <DialogDescription>
              Adicione uma nova matéria ao sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nova-materia-nome">Nome da Matéria</Label>
              <Input
                id="nova-materia-nome"
                value={novaMateriaNome}
                onChange={(e) => setNovaMateriaNome(e.target.value)}
                placeholder="Ex: Português, Matemática, Informática..."
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setNovaMateriaModalOpen(false);
                  setNovaMateriaNome("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateMateria}>
                Criar Matéria
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Insumo */}
      <Dialog open={novoInsumoModalOpen} onOpenChange={setNovoInsumoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Insumo</DialogTitle>
            <DialogDescription>
              Adicione um novo insumo ao sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="novo-insumo-nome">Nome do Insumo</Label>
              <Input
                id="novo-insumo-nome"
                value={novoInsumoNome}
                onChange={(e) => setNovoInsumoNome(e.target.value)}
                placeholder="Ex: Papel A4, Canetas, Tesouras..."
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setNovoInsumoModalOpen(false);
                  setNovoInsumoNome("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateInsumo}>
                Criar Insumo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default CursoForm;
