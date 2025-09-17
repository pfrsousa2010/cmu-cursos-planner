import { ReactNode } from "react";

interface ChartsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const ChartsSection = ({ title, description, children }: ChartsSectionProps) => {
  return (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
};
