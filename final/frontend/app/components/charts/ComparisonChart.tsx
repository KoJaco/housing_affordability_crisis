import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button } from '~/components/ui/button';
import type { BulkSuburbsData } from '~/types';

interface ComparisonChartProps {
  data: BulkSuburbsData;
  height?: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

type TimePeriod = '1yr' | '3yr' | '5yr' | 'max';

export function ComparisonChart({ data, height = 400 }: ComparisonChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('max');
  const suburbs = Object.keys(data);
  
  if (suburbs.length === 0) {
    return <div className="flex h-[400px] items-center justify-center">No data</div>;
  }

  // Calculate date cutoff based on time period
  const cutoffDate = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    switch (timePeriod) {
      case '1yr':
        return { year: currentYear - 1, quarter: currentQuarter };
      case '3yr':
        return { year: currentYear - 3, quarter: currentQuarter };
      case '5yr':
        return { year: currentYear - 5, quarter: currentQuarter };
      case 'max':
      default:
        return { year: 2000, quarter: 1 }; // Show all data
    }
  }, [timePeriod]);

  // Combine quarterly data from all suburbs and filter by time period
  const sortedQuarters = useMemo(() => {
    // Collect all unique quarters
    const allQuarters = new Set<string>();
    suburbs.forEach((suburb) => {
      const suburbData = data[suburb];
      if (!suburbData || !suburbData.quarterly) return;
      suburbData.quarterly.forEach((q) => {
        if (q.median_price !== null && q.median_price !== undefined) {
          allQuarters.add(`Q${q.quarter} ${q.year}`);
        }
      });
    });

    // Sort quarters
    const quarters = Array.from(allQuarters).sort((a, b) => {
      const [qA, yA] = a.split(' ');
      const [qB, yB] = b.split(' ');
      const yearA = parseInt(yA);
      const yearB = parseInt(yB);
      if (yearA !== yearB) return yearA - yearB;
      return parseInt(qA.slice(1)) - parseInt(qB.slice(1));
    });

    // Filter by time period
    if (timePeriod === 'max') return quarters;

    return quarters.filter((quarterStr) => {
      const [qStr, yStr] = quarterStr.split(' ');
      const year = parseInt(yStr);
      const quarter = parseInt(qStr.slice(1));
      
      if (year > cutoffDate.year) return true;
      if (year === cutoffDate.year && quarter >= cutoffDate.quarter) return true;
      return false;
    });
  }, [data, suburbs, timePeriod, cutoffDate]);

  // Build chart data
  const chartData = useMemo(() => {
    return sortedQuarters.map((quarter) => {
    const entry: Record<string, any> = { quarter };
    suburbs.forEach((suburb) => {
      const suburbData = data[suburb];
      if (!suburbData || !suburbData.quarterly) {
        entry[suburb] = null;
        return;
      }
      const quarterData = suburbData.quarterly.find(
        (q) => `Q${q.quarter} ${q.year}` === quarter && q.median_price != null
      );
      entry[suburb] = quarterData?.median_price ?? null;
    });
    return entry;
  });
  }, [sortedQuarters, suburbs, data]);

  const formatPrice = (value: number | null | undefined): string => {
    if (value == null || typeof value !== 'number') return 'N/A';
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="mb-2 font-semibold">{payload[0].payload.quarter}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null ? formatPrice(entry.value) : 'N/A'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Time Period Selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={timePeriod === '1yr' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimePeriod('1yr')}
        >
          1 Year
        </Button>
        <Button
          variant={timePeriod === '3yr' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimePeriod('3yr')}
        >
          3 Years
        </Button>
        <Button
          variant={timePeriod === '5yr' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimePeriod('5yr')}
        >
          5 Years
        </Button>
        <Button
          variant={timePeriod === 'max' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimePeriod('max')}
        >
          Max (20 Years)
        </Button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="quarter"
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis 
            tickFormatter={(value) => formatPrice(value)} 
            className="text-xs" 
            width={80}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {suburbs.map((suburb, index) => (
            <Line
              key={suburb}
              type="monotone"
              dataKey={suburb}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

