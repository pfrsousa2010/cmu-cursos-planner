import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";

interface ScatterChartProps {
  title: string;
  description: string;
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  height?: number;
  margin?: any;
  xAxisDataKey: string;
  yAxisDataKey: string;
  xAxisName: string;
  yAxisName: string;
  xAxisUnit?: string;
  yAxisUnit?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color: string;
  radius?: number;
  theme: string;
  customTooltip?: (props: any) => React.ReactNode;
}

export const ScatterChart = ({
  title,
  description,
  data,
  isLoading = false,
  emptyMessage,
  emptyIcon,
  height = 400,
  margin = { top: 20, right: 30, left: 20, bottom: 5 },
  xAxisDataKey,
  yAxisDataKey,
  xAxisName,
  yAxisName,
  xAxisUnit,
  yAxisUnit,
  xAxisLabel,
  yAxisLabel,
  color,
  radius = 6,
  theme,
  customTooltip
}: ScatterChartProps) => {
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
        <ChartContainer config={{}} className="w-full" style={{ height: `${height}px` }}>
          <RechartsPrimitive.ScatterChart data={data} margin={margin}>
            <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
            <RechartsPrimitive.XAxis 
              dataKey={xAxisDataKey} 
              name={xAxisName}
              unit={xAxisUnit}
              tick={{ fontSize: 12 }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
            />
            <RechartsPrimitive.YAxis 
              dataKey={yAxisDataKey}
              name={yAxisName}
              unit={yAxisUnit}
              tick={{ fontSize: 12 }}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <RechartsPrimitive.Tooltip
              content={customTooltip || (({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className={`rounded border p-2 shadow text-xs ${
                    theme === 'dark' 
                      ? 'bg-card border-border text-card-foreground' 
                      : 'bg-background border-border text-foreground'
                  }`}>
                    <div className="font-semibold mb-1">{data.titulo || data.nome}</div>
                    <div>{xAxisName}: {data[xAxisDataKey]}{xAxisUnit}</div>
                    <div>{yAxisName}: {data[yAxisDataKey]}{yAxisUnit}</div>
                  </div>
                );
              })}
            />
            <RechartsPrimitive.Scatter 
              dataKey={yAxisDataKey} 
              fill={color}
              r={radius}
            />
          </RechartsPrimitive.ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
