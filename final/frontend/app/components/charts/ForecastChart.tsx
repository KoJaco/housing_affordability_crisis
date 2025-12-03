import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SuburbAnalytics, AggregatedSuburbAnalytics, QuarterlyStats } from '~/types';

interface ForecastChartProps {
  historical: QuarterlyStats[];
  analytics: SuburbAnalytics | AggregatedSuburbAnalytics;
  height?: number;
}

export function ForecastChart({ historical, analytics, height = 400 }: ForecastChartProps) {
  // Get the last historical quarter
  const lastHistorical = historical
    .filter((d) => d.median_price !== null)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarter - a.quarter;
    })[0];

  if (!lastHistorical) {
    return <div className="flex h-[400px] items-center justify-center">No historical data</div>;
  }

  const currentQuarter = `Q${lastHistorical.quarter} ${lastHistorical.year}`;

  // Build chart data
  const chartData: Array<{
    quarter: string;
    price: number | null;
    lower: number | null;
    upper: number | null;
    isForecast: boolean;
  }> = [];

  // Add historical data (last 8 quarters)
  const recentHistorical = historical
    .filter((d) => d.median_price !== null)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    })
    .slice(-8);

  recentHistorical.forEach((d) => {
    chartData.push({
      quarter: `Q${d.quarter} ${d.year}`,
      price: d.median_price,
      lower: d.median_price,
      upper: d.median_price,
      isForecast: false,
    });
  });

  // Add forecast data
  if (analytics.forecast_q1_price !== null) {
    const nextQuarter = lastHistorical.quarter === 4
      ? `Q1 ${lastHistorical.year + 1}`
      : `Q${lastHistorical.quarter + 1} ${lastHistorical.year}`;
    
    chartData.push({
      quarter: nextQuarter,
      price: analytics.forecast_q1_price,
      lower: analytics.forecast_q1_lower,
      upper: analytics.forecast_q1_upper,
      isForecast: true,
    });
  }

  if (analytics.forecast_q2_price !== null) {
    const q2Quarter = lastHistorical.quarter >= 3
      ? `Q${lastHistorical.quarter === 4 ? 2 : lastHistorical.quarter + 2} ${lastHistorical.year + (lastHistorical.quarter === 4 ? 1 : 0)}`
      : `Q${lastHistorical.quarter + 2} ${lastHistorical.year}`;
    
    chartData.push({
      quarter: q2Quarter,
      price: analytics.forecast_q2_price,
      lower: analytics.forecast_q2_lower,
      upper: analytics.forecast_q2_upper,
      isForecast: true,
    });
  }

  const formatPrice = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="font-semibold">{data.quarter}</p>
          <p className="text-blue-600">{formatPrice(data.price!)}</p>
          {data.isForecast && data.lower !== null && data.upper !== null && (
            <p className="text-xs text-muted-foreground">
              80% Confidence: {formatPrice(data.lower)} - {formatPrice(data.upper)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="quarter"
          className="text-xs"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tickFormatter={formatPrice} className="text-xs" width={80} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          x={currentQuarter}
          stroke="#9ca3af"
          strokeDasharray="3 3"
          label={{ value: 'Current', position: 'top' }}
        />
        {/* Confidence band */}
        <Area
          dataKey="upper"
          stroke="none"
          fill="#3b82f6"
          fillOpacity={0.1}
          connectNulls
        />
        <Area
          dataKey="lower"
          stroke="none"
          fill="#fff"
          connectNulls
        />
        {/* Historical line */}
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          strokeDasharray={chartData.map((d) => (d.isForecast ? '5 5' : '0'))}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

