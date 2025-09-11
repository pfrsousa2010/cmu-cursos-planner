
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, BookOpen, Building2, Users, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPeriodo } from "@/utils/calendarioUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { useTheme } from "next-themes";
import { useOrientation } from "@/hooks/useOrientation";

const Dashboard = () => {
  const { theme } = useTheme();
  const { isPortrait } = useOrientation();
  
  // Estados para controlar colapso das unidades em cada card
  const [collapsedUnidadesSemana, setCollapsedUnidadesSemana] = useState<Set<string>>(new Set());
  const [collapsedUnidadesMes, setCollapsedUnidadesMes] = useState<Set<string>>(new Set());

  // Função para agrupar cursos por unidade e sala
  const agruparCursosPorUnidadeSala = (cursos: any[]) => {
    const grupos: { [key: string]: { [key: string]: any[] } } = {};
    
    cursos.forEach(curso => {
      const unidadeNome = curso.unidades?.nome || 'Sem unidade';
      const salaNome = curso.salas?.nome || 'Sem sala';
      
      if (!grupos[unidadeNome]) {
        grupos[unidadeNome] = {};
      }
      
      if (!grupos[unidadeNome][salaNome]) {
        grupos[unidadeNome][salaNome] = [];
      }
      
      grupos[unidadeNome][salaNome].push(curso);
    });
    
    return grupos;
  };

  // Funções para alternar colapso de uma unidade em cada card
  const toggleUnidadeSemana = (unidadeNome: string) => {
    setCollapsedUnidadesSemana(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unidadeNome)) {
        newSet.delete(unidadeNome);
      } else {
        newSet.add(unidadeNome);
      }
      return newSet;
    });
  };

  const toggleUnidadeMes = (unidadeNome: string) => {
    setCollapsedUnidadesMes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unidadeNome)) {
        newSet.delete(unidadeNome);
      } else {
        newSet.add(unidadeNome);
      }
      return newSet;
    });
  };

  // Funções para recolher todas as unidades
  const recolherTodasUnidadesSemana = () => {
    if (cursosSemana && cursosSemana.length > 0) {
      const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursosSemana));
      setCollapsedUnidadesSemana(new Set(todasUnidades));
    }
  };

  const recolherTodasUnidadesMes = () => {
    if (cursosMes && cursosMes.length > 0) {
      const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursosMes));
      setCollapsedUnidadesMes(new Set(todasUnidades));
    }
  };

  // Funções para expandir todas as unidades
  const expandirTodasUnidadesSemana = () => {
    setCollapsedUnidadesSemana(new Set());
  };

  const expandirTodasUnidadesMes = () => {
    setCollapsedUnidadesMes(new Set());
  };

  // Funções para verificar se há unidades expandidas
  const temUnidadesExpandidasSemana = () => {
    if (!cursosSemana || cursosSemana.length === 0) return false;
    const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursosSemana));
    return todasUnidades.some(unidade => !collapsedUnidadesSemana.has(unidade));
  };

  const temUnidadesExpandidasMes = () => {
    if (!cursosMes || cursosMes.length === 0) return false;
    const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursosMes));
    return todasUnidades.some(unidade => !collapsedUnidadesMes.has(unidade));
  };

  // Funções para verificar se todas as unidades estão recolhidas
  const todasUnidadesRecolhidasSemana = () => {
    if (!cursosSemana || cursosSemana.length === 0) return false;
    const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursosSemana));
    return todasUnidades.length > 0 && todasUnidades.every(unidade => collapsedUnidadesSemana.has(unidade));
  };

  const todasUnidadesRecolhidasMes = () => {
    if (!cursosMes || cursosMes.length === 0) return false;
    const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursosMes));
    return todasUnidades.length > 0 && todasUnidades.every(unidade => collapsedUnidadesMes.has(unidade));
  };

  // Buscar estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [cursosRes, unidadesRes, salasRes, usuariosRes] = await Promise.all([
        supabase.from('cursos').select('*', { count: 'exact' }),
        supabase.from('unidades').select('*', { count: 'exact' }),
        supabase.from('salas').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' })
      ]);

      return {
        cursos: cursosRes.count || 0,
        unidades: unidadesRes.count || 0,
        salas: salasRes.count || 0,
        usuarios: usuariosRes.count || 0
      };
    }
  });

  // Buscar cursos próximos (que começam nos próximos 7 dias)
  const { data: cursosProximos } = useQuery({
    queryKey: ['cursos-proximos'],
    queryFn: async () => {
      const hoje = new Date();
      const proximaSemana = addDays(hoje, 7);
      
      const { data } = await (supabase as any)
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .gte('inicio', format(hoje, 'yyyy-MM-dd'))
        .lte('inicio', format(proximaSemana, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('inicio', { ascending: true });

      return data || [];
    }
  });

  // Buscar cursos que terminam nos próximos 7 dias
  const { data: cursosTerminando } = useQuery({
    queryKey: ['cursos-terminando'],
    queryFn: async () => {
      const hoje = new Date();
      const proximaSemana = addDays(hoje, 7);
      
      const { data } = await (supabase as any)
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .gte('fim', format(hoje, 'yyyy-MM-dd'))
        .lte('fim', format(proximaSemana, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('fim', { ascending: true });

      return data || [];
    }
  });

  // Buscar cursos em andamento na semana
  const { data: cursosSemana } = useQuery({
    queryKey: ['cursos-semana-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const startOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // segunda-feira
        return new Date(d.setDate(diff));
      };
      const endOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + 6; // sábado (para mostrar apenas segunda a sábado)
        return new Date(d.setDate(diff));
      };
      const inicioSemana = startOfWeek(hoje);
      const fimSemana = endOfWeek(hoje);
      
      const { data } = await (supabase as any)
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .lte('inicio', format(fimSemana, 'yyyy-MM-dd'))
        .gte('fim', format(inicioSemana, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('inicio', { ascending: true });
      return data || [];
    }
  });

  // Buscar cursos do mês atual
  const { data: cursosMes } = useQuery({
    queryKey: ['cursos-mes-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      
      const { data } = await (supabase as any)
        .from('cursos')
        .select(`
          *,
          unidades (nome),
          salas (nome)
        `)
        .lte('inicio', format(fimMes, 'yyyy-MM-dd'))
        .gte('fim', format(inicioMes, 'yyyy-MM-dd'))
        .eq('status', 'ativo')
        .order('inicio', { ascending: true });
      return data || [];
    }
  });

  // Buscar cursos do ano corrente para o gráfico
  const anoAtual = new Date().getFullYear();
  const { data: cursosAno, isLoading: loadingCursosAno } = useQuery({
    queryKey: ["cursos-ano", anoAtual],
    queryFn: async () => {
      const inicioAno = `${anoAtual}-01-01`;
      const fimAno = `${anoAtual}-12-31`;
      const { data } = await supabase
        .from("cursos")
        .select(`*, unidades (nome)`)
        .or(`and(inicio.lte.${fimAno},fim.gte.${inicioAno})`);
      return data || [];
    },
  });

  // Buscar dados para gráficos adicionais
  const { data: cursosCompletos, isLoading: loadingCursosCompletos } = useQuery({
    queryKey: ["cursos-completos", anoAtual],
    queryFn: async () => {
      const inicioAno = `${anoAtual}-01-01`;
      const fimAno = `${anoAtual}-12-31`;
      const { data } = await supabase
        .from("cursos")
        .select(`
          *,
          unidades (nome),
          salas (nome, capacidade),
          curso_materias (materias (nome)),
          curso_insumos (insumos (nome), quantidade)
        `)
        .or(`and(inicio.lte.${fimAno},fim.gte.${inicioAno})`);
      return data || [];
    },
  });

  // Processar dados para o gráfico
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const unidades = Array.from(new Set((cursosAno || []).map(c => c.unidades?.nome).filter(Boolean)));
  
  // Paleta de cores adaptável ao tema
  const unidadeColors = theme === 'dark' ? [
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#22c55e", "#eab308", "#f97316", "#6b7280", "#06b6d4", "#ef4444", "#3b82f6", "#84cc16"
  ] : [
    "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666", "#8dd3c7", "#fb8072", "#80b1d3", "#fdb462"
  ];
  // Montar dados: [{ mes: 'Janeiro', Unidade1: 2, Unidade2: 1, ... }, ...]
  const chartData = meses.map((mes, idx) => {
    const mesNum = idx + 1;
    const dataMes: any = { mes };
    unidades.forEach((unidade) => {
      dataMes[unidade] = (cursosAno || []).filter(curso => {
        if (!curso.unidades?.nome) return false;
        if (curso.unidades.nome !== unidade) return false;
        // Parse datas no fuso local, ignorando horas
        const inicio = new Date(curso.inicio + 'T00:00:00-03:00');
        const fim = new Date(curso.fim + 'T23:59:59-03:00');
        // O mês/ano de referência
        const ref = new Date(Date.UTC(anoAtual, idx, 1));
        // Início do mês local
        const inicioMes = new Date(anoAtual, idx, 1, 0, 0, 0, 0);
        // Fim do mês local
        const fimMes = new Date(anoAtual, idx + 1, 0, 23, 59, 59, 999);
        // O curso é considerado ativo se houver interseção entre [inicio, fim] e [inicioMes, fimMes]
        return fim >= inicioMes && inicio <= fimMes;
      }).length;
    });
    return dataMes;
  });
  // Config do gráfico
  const chartConfig = unidades.reduce((acc, unidade, idx) => {
    acc[unidade] = { label: unidade, color: unidadeColors[idx % unidadeColors.length] };
    return acc;
  }, {} as any);

  // Processar dados para gráfico de períodos
  const periodosData = [
    { periodo: 'Manhã', quantidade: (cursosCompletos || []).filter(c => c.periodo === 'manha').length },
    { periodo: 'Tarde', quantidade: (cursosCompletos || []).filter(c => c.periodo === 'tarde').length },
    { periodo: 'Noite', quantidade: (cursosCompletos || []).filter(c => c.periodo === 'noite').length }
  ];

  // Processar dados para gráfico de salas mais utilizadas
  const salasData = (cursosCompletos || []).reduce((acc: any, curso) => {
    const salaNome = curso.salas?.nome || 'Sem sala';
    if (!acc[salaNome]) {
      acc[salaNome] = { nome: salaNome, quantidade: 0, capacidade: curso.salas?.capacidade || 0 };
    }
    acc[salaNome].quantidade += 1;
    return acc;
  }, {});

  const salasOrdenadas = Object.values(salasData)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 10); // Top 10 salas

  // Processar dados para gráfico de professores
  const professoresData = (cursosCompletos || []).reduce((acc: any, curso) => {
    const professor = curso.professor;
    if (!acc[professor]) {
      acc[professor] = { nome: professor, quantidade: 0 };
    }
    acc[professor].quantidade += 1;
    return acc;
  }, {});

  const professoresOrdenados = Object.values(professoresData)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 10); // Top 10 professores

  // Processar dados para gráfico de matérias
  const materiasData = (cursosCompletos || []).reduce((acc: any, curso) => {
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

  const materiasOrdenadas = Object.values(materiasData)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 8); // Top 8 matérias

  // Processar dados para evolução mensal
  const evolucaoMensal = meses.map((mes, idx) => {
    const mesNum = idx + 1;
    const cursosDoMes = (cursosCompletos || []).filter(curso => {
      const inicio = new Date(curso.inicio + 'T00:00:00-03:00');
      const fim = new Date(curso.fim + 'T23:59:59-03:00');
      const inicioMes = new Date(anoAtual, idx, 1, 0, 0, 0, 0);
      const fimMes = new Date(anoAtual, idx + 1, 0, 23, 59, 59, 999);
      return fim >= inicioMes && inicio <= fimMes;
    });
    
    // Data de ontem para comparar com data de fim dos cursos
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(23, 59, 59, 999);
    
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

  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold">{stats.cursos}</div>
              ) : (
                <Skeleton className="h-8 w-16 rounded" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unidades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold">{stats.unidades}</div>
              ) : (
                <Skeleton className="h-8 w-16 rounded" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salas</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold">{stats.salas}</div>
              ) : (
                <Skeleton className="h-8 w-16 rounded" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingCursosCompletos ? (
                <Skeleton className="h-8 w-16 rounded" />
              ) : (
                <div className="text-2xl font-bold">
                  {Object.keys(professoresData).length}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Cursos começando em breve */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-green-500" />
                Cursos Iniciando em Breve
              </CardTitle>
              <CardDescription>
                Cursos que começam nos próximos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!cursosProximos ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-12 rounded" />
                    </div>
                  ))}
                </div>
              ) : cursosProximos.length > 0 ? (
                <div className="space-y-3">
                  {cursosProximos.map((curso) => (
                    <div key={curso.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{curso.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {curso.professor} • {formatPeriodo(curso.periodo)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {curso.unidades?.nome} - {curso.salas?.nome}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {format(new Date(curso.inicio  + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum curso iniciando em breve</p>
              )}
            </CardContent>
          </Card>

          {/* Cursos terminando em breve */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Cursos Terminando em Breve
              </CardTitle>
              <CardDescription>
                Cursos que terminam nos próximos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!cursosTerminando ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-12 rounded" />
                    </div>
                  ))}
                </div>
              ) : cursosTerminando.length > 0 ? (
                <div className="space-y-3">
                  {cursosTerminando.map((curso) => (
                    <div key={curso.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{curso.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {curso.professor} • {formatPeriodo(curso.periodo)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {curso.unidades?.nome} - {curso.salas?.nome}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {format(new Date(curso.fim  + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum curso terminando em breve</p>
              )}
            </CardContent>
          </Card>

          {/* Novo card: Cursos em andamento na semana */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Cursos em andamento na semana
                  </CardTitle>
                  <CardDescription>
                    Cursos que estão ocorrendo nesta semana
                  </CardDescription>
                </div>
                {cursosSemana && cursosSemana.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={todasUnidadesRecolhidasSemana() ? expandirTodasUnidadesSemana : recolherTodasUnidadesSemana}
                    className="text-xs"
                  >
                    {todasUnidadesRecolhidasSemana() ? 'Expandir tudo' : 'Recolher tudo'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!cursosSemana ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  ))}
                </div>
              ) : cursosSemana.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(agruparCursosPorUnidadeSala(cursosSemana))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([unidadeNome, salas]) => (
                      <Collapsible
                        key={unidadeNome}
                        open={!collapsedUnidadesSemana.has(unidadeNome)}
                        onOpenChange={() => toggleUnidadeSemana(unidadeNome)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm flex-1 min-w-0">{unidadeNome}</span>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {Object.values(salas).flat().length} curso{Object.values(salas).flat().length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {collapsedUnidadesSemana.has(unidadeNome) ? 'Expandir' : 'Recolher'}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-3 space-y-3">
                            {Object.entries(salas)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([salaNome, cursos]) => (
                                <div key={salaNome} className="ml-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
                                    <span className="text-sm font-medium text-muted-foreground flex-1 min-w-0">{salaNome}</span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {cursos.length} curso{cursos.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  <div className="ml-4 space-y-2">
                                    {cursos
                                      .slice()
                                      .sort((a, b) => {
                                        const aFim = new Date(a.fim + 'T23:59:59') < new Date();
                                        const bFim = new Date(b.fim + 'T23:59:59') < new Date();
                                        if (aFim === bFim) return 0;
                                        return aFim ? 1 : -1;
                                      })
                                      .map((curso) => {
                                        const fimJaPassou = new Date(curso.fim + 'T23:59:59') < new Date();
                                        return (
                                          <div key={curso.id} className="flex items-center justify-between border-b pb-2">
                                            <div>
                                              <p className="font-medium text-sm">{curso.titulo}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {curso.professor} • {formatPeriodo(curso.periodo)}
                                              </p>
                                            </div>
                                            <div className="flex flex-col items-end min-w-[90px]">
                                              <Badge variant={fimJaPassou ? "destructive" : "outline"} className="text-xs">
                                                {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM', { locale: ptBR })} - {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                                              </Badge>
                                              {fimJaPassou && (
                                                <div className="text-xs text-red-600 font-semibold mt-1">Finalizado</div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum curso em andamento nesta semana</p>
              )}
            </CardContent>
          </Card>

          {/* Novo card: Cursos do mês */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-purple-500" />
                    Cursos do mês
                  </CardTitle>
                  <CardDescription>
                    Cursos que estão ocorrendo neste mês
                  </CardDescription>
                </div>
                {cursosMes && cursosMes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={todasUnidadesRecolhidasMes() ? expandirTodasUnidadesMes : recolherTodasUnidadesMes}
                    className="text-xs"
                  >
                    {todasUnidadesRecolhidasMes() ? 'Expandir tudo' : 'Recolher tudo'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!cursosMes ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  ))}
                </div>
              ) : cursosMes.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(agruparCursosPorUnidadeSala(cursosMes))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([unidadeNome, salas]) => (
                      <Collapsible
                        key={unidadeNome}
                        open={!collapsedUnidadesMes.has(unidadeNome)}
                        onOpenChange={() => toggleUnidadeMes(unidadeNome)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-purple-500" />
                              <span className="font-semibold text-sm">{unidadeNome}</span>
                              <Badge variant="secondary" className="text-xs">
                                {Object.values(salas).flat().length} curso{Object.values(salas).flat().length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {collapsedUnidadesMes.has(unidadeNome) ? 'Expandir' : 'Recolher'}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-3 space-y-3">
                            {Object.entries(salas)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([salaNome, cursos]) => (
                                <div key={salaNome} className="ml-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                    <span className="text-sm font-medium text-muted-foreground flex-1 min-w-0">{salaNome}</span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {cursos.length} curso{cursos.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  <div className="ml-4 space-y-2">
                                    {cursos
                                      .slice()
                                      .sort((a, b) => {
                                        const aFim = new Date(a.fim + 'T23:59:59') < new Date();
                                        const bFim = new Date(b.fim + 'T23:59:59') < new Date();
                                        if (aFim === bFim) return 0;
                                        return aFim ? 1 : -1;
                                      })
                                      .map((curso) => {
                                        const fimJaPassou = new Date(curso.fim + 'T23:59:59') < new Date();
                                        return (
                                          <div key={curso.id} className="flex items-center justify-between border-b pb-2">
                                            <div>
                                              <p className="font-medium text-sm">{curso.titulo}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {curso.professor} • {formatPeriodo(curso.periodo)}
                                              </p>
                                            </div>
                                            <div className="flex flex-col items-end min-w-[90px]">
                                              <Badge variant={fimJaPassou ? "destructive" : "outline"} className="text-xs">
                                                {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM', { locale: ptBR })} - {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                                              </Badge>
                                              {fimJaPassou && (
                                                <div className="text-xs text-red-600 font-semibold mt-1">Finalizado</div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum curso em andamento neste mês</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos - apenas em modo paisagem (não celular) */}
        {!isPortrait && (
          <>
            {/* Nova seção: Gráfico de cursos por unidade ao longo do ano */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Cursos por Unidade ao Longo do Ano ({anoAtual})</CardTitle>
                  <CardDescription>
                    Distribuição mensal de cursos por unidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCursosAno ? (
                    <div className="flex justify-center items-center h-64"><Skeleton className="h-48 w-full rounded" /></div>
                  ) : (
                    <ChartContainer config={chartConfig} className="w-full h-[350px]">
                      <RechartsPrimitive.BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                        <RechartsPrimitive.XAxis dataKey="mes" />
                        <RechartsPrimitive.YAxis allowDecimals={false} label={{ value: 'Quantidade de Cursos', angle: -90, position: 'insideLeft' }} />
                        <RechartsPrimitive.Tooltip
                          cursor={{ fill: theme === 'dark' ? '#374151' : '#f3f4f6' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            // Mostra apenas barras com valor > 0 ou todas se todas forem zero
                            const bars = payload.filter(p => Number(p.value) > 0)
                              .length > 0 ? payload.filter(p => Number(p.value) > 0) : payload;
                            return (
                              <div className={`rounded border p-2 shadow text-xs min-w-[180px] ${
                                theme === 'dark' 
                                  ? 'bg-card border-border text-card-foreground' 
                                  : 'bg-background border-border text-foreground'
                              }`}>
                                <div className="font-semibold mb-1">Mês: {label}</div>
                                {bars.map((item, idx) => (
                                  <div key={item.dataKey} className="mb-1 flex items-center gap-2">
                                    <span style={{ color: item.color, fontWeight: 500 }}>{item.dataKey}:</span>
                                    <span>
                                      {item.value} Curso{Number(item.value) === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <RechartsPrimitive.Legend
                          verticalAlign="top"
                          align="center"
                          iconType="rect"
                          wrapperStyle={{ 
                            paddingBottom: 16,
                            color: theme === 'dark' ? '#e5e7eb' : '#374151'
                          }}
                          formatter={(value, entry, idx) => (
                            <span style={{ 
                              color: theme === 'dark' ? '#e5e7eb' : '#374151', 
                              fontWeight: 500 
                            }}>{value}</span>
                          )}
                        />
                        {unidades.map((unidade, idx) => (
                          <RechartsPrimitive.Bar
                            key={unidade}
                            dataKey={unidade}
                            fill={unidadeColors[idx % unidadeColors.length]}
                            name={unidade}
                            isAnimationActive={false}
                            barSize={24}
                          />
                        ))}
                      </RechartsPrimitive.BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Gráficos - apenas em modo paisagem (não celular) */}
        {!isPortrait && (
          <>
            {/* Nova seção: Gráficos de métricas adicionais */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Gráfico de distribuição por período */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Distribuição de Cursos por Período</CardTitle>
                  <CardDescription>
                    Proporção de cursos por turno
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCursosCompletos ? (
                    <div className="flex justify-center items-center h-64"><Skeleton className="h-48 w-full rounded" /></div>
                  ) : (
                    <ChartContainer config={{}} className="w-full h-[300px]">
                      <RechartsPrimitive.PieChart>
                        <RechartsPrimitive.Pie
                          data={periodosData}
                          dataKey="quantidade"
                          nameKey="periodo"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ periodo, quantidade, percent }) => `${periodo}: ${quantidade} (${(percent * 100).toFixed(1)}%)`}
                        >
                          {periodosData.map((entry, index) => (
                            <RechartsPrimitive.Cell key={`cell-${index}`} fill={unidadeColors[index % unidadeColors.length]} />
                          ))}
                        </RechartsPrimitive.Pie>
                        <RechartsPrimitive.Tooltip />
                        <RechartsPrimitive.Legend />
                      </RechartsPrimitive.PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de salas mais utilizadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Salas Mais Utilizadas</CardTitle>
                  <CardDescription>
                    Top 10 salas com mais cursos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCursosCompletos ? (
                    <div className="flex justify-center items-center h-64"><Skeleton className="h-48 w-full rounded" /></div>
                  ) : salasOrdenadas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhuma sala utilizada</p>
                      <p className="text-sm">Não há cursos cadastrados com salas</p>
                    </div>
                  ) : (
                    <ChartContainer config={{}} className="w-full h-[400px]">
                        <RechartsPrimitive.BarChart 
                          data={salasOrdenadas} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          width={600}
                          height={400}
                        >
                          <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                          <RechartsPrimitive.XAxis 
                            dataKey="nome" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fontSize: 10 }}
                            interval={0}
                          />
                          <RechartsPrimitive.YAxis 
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsPrimitive.Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload || !payload.length) return null;
                              const data = payload[0].payload;
                              return (
                                <div className={`rounded border p-2 shadow text-xs ${
                                  theme === 'dark' 
                                    ? 'bg-card border-border text-card-foreground' 
                                    : 'bg-background border-border text-foreground'
                                }`}>
                                  <div className="font-semibold mb-1">{data.nome}</div>
                                  <div>Cursos: {data.quantidade}</div>
                                  <div>Capacidade: {data.capacidade}</div>
                                </div>
                              );
                            }}
                          />
                          <RechartsPrimitive.Bar 
                            dataKey="quantidade" 
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                          />
                        </RechartsPrimitive.BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de professores mais ativos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Professores Com Mais Cursos</CardTitle>
                  <CardDescription>
                    Top 10 professores com mais cursos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCursosCompletos ? (
                    <div className="flex justify-center items-center h-64"><Skeleton className="h-48 w-full rounded" /></div>
                  ) : (
                    <ChartContainer config={{}} className="w-full h-[300px]">
                      <RechartsPrimitive.BarChart data={professoresOrdenados} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                        <RechartsPrimitive.XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                        <RechartsPrimitive.YAxis allowDecimals={false} />
                        <RechartsPrimitive.Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            return (
                              <div className={`rounded border p-2 shadow text-xs ${
                                theme === 'dark' 
                                  ? 'bg-card border-border text-card-foreground' 
                                  : 'bg-background border-border text-foreground'
                              }`}>
                                <div className="font-semibold mb-1">{label}</div>
                                <div>Cursos: {payload[0].value}</div>
                              </div>
                            );
                          }}
                        />
                        <RechartsPrimitive.Bar dataKey="quantidade" fill="#82ca9d" />
                      </RechartsPrimitive.BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de matérias mais populares */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Matérias Mais Populares</CardTitle>
                  <CardDescription>
                    Top 8 matérias com mais cursos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCursosCompletos ? (
                    <div className="flex justify-center items-center h-64"><Skeleton className="h-48 w-full rounded" /></div>
                  ) : (
                    <ChartContainer config={{}} className="w-full h-[300px]">
                      <RechartsPrimitive.BarChart data={materiasOrdenadas} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                        <RechartsPrimitive.XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                        <RechartsPrimitive.YAxis allowDecimals={false} />
                        <RechartsPrimitive.Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            return (
                              <div className={`rounded border p-2 shadow text-xs ${
                                theme === 'dark' 
                                  ? 'bg-card border-border text-card-foreground' 
                                  : 'bg-background border-border text-foreground'
                              }`}>
                                <div className="font-semibold mb-1">{label}</div>
                                <div>Cursos: {payload[0].value}</div>
                              </div>
                            );
                          }}
                        />
                        <RechartsPrimitive.Bar dataKey="quantidade" fill="#ffc658" />
                      </RechartsPrimitive.BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de evolução mensal */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Evolução Mensal de Cursos ({anoAtual})</CardTitle>
                  <CardDescription>
                    Tendência de criação de cursos ao longo do ano
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCursosCompletos ? (
                    <div className="flex justify-center items-center h-64"><Skeleton className="h-48 w-full rounded" /></div>
                  ) : (
                    <ChartContainer config={{}} className="w-full h-[350px]">
                      <RechartsPrimitive.LineChart data={evolucaoMensal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                        <RechartsPrimitive.XAxis dataKey="mes" />
                        <RechartsPrimitive.YAxis allowDecimals={false} />
                        <RechartsPrimitive.Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            return (
                              <div className={`rounded border p-2 shadow text-xs ${
                                theme === 'dark' 
                                  ? 'bg-card border-border text-card-foreground' 
                                  : 'bg-background border-border text-foreground'
                              }`}>
                                <div className="font-semibold mb-1">Mês: {label}</div>
                                <div>Total: {payload[0].payload.cursos}</div>
                                <div>Ativos: {payload[0].payload.ativos}</div>
                                <div>Finalizados: {payload[0].payload.finalizados}</div>
                              </div>
                            );
                          }}
                        />
                        <RechartsPrimitive.Legend />
                        <RechartsPrimitive.Line type="monotone" dataKey="cursos" stroke="#8884d8" strokeWidth={2} name="Total de Cursos" />
                        <RechartsPrimitive.Line type="monotone" dataKey="ativos" stroke="#82ca9d" strokeWidth={2} name="Cursos Ativos" />
                        <RechartsPrimitive.Line type="monotone" dataKey="finalizados" stroke="#ffc658" strokeWidth={2} name="Cursos Finalizados" />
                      </RechartsPrimitive.LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
