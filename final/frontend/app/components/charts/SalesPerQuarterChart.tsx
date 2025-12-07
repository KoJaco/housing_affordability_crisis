import { useState, useMemo, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { formatSales } from "~/lib/formatters";
import {
    calculateCutoffDate,
    formatQuarterString,
    isQuarterInRange,
    type TimePeriod,
} from "~/lib/dateUtils";
import { isValidSales } from "~/lib/typeGuards";
import { TimePeriodSelector } from "./TimePeriodSelector";
import { useChartSettingsStore } from "~/lib/chartSettingsStore";
import { useIsMobileBreakpoint } from "~/hooks/useIsMobile";
import type { QuarterlyStats } from "~/types";

interface SalesPerQuarterChartProps {
    data: QuarterlyStats[];
    height?: number;
}

export function SalesPerQuarterChart({
    data,
    height = 400,
}: SalesPerQuarterChartProps) {
    const isMobile = useIsMobileBreakpoint();
    // Get sync state from store
    const syncEnabled = useChartSettingsStore((state) => state.syncEnabled);
    const globalTimePeriod = useChartSettingsStore((state) => state.globalTimePeriod);
    const setGlobalTimePeriod = useChartSettingsStore((state) => state.setGlobalTimePeriod);

    // Local state for when sync is disabled
    const [localTimePeriod, setLocalTimePeriod] = useState<TimePeriod>("1yr");

    // Use global or local state based on sync
    const timePeriod = syncEnabled ? globalTimePeriod : localTimePeriod;

    const handleTimePeriodChange = (period: TimePeriod) => {
        if (syncEnabled) {
            setGlobalTimePeriod(period);
        } else {
            setLocalTimePeriod(period);
        }
    };

    // Sync local state when sync is enabled
    useEffect(() => {
        if (syncEnabled) {
            setLocalTimePeriod(globalTimePeriod);
        }
    }, [syncEnabled, globalTimePeriod]);

    const cutoffDate = useMemo(
        () => calculateCutoffDate(timePeriod, 2005),
        [timePeriod]
    );

    const chartData = useMemo(() => {
        return data
            .filter((d) => {
                if (!isValidSales(d.num_sales)) return false;
                return isQuarterInRange(
                    d.year,
                    d.quarter,
                    cutoffDate,
                    timePeriod
                );
            })
            .map((d) => ({
                quarter: formatQuarterString(d.year, d.quarter),
                sales: d.num_sales,
                year: d.year,
                quarterNum: d.quarter,
            }))
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.quarterNum - b.quarterNum;
            });
    }, [data, cutoffDate, timePeriod]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            return (
                <div className="rounded-lg border bg-white p-3 shadow-lg">
                    <p className="mb-1 font-semibold">
                        {payload[0].payload.quarter}
                    </p>
                    <p className="text-sm">
                        Sales:{" "}
                        <span className="font-semibold">
                            {formatSales(value)}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <TimePeriodSelector
                timePeriod={timePeriod}
                onTimePeriodChange={handleTimePeriodChange}
            />

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
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
                        className="text-xs"
                        width={isMobile ? 50 : 80}
                        tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
