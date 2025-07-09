import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CursoFormProps {
  curso?: any;
  onSuccess: () => void;
}

const CursoForm = ({ curso, onSuccess }: CursoFormProps) => {
  const [titulo, setTitulo] = useState("");
  const [professor, setProfessor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [status, setStatus] = useState("ativo");
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [selectedInsumos, setSelectedInsumos] = useState<{id: string, quantidade: number}[]>([]);

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

  // Carregar dados do curso para edição
  useEffect(() => {
    if (curso) {
      console.log('Carregando dados do curso para edição:', curso);
      setTitulo(curso.titulo || "");
      setProfessor(curso.professor || "");
      setInicio(curso.inicio || "");
      setFim(curso.fim || "");
      setPeriodo(curso.periodo || "");
      setUnidadeId(curso.unidade_id || "");
      // Aguardar um pouco para garantir que a unidade seja definida antes da sala
      setTimeout(() => {
        setSalaId(curso.sala_id || "");
        console.log('Sala ID definido:', curso.sala_id);
      }, 100);
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
      // Limpar formulário para novo curso
      setTitulo("");
      setProfessor("");
      setInicio("");
      setFim("");
      setPeriodo("");
      setUnidadeId("");
      setSalaId("");
      setStatus("ativo");
      setSelectedMaterias([]);
      setSelectedInsumos([]);
    }
  }, [curso]);

  // Quando a unidade mudar, limpar a sala se não for da mesma unidade
  useEffect(() => {
    if (curso && curso.unidade_id && unidadeId !== curso.unidade_id) {
      setSalaId("");
    }
  }, [unidadeId, curso]);

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
      setSelectedInsumos(prev => [...prev, { id: insumoId, quantidade: 1 }]);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título do Curso</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="professor">Professor</Label>
          <Input
            id="professor"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inicio">Data de Início</Label>
          <Input
            id="inicio"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fim">Data de Fim</Label>
          <Input
            id="fim"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodo">Período</Label>
          <Select value={periodo} onValueChange={setPeriodo} required>
            <SelectTrigger>
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
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Select value={unidadeId} onValueChange={setUnidadeId} required>
            <SelectTrigger>
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
          <Label htmlFor="sala">Sala</Label>
          <Select value={salaId} onValueChange={setSalaId}>
            <SelectTrigger>
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
        <Label>Matérias do Curso</Label>
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
      <div className="space-y-4">
        <Label>Insumos do Curso</Label>
        <Select onValueChange={handleInsumoAdd}>
          <SelectTrigger>
            <SelectValue placeholder="Adicionar insumo" />
          </SelectTrigger>
          <SelectContent>
            {insumos?.filter(insumo => !selectedInsumos.find(i => i.id === insumo.id))
              .map(insumo => (
                <SelectItem key={insumo.id} value={insumo.id}>
                  {insumo.nome}
                </SelectItem>
              ))}
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
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : (curso ? "Atualizar" : "Criar")}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default CursoForm;
