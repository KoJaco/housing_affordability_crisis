import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MetricCard } from "~/components/MetricCard";
import { PriceTrendChart } from "~/components/charts/PriceTrendChart";
import { GrowthBarChart } from "~/components/charts/GrowthBarChart";
import { SalesPerQuarterChart } from "~/components/charts/SalesPerQuarterChart";
import { Home, TrendingDown } from "lucide-react";
import { formatSales } from "~/lib/formatters";
import { isNumber } from "~/lib/typeGuards";
import { mergeQuarterlyData } from "~/lib/quarterlyMerging";
import type { SuburbData, PropertyType } from "~/types";

interface SingleSuburbViewProps {
    suburb: string;
    data: SuburbData;
    propertyType: PropertyType;
}

export function SingleSuburbView({
    suburb,
    data,
    propertyType,
}: SingleSuburbViewProps) {
    const { analytics, quarterly } = data;
    const [useSmoothed, setUseSmoothed] = useState(false);

    // Merge quarterly data when propertyType is "all" to average house and unit prices
    const mergedQuarterly = useMemo(
        () => mergeQuarterlyData(quarterly, propertyType),
        [quarterly, propertyType]
    );

    return (
        <div className="space-y-6 lg:px-0 px-4 pt-4 w-full">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold">{suburb}</h2>
                <p className="text-sm text-muted-foreground">
                    Analytics for single suburb.
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                    label="Current Median Price"
                    value={
                        useSmoothed
                            ? (analytics.current_median_price_smoothed ??
                              analytics.current_median_price ??
                              0)
                            : (analytics.current_median_price ?? 0)
                    }
                    change={
                        useSmoothed
                            ? (analytics.growth_1yr_percentage_smoothed ??
                              analytics.growth_1yr_percentage ??
                              undefined)
                            : (analytics.growth_1yr_percentage ?? undefined)
                    }
                    changeLabel="YoY"
                    icon={<Home className="h-4 w-4" />}
                />
                <MetricCard
                    label="Average Days Between Contract and Settlement"
                    value={
                        isNumber(analytics.current_avg_ctsd)
                            ? `${Math.round(analytics.current_avg_ctsd)} days`
                            : "N/A"
                    }
                    tooltip="Average days between contract date and settlement date"
                />
                <MetricCard
                    label="Sales Last 12 Months"
                    value={formatSales(analytics.current_num_sales)}
                />
            </div>

            {/* Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Price Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <PriceTrendChart data={mergedQuarterly} height={400} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Price Growth</CardTitle>
                </CardHeader>
                <CardContent>
                    <GrowthBarChart analytics={analytics} height={300} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sales Per Quarter</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesPerQuarterChart data={mergedQuarterly} height={400} />
                </CardContent>
            </Card>
        </div>
    );
}
