import { useState, useMemo, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { formatPrice, formatPercentage } from "~/lib/formatters";
import {
    calculateCutoffDate,
    formatQuarterString,
    isQuarterInRange,
    type TimePeriod,
} from "~/lib/dateUtils";
import { isValidPrice, isValidPercentage } from "~/lib/typeGuards";
import { TimePeriodSelector } from "./TimePeriodSelector";
import { ChartTooltip } from "./ChartTooltip";
import { SmoothedToggle } from "./SmoothedToggle";
import { useChartSettingsStore } from "~/lib/chartSettingsStore";
import { useIsMobileBreakpoint } from "~/hooks/useIsMobile";
import type { QuarterlyStats } from "~/types";

interface PriceTrendChartProps {
    data: QuarterlyStats[];
    height?: number;
}

export function PriceTrendChart({ data, height = 400 }: PriceTrendChartProps) {
    const isMobile = useIsMobileBreakpoint();
    // Get sync state from store
    const syncEnabled = useChartSettingsStore((state) => state.syncEnabled);
    const globalTimePeriod = useChartSettingsStore((state) => state.globalTimePeriod);
    const globalUseSmoothed = useChartSettingsStore((state) => state.globalUseSmoothed);
    const setGlobalTimePeriod = useChartSettingsStore((state) => state.setGlobalTimePeriod);
    const setGlobalUseSmoothed = useChartSettingsStore((state) => state.setGlobalUseSmoothed);

    // Local state for when sync is disabled
    const [localTimePeriod, setLocalTimePeriod] = useState<TimePeriod>("max");
    const [localUseSmoothed, setLocalUseSmoothed] = useState(false);

    // Use global or local state based on sync
    const timePeriod = syncEnabled ? globalTimePeriod : localTimePeriod;
    const useSmoothed = syncEnabled ? globalUseSmoothed : localUseSmoothed;

    const handleTimePeriodChange = (period: TimePeriod) => {
        if (syncEnabled) {
            setGlobalTimePeriod(period);
        } else {
            setLocalTimePeriod(period);
        }
    };

    const handleSmoothedChange = (enabled: boolean) => {
        if (syncEnabled) {
            setGlobalUseSmoothed(enabled);
        } else {
            setLocalUseSmoothed(enabled);
        }
    };

    // Sync local state when sync is enabled
    useEffect(() => {
        if (syncEnabled) {
            setLocalTimePeriod(globalTimePeriod);
            setLocalUseSmoothed(globalUseSmoothed);
        }
    }, [syncEnabled, globalTimePeriod, globalUseSmoothed]);

    // Calculate date cutoff based on time period
    const cutoffDate = useMemo(
        () => calculateCutoffDate(timePeriod),
        [timePeriod]
    );

    // Transform quarterly data for chart with time period filter
    const chartData = useMemo(() => {
        return data
            .filter((d) => {
                // Check if we have valid price data (smoothed or raw)
                const price = useSmoothed
                    ? d.median_price_smoothed
                    : d.median_price;
                if (!isValidPrice(price)) return false;
                return isQuarterInRange(
                    d.year,
                    d.quarter,
                    cutoffDate,
                    timePeriod
                );
            })
            .map((d) => {
                // Prefer smoothed if enabled, fallback to raw
                const price = useSmoothed
                    ? (d.median_price_smoothed ?? d.median_price)
                    : d.median_price;

                return {
                    quarter: formatQuarterString(d.year, d.quarter),
                    price: price!,
                    year: d.year,
                    quarterNum: d.quarter,
                    qoqChange: d.qoq_price_change_percentage,
                };
            })
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.quarterNum - b.quarterNum;
            });
    }, [data, timePeriod, cutoffDate, useSmoothed]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-white p-3 shadow-lg">
                <p className="font-semibold">{data.quarter}</p>
                <p className="text-blue-600">{formatPrice(data.price)}</p>
                {isValidPercentage(data.qoqChange) && (
                    <p className="text-sm text-muted-foreground">
                        QoQ: {formatPercentage(data.qoqChange)}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <TimePeriodSelector
                    timePeriod={timePeriod}
                    onTimePeriodChange={handleTimePeriodChange}
                />
                <SmoothedToggle
                    enabled={useSmoothed}
                    onToggle={handleSmoothedChange}
                />
            </div>

            {/* Chart */}
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
                        tickFormatter={(value) => formatPrice(value as number)}
                        className="text-xs"
                        width={isMobile ? 50 : 80}
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
