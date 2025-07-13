
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, BookOpen, Building2, Users, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.cursos || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unidades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.unidades || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salas</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.salas || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.usuarios || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
              {cursosProximos && cursosProximos.length > 0 ? (
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
              {cursosTerminando && cursosTerminando.length > 0 ? (
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
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
