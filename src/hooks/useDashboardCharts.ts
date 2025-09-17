import { useMemo } from "react";
import { Curso } from "./useDashboardCursos";

export interface ChartData {
  mes: string;
  [key: string]: string | number;
}

export interface PeriodData {
  periodo: string;
  quantidade: number;
}

export interface SalaData {
  nome: string;
  quantidade: number;
  capacidade: number;
}

export interface ProfessorData {
  nome: string;
  quantidade: number;
}

export interface MateriaData {
  nome: string;
  quantidade: number;
}

export interface EvolucaoAluno {
  titulo: string;
  alunosInicio: number;
  alunosFim: number;
  unidade: string;
  evasao: number;
  taxaEvasao: number;
}

export interface CargaHorariaData {
  faixa: string;
  quantidade: number;
  cargaTotal: number;
}

export interface DiaSemanaData {
  dia: string;
  quantidade: number;
}

export interface EvasaoUnidadeData {
  unidade: string;
  totalCursos: number;
  totalAlunosInicio: number;
  totalAlunosFim: number;
  cursosComAlunos: number;
  taxaEvasao: number;
  evasaoAbsoluta: number;
}

export interface EficienciaSalaData {
  sala: string;
  capacidade: number;
  totalCursos: number;
  totalAlunosInicio: number;
  totalAlunosFim: number;
  cursosComAlunos: number;
  ocupacaoInicio: number;
  ocupacaoFim: number;
  eficiencia: number;
}

export interface CorrelacaoCargaEvasao {
  cargaHoraria: number;
  taxaEvasao: number;
  titulo: string;
  unidade: string;
}

export interface EvolucaoMensal {
  mes: string;
  cursos: number;
  ativos: number;
  finalizados: number;
}

