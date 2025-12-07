import { useState, useEffect, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts";
import { formatPercentage, formatSales } from "~/lib/formatters";
import { TimePeriodSelector } from "./TimePeriodSelector";
import { useChartSettingsStore } from "~/lib/chartSettingsStore";
import { useIsMobileBreakpoint } from "~/hooks/useIsMobile";
import type { TimePeriod } from "~/lib/dateUtils";
import type { BulkSuburbsData } from "~/types";

// Helper to convert TimePeriod to GrowthPeriod for display
function timePeriodToGrowthPeriod(
    period: TimePeriod
): "1yr" | "3yr" | "5yr" | "all" {
    if (period === "max") return "all";
    return period;
}

interface SalesGrowthBarChartProps {
    data: BulkSuburbsData;
    height?: number;
}

// Calculate sales growth for a given period
function calculateSalesGrowth(
    quarterly: Array<{ year: number; quarter: number; num_sales: number }>,
    timePeriod: TimePeriod
): { growth: number | null; recentSales: number; pastSales: number } {
    if (!quarterly || quarterly.length === 0) {
        return { growth: null, recentSales: 0, pastSales: 0 };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    // Get the last 4 quarters of data (most recent year)
    const getRecentYearSales = (): number => {
        let total = 0;
        let quartersFound = 0;

        // Go back 4 quarters from current quarter
        for (let i = 0; i < 4; i++) {
            let year = currentYear;
            let quarter = currentQuarter - i;

            // Handle year rollover
            while (quarter <= 0) {
                quarter += 4;
                year -= 1;
            }

            const quarterData = quarterly.find(
                (q) => q.year === year && q.quarter === quarter
            );
            if (quarterData) {
                total += quarterData.num_sales;
                quartersFound++;
            }
        }

        return quartersFound >= 2 ? total : 0; // Need at least 2 quarters
    };

    // Get sales from the same period X years ago
    const getPastYearSales = (yearsAgo: number): number => {
        let total = 0;
        let quartersFound = 0;

        const pastYear = currentYear - yearsAgo;

        // Get the same 4 quarters from X years ago
        for (let i = 0; i < 4; i++) {
            let year = pastYear;
            let quarter = currentQuarter - i;

            // Handle year rollover
            while (quarter <= 0) {
                quarter += 4;
                year -= 1;
            }

            const quarterData = quarterly.find(
                (q) => q.year === year && q.quarter === quarter
            );
            if (quarterData) {
                total += quarterData.num_sales;
                quartersFound++;
            }
        }

        return quartersFound >= 2 ? total : 0; // Need at least 2 quarters
    };

    const recentSales = getRecentYearSales();

    // Determine years ago based on time period
    let yearsAgo: number;
    if (timePeriod === "max") {
        yearsAgo = 20; // Max 20 years
    } else {
        yearsAgo = parseInt(timePeriod.replace("yr", ""), 10);
    }

    const pastSales = getPastYearSales(yearsAgo);

    if (pastSales === 0 || recentSales === 0) {
        return { growth: null, recentSales, pastSales };
    }

    // Calculate percentage growth
    const growth = ((recentSales - pastSales) / pastSales) * 100;
    return { growth, recentSales, pastSales };
}

export function SalesGrowthBarChart({
    data,
    height = 300,
}: SalesGrowthBarChartProps) {
    const isMobile = useIsMobileBreakpoint();
    // Get sync state from store
    const syncEnabled = useChartSettingsStore((state) => state.syncEnabled);
    const globalTimePeriod = useChartSettingsStore((state) => state.globalTimePeriod);
    const setGlobalTimePeriod = useChartSettingsStore((state) => state.setGlobalTimePeriod);

    // Local state for when sync is disabled
    const [localTimePeriod, setLocalTimePeriod] = useState<TimePeriod>("5yr");

    // Use global time period or local state based on sync
    // Memoize to ensure reactivity when globalTimePeriod changes
    const timePeriod = useMemo(
        () => (syncEnabled ? globalTimePeriod : localTimePeriod),
        [syncEnabled, globalTimePeriod, localTimePeriod]
    );

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

    const suburbs = Object.keys(data);

    const chartData = suburbs
        .map((suburb) => {
            const suburbData = data[suburb];
            if (!suburbData || !suburbData.quarterly) {
                return {
                    suburb,
                    growth: null,
                    sales: { recent: 0, past: 0 },
                };
            }

            const quarterly = suburbData.quarterly.map((q) => ({
                year: q.year,
                quarter: q.quarter,
                num_sales: q.num_sales,
            }));

            const result = calculateSalesGrowth(quarterly, timePeriod);

            return {
                suburb,
                growth: result.growth,
                sales: {
                    recent: result.recentSales,
                    past: result.pastSales,
                },
            };
        })
        .filter((item) => {
            // Only include suburbs that have valid growth value
            return item.growth !== null;
        });

    // Transform data for Recharts - one data point per suburb
    const transformedData = chartData.map((item) => ({
        suburb: item.suburb,
        growth: item.growth,
        sales: item.sales,
    }));

    return (
        <div className="space-y-4">
            <TimePeriodSelector
                timePeriod={timePeriod}
                onTimePeriodChange={handleTimePeriodChange}
            />
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={transformedData}
                    layout="vertical"
                    margin={{ 
                        top: 5, 
                        right: isMobile ? 10 : 30, 
                        left: isMobile ? 60 : 100, 
                        bottom: 5 
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                    />
                    <XAxis
                        type="number"
                        tickFormatter={(value) =>
                            `${value >= 0 ? "+" : ""}${value}%`
                        }
                        className="text-xs"
                    />
                    <YAxis
                        type="category"
                        dataKey="suburb"
                        className="text-xs"
                        width={isMobile ? 60 : 90}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload || !payload[0]) return null;
                            const data = payload[0].payload;
                            const periodLabel =
                                timePeriod === "max"
                                    ? "20 Years"
                                    : timePeriod
                                          .toUpperCase()
                                          .replace("YR", " Year");
                            return (
                                <div className="rounded-lg border bg-white p-3 shadow-lg">
                                    <p className="mb-2 font-semibold">
                                        {periodLabel}
                                    </p>
                                    <p style={{ color: payload[0].color }}>
                                        {data.suburb}:{" "}
                                        {formatPercentage(data.growth)}
                                        {data.sales &&
                                            data.sales.recent !== undefined &&
                                            data.sales.past !== undefined && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    (
                                                    {formatSales(
                                                        data.sales.recent
                                                    )}{" "}
                                                    vs{" "}
                                                    {formatSales(
                                                        data.sales.past
                                                    )}
                                                    )
                                                </span>
                                            )}
                                    </p>
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                        {transformedData.map((entry, index) => {
                            const fillColor =
                                entry.growth !== null && entry.growth >= 0
                                    ? "#10b981" // Green for positive
                                    : "#ef4444"; // Red for negative
                            return (
                                <Cell key={`cell-${index}`} fill={fillColor} />
                            );
                        })}
                        <LabelList
                            dataKey="growth"
                            content={(props: any) => {
                                const { x, y, width, value, payload } = props;
                                if (value === null || value === undefined)
                                    return null;

                                const growthText = formatPercentage(value);
                                const salesData = payload?.sales;

                                if (
                                    !salesData ||
                                    salesData.recent === undefined
                                ) {
                                    return (
                                        <text
                                            x={x + width + 5}
                                            y={y + 5}
                                            fill="#666"
                                            fontSize={10}
                                        >
                                            {growthText}
                                        </text>
                                    );
                                }

                                return (
                                    <g>
                                        <text
                                            x={x + width + 5}
                                            y={y + 5}
                                            fill="#666"
                                            fontSize={10}
                                        >
                                            {growthText}
                                        </text>
                                        <text
                                            x={x + width + 5}
                                            y={y + 15}
                                            fill="#999"
                                            fontSize={9}
                                        >
                                            {formatSales(salesData.recent)}
                                        </text>
                                    </g>
                                );
                            }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
