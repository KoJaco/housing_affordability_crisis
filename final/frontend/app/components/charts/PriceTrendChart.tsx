import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Button } from "~/components/ui/button";
import type { QuarterlyStats } from "~/types";

interface PriceTrendChartProps {
    data: QuarterlyStats[];
    height?: number;
}

type TimePeriod = "1yr" | "3yr" | "5yr" | "max";

export function PriceTrendChart({ data, height = 400 }: PriceTrendChartProps) {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("max");

    // Calculate date cutoff based on time period
    const cutoffDate = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

        switch (timePeriod) {
            case "1yr":
                return { year: currentYear - 1, quarter: currentQuarter };
            case "3yr":
                return { year: currentYear - 3, quarter: currentQuarter };
            case "5yr":
                return { year: currentYear - 5, quarter: currentQuarter };
            case "max":
            default:
                return { year: 2000, quarter: 1 }; // Show all data
        }
    }, [timePeriod]);

    // Transform quarterly data for chart with time period filter
    const chartData = useMemo(() => {
        return data
            .filter((d) => {
                if (d.median_price === null) return false;
                if (timePeriod === "max") return true;
                // Filter by year and quarter
                if (d.year > cutoffDate.year) return true;
                if (
                    d.year === cutoffDate.year &&
                    d.quarter >= cutoffDate.quarter
                )
                    return true;
                return false;
            })
            .map((d) => ({
                quarter: `Q${d.quarter} ${d.year}`,
                price: d.median_price!,
                year: d.year,
                quarterNum: d.quarter,
                qoqChange: d.qoq_price_change_percentage,
            }))
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.quarterNum - b.quarterNum;
            });
    }, [data, timePeriod, cutoffDate]);

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
                    <p className="text-blue-600">{formatPrice(data.price)}</p>
                    {data.qoqChange !== null && (
                        <p className="text-sm text-muted-foreground">
                            QoQ: {data.qoqChange >= 0 ? "+" : ""}
                            {data.qoqChange.toFixed(1)}%
                        </p>
                    )}
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
                    variant={timePeriod === "1yr" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("1yr")}
                >
                    1 Year
                </Button>
                <Button
                    variant={timePeriod === "3yr" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("3yr")}
                >
                    3 Years
                </Button>
                <Button
                    variant={timePeriod === "5yr" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("5yr")}
                >
                    5 Years
                </Button>
                <Button
                    variant={timePeriod === "max" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("max")}
                >
                    Max (20 Years)
                </Button>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                    />
                    <XAxis
                        dataKey="quarter"
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tickFormatter={formatPrice}
                        className="text-xs"
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
