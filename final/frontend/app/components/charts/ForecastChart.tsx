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
} from "recharts";
import { formatPrice } from "~/lib/formatters";
import { formatQuarterString } from "~/lib/dateUtils";
import { isValidPrice } from "~/lib/typeGuards";
import { useIsMobileBreakpoint } from "~/hooks/useIsMobile";
import type {
    SuburbAnalytics,
    AggregatedSuburbAnalytics,
    QuarterlyStats,
} from "~/types";

interface ForecastChartProps {
    historical: QuarterlyStats[];
    analytics: SuburbAnalytics | AggregatedSuburbAnalytics;
    height?: number;
}

export function ForecastChart({
    historical,
    analytics,
    height = 400,
}: ForecastChartProps) {
    const isMobile = useIsMobileBreakpoint();
    // Get the last historical quarter
    const lastHistorical = historical
        .filter((d) => isValidPrice(d.median_price))
        .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.quarter - a.quarter;
        })[0];

    if (!lastHistorical) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                No historical data
            </div>
        );
    }

    const currentQuarter = formatQuarterString(
        lastHistorical.year,
        lastHistorical.quarter
    );

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
        .filter((d) => isValidPrice(d.median_price))
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.quarter - b.quarter;
        })
        .slice(-8);

    recentHistorical.forEach((d) => {
        chartData.push({
            quarter: formatQuarterString(d.year, d.quarter),
            price: d.median_price,
            lower: d.median_price,
            upper: d.median_price,
            isForecast: false,
        });
    });

    // Add forecast data
    if (analytics.forecast_q1_price !== null) {
        const nextYear =
            lastHistorical.quarter === 4
                ? lastHistorical.year + 1
                : lastHistorical.year;
        const nextQuarter =
            lastHistorical.quarter === 4 ? 1 : lastHistorical.quarter + 1;

        chartData.push({
            quarter: formatQuarterString(nextYear, nextQuarter),
            price: analytics.forecast_q1_price,
            lower: analytics.forecast_q1_lower,
            upper: analytics.forecast_q1_upper,
            isForecast: true,
        });
    }

    if (analytics.forecast_q2_price !== null) {
        let q2Year = lastHistorical.year;
        let q2Quarter = lastHistorical.quarter + 2;

        if (q2Quarter > 4) {
            q2Quarter -= 4;
            q2Year += 1;
        }

        chartData.push({
            quarter: formatQuarterString(q2Year, q2Quarter),
            price: analytics.forecast_q2_price,
            lower: analytics.forecast_q2_lower,
            upper: analytics.forecast_q2_upper,
            isForecast: true,
        });
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border bg-white p-3 shadow-lg">
                    <p className="font-semibold">{data.quarter}</p>
                    <p className="text-blue-600">{formatPrice(data.price!)}</p>
                    {data.isForecast &&
                        data.lower !== null &&
                        data.upper !== null && (
                            <p className="text-xs text-muted-foreground">
                                80% Confidence: {formatPrice(data.lower)} -{" "}
                                {formatPrice(data.upper)}
                            </p>
                        )}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart
                data={chartData}
                margin={{ 
                    top: 5, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 5 : 20, 
                    bottom: 5 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="quarter"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    tickFormatter={(value) => formatPrice(value as number)}
                    className="text-xs"
                    width={isMobile ? 50 : 80}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                    x={currentQuarter}
                    stroke="#9ca3af"
                    strokeDasharray="3 3"
                    label={{ value: "Current", position: "top" }}
                />
                {/* Confidence band */}
                <Area
                    dataKey="upper"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    connectNulls
                />
                <Area dataKey="lower" stroke="none" fill="#fff" connectNulls />
                {/* Historical line */}
                <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    strokeDasharray={chartData
                        .map((d) => (d.isForecast ? "5 5" : "0"))
                        .join(" ")}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
