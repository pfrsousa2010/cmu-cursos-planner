
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Curso {
  id: string;
  titulo: string;
  professor: string;
  periodo: 'manha' | 'tarde' | 'noite';
  inicio: string;
  fim: string;
  sala_id: string;
  unidades: { nome: string } | null;
  salas: { nome: string } | null;
}

interface CursoDetailsProps {
  curso: Curso;
  onEdit?: (curso: Curso) => void;
  onViewInsumos?: (curso: Curso) => void;
}

const CursoDetails = ({ curso, onEdit, onViewInsumos }: CursoDetailsProps) => {
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{curso.titulo}</h3>
        <p className="text-muted-foreground">Professor: {curso.professor}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Período:</span>
          <Badge className={getPeriodoColor(curso.periodo) + " ml-2"}>
            {formatPeriodo(curso.periodo)}
          </Badge>
        </div>
        
        <div>
          <span className="font-medium">Sala:</span>
          <p>{curso.salas?.nome}</p>
        </div>
        
        <div>
          <span className="font-medium">Unidade:</span>
          <p>{curso.unidades?.nome}</p>
        </div>
        
        <div>
          <span className="font-medium">Duração:</span>
          <p>{format(parseISO(curso.inicio), 'dd/MM')} - {format(parseISO(curso.fim), 'dd/MM')}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" size="sm" className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </Button>
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
    </div>
  );
};

export default CursoDetails;
