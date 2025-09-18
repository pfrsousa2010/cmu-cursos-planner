
import Layout from "@/components/Layout";
import { useTheme } from "next-themes";
import { useOrientation } from "@/hooks/useOrientation";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUpcomingCourses, useEndingCourses, useWeeklyCourses, useMonthlyCourses, useYearlyCourses, useCompleteCourses } from "@/hooks/useDashboardCursos";
import { useDashboardCharts } from "@/hooks/useDashboardCharts";
import { StatsCards, UpcomingCourses, CollapsibleCoursesList } from "@/components/dashboard";
import { ChartsSection, BarChart, PieChart, LineChart, ScatterChart } from "@/components/dashboard/charts";
import { CalendarDays, BookOpen, Users, Building2 } from "lucide-react";

const Dashboard = () => {
  const { theme } = useTheme();
  const { isPortrait } = useOrientation();

  // Hooks para buscar dados
  const { data: stats } = useDashboardStats();
  const { data: cursosProximos } = useUpcomingCourses();
  const { data: cursosTerminando } = useEndingCourses();
  const { data: cursosSemana } = useWeeklyCourses();
  const { data: cursosMes } = useMonthlyCourses();
  const { data: cursosAno, isLoading: loadingCursosAno } = useYearlyCourses();
  const { data: cursosCompletos, isLoading: loadingCursosCompletos } = useCompleteCourses();

  // Hook para processar dados dos gráficos
  const {
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
  } = useDashboardCharts(cursosAno || [], cursosCompletos || [], theme || 'light');


  return (
    <Layout>
      <div className="space-y-6 overflow-x-hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

        {/* Cards de estatísticas */}
        <StatsCards
          stats={stats}
          professoresCount={professoresData.length}
          isLoadingProfessores={loadingCursosCompletos}
        />

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {/* Cursos começando em breve */}
          <UpcomingCourses
            cursos={cursosProximos}
            isLoading={!cursosProximos}
            title="Cursos Iniciando em Breve"
            description="Cursos que começam nos próximos 7 dias"
            iconColor="text-green-500"
            badgeVariant="secondary"
            dateField="inicio"
          />

          {/* Cursos terminando em breve */}
          <UpcomingCourses
            cursos={cursosTerminando}
            isLoading={!cursosTerminando}
            title="Cursos Terminando em Breve"
            description="Cursos que terminam nos próximos 7 dias"
            iconColor="text-orange-500"
            badgeVariant="destructive"
            dateField="fim"
          />

          {/* Cursos em andamento na semana */}
          <CollapsibleCoursesList
            cursos={cursosSemana}
            isLoading={!cursosSemana}
            title="Cursos em andamento na semana"
            description="Cursos que estão ocorrendo nesta semana"
            iconColor="text-primary"
            emptyMessage="Nenhum curso em andamento nesta semana"
          />

          {/* Cursos do mês */}
          <CollapsibleCoursesList
            cursos={cursosMes}
            isLoading={!cursosMes}
            title="Cursos do mês"
            description="Cursos que estão ocorrendo neste mês"
            iconColor="text-purple-500"
            emptyMessage="Nenhum curso em andamento neste mês"
          />
        </div>

        {/* Gráficos - apenas em modo paisagem (não celular) */}
        {!isPortrait && (
          <>
            <ChartsSection
              title="Visão Geral e Tendências"
              description="Análise de distribuição, utilização de recursos e padrões de crescimento"
            >
              <BarChart
                title={`Cursos por Unidade ao Longo do Ano (${new Date().getFullYear()})`}
                description="Distribuição mensal de cursos por unidade"
                data={chartData}
                config={chartConfig}
                isLoading={loadingCursosAno}
                xAxisDataKey="mes"
                yAxisDataKey=""
                dataKeys={Object.keys(chartConfig)}
                colors={unidadeColors}
                theme={theme || 'light'}
                showLegend={false}
                height={350}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                xAxisAngle={-45}
                xAxisHeight={80}
                yAxisLabel="Quantidade de Cursos"
                customTooltip={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const bars = payload.filter(p => Number(p.value) > 0)
                    .length > 0 ? payload.filter(p => Number(p.value) > 0) : payload;
                  return (
                    <div className={`rounded border p-2 shadow text-xs min-w-[120px] max-w-[200px] ${theme === 'dark'
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
            </ChartsSection>
          </>
        )}

        {/* Gráficos - apenas em modo paisagem (não celular) */}
        {!isPortrait && (
          <>
            <ChartsSection
              title="Utilização de Recursos"
              description="Análise de professores, salas, matérias e distribuição por períodos"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <PieChart
                  title="Distribuição de Cursos por Período"
                  description="Proporção de cursos por turno"
                  data={periodosData}
                  dataKey="quantidade"
                  nameKey="periodo"
                  isLoading={loadingCursosCompletos}
                  colors={unidadeColors}
                  labelFormatter={({ periodo, quantidade, percent }) => `${periodo}: ${quantidade} (${(percent * 100).toFixed(1)}%)`}
                />

                <BarChart
                  title="Taxa de Ocupação das Salas"
                  description="Top 10 salas com maior taxa de ocupação baseada em alunos que concluíram (apenas cursos finalizados)"
                  data={salasData}
                  config={{}}
                  isLoading={loadingCursosCompletos}
                  emptyMessage="Nenhuma sala utilizada"
                  emptyIcon={<CalendarDays className="h-12 w-12 mb-4 opacity-50" />}
                  height={400}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  xAxisDataKey="nome"
                  yAxisDataKey="taxaOcupacao"
                  dataKeys={["taxaOcupacao"]}
                  colors={["#f97316"]}
                  theme={theme || 'light'}
                  showLegend={false}
                  xAxisAngle={-45}
                  xAxisHeight={60}
                  yAxisLabel="Taxa de Ocupação (%)"
                  customTooltip={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className={`rounded-lg border-2 p-4 shadow-lg min-w-[200px] max-w-[280px] ${theme === 'dark'
                        ? 'bg-card border-border text-card-foreground'
                        : 'bg-background border-border text-foreground'
                        }`}>
                        <div className="font-bold text-sm mb-3 text-center border-b pb-2">
                          {data.nome}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium">Unidade:</span>
                            <span>{data.unidade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-blue-600">Cursos:</span>
                            <span className="font-bold text-blue-600">{data.quantidade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-green-600">Capacidade:</span>
                            <span className="font-bold text-green-600">{data.capacidade} alunos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-purple-600">Total Vagas:</span>
                            <span className="font-bold text-purple-600">{data.totalVagas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-indigo-600">Alunos Iniciaram:</span>
                            <span className="font-bold text-indigo-600">{data.totalAlunosIniciaram}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-emerald-600">Alunos Concluíram:</span>
                            <span className="font-bold text-emerald-600">{data.totalAlunosConcluiram}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-cyan-600">Média por Curso:</span>
                            <span className="font-bold text-cyan-600">
                              {data.quantidade > 0 ? (data.totalAlunosConcluiram / data.quantidade).toFixed(1) : 0} alunos
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium text-orange-500">Taxa Ocupação:</span>
                            <span className="font-bold text-orange-500">
                              {data.taxaOcupacao ? data.taxaOcupacao.toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                <BarChart
                  title="Professores Com Mais Cursos"
                  description="Top 10 professores com mais cursos"
                  data={professoresData}
                  config={{}}
                  isLoading={loadingCursosCompletos}
                  xAxisDataKey="nome"
                  yAxisDataKey="quantidade"
                  dataKeys={["quantidade"]}
                  colors={["#82ca9d"]}
                  theme={theme || 'light'}
                  showLegend={false}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                />

                <BarChart
                  title="Matérias Mais Populares"
                  description="Top 8 matérias com mais cursos"
                  data={materiasData}
                  config={{}}
                  isLoading={loadingCursosCompletos}
                  xAxisDataKey="nome"
                  yAxisDataKey="quantidade"
                  dataKeys={["quantidade"]}
                  colors={["#ffc658"]}
                  theme={theme || 'light'}
                  showLegend={false}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                />
              </div>
            </ChartsSection>



            <ChartsSection
              title="Análise de Performance e Padrões"
              description="Distribuição de carga horária, dias da semana, evasão por unidade e evolução de alunos nos cursos"
            >
              <div className="grid gap-6 md:grid-cols-2">

                <PieChart
                  title="Dias da Semana Mais Utilizados"
                  description="Frequência de uso de cada dia da semana nos cursos"
                  data={diasSemanaData}
                  dataKey="quantidade"
                  nameKey="dia"
                  isLoading={loadingCursosCompletos}
                  emptyMessage="Nenhum dado de dias"
                  emptyIcon={<CalendarDays className="h-12 w-12 mb-4 opacity-50" />}
                  height={400}
                  colors={unidadeColors}
                  labelFormatter={({ dia, quantidade, percent }) => `${dia}: ${quantidade} (${(percent * 100).toFixed(1)}%)`}
                />

                <BarChart
                  title="Distribuição de Carga Horária"
                  description="Quantidade de cursos por faixa de carga horária"
                  data={distribuicaoCargaHoraria}
                  config={{
                    quantidade: { label: "Quantidade" }
                  }}
                  isLoading={loadingCursosCompletos}
                  emptyMessage="Nenhum dado de carga horária"
                  emptyIcon={<BookOpen className="h-12 w-12 mb-4 opacity-50" />}
                  height={400}
                  xAxisDataKey="faixa"
                  yAxisDataKey="quantidade"
                  dataKeys={["quantidade"]}
                  colors={["#8884d8"]}
                  theme={theme || 'light'}
                  showLegend={false}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                  customTooltip={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className={`rounded-lg border-2 p-4 shadow-lg min-w-[200px] max-w-[280px] ${theme === 'dark'
                        ? 'bg-card border-border text-card-foreground'
                        : 'bg-background border-border text-foreground'
                        }`}>
                        <div className="font-bold text-sm mb-3 text-center border-b pb-2">
                          {data.faixa}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium">Cursos:</span>
                            <span className="font-bold">{data.quantidade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Carga Total:</span>
                            <span className="font-bold">{data.cargaTotal}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                <BarChart
                  title="Taxa de Evasão por Unidade"
                  description="Percentual de evasão de alunos por unidade (apenas cursos finalizados)"
                  data={evasaoPorUnidade}
                  config={{
                    taxaEvasao: { label: "Taxa de Evasão" }
                  }}
                  isLoading={loadingCursosCompletos}
                  emptyMessage="Nenhum dado de evasão"
                  emptyIcon={<Building2 className="h-12 w-12 mb-4 opacity-50" />}
                  height={400}
                  xAxisDataKey="unidade"
                  yAxisDataKey="taxaEvasao"
                  dataKeys={["taxaEvasao"]}
                  colors={["#ef4444"]}
                  theme={theme || 'light'}
                  showLegend={false}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                  yAxisLabel="Taxa de Evasão (%)"
                  customTooltip={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className={`rounded-lg border-2 p-4 shadow-lg min-w-[200px] max-w-[280px] ${theme === 'dark'
                        ? 'bg-card border-border text-card-foreground'
                        : 'bg-background border-border text-foreground'
                        }`}>
                        <div className="font-bold text-sm mb-3 text-center border-b pb-2">
                          {data.unidade}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-red-500">Taxa de Evasão:</span>
                            <span className="font-bold text-red-500">{data.taxaEvasao.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Evasão Absoluta:</span>
                            <span className="font-bold">{data.evasaoAbsoluta} alunos</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                <BarChart
                  title="Evolução de Alunos por Curso"
                  description="Comparação entre alunos que iniciaram e concluíram os cursos (Top 5 com maior taxa de evasão)"
                  data={evolucaoAlunos}
                  config={{
                    alunosInicio: { label: "Iniciaram" },
                    alunosFim: { label: "Concluíram" },
                    evasao: { label: "Evasão" }
                  }}
                  isLoading={loadingCursosCompletos}
                  emptyMessage="Nenhum dado de alunos"
                  emptyIcon={<Users className="h-12 w-12 mb-4 opacity-50" />}
                  height={450}
                  margin={{ top: 30, right: 40, left: 20, bottom: 20 }}
                  xAxisDataKey="titulo"
                  yAxisDataKey=""
                  dataKeys={["alunosInicio", "alunosFim", "evasao"]}
                  colors={["#10b981", "#3b82f6", "#ef4444"]}
                  theme={theme || 'light'}
                  xAxisAngle={-45}
                  xAxisHeight={120}
                  yAxisLabel="Quantidade de Alunos"
                  customTooltip={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className={`rounded-lg border-2 p-4 shadow-lg min-w-[200px] max-w-[280px] ${theme === 'dark'
                        ? 'bg-card border-border text-card-foreground'
                        : 'bg-background border-border text-foreground'
                        }`}>
                        <div className="font-bold text-sm mb-3 text-center border-b pb-2">
                          {data.titulo}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium">Unidade:</span>
                            <span>{data.unidade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-green-600">Alunos Início:</span>
                            <span className="font-bold text-green-600">{data.alunosInicio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-blue-600">Alunos Fim:</span>
                            <span className="font-bold text-blue-600">{data.alunosFim}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-red-500">Evasão:</span>
                            <span className="font-bold text-red-500">{data.evasao} alunos</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium text-orange-500">Taxa Evasão:</span>
                            <span className="font-bold text-orange-500">{data.taxaEvasao.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </ChartsSection>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
