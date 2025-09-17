import { Curso } from "@/hooks/useDashboardCursos";
import { 
  getCargaHorariaFaixa, 
  getDiaSemanaFormatado, 
  calculateTaxaEvasao, 
  calculateEficiencia,
  truncateText 
} from "./dashboardUtils";

export const processPeriodosData = (cursos: Curso[]) => {
  return [
    { periodo: 'Manhã', quantidade: cursos.filter(c => c.periodo === 'manha').length },
    { periodo: 'Tarde', quantidade: cursos.filter(c => c.periodo === 'tarde').length },
    { periodo: 'Noite', quantidade: cursos.filter(c => c.periodo === 'noite').length }
  ];
};

export const processSalasData = (cursos: Curso[]) => {
  const salasMap = cursos.reduce((acc: any, curso) => {
    const salaNome = curso.salas?.nome || 'Sem sala';
    if (!acc[salaNome]) {
      acc[salaNome] = { nome: salaNome, quantidade: 0, capacidade: curso.salas?.capacidade || 0 };
    }
    acc[salaNome].quantidade += 1;
    return acc;
  }, {});

  return Object.values(salasMap)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 10);
};

export const processProfessoresData = (cursos: Curso[]) => {
  const professoresMap = cursos.reduce((acc: any, curso) => {
    const professor = curso.professor;
    if (!acc[professor]) {
      acc[professor] = { nome: professor, quantidade: 0 };
    }
    acc[professor].quantidade += 1;
    return acc;
  }, {});

  return Object.values(professoresMap)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 10);
};

export const processMateriasData = (cursos: Curso[]) => {
  const materiasMap = cursos.reduce((acc: any, curso) => {
    if (curso.curso_materias) {
      curso.curso_materias.forEach((cm: any) => {
        const materiaNome = cm.materias?.nome || 'Sem matéria';
        if (!acc[materiaNome]) {
          acc[materiaNome] = { nome: materiaNome, quantidade: 0 };
        }
        acc[materiaNome].quantidade += 1;
      });
    }
    return acc;
  }, {});

  return Object.values(materiasMap)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 8);
};

export const processEvolucaoAlunos = (cursos: Curso[]) => {
  return cursos.map(curso => ({
    titulo: truncateText(curso.titulo, 30),
    alunosInicio: curso.qtd_alunos_iniciaram || 0,
    alunosFim: curso.qtd_alunos_concluiram || 0,
    unidade: curso.unidades?.nome || 'Sem unidade',
    evasao: ((curso.qtd_alunos_iniciaram || 0) - (curso.qtd_alunos_concluiram || 0)),
    taxaEvasao: calculateTaxaEvasao(curso.qtd_alunos_iniciaram || 0, curso.qtd_alunos_concluiram || 0)
  })).sort((a, b) => b.taxaEvasao - a.taxaEvasao).slice(0, 15);
};

export const processDistribuicaoCargaHoraria = (cursos: Curso[]) => {
  const distribuicao = cursos.reduce((acc: any, curso) => {
    if (curso.carga_horaria) {
      const faixa = getCargaHorariaFaixa(curso.carga_horaria);
      
      if (!acc[faixa]) {
        acc[faixa] = { faixa, quantidade: 0, cargaTotal: 0 };
      }
      acc[faixa].quantidade += 1;
      acc[faixa].cargaTotal += curso.carga_horaria;
    }
    return acc;
  }, {});

  return Object.values(distribuicao)
    .sort((a: any, b: any) => {
      const ordem = ['Até 20h', '21-40h', '41-60h', '61-80h', 'Mais de 80h'];
      return ordem.indexOf(a.faixa) - ordem.indexOf(b.faixa);
    });
};

export const processDiasSemanaData = (cursos: Curso[]) => {
  const diasMap = cursos.reduce((acc: any, curso) => {
    if (curso.dia_semana && Array.isArray(curso.dia_semana)) {
      curso.dia_semana.forEach(dia => {
        const diaFormatado = getDiaSemanaFormatado(dia);
        
        if (!acc[diaFormatado]) {
          acc[diaFormatado] = { dia: diaFormatado, quantidade: 0 };
        }
        acc[diaFormatado].quantidade += 1;
      });
    }
    return acc;
  }, {});

  return Object.values(diasMap)
    .sort((a: any, b: any) => b.quantidade - a.quantidade);
};

