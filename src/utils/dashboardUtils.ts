import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatPeriodo = (periodo: string) => {
  const periodos = {
    'manha': 'Manhã',
    'tarde': 'Tarde',
    'noite': 'Noite'
  };
  return periodos[periodo as keyof typeof periodos] || periodo;
};

export const formatDate = (date: string, formatStr: string = 'dd/MM') => {
  return format(new Date(date + 'T00:00:00'), formatStr, { locale: ptBR });
};

export const isCourseFinished = (fim: string) => {
  return new Date(fim + 'T23:59:59') < new Date();
};

export const getWeekRange = (date: Date) => {
  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // segunda-feira
    return new Date(d.setDate(diff));
  };
  const endOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 6; // sábado
    return new Date(d.setDate(diff));
  };
  
  return {
    start: startOfWeek(date),
    end: endOfWeek(date)
  };
};

export const getMonthRange = (date: Date) => {
  const inicioMes = new Date(date.getFullYear(), date.getMonth(), 1);
  const fimMes = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    start: inicioMes,
    end: fimMes
  };
};

export const getYearRange = (year: number) => {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
};

export const sortCoursesByStatus = (cursos: any[]) => {
  return cursos.slice().sort((a, b) => {
    const aFim = new Date(a.fim + 'T23:59:59') < new Date();
    const bFim = new Date(b.fim + 'T23:59:59') < new Date();
    if (aFim === bFim) return 0;
    return aFim ? 1 : -1;
  });
};

export const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const getCargaHorariaFaixa = (cargaHoraria: number) => {
  if (cargaHoraria <= 20) return 'Até 20h';
  if (cargaHoraria <= 40) return '21-40h';
  if (cargaHoraria <= 60) return '41-60h';
  if (cargaHoraria <= 80) return '61-80h';
  return 'Mais de 80h';
};

export const getDiaSemanaFormatado = (dia: string) => {
  const dias = {
    'segunda': 'Segunda',
    'terca': 'Terça',
    'quarta': 'Quarta',
    'quinta': 'Quinta',
    'sexta': 'Sexta'
  };
  return dias[dia as keyof typeof dias] || dia;
};

export const calculateTaxaEvasao = (inicio: number, fim: number) => {
  if (inicio === 0) return 0;
  return ((inicio - fim) / inicio * 100);
};

export const calculateEficiencia = (inicio: number, fim: number) => {
  if (inicio === 0) return 0;
  return (fim / inicio * 100);
};
