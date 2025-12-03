import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { ComparisonChart } from '~/components/charts/ComparisonChart';
import { MetricCard } from '~/components/MetricCard';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import type { BulkSuburbsData } from '~/types';

interface ComparisonViewProps {
  suburbs: string[];
  data: BulkSuburbsData;
}

type GrowthPeriod = '1yr' | '3yr' | '5yr' | 'all';

export function ComparisonView({ suburbs, data }: ComparisonViewProps) {
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>('5yr');

  const formatPrice = (price: number | null | undefined): string => {
    if (price == null || typeof price !== 'number') return 'N/A';
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const formatPercentage = (value: number | null | undefined): string => {
    if (value == null || typeof value !== 'number') return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get growth value based on selected period
  const getGrowthValue = (analytics: any): number | null => {
    if (!analytics) return null;
    switch (growthPeriod) {
      case '1yr':
        return analytics.growth_1yr_percentage ?? null;
      case '3yr':
        return analytics.growth_3yr_percentage ?? null;
      case '5yr':
        return analytics.growth_5yr_percentage ?? null;
      case 'all':
        return analytics.growth_since_2005_percentage ?? null;
      default:
        return analytics.growth_5yr_percentage ?? null;
    }
  };

  const getGrowthLabel = (): string => {
    switch (growthPeriod) {
      case '1yr':
        return '1-Year Growth';
      case '3yr':
        return '3-Year Growth';
      case '5yr':
        return '5-Year Growth';
      case 'all':
        return 'Growth Since 2005';
      default:
        return '5-Year Growth';
    }
  };

  // Get best value for each metric
  const getBestValue = (metric: string, higherIsBetter: boolean = true): string | null => {
    let bestSuburb: string | null = null;
    let bestValue: number | null = null;

    suburbs.forEach((suburb) => {
      const analytics = data[suburb]?.analytics;
      if (!analytics) return;

      let value: number | null = null;
      switch (metric) {
        case 'price':
          value = analytics.current_median_price ?? null;
          break;
        case 'growth':
          value = getGrowthValue(analytics);
          break;
        case 'speed':
          // Lower is better, so negate the value for comparison
          value = analytics.current_avg_ctsd != null ? -analytics.current_avg_ctsd : null;
          break;
      }

      if (value != null && typeof value === 'number' && (bestValue === null || (higherIsBetter ? value > bestValue : value < bestValue))) {
        bestValue = value;
        bestSuburb = suburb;
      }
    });

    return bestSuburb;
  };

  const bestPrice = getBestValue('price', true);
  const bestGrowth = getBestValue('growth', true);
  const bestSpeed = getBestValue('speed', false);

  const comparisonRows = [
    {
      label: 'Median Price',
      getValue: (suburb: string) => formatPrice(data[suburb]?.analytics?.current_median_price),
      best: bestPrice,
    },
    {
      label: getGrowthLabel(),
      getValue: (suburb: string) => formatPercentage(getGrowthValue(data[suburb]?.analytics)),
      best: bestGrowth,
    },
    {
      label: 'Days on Market',
      getValue: (suburb: string) => {
        const value = data[suburb]?.analytics?.current_avg_ctsd;
        return value != null && typeof value === 'number' ? `${Math.round(value)} days` : 'N/A';
      },
      best: bestSpeed,
    },
    {
      label: 'Sales (12m)',
      getValue: (suburb: string) => {
        const value = data[suburb]?.analytics?.current_num_sales;
        return value != null ? value.toLocaleString() : 'N/A';
      },
      best: null,
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Comparison</h2>
        <p className="text-sm text-muted-foreground">
          Comparing {suburbs.length} {suburbs.length === 1 ? 'suburb' : 'suburbs'}
        </p>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">Metric</TableHead>
                  {suburbs.map((suburb) => (
                    <TableHead key={suburb} className="text-center">
                      {suburb}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="sticky left-0 bg-white font-medium">
                      {row.label}
                    </TableCell>
                    {suburbs.map((suburb) => (
                      <TableCell
                        key={suburb}
                        className={`text-center ${
                          row.best === suburb ? 'bg-green-50 dark:bg-green-950' : ''
                        }`}
                      >
                        {row.getValue(suburb)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Price Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Trends Overlay</CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonChart data={data} height={400} />
        </CardContent>
      </Card>

      {/* Growth Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{getGrowthLabel()} Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time Period Selector */}
            <div className="flex flex-wrap gap-2 pb-4">
              <Button
                variant={growthPeriod === '1yr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGrowthPeriod('1yr')}
              >
                1 Year
              </Button>
              <Button
                variant={growthPeriod === '3yr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGrowthPeriod('3yr')}
              >
                3 Years
              </Button>
              <Button
                variant={growthPeriod === '5yr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGrowthPeriod('5yr')}
              >
                5 Years
              </Button>
              <Button
                variant={growthPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGrowthPeriod('all')}
              >
                Since 2005
              </Button>
            </div>

            {/* Growth Bars */}
            <div className="space-y-4">
              {(() => {
                // Calculate all growth values first
                const growthData = suburbs
                  .map((suburb) => ({
                    suburb,
                    growth: getGrowthValue(data[suburb]?.analytics),
                  }))
                  .map((item) => ({
                    suburb: item.suburb,
                    growth: item.growth != null && typeof item.growth === 'number' ? item.growth : null,
                  }));

                // Find the maximum absolute growth value for normalization (only among valid values)
                const validGrowthValues = growthData
                  .filter((item) => item.growth !== null)
                  .map((item) => Math.abs(item.growth as number));
                
                const maxGrowth = validGrowthValues.length > 0
                  ? Math.max(...validGrowthValues)
                  : 1; // Avoid division by zero

                // Sort and render bars normalized to max value
                return growthData
                  .sort((a, b) => {
                    const aVal = a.growth ?? -Infinity;
                    const bVal = b.growth ?? -Infinity;
                    return bVal - aVal;
                  })
                  .map(({ suburb, growth }) => {
                    const growthValue = growth;
                    
                    if (growthValue === null) {
                      // Show N/A for suburbs without growth data
                      return (
                        <div key={suburb} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{suburb}</span>
                            <span className="text-muted-foreground">N/A</span>
                          </div>
                          <div className="h-6 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-gray-300" style={{ width: '0%' }} />
                          </div>
                        </div>
                      );
                    }

                    // Normalize width: max value = 100%, others proportional
                    const normalizedWidth = maxGrowth > 0
                      ? (Math.abs(growthValue) / maxGrowth) * 100
                      : 0;

                    return (
                      <div key={suburb} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{suburb}</span>
                          <span className={growthValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(growthValue)}
                          </span>
                        </div>
                        <div className="h-6 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full ${
                              growthValue >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(normalizedWidth, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Metric Cards (only for 2-3 suburbs) */}
      {suburbs.length <= 3 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suburbs.map((suburb) => {
            const analytics = data[suburb]?.analytics;
            if (!analytics) return null;

            return (
              <div key={suburb} className="space-y-4">
                <h3 className="text-lg font-semibold">{suburb}</h3>
                <MetricCard
                  label="Median Price"
                  value={
                    analytics.current_median_price != null && typeof analytics.current_median_price === 'number'
                      ? analytics.current_median_price
                      : 'N/A'
                  }
                />
                <MetricCard
                  label="5yr Growth"
                  value={
                    analytics.growth_5yr_percentage != null && typeof analytics.growth_5yr_percentage === 'number'
                      ? `${analytics.growth_5yr_percentage >= 0 ? '+' : ''}${analytics.growth_5yr_percentage.toFixed(1)}%`
                      : 'N/A'
                  }
                />
                <MetricCard
                  label="Avg Days on Market"
                  value={
                    analytics.current_avg_ctsd != null && typeof analytics.current_avg_ctsd === 'number'
                      ? `${Math.round(analytics.current_avg_ctsd)} days`
                      : 'N/A'
                  }
                />
                <MetricCard
                  label="Sales Last 12 Months"
                  value={
                    analytics.current_num_sales != null && typeof analytics.current_num_sales === 'number'
                      ? analytics.current_num_sales.toLocaleString()
                      : 'N/A'
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

