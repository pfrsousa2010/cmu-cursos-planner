import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarDays, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Curso } from "@/hooks/useDashboardCursos";
import { formatPeriodo } from "@/utils/calendarioUtils";

interface CollapsibleCoursesListProps {
  cursos?: Curso[];
  isLoading?: boolean;
  title: string;
  description: string;
  iconColor: string;
  emptyMessage: string;
}

export const CollapsibleCoursesList = ({ 
  cursos, 
  isLoading, 
  title, 
  description, 
  iconColor, 
  emptyMessage 
}: CollapsibleCoursesListProps) => {
  const [collapsedUnidades, setCollapsedUnidades] = useState<Set<string>>(new Set());

  const agruparCursosPorUnidadeSala = (cursos: Curso[]) => {
    const grupos: { [key: string]: { [key: string]: Curso[] } } = {};
    
    cursos.forEach(curso => {
      const unidadeNome = curso.unidades?.nome || 'Sem unidade';
      const salaNome = curso.salas?.nome || 'Sem sala';
      
      if (!grupos[unidadeNome]) {
        grupos[unidadeNome] = {};
      }
      
      if (!grupos[unidadeNome][salaNome]) {
        grupos[unidadeNome][salaNome] = [];
      }
      
      grupos[unidadeNome][salaNome].push(curso);
    });
    
    return grupos;
  };

  const toggleUnidade = (unidadeNome: string) => {
    setCollapsedUnidades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unidadeNome)) {
        newSet.delete(unidadeNome);
      } else {
        newSet.add(unidadeNome);
      }
      return newSet;
    });
  };

  const recolherTodasUnidades = () => {
    if (cursos && cursos.length > 0) {
      const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursos));
      setCollapsedUnidades(new Set(todasUnidades));
    }
  };

  const expandirTodasUnidades = () => {
    setCollapsedUnidades(new Set());
  };

  const todasUnidadesRecolhidas = () => {
    if (!cursos || cursos.length === 0) return false;
    const todasUnidades = Object.keys(agruparCursosPorUnidadeSala(cursos));
    return todasUnidades.length > 0 && todasUnidades.every(unidade => collapsedUnidades.has(unidade));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-20 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cursos || cursos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className={`h-5 w-5 ${iconColor}`} />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={todasUnidadesRecolhidas() ? expandirTodasUnidades : recolherTodasUnidades}
            className="text-xs"
          >
            {todasUnidadesRecolhidas() ? 'Expandir tudo' : 'Recolher tudo'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(agruparCursosPorUnidadeSala(cursos))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([unidadeNome, salas]) => (
              <Collapsible
                key={unidadeNome}
                open={!collapsedUnidades.has(unidadeNome)}
                onOpenChange={() => toggleUnidade(unidadeNome)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Building2 className={`h-4 w-4 ${iconColor}`} />
                      <span className="font-semibold text-sm flex-1 min-w-0">{unidadeNome}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {Object.values(salas).flat().length} curso{Object.values(salas).flat().length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {collapsedUnidades.has(unidadeNome) ? 'Expandir' : 'Recolher'}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-3">
                    {Object.entries(salas)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([salaNome, cursos]) => (
                        <div key={salaNome} className="ml-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${iconColor.includes('purple') ? 'bg-purple-300' : 'bg-primary/30'} rounded-full`}></div>
                            <span className="text-sm font-medium text-muted-foreground flex-1 min-w-0">{salaNome}</span>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {cursos.length} curso{cursos.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="ml-4 space-y-2">
                            {cursos
                              .slice()
                              .sort((a, b) => {
                                const aFim = new Date(a.fim + 'T23:59:59') < new Date();
                                const bFim = new Date(b.fim + 'T23:59:59') < new Date();
                                if (aFim === bFim) return 0;
                                return aFim ? 1 : -1;
                              })
                              .map((curso) => {
                                const isFinalizado = new Date(curso.fim + 'T23:59:59') < new Date();
                                return (
                                  <div key={curso.id} className="flex items-center justify-between border-b pb-2 gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{curso.titulo}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {curso.professor} • {formatPeriodo(curso.periodo)}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end min-w-[80px] flex-shrink-0">
                                      <Badge variant={isFinalizado ? "destructive" : "outline"} className="text-xs">
                                        {format(new Date(curso.inicio + 'T00:00:00'), 'dd/MM', { locale: ptBR })} - {format(new Date(curso.fim + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                                      </Badge>
                                      {isFinalizado && (
                                        <div className="text-xs text-red-600 font-semibold mt-1">Finalizado</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
