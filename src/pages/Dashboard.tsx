
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, BookOpen, Building2, Users, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
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
      
      const { data } = await supabase
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
      
      const { data } = await supabase
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
        const diff = d.getDate() - day + 7; // domingo
        return new Date(d.setDate(diff));
      };
      const inicioSemana = startOfWeek(hoje);
      const fimSemana = endOfWeek(hoje);
      
      const { data } = await supabase
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
      
      const { data } = await supabase
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
          <p className="text-muted-foreground">
            Visão geral do sistema de gerenciamento de cursos da CMU
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                Cursos em andamento na semana
              </CardTitle>
              <CardDescription>
                Cursos que estão ocorrendo nesta semana
              </CardDescription>
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
                <div className="space-y-3">
                  {cursosSemana
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
                            <p className="font-medium">{curso.titulo}</p>
                            <p className="text-sm text-muted-foreground">
                              {curso.professor} • {formatPeriodo(curso.periodo)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {curso.unidades?.nome} - {curso.salas?.nome}
                            </p>
                          </div>
                          <div className="flex flex-col items-end min-w-[90px]">
                            <Badge variant={fimJaPassou ? "destructive" : "outline"}>
                              {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM', { locale: ptBR })} - {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                            </Badge>
                            {fimJaPassou && (
                              <div className="text-xs text-red-600 font-semibold mt-1">Terminado</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum curso em andamento nesta semana</p>
              )}
            </CardContent>
          </Card>

          {/* Novo card: Cursos do mês */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-purple-500" />
                Cursos do mês
              </CardTitle>
              <CardDescription>
                Cursos que estão ocorrendo neste mês
              </CardDescription>
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
                <div className="space-y-3">
                  {cursosMes
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
                            <p className="font-medium">{curso.titulo}</p>
                            <p className="text-sm text-muted-foreground">
                              {curso.professor} • {formatPeriodo(curso.periodo)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {curso.unidades?.nome} - {curso.salas?.nome}
                            </p>
                          </div>
                          <div className="flex flex-col items-end min-w-[90px]">
                            <Badge variant={fimJaPassou ? "destructive" : "outline"}>
                              {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM', { locale: ptBR })} - {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                            </Badge>
                            {fimJaPassou && (
                              <div className="text-xs text-red-600 font-semibold mt-1">Terminado</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum curso em andamento neste mês</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
