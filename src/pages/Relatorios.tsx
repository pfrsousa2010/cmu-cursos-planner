import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRelatoriosCursos, PeriodoRelatorio } from "@/hooks/useRelatoriosCursos";
import { useRelatoriosExport } from "@/hooks/useRelatoriosExport";
import { useOrientation } from "@/hooks/useOrientation";
import { 
  Download, 
  FileSpreadsheet, 
  FileImage, 
  Calendar,
  BarChart3,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoCmu from "/logo-cmu.png";

const Relatorios = () => {
  const {
    periodoSelecionado,
    setPeriodoSelecionado,
    dataInicio,
    setDataInicio,
    filtros,
    setFiltros,
    periodoCalculado,
    cursosFiltrados,
    estatisticas,
    unidades,
    salas,
    isLoading
  } = useRelatoriosCursos();

  const { exportToExcel, exportToPDF } = useRelatoriosExport();
  const { width } = useOrientation();
  const isMobile = width < 768;

  const formatPeriodo = (periodo: string) => {
    const periodos = {
      'manha': 'Manhã',
      'tarde': 'Tarde',
      'noite': 'Noite'
    };
    return periodos[periodo as keyof typeof periodos] || periodo;
  };

  const getPeriodoColor = (periodo: string) => {
    const colors = {
      'manha': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'tarde': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'noite': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return colors[periodo as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const handleExportExcel = () => {
    exportToExcel(cursosFiltrados, periodoSelecionado, periodoCalculado.label, estatisticas);
  };

  const handleExportPDF = () => {
    exportToPDF(cursosFiltrados, periodoSelecionado, periodoCalculado.label, estatisticas, filtros);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <img src={logoCmu} alt="Logo CMU" className="h-32 w-auto animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios de Cursos</h1>
            <p className="text-muted-foreground">
              Gere relatórios detalhados dos cursos por período
            </p>
          </div>
        </div>

        {/* Configuração do Relatório */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configuração do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Período do Relatório */}
              <div className="space-y-2">
                <Label htmlFor="periodo">Período do Relatório</Label>
                <Select 
                  value={periodoSelecionado} 
                  onValueChange={(value: PeriodoRelatorio) => setPeriodoSelecionado(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Referência */}
              <div className="space-y-2">
                <Label htmlFor="dataInicio">
                  {periodoSelecionado === 'anual' && 'Ano'}
                  {periodoSelecionado === 'semestral' && 'Semestre'}
                  {periodoSelecionado === 'mensal' && 'Mês'}
                  {periodoSelecionado === 'semanal' && 'Semana'}
                </Label>
                {periodoSelecionado === 'anual' ? (
                  <Select 
                    value={dataInicio.getFullYear().toString()} 
                    onValueChange={(value) => setDataInicio(new Date(parseInt(value), 0, 1))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : periodoSelecionado === 'semestral' ? (
                  <div className="flex gap-2">
                    <Select 
                      value={dataInicio.getFullYear().toString()} 
                      onValueChange={(value) => setDataInicio(new Date(parseInt(value), dataInicio.getMonth(), 1))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={dataInicio.getMonth() < 6 ? '1' : '2'} 
                      onValueChange={(value) => {
                        const year = dataInicio.getFullYear();
                        const month = value === '1' ? 0 : 6; // Janeiro ou Julho
                        setDataInicio(new Date(year, month, 1));
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Semestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Semestre</SelectItem>
                        <SelectItem value="2">2º Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : periodoSelecionado === 'mensal' ? (
                  <div className="flex gap-2">
                    <Select 
                      value={dataInicio.getFullYear().toString()} 
                      onValueChange={(value) => setDataInicio(new Date(parseInt(value), dataInicio.getMonth(), 1))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={dataInicio.getMonth().toString()} 
                      onValueChange={(value) => setDataInicio(new Date(dataInicio.getFullYear(), parseInt(value), 1))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input
                    id="dataInicio"
                    type="date"
                    value={format(dataInicio, 'yyyy-MM-dd')}
                    onChange={(e) => setDataInicio(new Date(e.target.value))}
                  />
                )}
              </div>

              {/* Filtro por Unidade */}
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select 
                  value={filtros.unidade} 
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, unidade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as unidades</SelectItem>
                    {unidades.map(unidade => (
                      <SelectItem key={unidade} value={unidade}>
                        {unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Período do Dia */}
              <div className="space-y-2">
                <Label htmlFor="periodoDia">Período do Dia</Label>
                <Select 
                  value={filtros.periodo} 
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, periodo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os períodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os períodos</SelectItem>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Informações do Período Selecionado */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Período Selecionado:</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {periodoCalculado.label} - {format(periodoCalculado.inicio, 'dd/MM/yyyy', { locale: ptBR })} a {format(periodoCalculado.fim, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas e Exportação */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estatisticas ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{estatisticas.totalCursos}</div>
                      <div className="text-sm text-muted-foreground">Total de Cursos</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{estatisticas.totalVagas}</div>
                      <div className="text-sm text-muted-foreground">Total de Vagas</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{estatisticas.totalAlunosIniciaram}</div>
                      <div className="text-sm text-muted-foreground">Alunos Iniciaram</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{estatisticas.totalAlunosConcluiram}</div>
                      <div className="text-sm text-muted-foreground">Alunos Concluíram</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Taxa de Conclusão:</span>
                      <span className="text-sm font-bold text-primary">
                        {estatisticas.taxaConclusao.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Carga Horária Total:</span>
                      <span className="text-sm font-bold text-primary">
                        {estatisticas.totalCargaHoraria}h
                      </span>
                    </div>
                  </div>

                  {/* Cursos por Período */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Cursos por Período do Dia:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(estatisticas.cursosPorPeriodo).map(([periodo, qtd]) => (
                        <Badge key={periodo} variant="outline" className={getPeriodoColor(periodo)}>
                          {formatPeriodo(periodo)}: {qtd}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Cursos por Unidade */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Cursos por Unidade:</h4>
                    <div className="space-y-1">
                      {Object.entries(estatisticas.cursosPorUnidade).map(([unidade, qtd]) => (
                        <div key={unidade} className="flex justify-between items-center text-sm">
                          <span>{unidade}</span>
                          <Badge variant="secondary">{qtd}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum curso encontrado para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporte o relatório dos cursos filtrados nos formatos Excel ou PDF.
                </p>
                
                <div className="grid gap-3">
                  <Button 
                    onClick={handleExportExcel}
                    variant="outline" 
                    className="h-auto p-4 flex items-center justify-start gap-3"
                    disabled={!cursosFiltrados.length}
                  >
                    <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div className="text-left">
                      <div className="font-medium">Exportar para Excel</div>
                      <div className="text-sm text-muted-foreground">
                        Arquivo XLSX com dados e estatísticas
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={handleExportPDF}
                    variant="outline" 
                    className="h-auto p-4 flex items-center justify-start gap-3"
                    disabled={!cursosFiltrados.length}
                  >
                    <FileImage className="h-6 w-6 text-red-600 dark:text-red-400" />
                    <div className="text-left">
                      <div className="font-medium">Exportar para PDF</div>
                      <div className="text-sm text-muted-foreground">
                        Documento PDF para impressão
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Total de cursos a serem exportados: {cursosFiltrados.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Cursos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Cursos do Período ({cursosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cursosFiltrados.length > 0 ? (
              <div className="space-y-4">
                {cursosFiltrados.map((curso) => {
                  const cursoFinalizado = new Date(curso.fim + 'T00:00:00') < new Date();
                  
                  return (
                    <div 
                      key={curso.id}
                      className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        cursoFinalizado ? 'bg-destructive/10 border-destructive/20' : ''
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{curso.titulo}</h3>
                          <p className="text-sm text-muted-foreground">{curso.professor}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getPeriodoColor(curso.periodo)}>
                            {formatPeriodo(curso.periodo)}
                          </Badge>
                          
                          {cursoFinalizado && (
                            <Badge variant="destructive">Finalizado</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Unidade:</span> {curso.unidades?.nome || 'Sem Unidade'}
                        </div>
                        <div>
                          <span className="font-medium">Sala:</span> {curso.salas?.nome || 'Sem Sala'}
                        </div>
                        <div>
                          <span className="font-medium">Vagas:</span> {curso.vagas || 'Não definido'}
                        </div>
                        <div>
                          <span className="font-medium">Carga Horária:</span> {curso.carga_horaria ? `${curso.carga_horaria}h` : 'Não definida'}
                        </div>
                        <div>
                          <span className="font-medium">Início:</span> {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div>
                          <span className="font-medium">Fim:</span> {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div>
                          <span className="font-medium">Alunos:</span> {curso.qtd_alunos_iniciaram || 0} → {curso.qtd_alunos_concluiram || 0}
                        </div>
                        <div>
                          <span className="font-medium">Insumos/Matérias:</span> {curso.total_insumos || 0}/{curso.total_materias || 0}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
                <p className="text-muted-foreground">
                  Ajuste os filtros ou selecione um período diferente para visualizar os cursos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Relatorios;
