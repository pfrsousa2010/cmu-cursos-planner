import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusCurso(dataInicio: string, dataFim: string): 'Previsto' | 'Em andamento' | 'Finalizado' {
  const hoje = new Date();
  const inicioCurso = new Date(dataInicio + 'T00:00:00');
  const fimCurso = new Date(dataFim + 'T00:00:00');

  const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioNormalizado = new Date(inicioCurso.getFullYear(), inicioCurso.getMonth(), inicioCurso.getDate());
  const fimNormalizado = new Date(fimCurso.getFullYear(), fimCurso.getMonth(), fimCurso.getDate());

  if (inicioNormalizado > hojeNormalizado) {
    return 'Previsto';
  } else if (inicioNormalizado <= hojeNormalizado && fimNormalizado >= hojeNormalizado) {
    return 'Em andamento';
  } else {
    return 'Finalizado';
  }
}

export function getStatusBadgeColor(status: 'Previsto' | 'Em andamento' | 'Finalizado'): string {
  const colors = {
    'Previsto': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Em andamento': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Finalizado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };
  return colors[status];
}