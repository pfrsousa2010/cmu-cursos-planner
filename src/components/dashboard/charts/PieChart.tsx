import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";

interface PieChartProps {
  title: string;
  description: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  height?: number;
  colors: string[];
  showLabel?: boolean;
  labelFormatter?: (entry: any) => string;
  customTooltip?: (props: any) => React.ReactNode;
}

export const PieChart = ({
  title,
  description,
  data,
  dataKey,
  nameKey,
  isLoading = false,
  emptyMessage,
  emptyIcon,
  height = 300,
  colors,
  showLabel = true,
  labelFormatter,
  customTooltip
}: PieChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <Skeleton className="h-48 w-full rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            {emptyIcon}
            <p className="text-lg font-medium">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="w-full max-w-full overflow-hidden" style={{ height: `${height}px` }}>
          <RechartsPrimitive.PieChart>
            <RechartsPrimitive.Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={showLabel ? (labelFormatter || (({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`)) : undefined}
            >
              {data.map((entry, index) => (
                <RechartsPrimitive.Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </RechartsPrimitive.Pie>
            <RechartsPrimitive.Tooltip content={customTooltip} />
            <RechartsPrimitive.Legend />
          </RechartsPrimitive.PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
