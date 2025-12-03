import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SuburbAnalytics, AggregatedSuburbAnalytics } from '~/types';

interface GrowthBarChartProps {
  analytics: SuburbAnalytics | AggregatedSuburbAnalytics;
  height?: number;
}

export function GrowthBarChart({ analytics, height = 300 }: GrowthBarChartProps) {
  const data = [
    {
      period: '1yr',
      growth: analytics.growth_1yr_percentage,
    },
    {
      period: '3yr',
      growth: analytics.growth_3yr_percentage,
    },
    {
      period: '5yr',
      growth: analytics.growth_5yr_percentage,
    },
    {
      period: '10yr',
      growth: analytics.growth_10yr_percentage,
    },
    {
      period: 'Since 2005',
      growth: analytics.growth_since_2005_percentage,
    },
  ].filter((d) => d.growth !== null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="rounded-lg border bg-white p-2 shadow-lg">
          <p className="font-semibold">{`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value}%`} />
        <YAxis dataKey="period" type="category" width={70} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.growth! >= 0 ? '#10b981' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

