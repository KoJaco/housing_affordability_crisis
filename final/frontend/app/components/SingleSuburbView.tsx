import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MetricCard } from "~/components/MetricCard";
import { PriceTrendChart } from "~/components/charts/PriceTrendChart";
import { GrowthBarChart } from "~/components/charts/GrowthBarChart";
import { ForecastChart } from "~/components/charts/ForecastChart";
import { Badge } from "~/components/ui/badge";
import { TrendingUp, TrendingDown, Home, BarChart3 } from "lucide-react";
import type { SuburbData } from "~/types";

interface SingleSuburbViewProps {
    suburb: string;
    data: SuburbData;
}

export function SingleSuburbView({ suburb, data }: SingleSuburbViewProps) {
    const { analytics, quarterly } = data;

    const formatPrice = (price: number | null): string => {
        if (price === null) return "N/A";
        if (price >= 1000000) {
            return `$${(price / 1000000).toFixed(2)}M`;
        }
        return `$${(price / 1000).toFixed(0)}K`;
    };

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold">{suburb}</h2>
                <p className="text-sm text-muted-foreground">
                    Home &gt; Analyze &gt; {suburb}
                </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    label="Current Median Price"
                    value={analytics.current_median_price ?? 0}
                    change={analytics.growth_1yr_percentage ?? undefined}
                    changeLabel="YoY"
                    icon={<Home className="h-4 w-4" />}
                />
                <MetricCard
                    label="Avg Days on Market"
                    value={
                        analytics.current_avg_ctsd !== null
                            ? `${Math.round(analytics.current_avg_ctsd)} days`
                            : "N/A"
                    }
                    tooltip="Average contract to settlement days"
                />
                <MetricCard
                    label="Sales Last 12 Months"
                    value={
                        analytics.current_num_sales !== null
                            ? analytics.current_num_sales.toLocaleString()
                            : "N/A"
                    }
                />
            </div>

            {/* Price Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Price Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <PriceTrendChart data={quarterly} height={400} />
                </CardContent>
            </Card>

            {/* Growth Rates */}
            <Card>
                <CardHeader>
                    <CardTitle>Growth Rates</CardTitle>
                </CardHeader>
                <CardContent>
                    <GrowthBarChart analytics={analytics} height={300} />
                </CardContent>
            </Card>

            {/* Market Insights */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Volatility Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {analytics.volatility_score?.toFixed(1) ?? "N/A"}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Lower scores indicate more stable prices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Liquidity Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {analytics.overall_liquidity_score?.toFixed(1) ??
                                "N/A"}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Higher scores indicate easier to sell
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Best Quarter to Sell</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics.best_quarter_to_sell ?? "N/A"}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Based on historical premium analysis
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Rankings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Price Rank</span>
                            <Badge variant="outline">
                                {analytics.price_rank ?? "N/A"}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Growth Rank</span>
                            <Badge variant="outline">
                                {analytics.growth_rank ?? "N/A"}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Speed Rank</span>
                            <Badge variant="outline">
                                {analytics.speed_rank ?? "N/A"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Forecast */}
            <Card>
                <CardHeader>
                    <CardTitle>12-Month Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                    <ForecastChart
                        historical={quarterly}
                        analytics={analytics}
                        height={400}
                    />
                    <p className="mt-4 text-xs text-muted-foreground">
                        Based on historical trends. Forecasts are estimates and
                        may vary.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
