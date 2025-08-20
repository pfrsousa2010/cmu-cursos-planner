import { useMemo, useState } from "react";
import { Curso, Unidade, Sala } from "@/types/calendario";

export const useCalendarioFiltros = (cursos: Curso[] | undefined) => {
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<string>("all");
  const [selectedSala, setSelectedSala] = useState<string>("all");

  // Extrair dados únicos dos cursos para os filtros
  const unidades = useMemo(() => {
    if (!cursos) return [];
    const uniqueUnidades = new Map();
    cursos.forEach(curso => {
      if (curso.unidades) {
        uniqueUnidades.set(curso.unidades.id, curso.unidades);
      }
    });
    return Array.from(uniqueUnidades.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cursos]);

  const salas = useMemo(() => {
    if (!cursos) return [];
    const uniqueSalas = new Map();
    cursos.forEach(curso => {
      if (curso.salas) {
        uniqueSalas.set(curso.salas.id, {
          id: curso.salas.id,
          nome: curso.salas.nome,
          unidade_id: curso.unidade_id,
          unidades: curso.unidades
        });
      }
    });
    
    return Array.from(uniqueSalas.values()).sort((a, b) => {
      const unidadeComparison = (a.unidades?.nome || '').localeCompare(b.unidades?.nome || '');
      if (unidadeComparison !== 0) {
        return unidadeComparison;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [cursos]);

  const professores = useMemo(() => {
    if (!cursos) return [];
    const uniqueProfessores = [...new Set(cursos.map(curso => curso.professor))];
    return uniqueProfessores.sort();
  }, [cursos]);

  // Filtrar salas baseado na unidade selecionada
  const salasFiltradas = useMemo(() => {
    if (!cursos) return [];
    
    if (selectedUnidade === "all") {
      return salas;
    }
    
    return salas.filter(sala => sala.unidade_id === selectedUnidade);
  }, [salas, selectedUnidade]);

  // Filtrar professores baseado na unidade selecionada
  const professoresFiltrados = useMemo(() => {
    if (!cursos) return [];
    
    if (selectedUnidade === "all") {
      return professores;
    }
    
    const professoresUnidade = new Set<string>();
    cursos.forEach(curso => {
      if (curso.unidade_id === selectedUnidade) {
        professoresUnidade.add(curso.professor);
      }
    });
    
    return Array.from(professoresUnidade).sort();
  }, [cursos, selectedUnidade, professores]);

  // Filtrar cursos baseado nos filtros selecionados
  const cursosFiltrados = useMemo(() => {
    if (!cursos) return [];
    
    return cursos.filter(curso => {
      if (selectedUnidade !== "all" && curso.unidade_id !== selectedUnidade) return false;
      if (selectedProfessor !== "all" && curso.professor !== selectedProfessor) return false;
      if (selectedSala !== "all" && curso.sala_id !== selectedSala) return false;
      return true;
    });
  }, [cursos, selectedUnidade, selectedProfessor, selectedSala]);

  // Resetar filtros dependentes quando unidade muda
  const handleUnidadeChange = (value: string) => {
    setSelectedUnidade(value);
    setSelectedSala("all");
    setSelectedProfessor("all");
  };

  const handleLimparFiltros = () => {
    setSelectedUnidade('all');
    setSelectedSala('all');
    setSelectedProfessor('all');
  };

  return {
    selectedUnidade,
    selectedProfessor,
    selectedSala,
    unidades,
    salas,
    professores,
    salasFiltradas,
    professoresFiltrados,
    cursosFiltrados,
    setSelectedUnidade,
    setSelectedProfessor,
    setSelectedSala,
    handleUnidadeChange,
    handleLimparFiltros
  };
};
