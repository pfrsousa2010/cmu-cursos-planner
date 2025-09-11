
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Curso } from "@/types/calendario";

interface CursoDetailsProps {
  curso: Curso;
  onEdit?: (curso: Curso) => void;
  onViewInsumos?: (curso: Curso) => void;
  showActions?: boolean;
}

const CursoDetails = ({ curso, onEdit, onViewInsumos, showActions = true }: CursoDetailsProps) => {
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

  // Função para verificar se o curso está finalizado
  const isCursoFinalizado = (dataFim: string) => {
    const hoje = new Date();
    const fimCurso = new Date(dataFim + 'T00:00:00');
    
    // Normalizar as datas para comparar apenas o dia (sem horário)
    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimCursoNormalizado = new Date(fimCurso.getFullYear(), fimCurso.getMonth(), fimCurso.getDate());
    
    // Curso está finalizado apenas se a data fim for anterior ao dia atual
    return fimCursoNormalizado < hojeNormalizado;
  };

  const cursoFinalizado = isCursoFinalizado(curso.fim);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-2 mb-2">
          <h3 className="font-semibold text-lg">{curso.titulo}</h3>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className={getPeriodoColor(curso.periodo)}>
              {formatPeriodo(curso.periodo)}
            </Badge>
            {(() => {
              if (!curso.dia_semana || curso.dia_semana.length === 0) {
                return (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Sem dias
                  </Badge>
                );
              }
              
              const todosOsDias: ('segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta')[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
              const temTodosOsDias = todosOsDias.every(dia => curso.dia_semana?.includes(dia));
              
              if (temTodosOsDias) {
                return (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    Todos os dias
                  </Badge>
                );
              }
              
              const diaLabels = {
                'segunda': 'Seg',
                'terca': 'Ter',
                'quarta': 'Qua',
                'quinta': 'Qui',
                'sexta': 'Sex'
              };
              
              return curso.dia_semana.map(dia => (
                <Badge key={dia} variant="outline" className="bg-green-100 text-green-700">
                  {diaLabels[dia as keyof typeof diaLabels] || dia}
                </Badge>
              ));
            })()}
            {cursoFinalizado && (
              <Badge variant="destructive">
                Finalizado
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">Professor: {curso.professor}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Sala:</span>
          <p>{curso.salas?.nome || 'Não definida'}</p>
        </div>
        
        <div>
          <span className="font-medium">Unidade:</span>
          <p>{curso.unidades?.nome || 'Não definida'}</p>
        </div>
        
        <div>
          <span className="font-medium">Duração:</span>
          <p>{format(parseISO(curso.inicio), 'dd/MM')} - {format(parseISO(curso.fim), 'dd/MM')}</p>
        </div>

        <div>
          <span className="font-medium">Matérias:</span>
          <p>{curso.total_materias || 0}</p>
        </div>
        
        <div>
          <span className="font-medium">Carga Horária:</span>
          <p>{curso.carga_horaria ? `${curso.carga_horaria}h` : 'Não definida'}</p>
        </div>
        
        <div>
          <span className="font-medium">Vagas:</span>
          <p>
            {(curso.vaga_inicio || 0) === 0 && (curso.vaga_fim || 0) === 0 
              ? 'Não definido' 
              : (
                  <>
                    <span className="text-green-600 font-medium">{curso.vaga_inicio || 0}</span>
                    {' → '}
                    <span className="text-red-500 font-medium">{curso.vaga_fim || 0}</span>
                  </>
                )
            }
          </p>
        </div>        
      </div>

      {showActions && (
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(curso)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewInsumos?.(curso)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Insumos
          </Button>
        </div>
      )}
    </div>
  );
};

export default CursoDetails;
