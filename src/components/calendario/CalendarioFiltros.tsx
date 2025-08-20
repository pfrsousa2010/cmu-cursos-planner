import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon } from "lucide-react";
import { Unidade, Sala } from "@/types/calendario";

interface CalendarioFiltrosProps {
  selectedUnidade: string;
  selectedProfessor: string;
  selectedSala: string;
  unidades: Unidade[];
  salasFiltradas: Sala[];
  professoresFiltrados: string[];
  loadingUnidades: boolean;
  loadingSalas: boolean;
  loadingProfessores: boolean;
  onUnidadeChange: (value: string) => void;
  onProfessorChange: (value: string) => void;
  onSalaChange: (value: string) => void;
  onLimparFiltros: () => void;
}

const CalendarioFiltros: React.FC<CalendarioFiltrosProps> = ({
  selectedUnidade,
  selectedProfessor,
  selectedSala,
  unidades,
  salasFiltradas,
  professoresFiltrados,
  loadingUnidades,
  loadingSalas,
  loadingProfessores,
  onUnidadeChange,
  onProfessorChange,
  onSalaChange,
  onLimparFiltros
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Unidade</label>
          {loadingUnidades ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedUnidade} onValueChange={onUnidadeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades?.map(unidade => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Sala</label>
          {loadingSalas ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedSala} onValueChange={onSalaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as salas</SelectItem>
                {salasFiltradas?.map(sala => (
                  <SelectItem key={sala.id} value={sala.id}>
                    {sala.nome} - {sala.unidades?.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Professor</label>
          {loadingProfessores ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedProfessor} onValueChange={onProfessorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os professores</SelectItem>
                {professoresFiltrados?.map(professor => (
                  <SelectItem key={professor} value={professor}>
                    {professor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>            
        <Button
          variant="outline"
          size="sm"
          onClick={onLimparFiltros}
          className="self-end"
        >
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );
};

export default CalendarioFiltros;
