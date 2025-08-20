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
  if (!unidadeNome) return 'bg-gray-50/50';
  
  let hash = 0;
  for (let i = 0; i < unidadeNome.length; i++) {
    const char = unidadeNome.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const colors = [
    'bg-green-50/50', 'bg-blue-50/50', 'bg-purple-50/50', 'bg-orange-50/50',
    'bg-pink-50/50', 'bg-indigo-50/50', 'bg-teal-50/50', 'bg-cyan-50/50',
    'bg-amber-50/50', 'bg-rose-50/50', 'bg-violet-50/50', 'bg-lime-50/50',
    'bg-fuchsia-50/50', 'bg-sky-50/50', 'bg-yellow-50/50', 'bg-slate-50/50'
  ];
  
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

export const getUnidadeTextColor = (unidadeNome: string) => {
  if (!unidadeNome) return 'text-gray-700';
  
  let hash = 0;
  for (let i = 0; i < unidadeNome.length; i++) {
    const char = unidadeNome.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const textColors = [
    'text-green-700', 'text-blue-700', 'text-purple-700', 'text-orange-700',
    'text-pink-700', 'text-yellow-700', 'text-indigo-700', 'text-teal-700',
    'text-cyan-700', 'text-amber-700', 'text-lime-700', 'text-rose-700',
    'text-violet-700', 'text-fuchsia-700', 'text-sky-700', 'text-slate-700'
  ];
  
  const colorIndex = Math.abs(hash) % textColors.length;
  return textColors[colorIndex];
};

export const getUnidadeBorder = (unidadeNome: string) => {
  if (!unidadeNome) return 'border-l-4 border-l-gray-300';
  
  let hash = 0;
  for (let i = 0; i < unidadeNome.length; i++) {
    const char = unidadeNome.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const borders = [
    'border-l-4 border-l-green-300', 'border-l-4 border-l-blue-300',
    'border-l-4 border-l-purple-300', 'border-l-4 border-l-orange-300',
    'border-l-4 border-l-pink-300', 'border-l-4 border-l-yellow-300',
    'border-l-4 border-l-indigo-300', 'border-l-4 border-l-teal-300',
    'border-l-4 border-l-cyan-300', 'border-l-4 border-l-amber-300',
    'border-l-4 border-l-lime-300', 'border-l-4 border-l-rose-300',
    'border-l-4 border-l-violet-300', 'border-l-4 border-l-fuchsia-300',
    'border-l-4 border-l-sky-300', 'border-l-4 border-l-slate-300'
  ];
  
  const colorIndex = Math.abs(hash) % borders.length;
  return borders[colorIndex];
};

export const getCursosForSalaAndDay = (cursos: Curso[], salaId: string, day: Date) => {
  return cursos?.filter(curso => {
    if (curso.sala_id !== salaId) return false;
    
    const cursoStart = parseISO(curso.inicio);
    const cursoEnd = parseISO(curso.fim);
    return isWithinInterval(day, { start: cursoStart, end: cursoEnd });
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
  'bg-blue-200 border-blue-400', 'bg-green-200 border-green-400',
  'bg-pink-200 border-pink-400', 'bg-yellow-200 border-yellow-400',
  'bg-purple-200 border-purple-400', 'bg-orange-200 border-orange-400',
  'bg-cyan-200 border-cyan-400', 'bg-amber-200 border-amber-400',
  'bg-lime-200 border-lime-400', 'bg-rose-200 border-rose-400',
  'bg-indigo-200 border-indigo-400', 'bg-teal-200 border-teal-400',
  'bg-emerald-200 border-emerald-400', 'bg-violet-200 border-violet-400',
  'bg-fuchsia-200 border-fuchsia-400', 'bg-sky-200 border-sky-400',
  'bg-slate-200 border-slate-400', 'bg-zinc-200 border-zinc-400',
  'bg-stone-200 border-stone-400', 'bg-red-200 border-red-400'
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
