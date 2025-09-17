import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";

interface LineChartProps {
  title: string;
  description: string;
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  height?: number;
  margin?: any;
  xAxisDataKey: string;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
    strokeWidth?: number;
  }>;
  theme: string;
  customTooltip?: (props: any) => React.ReactNode;
}

export const LineChart = ({
  title,
  description,
  data,
  isLoading = false,
  emptyMessage,
  emptyIcon,
  height = 350,
  margin = { top: 20, right: 30, left: 0, bottom: 5 },
  xAxisDataKey,
  lines,
  theme,
  customTooltip
}: LineChartProps) => {
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
          <RechartsPrimitive.LineChart data={data} margin={margin}>
            <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
            <RechartsPrimitive.XAxis dataKey={xAxisDataKey} />
            <RechartsPrimitive.YAxis allowDecimals={false} />
            <RechartsPrimitive.Tooltip
              content={customTooltip || (({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className={`rounded border p-2 shadow text-xs ${
                    theme === 'dark' 
                      ? 'bg-card border-border text-card-foreground' 
                      : 'bg-background border-border text-foreground'
                  }`}>
                    <div className="font-semibold mb-1">{label}</div>
                    {payload.map((item, idx) => (
                      <div key={item.dataKey} className="mb-1 flex items-center gap-2">
                        <span style={{ color: item.color, fontWeight: 500 }}>{item.name}:</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            />
            <RechartsPrimitive.Legend />
            {lines.map((line, idx) => (
              <RechartsPrimitive.Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth || 2}
                name={line.name}
              />
            ))}
          </RechartsPrimitive.LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