export const useDashboardCharts = (cursosAno: Curso[], cursosCompletos: Curso[], theme: string) => {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const unidadeColors = theme === 'dark' ? [
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#22c55e", "#eab308", "#f97316", "#6b7280", "#06b6d4", "#ef4444", "#3b82f6", "#84cc16"
  ] : [
    "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666", "#8dd3c7", "#fb8072", "#80b1d3", "#fdb462"
  ];

  const unidades = useMemo(() => 
    Array.from(new Set(cursosAno.map(c => c.unidades?.nome).filter(Boolean))), 
    [cursosAno]
  );

  const chartData = useMemo((): ChartData[] => {
    return meses.map((mes, idx) => {
      const mesNum = idx + 1;
      const dataMes: any = { mes };
      unidades.forEach((unidade) => {
        dataMes[unidade] = cursosAno.filter(curso => {
          if (!curso.unidades?.nome) return false;
          if (curso.unidades.nome !== unidade) return false;
          const inicio = new Date(curso.inicio + 'T00:00:00-03:00');
          const fim = new Date(curso.fim + 'T23:59:59-03:00');
          const anoAtual = new Date().getFullYear();
          const inicioMes = new Date(anoAtual, idx, 1, 0, 0, 0, 0);
          const fimMes = new Date(anoAtual, idx + 1, 0, 23, 59, 59, 999);
          return fim >= inicioMes && inicio <= fimMes;
        }).length;
      });
      return dataMes;
    });
  }, [cursosAno, unidades, meses]);

  const chartConfig = useMemo(() => 
    unidades.reduce((acc, unidade, idx) => {
      acc[unidade] = { label: unidade, color: unidadeColors[idx % unidadeColors.length] };
      return acc;
    }, {} as any), 
    [unidades, unidadeColors]
  );

  const periodosData = useMemo((): PeriodData[] => [
    { periodo: 'Manhã', quantidade: cursosCompletos.filter(c => c.periodo === 'manha').length },
    { periodo: 'Tarde', quantidade: cursosCompletos.filter(c => c.periodo === 'tarde').length },
    { periodo: 'Noite', quantidade: cursosCompletos.filter(c => c.periodo === 'noite').length }
  ], [cursosCompletos]);

  const salasData = useMemo((): SalaData[] => {
    const salasMap = cursosCompletos.reduce((acc: any, curso) => {
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
  }, [cursosCompletos]);

  const professoresData = useMemo((): ProfessorData[] => {
    const professoresMap = cursosCompletos.reduce((acc: any, curso) => {
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
  }, [cursosCompletos]);

  const materiasData = useMemo((): MateriaData[] => {
    const materiasMap = cursosCompletos.reduce((acc: any, curso) => {
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
  }, [cursosCompletos]);

  const evolucaoMensal = useMemo((): EvolucaoMensal[] => {
    const anoAtual = new Date().getFullYear();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(23, 59, 59, 999);

    return meses.map((mes, idx) => {
      const cursosDoMes = cursosCompletos.filter(curso => {
        const inicio = new Date(curso.inicio + 'T00:00:00-03:00');
        const fim = new Date(curso.fim + 'T23:59:59-03:00');
        const inicioMes = new Date(anoAtual, idx, 1, 0, 0, 0, 0);
        const fimMes = new Date(anoAtual, idx + 1, 0, 23, 59, 59, 999);
        return fim >= inicioMes && inicio <= fimMes;
      });
      
      const cursosFinalizados = cursosDoMes.filter(curso => {
        const fimCurso = new Date(curso.fim + 'T23:59:59-03:00');
        return fimCurso < ontem;
      });
      
      const cursosAtivos = cursosDoMes.filter(curso => {
        const fimCurso = new Date(curso.fim + 'T23:59:59-03:00');
        return fimCurso >= ontem;
      });
      
      return {
        mes,
        cursos: cursosDoMes.length,
        ativos: cursosAtivos.length,
        finalizados: cursosFinalizados.length
      };
    });
  }, [cursosCompletos, meses]);

  const cursosFinalizados = useMemo(() => {
    const hoje = new Date();
    return cursosCompletos.filter(curso => {
      const fimCurso = new Date(curso.fim + 'T23:59:59-03:00');
      return fimCurso < hoje;
    });
  }, [cursosCompletos]);

  const cursosComVagas = useMemo(() => 
    cursosFinalizados.filter(curso => 
      (curso.qtd_alunos_iniciaram !== null && curso.qtd_alunos_iniciaram > 0) || 
      (curso.qtd_alunos_concluiram !== null && curso.qtd_alunos_concluiram > 0)
    ), 
    [cursosFinalizados]
  );

  const evolucaoAlunos = useMemo((): EvolucaoAluno[] => 
    cursosComVagas.map(curso => ({
      titulo: curso.titulo.length > 30 ? curso.titulo.substring(0, 30) + '...' : curso.titulo,
      alunosInicio: curso.qtd_alunos_iniciaram || 0,
      alunosFim: curso.qtd_alunos_concluiram || 0,
      unidade: curso.unidades?.nome || 'Sem unidade',
      evasao: ((curso.qtd_alunos_iniciaram || 0) - (curso.qtd_alunos_concluiram || 0)),
      taxaEvasao: curso.qtd_alunos_iniciaram ? (((curso.qtd_alunos_iniciaram || 0) - (curso.qtd_alunos_concluiram || 0)) / curso.qtd_alunos_iniciaram * 100) : 0
    })).sort((a, b) => b.taxaEvasao - a.taxaEvasao).slice(0, 15), 
    [cursosComVagas]
  );

  const distribuicaoCargaHoraria = useMemo((): CargaHorariaData[] => {
    const distribuicao = cursosCompletos.reduce((acc: any, curso) => {
      if (curso.carga_horaria) {
        const faixa = curso.carga_horaria <= 20 ? 'Até 20h' :
                     curso.carga_horaria <= 40 ? '21-40h' :
                     curso.carga_horaria <= 60 ? '41-60h' :
                     curso.carga_horaria <= 80 ? '61-80h' : 'Mais de 80h';
        
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
  }, [cursosCompletos]);

  const diasSemanaData = useMemo((): DiaSemanaData[] => {
    const diasMap = cursosCompletos.reduce((acc: any, curso) => {
      if (curso.dia_semana && Array.isArray(curso.dia_semana)) {
        curso.dia_semana.forEach(dia => {
          const diaFormatado = {
            'segunda': 'Segunda',
            'terca': 'Terça',
            'quarta': 'Quarta',
            'quinta': 'Quinta',
            'sexta': 'Sexta'
          }[dia] || dia;
          
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
  }, [cursosCompletos]);

  const evasaoPorUnidade = useMemo((): EvasaoUnidadeData[] => {
    const evasaoMap = cursosFinalizados.reduce((acc: any, curso) => {
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
        taxaEvasao: item.totalAlunosInicio > 0 ? 
          ((item.totalAlunosInicio - item.totalAlunosFim) / item.totalAlunosInicio * 100) : 0,
        evasaoAbsoluta: item.totalAlunosInicio - item.totalAlunosFim
      }))
      .filter((item: any) => item.cursosComAlunos > 0)
      .sort((a: any, b: any) => b.taxaEvasao - a.taxaEvasao);
  }, [cursosFinalizados]);

  const eficienciaSalas = useMemo((): EficienciaSalaData[] => {
    const eficienciaMap = cursosFinalizados.reduce((acc: any, curso) => {
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
          eficiencia: item.totalAlunosInicio > 0 ? (item.totalAlunosFim / item.totalAlunosInicio * 100) : 0
        };
      })
      .filter((item: any) => item.cursosComAlunos > 0 && item.capacidade > 0)
      .sort((a: any, b: any) => b.eficiencia - a.eficiencia)
      .slice(0, 10);
  }, [cursosFinalizados]);

  const correlacaoCargaEvasao = useMemo((): CorrelacaoCargaEvasao[] => 
    cursosComVagas.map(curso => ({
      cargaHoraria: curso.carga_horaria || 0,
      taxaEvasao: curso.qtd_alunos_iniciaram ? 
        ((curso.qtd_alunos_iniciaram - (curso.qtd_alunos_concluiram || 0)) / curso.qtd_alunos_iniciaram * 100) : 0,
      titulo: curso.titulo.length > 20 ? curso.titulo.substring(0, 20) + '...' : curso.titulo,
      unidade: curso.unidades?.nome || 'Sem unidade'
    })).filter(item => item.cargaHoraria > 0), 
    [cursosComVagas]
  );

  return {
    chartData,
    chartConfig,
    periodosData,
    salasData,
    professoresData,
    materiasData,
    evolucaoMensal,
    evolucaoAlunos,
    distribuicaoCargaHoraria,
    diasSemanaData,
    evasaoPorUnidade,
    eficienciaSalas,
    correlacaoCargaEvasao,
    unidadeColors
  };
};
