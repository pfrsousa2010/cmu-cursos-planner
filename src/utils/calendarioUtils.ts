import { parseISO, isWithinInterval } from "date-fns";
import { Curso, Sala } from "@/types/calendario";

export const formatPeriodo = (periodo: string) => {
  const periodos = {
    'manha': 'Manhã',
    'tarde': 'Tarde',
    'noite': 'Noite'
  };
  return periodos[periodo as keyof typeof periodos] || periodo;
};

export const getPeriodoColor = (periodo: string) => {
  const colors = {
    'manha': 'bg-yellow-100 text-yellow-800',
    'tarde': 'bg-orange-100 text-orange-800',
    'noite': 'bg-blue-100 text-blue-800'
  };
  return colors[periodo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getUnidadeColor = (unidadeNome: string) => {
  if (!unidadeNome) return 'bg-muted/30';
  
  let hash = 0;
  for (let i = 0; i < unidadeNome.length; i++) {
    const char = unidadeNome.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const colors = [
    'bg-green-100/50 dark:bg-green-900/30', 'bg-blue-100/50 dark:bg-blue-900/30', 
    'bg-purple-100/50 dark:bg-purple-900/30', 'bg-orange-100/50 dark:bg-orange-900/30',
    'bg-pink-100/50 dark:bg-pink-900/30', 'bg-indigo-100/50 dark:bg-indigo-900/30', 
    'bg-teal-100/50 dark:bg-teal-900/30', 'bg-cyan-100/50 dark:bg-cyan-900/30',
    'bg-amber-100/50 dark:bg-amber-900/30', 'bg-rose-100/50 dark:bg-rose-900/30', 
    'bg-violet-100/50 dark:bg-violet-900/30', 'bg-lime-100/50 dark:bg-lime-900/30',
    'bg-fuchsia-100/50 dark:bg-fuchsia-900/30', 'bg-sky-100/50 dark:bg-sky-900/30', 
    'bg-yellow-100/50 dark:bg-yellow-900/30', 'bg-slate-100/50 dark:bg-slate-900/30'
  ];
  
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

export const getUnidadeTextColor = (unidadeNome: string) => {
  if (!unidadeNome) return 'text-muted-foreground';
  
  let hash = 0;
  for (let i = 0; i < unidadeNome.length; i++) {
    const char = unidadeNome.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const textColors = [
    'text-green-700 dark:text-green-300', 'text-blue-700 dark:text-blue-300', 
    'text-purple-700 dark:text-purple-300', 'text-orange-700 dark:text-orange-300',
    'text-pink-700 dark:text-pink-300', 'text-yellow-700 dark:text-yellow-300', 
    'text-indigo-700 dark:text-indigo-300', 'text-teal-700 dark:text-teal-300',
    'text-cyan-700 dark:text-cyan-300', 'text-amber-700 dark:text-amber-300', 
    'text-lime-700 dark:text-lime-300', 'text-rose-700 dark:text-rose-300',
    'text-violet-700 dark:text-violet-300', 'text-fuchsia-700 dark:text-fuchsia-300', 
    'text-sky-700 dark:text-sky-300', 'text-slate-700 dark:text-slate-300'
  ];
  
  const colorIndex = Math.abs(hash) % textColors.length;
  return textColors[colorIndex];
};

export const getUnidadeBorder = (unidadeNome: string) => {
  if (!unidadeNome) return 'border-l-4 border-l-border';
  
  let hash = 0;
  for (let i = 0; i < unidadeNome.length; i++) {
    const char = unidadeNome.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const borders = [
    'border-l-4 border-l-green-400 dark:border-l-green-600', 
    'border-l-4 border-l-blue-400 dark:border-l-blue-600',
    'border-l-4 border-l-purple-400 dark:border-l-purple-600', 
    'border-l-4 border-l-orange-400 dark:border-l-orange-600',
    'border-l-4 border-l-pink-400 dark:border-l-pink-600', 
    'border-l-4 border-l-yellow-400 dark:border-l-yellow-600',
    'border-l-4 border-l-indigo-400 dark:border-l-indigo-600', 
    'border-l-4 border-l-teal-400 dark:border-l-teal-600',
    'border-l-4 border-l-cyan-400 dark:border-l-cyan-600', 
    'border-l-4 border-l-amber-400 dark:border-l-amber-600',
    'border-l-4 border-l-lime-400 dark:border-l-lime-600', 
    'border-l-4 border-l-rose-400 dark:border-l-rose-600',
    'border-l-4 border-l-violet-400 dark:border-l-violet-600', 
    'border-l-4 border-l-fuchsia-400 dark:border-l-fuchsia-600',
    'border-l-4 border-l-sky-400 dark:border-l-sky-600', 
    'border-l-4 border-l-slate-400 dark:border-l-slate-600'
  ];
  
  const colorIndex = Math.abs(hash) % borders.length;
  return borders[colorIndex];
};

export const getCursosForSalaAndDay = (cursos: Curso[], salaId: string, day: Date) => {
  return cursos?.filter(curso => {
    if (curso.sala_id !== salaId) return false;
    
    const cursoStart = parseISO(curso.inicio);
    const cursoEnd = parseISO(curso.fim);
    
    // Verifica se o dia está dentro do intervalo de datas do curso
    if (!isWithinInterval(day, { start: cursoStart, end: cursoEnd })) {
      return false;
    }
    
    // Mapeia os dias da semana para números (0 = domingo, 1 = segunda, etc.)
    const dayOfWeekMap = {
      'segunda': 1,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5
    };
    
    // Verifica se o dia da semana atual está nos dias da semana do curso
    const currentDayOfWeek = day.getDay();
    const cursoDaysOfWeek = curso.dia_semana.map(dia => dayOfWeekMap[dia]);
    
    return cursoDaysOfWeek.includes(currentDayOfWeek);
  }) || [];
};

export const getSalasToShow = (salas: Sala[], cursosFiltrados: Curso[], selectedSala: string) => {
  if (!salas || !cursosFiltrados) return [];
  
  return salas.filter(sala => {
    if (selectedSala !== "all") {
      return sala.id === selectedSala;
    }
    
    return cursosFiltrados.some(curso => curso.sala_id === sala.id);
  });
};

// Paleta de cores para cursos
const cursoColors = [
  'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-600', 
  'bg-green-200 border-green-400 dark:bg-green-800 dark:border-green-600',
  'bg-pink-200 border-pink-400 dark:bg-pink-800 dark:border-pink-600', 
  'bg-yellow-200 border-yellow-400 dark:bg-yellow-800 dark:border-yellow-600',
  'bg-purple-200 border-purple-400 dark:bg-purple-800 dark:border-purple-600', 
  'bg-orange-200 border-orange-400 dark:bg-orange-800 dark:border-orange-600',
  'bg-cyan-200 border-cyan-400 dark:bg-cyan-800 dark:border-cyan-600', 
  'bg-amber-200 border-amber-400 dark:bg-amber-800 dark:border-amber-600',
  'bg-lime-200 border-lime-400 dark:bg-lime-800 dark:border-lime-600', 
  'bg-rose-200 border-rose-400 dark:bg-rose-800 dark:border-rose-600',
  'bg-indigo-200 border-indigo-400 dark:bg-indigo-800 dark:border-indigo-600', 
  'bg-teal-200 border-teal-400 dark:bg-teal-800 dark:border-teal-600',
  'bg-emerald-200 border-emerald-400 dark:bg-emerald-800 dark:border-emerald-600', 
  'bg-violet-200 border-violet-400 dark:bg-violet-800 dark:border-violet-600',
  'bg-fuchsia-200 border-fuchsia-400 dark:bg-fuchsia-800 dark:border-fuchsia-600', 
  'bg-sky-200 border-sky-400 dark:bg-sky-800 dark:border-sky-600',
  'bg-slate-200 border-slate-400 dark:bg-slate-800 dark:border-slate-600', 
  'bg-zinc-200 border-zinc-400 dark:bg-zinc-800 dark:border-zinc-600',
  'bg-stone-200 border-stone-400 dark:bg-stone-800 dark:border-stone-600', 
  'bg-red-200 border-red-400 dark:bg-red-800 dark:border-red-600'
];

export const getCursoColor = (cursoId: string, cursosFiltrados: Curso[]) => {
  if (!cursosFiltrados) return cursoColors[0];
  
  const cursoIndex = cursosFiltrados.findIndex(c => c.id === cursoId);
  if (cursoIndex === -1) return cursoColors[0];
  
  const colorIndex = cursoIndex % cursoColors.length;
  return cursoColors[colorIndex];
};

export const getTurnoBarColor = (periodo: string) => {
  switch (periodo) {
    case 'manha': return 'bg-yellow-200 border-yellow-400';
    case 'tarde': return 'bg-green-200 border-green-400';
    case 'noite': return 'bg-blue-200 border-blue-400';
    default: return 'bg-gray-200 border-gray-400';
  }
};

export const getCursoColorRGB = (cursoId: string, cursosFiltrados: Curso[]) => {
  if (!cursosFiltrados) return [200, 200, 200];
  
  const cursoIndex = cursosFiltrados.findIndex(c => c.id === cursoId);
  if (cursoIndex === -1) return [200, 200, 200];
  
  const colorMap = [
    [173, 216, 230], [144, 238, 144], [255, 182, 193], [255, 255, 224],
    [221, 160, 221], [255, 218, 185], [224, 255, 255], [255, 236, 139],
    [190, 255, 0], [255, 192, 203], [199, 199, 255], [175, 238, 238],
    [144, 238, 144], [221, 160, 221], [255, 192, 203], [135, 206, 235],
    [211, 211, 211], [220, 220, 220], [245, 245, 245], [255, 182, 193]
  ];
  
  const colorIndex = cursoIndex % colorMap.length;
  return colorMap[colorIndex];
};
