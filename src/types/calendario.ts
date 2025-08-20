export interface Curso {
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

export interface Unidade {
  id: string;
  nome: string;
}

export interface Sala {
  id: string;
  nome: string;
  unidade_id: string;
  unidades: { nome: string; id: string } | null;
}

export type ViewMode = 'semana' | 'mes';
