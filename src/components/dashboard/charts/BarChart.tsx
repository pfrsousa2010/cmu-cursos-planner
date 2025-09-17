import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";

interface BarChartProps {
  title: string;
  description: string;
  data: any[];
  config: any;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  height?: number;
  margin?: any;
  xAxisDataKey: string;
  yAxisDataKey: string;
  dataKeys: string[];
  colors: string[];
  theme: string;
  showLegend?: boolean;
  xAxisAngle?: number;
  xAxisHeight?: number;
  yAxisLabel?: string;
  customTooltip?: (props: any) => React.ReactNode;
}

export const BarChart = ({
  title,
  description,
  data,
  config,
  isLoading = false,
  emptyMessage,
  emptyIcon,
  height = 350,
  margin = { top: 20, right: 30, left: 0, bottom: 5 },
  xAxisDataKey,
  yAxisDataKey,
  dataKeys,
  colors,
  theme,
  showLegend = true,
  xAxisAngle = 0,
  xAxisHeight = 5,
  yAxisLabel,
  customTooltip
}: BarChartProps) => {
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
        <ChartContainer config={config} className="w-full" style={{ height: `${height}px` }}>
          <RechartsPrimitive.BarChart data={data} margin={margin}>
            <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
            <RechartsPrimitive.XAxis 
              dataKey={xAxisDataKey} 
              angle={xAxisAngle}
              textAnchor={xAxisAngle !== 0 ? "end" : "middle"}
              height={xAxisHeight}
              tick={{ fontSize: 10 }}
              interval={xAxisAngle !== 0 ? 0 : undefined}
            />
            <RechartsPrimitive.YAxis 
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <RechartsPrimitive.Tooltip
              cursor={{ fill: theme === 'dark' ? '#374151' : '#f3f4f6' }}
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
                        <span style={{ color: item.color, fontWeight: 500 }}>{item.dataKey}:</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            />
            {showLegend && (
              <RechartsPrimitive.Legend
                verticalAlign="top"
                align="center"
                iconType="rect"
                wrapperStyle={{ 
                  paddingBottom: 16,
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}
                formatter={(value, entry, idx) => (
                  <span style={{ 
                    color: theme === 'dark' ? '#e5e7eb' : '#374151', 
                    fontWeight: 500 
                  }}>{value}</span>
                )}
              />
            )}
            {dataKeys.map((dataKey, idx) => (
              <RechartsPrimitive.Bar
                key={dataKey}
                dataKey={dataKey}
                fill={colors[idx % colors.length]}
                name={config[dataKey]?.label || dataKey}
                isAnimationActive={false}
                barSize={24}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </RechartsPrimitive.BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
