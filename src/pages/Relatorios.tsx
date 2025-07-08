
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  inicio: string;
  fim: string;
  periodo: string;
  status: string;
  unidades: {
    nome: string;
  };
}

interface ChartData {
  name: string;
  value: number;
}

const Relatorios = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("todos");
  const [selectedMonth, setSelectedMonth] = useState("todos");
  const [selectedUnidade, setSelectedUnidade] = useState("todas");

  useEffect(() => {
    console.log("Relatorios: Iniciando carregamento...");
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      console.log("Relatorios: Buscando cursos...");
      const { data, error } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades (nome)
        `)
        .order('inicio');

      if (error) {
        console.error("Relatorios: Erro ao buscar cursos:", error);
        setError("Erro ao carregar dados dos cursos");
        toast.error("Erro ao carregar dados dos cursos");
      } else {
        console.log("Relatorios: Cursos carregados:", data?.length || 0);
        setCursos(data || []);
      }
    } catch (err) {
      console.error("Relatorios: Erro inesperado:", err);
      setError("Erro inesperado ao carregar dados");
      toast.error("Erro inesperado ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableYears = () => {
    const years = cursos.map(curso => new Date(curso.inicio).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const getFilteredCursos = () => {
    return cursos.filter(curso => {
      const cursoYear = new Date(curso.inicio).getFullYear().toString();
      const cursoMonth = (new Date(curso.inicio).getMonth() + 1).toString();
      
      if (selectedYear !== "todos" && cursoYear !== selectedYear) return false;
      if (selectedMonth !== "todos" && cursoMonth !== selectedMonth) return false;
      if (selectedUnidade !== "todas" && curso.unidades.nome !== selectedUnidade) return false;
      
      return true;
    });
  };

  const getCursosPorAno = (): ChartData[] => {
    const cursosPorAno: { [key: string]: number } = {};
    
    cursos.forEach(curso => {
      const year = new Date(curso.inicio).getFullYear().toString();
      cursosPorAno[year] = (cursosPorAno[year] || 0) + 1;
    });

    return Object.entries(cursosPorAno)
      .map(([year, count]) => ({ name: year, value: count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getCursosPorUnidade = (): ChartData[] => {
    const cursosPorUnidade: { [key: string]: number } = {};
    
    getFilteredCursos().forEach(curso => {
      const unidade = curso.unidades.nome;
      cursosPorUnidade[unidade] = (cursosPorUnidade[unidade] || 0) + 1;
    });

    return Object.entries(cursosPorUnidade)
      .map(([unidade, count]) => ({ name: unidade, value: count }));
  };

  const getCursosPorProfessor = (): ChartData[] => {
    const cursosPorProfessor: { [key: string]: number } = {};
    
    getFilteredCursos().forEach(curso => {
      cursosPorProfessor[curso.professor] = (cursosPorProfessor[curso.professor] || 0) + 1;
    });

    return Object.entries(cursosPorProfessor)
      .map(([professor, count]) => ({ name: professor, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getCursosPorPeriodo = (): ChartData[] => {
    const cursosPorPeriodo: { [key: string]: number } = {};
    
    getFilteredCursos().forEach(curso => {
      const periodo = curso.periodo === 'manha' ? 'Manhã' : 
                     curso.periodo === 'tarde' ? 'Tarde' : 'Noite';
      cursosPorPeriodo[periodo] = (cursosPorPeriodo[periodo] || 0) + 1;
    });

    return Object.entries(cursosPorPeriodo)
      .map(([periodo, count]) => ({ name: periodo, value: count }));
  };

  const generatePDF = () => {
    const filteredCursos = getFilteredCursos();
    const currentDate = new Date().toLocaleString('pt-BR');
    
    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Cursos - CMU</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .filters { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; }
            .curso { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .stat-card { padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sistema CMU - Relatório de Cursos</h1>
            <p>Gerado em: ${currentDate}</p>
          </div>
          
          <div class="filters">
            <h3>Filtros Aplicados:</h3>
            <p>Ano: ${selectedYear === 'todos' ? 'Todos' : selectedYear}</p>
            <p>Mês: ${selectedMonth === 'todos' ? 'Todos' : getMonthName(parseInt(selectedMonth))}</p>
            <p>Unidade: ${selectedUnidade === 'todas' ? 'Todas' : selectedUnidade}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Total de Cursos</h3>
              <p style="font-size: 24px; font-weight: bold;">${filteredCursos.length}</p>
            </div>
            <div class="stat-card">
              <h3>Cursos Ativos</h3>
              <p style="font-size: 24px; font-weight: bold;">${filteredCursos.filter(c => c.status === 'ativo').length}</p>
            </div>
          </div>
          
          <h2>Lista de Cursos</h2>
          ${filteredCursos.map(curso => `
            <div class="curso">
              <h4>${curso.titulo}</h4>
              <p><strong>Professor:</strong> ${curso.professor}</p>
              <p><strong>Período:</strong> ${curso.periodo === 'manha' ? 'Manhã' : curso.periodo === 'tarde' ? 'Tarde' : 'Noite'}</p>
              <p><strong>Unidade:</strong> ${curso.unidades.nome}</p>
              <p><strong>Duração:</strong> ${new Date(curso.inicio).toLocaleDateString('pt-BR')} a ${new Date(curso.fim).toLocaleDateString('pt-BR')}</p>
              <p><strong>Status:</strong> ${curso.status === 'ativo' ? 'Ativo' : 'Finalizado'}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const getUnidades = () => {
    const unidades = [...new Set(cursos.map(curso => curso.unidades.nome))];
    return unidades.sort();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    console.log("Relatorios: Mostrando loading...");
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.log("Relatorios: Mostrando erro:", error);
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar relatórios</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  console.log("Relatorios: Renderizando página completa com", cursos.length, "cursos");
  const filteredCursos = getFilteredCursos();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">Análise e estatísticas dos cursos</p>
          </div>
          
          <Button onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione os filtros para personalizar os relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ano</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    {getAvailableYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os meses</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Unidade</label>
                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as unidades</SelectItem>
                    {getUnidades().map(unidade => (
                      <SelectItem key={unidade} value={unidade}>
                        {unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCursos.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredCursos.filter(curso => curso.status === 'ativo').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Finalizados</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredCursos.filter(curso => curso.status === 'finalizado').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores Únicos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[...new Set(filteredCursos.map(curso => curso.professor))].length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cursos por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCursosPorAno()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Cursos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cursos por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCursosPorUnidade()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCursosPorUnidade().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Professores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCursosPorProfessor()} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Cursos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cursos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCursosPorPeriodo()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCursosPorPeriodo().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Relatorios;
