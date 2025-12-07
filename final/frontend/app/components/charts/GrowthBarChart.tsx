import { useState } from 'react';
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
import { formatPercentage } from '~/lib/formatters';
import { SmoothedToggle } from './SmoothedToggle';
import { isNumber } from '~/lib/typeGuards';
import { useIsMobileBreakpoint } from '~/hooks/useIsMobile';
import type { SuburbAnalytics, AggregatedSuburbAnalytics } from '~/types';

interface GrowthBarChartProps {
  analytics: SuburbAnalytics | AggregatedSuburbAnalytics;
  height?: number;
}

export function GrowthBarChart({ analytics, height = 300 }: GrowthBarChartProps) {
  const isMobile = useIsMobileBreakpoint();
  const [useSmoothed, setUseSmoothed] = useState(false);
  
  const data = [
    {
      period: '1yr',
      growth: useSmoothed 
        ? (analytics.growth_1yr_percentage_smoothed ?? analytics.growth_1yr_percentage)
        : analytics.growth_1yr_percentage,
    },
    {
      period: '3yr',
      growth: useSmoothed
        ? (analytics.growth_3yr_percentage_smoothed ?? analytics.growth_3yr_percentage)
        : analytics.growth_3yr_percentage,
    },
    {
      period: '5yr',
      growth: useSmoothed
        ? (analytics.growth_5yr_percentage_smoothed ?? analytics.growth_5yr_percentage)
        : analytics.growth_5yr_percentage,
    },
    {
      period: '10yr',
      growth: useSmoothed
        ? (analytics.growth_10yr_percentage_smoothed ?? analytics.growth_10yr_percentage)
        : analytics.growth_10yr_percentage,
    },
    {
      period: 'Since 2005',
      growth: useSmoothed
        ? (analytics.growth_since_2005_percentage_smoothed ?? analytics.growth_since_2005_percentage)
        : analytics.growth_since_2005_percentage,
    },
  ].filter((d) => isNumber(d.growth));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="rounded-lg border bg-white p-2 shadow-lg">
          <p className="font-semibold">{formatPercentage(value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmoothedToggle enabled={useSmoothed} onToggle={setUseSmoothed} />
      </div>
      <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ 
          top: 5, 
          right: isMobile ? 10 : 30, 
          left: isMobile ? 60 : 80, 
          bottom: 5 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value}%`} />
        <YAxis dataKey="period" type="category" width={isMobile ? 55 : 70} />
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
    </div>
  );
}