export const processEvasaoPorUnidade = (cursos: Curso[]) => {
  const evasaoMap = cursos.reduce((acc: any, curso) => {
    const unidadeNome = curso.unidades?.nome || 'Sem unidade';
    if (!acc[unidadeNome]) {
      acc[unidadeNome] = {
        unidade: unidadeNome,
        totalCursos: 0,
        totalAlunosInicio: 0,
        totalAlunosFim: 0,
        cursosComAlunos: 0
      };
    }
    
    acc[unidadeNome].totalCursos += 1;
    
    if (curso.qtd_alunos_iniciaram !== null && curso.qtd_alunos_concluiram !== null) {
      acc[unidadeNome].totalAlunosInicio += curso.qtd_alunos_iniciaram || 0;
      acc[unidadeNome].totalAlunosFim += curso.qtd_alunos_concluiram || 0;
      acc[unidadeNome].cursosComAlunos += 1;
    }
    
    return acc;
  }, {});

  return Object.values(evasaoMap)
    .map((item: any) => ({
      ...item,
      taxaEvasao: calculateTaxaEvasao(item.totalAlunosInicio, item.totalAlunosFim),
      evasaoAbsoluta: item.totalAlunosInicio - item.totalAlunosFim
    }))
    .filter((item: any) => item.cursosComAlunos > 0)
    .sort((a: any, b: any) => b.taxaEvasao - a.taxaEvasao);
};

export const processEficienciaSalas = (cursos: Curso[]) => {
  const eficienciaMap = cursos.reduce((acc: any, curso) => {
    const salaNome = curso.salas?.nome || 'Sem sala';
    const capacidade = curso.salas?.capacidade || 0;
    
    if (!acc[salaNome]) {
      acc[salaNome] = {
        sala: salaNome,
        capacidade: capacidade,
        totalCursos: 0,
        totalAlunosInicio: 0,
        totalAlunosFim: 0,
        cursosComAlunos: 0
      };
    }
    
    acc[salaNome].totalCursos += 1;
    
    if (curso.qtd_alunos_iniciaram !== null && curso.qtd_alunos_concluiram !== null) {
      acc[salaNome].totalAlunosInicio += curso.qtd_alunos_iniciaram || 0;
      acc[salaNome].totalAlunosFim += curso.qtd_alunos_concluiram || 0;
      acc[salaNome].cursosComAlunos += 1;
    }
    
    return acc;
  }, {});

  return Object.values(eficienciaMap)
    .map((item: any) => {
      const ocupacaoMediaInicio = item.capacidade > 0 && item.cursosComAlunos > 0 ? 
        (item.totalAlunosInicio / item.cursosComAlunos / item.capacidade * 100) : 0;
      const ocupacaoMediaFim = item.capacidade > 0 && item.cursosComAlunos > 0 ? 
        (item.totalAlunosFim / item.cursosComAlunos / item.capacidade * 100) : 0;
      
      return {
        ...item,
        ocupacaoInicio: Math.min(ocupacaoMediaInicio, 100),
        ocupacaoFim: Math.min(ocupacaoMediaFim, 100),
        eficiencia: calculateEficiencia(item.totalAlunosInicio, item.totalAlunosFim)
      };
    })
    .filter((item: any) => item.cursosComAlunos > 0 && item.capacidade > 0)
    .sort((a: any, b: any) => b.eficiencia - a.eficiencia)
    .slice(0, 10);
};

export const processCorrelacaoCargaEvasao = (cursos: Curso[]) => {
  return cursos.map(curso => ({
    cargaHoraria: curso.carga_horaria || 0,
    taxaEvasao: calculateTaxaEvasao(curso.qtd_alunos_iniciaram || 0, curso.qtd_alunos_concluiram || 0),
    titulo: truncateText(curso.titulo, 20),
    unidade: curso.unidades?.nome || 'Sem unidade'
  })).filter(item => item.cargaHoraria > 0);
};
