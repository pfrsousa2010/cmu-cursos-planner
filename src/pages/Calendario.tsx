import React, { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit, Download, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isWithinInterval, parseISO, startOfMonth, endOfMonth, getDate, getMonth, getYear, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import CursoDetails from "@/components/CursoDetails";
import CursoForm from "@/components/CursoForm";
import CursoInsumosList from "@/components/CursoInsumosList";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string;
  unidade_id: string;
  status: 'ativo' | 'finalizado';
  unidades: { nome: string; id: string } | null;
  salas: { nome: string; id: string } | null;
}

const Calendario = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<string>("all");
  const [selectedSala, setSelectedSala] = useState<string>("all");
  const [isChangingWeek, setIsChangingWeek] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCursoInsumos, setSelectedCursoInsumos] = useState<Curso | null>(null);
  const [cursoToEdit, setCursoToEdit] = useState<Curso | null>(null);
  const [viewMode, setViewMode] = useState<'semana' | 'mes'>('semana');

  const queryClient = useQueryClient();

  // Buscar cursos da semana ou mês (filtrados por unidade, sala, professor)
  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: [
      viewMode === 'semana' ? 'cursos-semana' : 'cursos-mes',
      currentWeek,
      viewMode
    ],
    queryFn: async () => {
      let query = supabase
        .from('cursos')
        .select(`
          *,
          unidades (id, nome),
          salas (id, nome)
        `)
        .eq('status', 'ativo');

      if (viewMode === 'semana') {
        const startDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
        const endDate = endOfWeek(currentWeek, { weekStartsOn: 0 });
        query = query
          .lte('inicio', format(endDate, 'yyyy-MM-dd'))
          .gte('fim', format(startDate, 'yyyy-MM-dd'));
      } else {
        // visão mensal
        const startMonth = startOfMonth(currentWeek);
        const endMonth = endOfMonth(currentWeek);
        query = query
          .lte('inicio', format(endMonth, 'yyyy-MM-dd'))
          .gte('fim', format(startMonth, 'yyyy-MM-dd'));
      }

      const { data } = await query.order('inicio');
      return data || [];
    }
  });

  // Extrair dados únicos dos cursos para os filtros (sempre todas as opções disponíveis)
  const unidades = React.useMemo(() => {
    if (!cursos) return [];
    const uniqueUnidades = new Map();
    cursos.forEach(curso => {
      if (curso.unidades) {
        uniqueUnidades.set(curso.unidades.id, curso.unidades);
      }
    });
    return Array.from(uniqueUnidades.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cursos]);

  // Filtrar salas baseado na unidade selecionada
  const salas = React.useMemo(() => {
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
    
    // Ordenar por unidade primeiro, depois por nome da sala
    return Array.from(uniqueSalas.values()).sort((a, b) => {
      // Primeiro ordenar por nome da unidade
      const unidadeComparison = (a.unidades?.nome || '').localeCompare(b.unidades?.nome || '');
      if (unidadeComparison !== 0) {
        return unidadeComparison;
      }
      // Se a unidade for a mesma, ordenar por nome da sala
      return a.nome.localeCompare(b.nome);
    });
  }, [cursos]);

  // Filtrar professores baseado na unidade selecionada
  const professores = React.useMemo(() => {
    if (!cursos) return [];
    const uniqueProfessores = [...new Set(cursos.map(curso => curso.professor))];
    return uniqueProfessores.sort();
  }, [cursos]);

  // Filtrar salas baseado na unidade selecionada para os filtros
  const salasFiltradas = React.useMemo(() => {
    if (!cursos) return [];
    
    // Se nenhuma unidade específica está selecionada, mostrar todas as salas
    if (selectedUnidade === "all") {
      return salas;
    }
    
    // Filtrar apenas salas da unidade selecionada
    return salas.filter(sala => sala.unidade_id === selectedUnidade);
  }, [salas, selectedUnidade]);

  // Filtrar professores baseado na unidade selecionada para os filtros
  const professoresFiltrados = React.useMemo(() => {
    if (!cursos) return [];
    
    // Se nenhuma unidade específica está selecionada, mostrar todos os professores
    if (selectedUnidade === "all") {
      return professores;
    }
    
    // Filtrar apenas professores que têm cursos na unidade selecionada
    const professoresUnidade = new Set<string>();
    cursos.forEach(curso => {
      if (curso.unidade_id === selectedUnidade) {
        professoresUnidade.add(curso.professor);
      }
    });
    
    return Array.from(professoresUnidade).sort();
  }, [cursos, selectedUnidade, professores]);

  // Filtrar cursos baseado nos filtros selecionados
  const cursosFiltrados = React.useMemo(() => {
    if (!cursos) return [];
    
    return cursos.filter(curso => {
      if (selectedUnidade !== "all" && curso.unidade_id !== selectedUnidade) return false;
      if (selectedProfessor !== "all" && curso.professor !== selectedProfessor) return false;
      if (selectedSala !== "all" && curso.sala_id !== selectedSala) return false;
      return true;
    });
  }, [cursos, selectedUnidade, selectedProfessor, selectedSala]);

  // Estados de loading baseados apenas na query de cursos
  const loadingUnidades = loadingCursos;
  const loadingSalas = loadingCursos;
  const loadingProfessores = loadingCursos;

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 0 })
  });

  // Mostrar todos os dias da semana (domingo a sábado)
  const weekDaysFull = weekDays; // [domingo, ..., sábado]

  // Cálculo para visão mensal
  const ano = currentWeek.getFullYear();
  const mes = currentWeek.getMonth();
  const startMonth = startOfMonth(currentWeek);
  const endMonth = endOfMonth(currentWeek);
  const totalDiasNoMes = getDate(endMonth);
  const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => new Date(ano, mes, i + 1));

  const getCursosForSalaAndDay = (salaId: string, day: Date) => {
    return cursosFiltrados?.filter(curso => {
      if (curso.sala_id !== salaId) return false;
      
      const cursoStart = parseISO(curso.inicio);
      const cursoEnd = parseISO(curso.fim);
      return isWithinInterval(day, { start: cursoStart, end: cursoEnd });
    }) || [];
  };

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
      'manha': 'bg-yellow-100 text-yellow-800',
      'tarde': 'bg-orange-100 text-orange-800',
      'noite': 'bg-blue-100 text-blue-800'
    };
    return colors[periodo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Função para gerar cor sutil baseada no nome da unidade
  const getUnidadeColor = (unidadeNome: string) => {
    if (!unidadeNome) return 'bg-gray-50/50';
    
    // Gerar uma cor baseada no hash do nome da unidade para manter consistência
    let hash = 0;
    for (let i = 0; i < unidadeNome.length; i++) {
      const char = unidadeNome.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Array de cores pastel suaves
    const colors = [
      'bg-green-50/50',
      'bg-blue-50/50',
      'bg-purple-50/50',
      'bg-orange-50/50',
      'bg-pink-50/50',      
      'bg-indigo-50/50',
      'bg-teal-50/50',
      'bg-cyan-50/50',
      'bg-amber-50/50',      
      'bg-rose-50/50',
      'bg-violet-50/50',
      'bg-lime-50/50',
      'bg-fuchsia-50/50',
      'bg-sky-50/50',
      'bg-yellow-50/50',
      'bg-slate-50/50'
    ];
    
    // Usar o hash para selecionar uma cor consistente
    const colorIndex = Math.abs(hash) % colors.length + 1;
    return colors[colorIndex];
  };

  // Função para obter cor do texto da unidade
  const getUnidadeTextColor = (unidadeNome: string) => {
    if (!unidadeNome) return 'text-gray-700';
    
    // Gerar uma cor de texto baseada no hash do nome da unidade
    let hash = 0;
    for (let i = 0; i < unidadeNome.length; i++) {
      const char = unidadeNome.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Array de cores de texto que combinam com as cores de fundo
    const textColors = [
      'text-green-700',
      'text-blue-700',
      'text-purple-700',
      'text-orange-700',
      'text-pink-700',
      'text-yellow-700',
      'text-indigo-700',
      'text-teal-700',
      'text-cyan-700',
      'text-amber-700',
      'text-lime-700',
      'text-rose-700',
      'text-violet-700',
      'text-fuchsia-700',
      'text-sky-700',
      'text-slate-700'
    ];
    
    // Usar o mesmo hash para manter consistência com a cor de fundo
    const colorIndex = Math.abs(hash) % textColors.length;
    return textColors[colorIndex];
  };

  // Função para obter a borda esquerda da unidade
  const getUnidadeBorder = (unidadeNome: string) => {
    if (!unidadeNome) return 'border-l-4 border-l-gray-300';
    
    // Gerar uma borda baseada no hash do nome da unidade
    let hash = 0;
    for (let i = 0; i < unidadeNome.length; i++) {
      const char = unidadeNome.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Array de bordas que combinam com as cores de fundo
    const borders = [
      'border-l-4 border-l-green-300',
      'border-l-4 border-l-blue-300',
      'border-l-4 border-l-purple-300',
      'border-l-4 border-l-orange-300',
      'border-l-4 border-l-pink-300',
      'border-l-4 border-l-yellow-300',
      'border-l-4 border-l-indigo-300',
      'border-l-4 border-l-teal-300',
      'border-l-4 border-l-cyan-300',
      'border-l-4 border-l-amber-300',
      'border-l-4 border-l-lime-300',
      'border-l-4 border-l-rose-300',
      'border-l-4 border-l-violet-300',
      'border-l-4 border-l-fuchsia-300',
      'border-l-4 border-l-sky-300',
      'border-l-4 border-l-slate-300'
    ];
    
    // Usar o mesmo hash para manter consistência com as outras cores
    const colorIndex = Math.abs(hash) % borders.length;
    return borders[colorIndex];
  };

  const handleCursoClick = (curso: Curso) => {
    setSelectedCurso(curso);
    setDialogOpen(true);
  };

  const handleEditCurso = (curso: Curso) => {
    console.log('Curso selecionado para edição:', curso);
    setCursoToEdit(curso);
    setEditDialogOpen(true);
    setDialogOpen(false);
  };

  const handleViewInsumos = (curso: Curso) => {
    setSelectedCursoInsumos(curso);
    setInsumosDialogOpen(true);
    setDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
    // Invalidar a query de cursos
    queryClient.invalidateQueries({ queryKey: ['cursos-semana'] });
    queryClient.invalidateQueries({ queryKey: ['cursos-mes'] });
    toast.success("Curso atualizado com sucesso!");
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setCursoToEdit(null);
  };

  // Resetar filtros dependentes quando unidade muda
  const handleUnidadeChange = (value: string) => {
    setSelectedUnidade(value);
    setSelectedSala("all");
    setSelectedProfessor("all");
  };

  // Handlers com loading visual
  const handleProfessorChange = (value: string) => {
    setSelectedProfessor(value);
  };

  const handleSalaChange = (value: string) => {
    setSelectedSala(value);
  };

  const handlePreviousWeek = () => {
    setIsChangingWeek(true);
    setCurrentWeek(subWeeks(currentWeek, 1));
    // Simular um pequeno delay para mostrar o loading
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleNextWeek = () => {
    setIsChangingWeek(true);
    setCurrentWeek(addWeeks(currentWeek, 1));
    // Simular um pequeno delay para mostrar o loading
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  // Data de hoje para referência do mês atual
  const [today] = useState(new Date());

  const handlePreviousMonth = () => {
    setIsChangingWeek(true);
    setCurrentWeek(subMonths(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleNextMonth = () => {
    setIsChangingWeek(true);
    setCurrentWeek(addMonths(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleCurrentMonth = () => {
    setCurrentWeek(today);
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    setSelectedUnidade('all');
    setSelectedSala('all');
    setSelectedProfessor('all');
  };

  // Função para exportar a tabela para PDF
  const handleExportPDF = () => {
    if (!cursosFiltrados || cursosFiltrados.length === 0) {
      toast.error("Nenhum curso encontrado para exportar");
      return;
    }

    const doc = new jsPDF('landscape'); // Orientação paisagem para melhor visualização
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Título principal
    doc.setFontSize(16);
    doc.text('Calendário de Cursos', 14, 20);
    
    // Informações dos filtros aplicados
    doc.setFontSize(10);
    let infoY = 30;
    
    // Filtros aplicados
    const filtros = [];
    if (selectedUnidade !== 'all') {
      const unidadeNome = unidades.find(u => u.id === selectedUnidade)?.nome;
      filtros.push(`Unidade: ${unidadeNome}`);
    }
    if (selectedSala !== 'all') {
      const salaNome = salas.find(s => s.id === selectedSala)?.nome;
      filtros.push(`Sala: ${salaNome}`);
    }
    if (selectedProfessor !== 'all') {
      filtros.push(`Professor: ${selectedProfessor}`);
    }
    
    if (filtros.length > 0) {
      doc.text(`Filtros aplicados: ${filtros.join(' | ')}`, 14, infoY);
      infoY += 6;
    }
    
    // Período da visualização e Data de emissão na mesma linha
    if (viewMode === 'semana') {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const endDate = endOfWeek(currentWeek, { weekStartsOn: 0 });
      doc.text(`Período: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`, 14, infoY);
    } else {
      const startMonth = startOfMonth(currentWeek);
      const endMonth = endOfMonth(currentWeek);
      doc.text(`Mês: ${format(startMonth, 'MMMM yyyy', { locale: ptBR })}`, 14, infoY);
    }
    
    // Data de emissão na mesma linha, com margem de aproximadamente 10px
    doc.text(`Data de emissão: ${dataAtual}`, 120, infoY);
    infoY += 8;
    
    // Preparar dados da tabela - uma única tabela com todas as unidades
    let tableData: any[] = [];
    
    if (viewMode === 'semana') {
      // Cabeçalho da tabela semanal
      const headers = ['Turno', 'Salas'];
      weekDaysFull.forEach(day => {
        const dayName = format(day, 'EEEE', { locale: ptBR });
        // Remover "-feira" dos dias da semana
        const shortDayName = dayName.replace('-feira', '');
        headers.push(`${shortDayName} ${format(day, 'dd/MM')}`);
      });
      
      // Para cada sala, adicionar os dados agrupados por turno
      salasToShow.forEach(sala => {
        // Linhas para cada turno da mesma sala
        const turnos = ['manha', 'tarde', 'noite'];
        turnos.forEach(turno => {
          const row = [formatPeriodo(turno), `${sala.unidades?.nome} - ${sala.nome}`]; // Turno e Unidade - Sala
          
          // Adicionar dados dos cursos para cada dia da semana
          weekDaysFull.forEach(day => {
            const cursosDay = getCursosForSalaAndDay(sala.id, day).filter(
              curso => curso.periodo === turno
            );
            
            if (cursosDay.length > 0) {
              const curso = cursosDay[0];
              row.push(`${curso.titulo} -\n${curso.professor}\n(${format(parseISO(curso.inicio), 'dd/MM')}_${format(parseISO(curso.fim), 'dd/MM')})`);
            } else {
              row.push('-');
            }
          });
          
          tableData.push(row);
        });
      });
      
      // Adicionar uma linha vazia no início para criar espaçamento
      // const emptyRow = new Array(headers.length).fill('');
      // tableData.unshift(emptyRow);
      
      // Configuração da tabela semanal
      const columnStyles: any = {
        0: { cellWidth: 25, halign: 'center' as const }, // Turno
        1: { cellWidth: 35, halign: 'center' as const }   // Salas
      };
      
      // Largura das colunas dos dias
      weekDaysFull.forEach((_, index) => {
        columnStyles[index + 2] = { cellWidth: 30, halign: 'center' as const };
      });
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: infoY + 3,
        margin: { left: 14, right: 20 },
        theme: 'grid',
        headStyles: { 
          fillColor: [74, 144, 226], 
          textColor: 255, 
          halign: 'center',
          fontSize: 9
        },
        bodyStyles: { 
          textColor: 0,
          fontSize: 8,
          cellPadding: 2
        },
        styles: { 
          fontSize: 8,
          cellPadding: 1
        },
        columnStyles,
        didParseCell: function (data) {
          // Ocultar a primeira linha da tabela (linha vazia)
          console.log(`data.cell.raw: ${data.cell.raw} \n data.column.index: ${data.column.index} \n data.row.index: ${data.row.index} \n data.section: ${data.section}`);
          // if (data.section === 'body' && data.row.index === 0) {
          //   data.cell.styles.fillColor = [255, 255, 255]; // Fundo branco
          //   data.cell.styles.textColor = [255, 255, 255]; // Texto branco (invisível)
          //   data.cell.styles.lineWidth = 0; // Sem bordas
          // }
          
          // Mesclar células da coluna Turno quando o valor for o mesmo
          if (data.section === 'body' && data.column.index === 0 && data.row.index >= 0) {
            const currentValue = tableData[data.row.index][0];
            const prevValue = data.row.index > 0 ? tableData[data.row.index - 1][0] : null;
            
            if (prevValue === currentValue) {
              // Mesclar com a linha anterior
              data.cell.rowSpan = 1;
              data.cell.styles.cellPadding = 0;
              data.cell.styles.fillColor = [255, 255, 255]; // Fundo branco para células mescladas
            } else {
              // Contar quantas linhas consecutivas têm o mesmo valor
              let rowSpan = 1;
              for (let i = data.row.index + 1; i < tableData.length; i++) {
                if (tableData[i][0] === currentValue) {
                  rowSpan++;
                } else {
                  break;
                }
              }
              data.cell.rowSpan = rowSpan;
              // Centralizar verticalmente o texto nas células mescladas
              data.cell.styles.valign = 'middle';
            }
          }
          
          // Mesclar células da coluna Salas quando o valor for o mesmo
          if (data.section === 'body' && data.column.index === 1 && data.row.index >= 0) {
            const currentValue = tableData[data.row.index][1];
            
            // Verificar se é a primeira ocorrência desta sala
            let isFirstOccurrence = true;
            for (let i = data.row.index - 1; i >= 0; i--) {
              if (tableData[i][1] === currentValue) {
                isFirstOccurrence = false;
                break;
              }
            }
            
            if (isFirstOccurrence) {
              // É a primeira ocorrência da sala - contar quantas linhas consecutivas têm o mesmo valor
              let rowSpan = 1;
              for (let i = data.row.index + 1; i < tableData.length; i++) {
                if (tableData[i][1] === currentValue) {
                  rowSpan++;
                } else {
                  break;
                }
              }
              
              // Aplicar rowSpan para mesclar as células
              data.cell.rowSpan = rowSpan;
              // Centralizar verticalmente o texto nas células mescladas
              data.cell.styles.valign = 'middle';
            } else {
              // Não é a primeira ocorrência - ocultar a célula (será mesclada com a primeira)
              data.cell.rowSpan = 1;
              data.cell.styles.cellPadding = 0;
              data.cell.styles.fillColor = [255, 255, 255]; // Fundo branco para células mescladas
            }
          }
        },
        didDrawPage: function (data) {
          // Rodapé com numeração de páginas
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text('Sistema de Cursos - CMU', 14, pageHeight - 10);
          const pageCount = doc.getNumberOfPages();
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, 280, pageHeight - 10, { align: 'right' });
        }
      });
      
    } else {
      // Cabeçalho da tabela mensal
      const headers = ['Sala/Unidade', 'Turno'];
      diasDoMes.forEach((_, i) => {
        headers.push(String(i + 1).padStart(2, '0'));
      });
      
      // Dados da tabela mensal
      salasToShow.forEach(sala => {
        const turnos = ['manha', 'tarde', 'noite'];
        turnos.forEach(turno => {
          const row = [
            sala.nome + '\n' + (sala.unidades?.nome || ''),
            formatPeriodo(turno)
          ];
          
          diasDoMes.forEach(dia => {
            const cursosTurno = cursosFiltrados.filter(curso =>
              curso.sala_id === sala.id &&
              curso.periodo === turno &&
              parseISO(curso.inicio) <= dia &&
              parseISO(curso.fim) >= dia
            );
            
            if (cursosTurno.length > 0) {
              const curso = cursosTurno[0]; // Pegar o primeiro curso se houver múltiplos
              row.push(`${curso.titulo}\n${curso.professor}`);
            } else {
              row.push('-');
            }
          });
          
          tableData.push(row);
        });
      });
      
      // Configuração da tabela mensal
      const columnStyles: any = {
        0: { cellWidth: 35, halign: 'center' as const },
        1: { cellWidth: 20, halign: 'center' as const }
      };
      
      // Largura das colunas dos dias (muito estreitas)
      diasDoMes.forEach((_, i) => {
        columnStyles[i + 2] = { cellWidth: 8, halign: 'center' as const };
      });
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: infoY + 1, // Reduzido o espaçamento
        margin: { left: 14, right: 0 }, // Diminu打da margem direita
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255, 
          halign: 'center',
          fontSize: 8
        },
        bodyStyles: { 
          textColor: 0,
          fontSize: 6,
          cellPadding: 1
        },
        styles: { 
          fontSize: 6,
          cellPadding: 0.5
        },
        columnStyles,
        didDrawPage: function (data) {
          // Rodapé com numeração de páginas
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text('Sistema de Cursos - CMU', 14, pageHeight - 10);
          const pageCount = doc.getNumberOfPages();
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, 280, pageHeight - 10, { align: 'right' });
        }
      });
    }
    
    // Nome do arquivo
    const sanitize = (str: string) => (str || '').normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const viewModeStr = viewMode === 'semana' ? 'semanal' : 'mensal';
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataStr = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const fileName = `calendario_${viewModeStr}_${dataStr}.pdf`;
    doc.save(fileName);
    
    toast.success("Calendário exportado com sucesso!");
  };

  // Mostrar apenas salas que têm cursos após a aplicação dos filtros
  let salasToShow: typeof salas = [];
  if (salas && cursosFiltrados) {
    // Filtrar salas que têm pelo menos um curso após a aplicação dos filtros
    salasToShow = salas.filter(sala => {
      // Se um filtro de sala específica está ativo, mostrar apenas essa sala
      if (selectedSala !== "all") {
        return sala.id === selectedSala;
      }
      
      // Verificar se a sala tem cursos após a aplicação dos filtros
      return cursosFiltrados.some(curso => curso.sala_id === sala.id);
    });
  }

  // Estado de loading geral
  const isLoading = loadingCursos || isChangingWeek;

  // Paleta de cores pastel para cursos - expandida para mais variedade
  const cursoColors = [
    'bg-blue-200 border-blue-400',
    'bg-green-200 border-green-400',
    'bg-pink-200 border-pink-400',
    'bg-yellow-200 border-yellow-400',
    'bg-purple-200 border-purple-400',
    'bg-orange-200 border-orange-400',
    'bg-cyan-200 border-cyan-400',
    'bg-amber-200 border-amber-400',
    'bg-lime-200 border-lime-400',
    'bg-rose-200 border-rose-400',
    'bg-indigo-200 border-indigo-400',
    'bg-teal-200 border-teal-400',
    'bg-emerald-200 border-emerald-400',
    'bg-violet-200 border-violet-400',
    'bg-fuchsia-200 border-fuchsia-400',
    'bg-sky-200 border-sky-400',
    'bg-slate-200 border-slate-400',
    'bg-zinc-200 border-zinc-400',
    'bg-stone-200 border-stone-400',
    'bg-red-200 border-red-400',
    'bg-orange-200 border-orange-400',
    'bg-amber-200 border-amber-400',
    'bg-yellow-200 border-yellow-400',
    'bg-lime-200 border-lime-400',
    'bg-green-200 border-green-400',
    'bg-emerald-200 border-emerald-400',
    'bg-teal-200 border-teal-400',
    'bg-cyan-200 border-cyan-400',
    'bg-sky-200 border-sky-400',
    'bg-blue-200 border-blue-400',
    'bg-indigo-200 border-indigo-400',
    'bg-violet-200 border-violet-400',
    'bg-purple-200 border-purple-400',
    'bg-fuchsia-200 border-fuchsia-400',
    'bg-pink-200 border-pink-400',
    'bg-rose-200 border-rose-400',
  ];
  // Função para pegar cor baseada no id do curso - versão melhorada
  function getCursoColor(cursoId: string) {
    // Criar um mapeamento único de cores para cada curso
    if (!cursosFiltrados) return cursoColors[0];
    
    // Encontrar o índice do curso na lista filtrada
    const cursoIndex = cursosFiltrados.findIndex(c => c.id === cursoId);
    if (cursoIndex === -1) return cursoColors[0];
    
    // Usar o índice para garantir cores únicas
    const colorIndex = cursoIndex % cursoColors.length;
    const curso = cursosFiltrados[cursoIndex];
    
    return cursoColors[colorIndex];
  }

  // Função para pegar cor baseada no turno (para barras do mensal)
  const getTurnoBarColor = (periodo: string) => {
    switch (periodo) {
      case 'manha':
        return 'bg-yellow-200 border-yellow-400';
      case 'tarde':
        return 'bg-green-200 border-green-400';
      case 'noite':
        return 'bg-blue-200 border-blue-400';
      default:
        return 'bg-gray-200 border-gray-400';
    }
  };

  // Geração das linhas da tabela mensal
  const linhasMensais = (salasToShow || []).flatMap((sala) => {
    const turnos = ['manha', 'tarde', 'noite'];
    return turnos.map((turno, turnoIdx) => {
      const cursosTurno = (cursosFiltrados || []).filter(curso =>
        curso.sala_id === sala.id &&
        curso.periodo === turno &&
        parseISO(curso.inicio) <= endMonth &&
        parseISO(curso.fim) >= startMonth
      ).sort((a, b) => parseISO(a.inicio).getTime() - parseISO(b.inicio).getTime());
      
      // Sempre criar uma linha, mesmo sem cursos, para mostrar sala/unidade
      const cells = [];
      let currentDay = 0;
      
      if (cursosTurno.length > 0) {
        // Adicionar células para cursos existentes
        for (const curso of cursosTurno) {
          const inicio = parseISO(curso.inicio);
          const fim = parseISO(curso.fim);
          const startIdx = Math.max(0, inicio.getMonth() === mes ? inicio.getDate() - 1 : 0);
          const endIdx = Math.min(totalDiasNoMes - 1, fim.getMonth() === mes ? fim.getDate() - 1 : totalDiasNoMes - 1);
          
          if (startIdx > currentDay) {
            for (let i = currentDay; i < startIdx; i++) {
              cells.push(<TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-top p-1 h-[56px]"></TableCell>);
            }
          }
          
          cells.push(
            <TableCell
              key={`curso-${curso.id}`}
              colSpan={endIdx - startIdx + 1}
              className={`align-middle p-0 text-center font-medium whitespace-nowrap ${getCursoColor(curso.id)} border cursor-pointer`}
              style={{ minWidth: (endIdx - startIdx + 1) * 20 }}
              onClick={() => handleCursoClick(curso)}
            >
              <div className="flex items-center justify-center h-full w-full" style={{ minHeight: 24 }}>
                <span className="block w-full truncate" style={{ fontSize: '0.8rem' }}>
                  {curso.titulo} - {curso.professor} <br />
                  <span className="text-xs">{format(parseISO(curso.inicio), 'dd/MM')} - {format(parseISO(curso.fim), 'dd/MM')}</span>
                </span>
              </div>
            </TableCell>
          );
          currentDay = endIdx + 1;
        }
      }
      
      // Preencher células restantes com células vazias
      if (currentDay < totalDiasNoMes) {
        for (let i = currentDay; i < totalDiasNoMes; i++) {
          cells.push(<TableCell key={`empty-${sala.id}-${turno}-${i}`} className="align-top p-1 h-[56px]"></TableCell>);
        }
      }
      
      return (
        <TableRow key={sala.id + '-' + turno} className={getUnidadeColor(sala.unidades?.nome || '') + ' h-[56px]'}>
          {turnoIdx === 0 ? (
            <TableCell 
              rowSpan={3} 
              className={`font-medium align-middle h-full ${getUnidadeBorder(sala.unidades?.nome || '')}`}
              style={{ height: '100%' }}
            >
              <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                <div className="font-semibold text-sm">{sala.nome}</div>
                <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                  {sala.unidades?.nome}
                </div>
              </div>
            </TableCell>
          ) : null}
          <TableCell className="font-medium align-middle w-16 text-right pr-2 h-[56px]">
            {formatPeriodo(turno)}
          </TableCell>
          {cells}
        </TableRow>
      );
    });
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Cursos</h1>            
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isLoading || !cursosFiltrados || cursosFiltrados.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar tabela
            </Button>
            <span className="text-sm font-medium">Visão Semanal</span>
            <Switch
              checked={viewMode === 'mes'}
              onCheckedChange={(checked) => setViewMode(checked ? 'mes' : 'semana')}
              disabled={isLoading}
            />
            <span className="text-sm font-medium">Visão Mensal</span>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Unidade</label>
              {loadingUnidades ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedUnidade} onValueChange={handleUnidadeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unidades?.map(unidade => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Sala</label>
              {loadingSalas ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedSala} onValueChange={handleSalaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as salas</SelectItem>
                    {salasFiltradas?.map(sala => (
                      <SelectItem key={sala.id} value={sala.id}>
                        {sala.nome} - {sala.unidades?.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Professor</label>
              {loadingProfessores ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedProfessor} onValueChange={handleProfessorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os professores</SelectItem>
                    {professoresFiltrados?.map(professor => (
                      <SelectItem key={professor} value={professor}>
                        {professor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimparFiltros}
              className="self-end"
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* Navegação da semana/mês */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={viewMode === 'semana' ? handlePreviousWeek : () => handlePreviousMonth()}
                disabled={isChangingWeek}
              >
                <ChevronLeft className="h-4 w-4" />
                {viewMode === 'semana' ? 'Semana Anterior' : 'Mês Anterior'}
              </Button>
              <div className="text-center">
                {isChangingWeek ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <Skeleton className="h-6 w-32" />
                  </div>
                ) : viewMode === 'semana' ? (
                  <h2 className="text-lg font-semibold">
                    {format(weekDaysFull[0], 'dd', { locale: ptBR })} - {format(weekDaysFull[6], 'dd MMM yyyy', { locale: ptBR })}
                  </h2>
                ) : (
                  <h2 className="text-lg font-semibold">
                    {format(startMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewMode === 'semana' ? handleNextWeek : () => handleNextMonth()}
                  disabled={isChangingWeek}
                >
                  {viewMode === 'semana' ? 'Próxima Semana' : 'Próximo Mês'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabela de cursos por sala - visão semanal ou mensal */}
        {viewMode === 'semana' ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Calendário Semanal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="table-fixed" style={{ minWidth: '100%' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-semibold">SALAS</TableHead>
                      {weekDaysFull.map((day) => (
                        <TableHead key={day.toISOString()} className="text-center min-w-[200px] font-semibold">
                          <div className="flex flex-col">
                            <span className="capitalize text-sm">
                              {format(day, 'EEEE', { locale: ptBR })}
                            </span>
                            <span className="text-lg font-bold">
                              {format(day, 'dd/MM')}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSalas ? (
                      // Loading skeleton para as salas
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium bg-gray-50 align-top">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </TableCell>
                          {weekDaysFull.map((day) => (
                            <TableCell key={day.toISOString()} className="align-top p-2">
                              <div className="space-y-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-12 w-full" />
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : salasToShow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                          {"Nenhuma sala com cursos encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      salasToShow.map((sala) => (
                        <TableRow key={sala.id} className={getUnidadeColor(sala.unidades?.nome || '')}>
                          <TableCell className="font-medium align-middle">
                            <div className="flex flex-col items-center justify-center h-full space-y-1 py-2">
                              <div className="font-semibold text-sm">{sala.nome}</div>
                              <div className={`text-xs font-medium ${getUnidadeTextColor(sala.unidades?.nome || '')}`}>
                                {sala.unidades?.nome}
                              </div>
                            </div>
                          </TableCell>
                          {weekDaysFull.map((day) => {
                            const periodoOrder = ['manha', 'tarde', 'noite'];
                            const cursosDay = [...getCursosForSalaAndDay(sala.id, day)].sort((a, b) => periodoOrder.indexOf(a.periodo) - periodoOrder.indexOf(b.periodo));
                            return (
                              <TableCell key={day.toISOString()} className="align-top p-2">
                                <div className="space-y-2">
                                  {loadingCursos ? (
                                    // Loading skeleton para os cursos
                                    Array.from({ length: 2 }).map((_, index) => (
                                      <Skeleton key={index} className="h-16 w-full" />
                                    ))
                                  ) : (
                                    cursosDay.map((curso) => (
                                      <div
                                        key={curso.id}
                                        className={`p-2 rounded border bg-white hover:shadow-md transition-shadow cursor-pointer text-xs ${getUnidadeColor(curso.unidades?.nome || '')}`}
                                        onClick={() => handleCursoClick(curso)}
                                      >
                                        <div className="space-y-1">
                                          <div className="font-medium leading-tight">{curso.titulo}</div>
                                          <div className="text-muted-foreground">{curso.professor}</div>
                                          <Badge 
                                            variant="secondary" 
                                            className={getPeriodoColor(curso.periodo) + " text-xs px-1 py-0"}
                                          >
                                            {formatPeriodo(curso.periodo)}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                  {!loadingCursos && cursosDay.length === 0 && (
                                    <div className="text-center text-muted-foreground text-xs py-2">
                                      -
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Calendário Mensal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div>
                <Table className="table-fixed" style={{ minWidth: '100%' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-semibold">Sala/Unidade</TableHead>
                      <TableHead className="w-16 font-semibold">Turno</TableHead>
                      {diasDoMes.map((dia, i) => (
                        <TableHead key={i} className="text-center font-semibold" style={{ minWidth: 30, fontSize: '0.8rem', padding: 0 }}>
                          {String(i + 1).padStart(2, '0')}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSalas ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium bg-gray-50 align-top">
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          {diasDoMes.map((_, i) => (
                            <TableCell key={i} className="align-top p-2">
                              <Skeleton className="h-8 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : salasToShow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={totalDiasNoMes + 2} className="text-center py-4 text-muted-foreground">
                          {"Nenhuma sala com cursos encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      linhasMensais
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}

        {/* Detalhes do Curso (se selecionado) */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            {selectedCurso && (
              <CursoDetails curso={selectedCurso} onEdit={handleEditCurso} onViewInsumos={handleViewInsumos} />
            )}
          </DialogContent>
        </Dialog>

        {/* Insumos do Curso (se selecionado) */}
        <Dialog open={insumosDialogOpen} onOpenChange={setInsumosDialogOpen}>
          <DialogContent>
            {selectedCursoInsumos && (
              <CursoInsumosList 
                cursoId={selectedCursoInsumos.id}
                cursoTitulo={selectedCursoInsumos.titulo}
                professor={selectedCursoInsumos.professor}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Formulário de Edição de Curso (se selecionado) */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {cursoToEdit && (
              <CursoForm 
                curso={cursoToEdit}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Calendario;