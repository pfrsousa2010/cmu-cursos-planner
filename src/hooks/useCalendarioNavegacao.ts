import { useState } from "react";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { ViewMode } from "@/types/calendario";

export const useCalendarioNavegacao = (initialDate: Date = new Date()) => {
  const [currentWeek, setCurrentWeek] = useState(initialDate);
  const [isChangingWeek, setIsChangingWeek] = useState(false);

  const handlePreviousWeek = () => {
    setIsChangingWeek(true);
    setCurrentWeek(subWeeks(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleNextWeek = () => {
    setIsChangingWeek(true);
    setCurrentWeek(addWeeks(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handlePreviousMonth = () => {
    setIsChangingWeek(true);
    setCurrentWeek(subMonths(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleNextMonth = () => {
    setIsChangingWeek(true);
    setCurrentWeek(addMonths(currentWeek, 1));
    setTimeout(() => setIsChangingWeek(false), 300);
  };

  const handleCurrentMonth = () => {
    setCurrentWeek(initialDate);
  };

  const navigateByViewMode = (viewMode: ViewMode, direction: 'next' | 'previous') => {
    if (viewMode === 'semana') {
      if (direction === 'next') {
        handleNextWeek();
      } else {
        handlePreviousWeek();
      }
    } else {
      if (direction === 'next') {
        handleNextMonth();
      } else {
        handlePreviousMonth();
      }
    }
  };

  return {
    currentWeek,
    isChangingWeek,
    handlePreviousWeek,
    handleNextWeek,
    handlePreviousMonth,
    handleNextMonth,
    handleCurrentMonth,
    navigateByViewMode
  };
};
