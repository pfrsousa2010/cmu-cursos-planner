import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Curso } from "@/hooks/useDashboardCursos";
import { formatPeriodo } from "@/utils/calendarioUtils";

interface UpcomingCoursesProps {
  cursos?: Curso[];
  isLoading?: boolean;
  title: string;
  description: string;
  iconColor: string;
  badgeVariant: "secondary" | "destructive";
  dateField: "inicio" | "fim";
}

export const UpcomingCourses = ({ 
  cursos, 
  isLoading, 
  title, 
  description, 
  iconColor, 
  badgeVariant,
  dateField 
}: UpcomingCoursesProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${iconColor}`} />
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
                <Skeleton className="h-6 w-12 rounded" />
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
            <AlertCircle className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum curso encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cursos.map((curso) => (
            <div key={curso.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-medium truncate">{curso.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {curso.professor} • {formatPeriodo(curso.periodo)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {curso.unidades?.nome} - {curso.salas?.nome}
                </p>
              </div>
              <Badge variant={badgeVariant}>
                {format(new Date(curso[dateField] + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
