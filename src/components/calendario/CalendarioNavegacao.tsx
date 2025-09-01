import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ViewMode } from "@/types/calendario";

interface CalendarioNavegacaoProps {
  currentWeek: Date;
  viewMode: ViewMode;
  isChangingWeek: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const CalendarioNavegacao: React.FC<CalendarioNavegacaoProps> = ({
  currentWeek,
  viewMode,
  isChangingWeek,
  onPrevious,
  onNext
}) => {
  const renderTitle = () => {
    if (isChangingWeek) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <Skeleton className="h-6 w-32" />
        </div>
      );
    }

    if (viewMode === 'semana') {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
      // Calcular o sábado (5 dias após a segunda-feira)
      const sabado = new Date(startDate);
      sabado.setDate(startDate.getDate() + 5);
      return (
        <h2 className="text-lg font-semibold">
          {format(startDate, 'dd', { locale: ptBR })} - {format(sabado, 'dd MMM yyyy', { locale: ptBR })}
        </h2>
      );
    } else {
      const startMonth = startOfMonth(currentWeek);
      return (
        <h2 className="text-lg font-semibold">
          {format(startMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      );
    }
  };

  const getButtonText = (direction: 'previous' | 'next') => {
    const isSemana = viewMode === 'semana';
    const suffix = isSemana ? 'Semana' : 'Mês';
    
    if (direction === 'previous') {
      return `${suffix} Anterior`;
    } else {
      return `${isSemana ? 'Próxima' : 'Próximo'} ${suffix}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={isChangingWeek}
          >
            <ChevronLeft className="h-4 w-4" />
            {getButtonText('previous')}
          </Button>
          <div className="text-center">
            {renderTitle()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={isChangingWeek}
          >
            {getButtonText('next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export default CalendarioNavegacao;
