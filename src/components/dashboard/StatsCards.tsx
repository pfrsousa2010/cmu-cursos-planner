import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Building2, CalendarDays, Users } from "lucide-react";
import { DashboardStats } from "@/hooks/useDashboardStats";

interface StatsCardsProps {
  stats?: DashboardStats;
  professoresCount?: number;
  isLoadingProfessores?: boolean;
}

export const StatsCards = ({ stats, professoresCount, isLoadingProfessores }: StatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="text-2xl font-bold">{stats.cursos}</div>
          ) : (
            <Skeleton className="h-8 w-16 rounded" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unidades</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="text-2xl font-bold">{stats.unidades}</div>
          ) : (
            <Skeleton className="h-8 w-16 rounded" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Salas</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="text-2xl font-bold">{stats.salas}</div>
          ) : (
            <Skeleton className="h-8 w-16 rounded" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Professores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingProfessores ? (
            <Skeleton className="h-8 w-16 rounded" />
          ) : (
            <div className="text-2xl font-bold">{professoresCount || 0}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
