import { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { ComparisonChart } from "~/components/charts/ComparisonChart";
import { SalesQuantityChart } from "~/components/charts/SalesQuantityChart";
import { SalesGrowthBarChart } from "~/components/charts/SalesGrowthBarChart";
import { MetricCard } from "~/components/MetricCard";
import { Button } from "~/components/ui/button";
import { SmoothedToggle } from "~/components/charts/SmoothedToggle";
import { formatPrice, formatPercentage, formatSales } from "~/lib/formatters";
import { isNumber } from "~/lib/typeGuards";
import { calculatePriceGrowth } from "~/lib/quarterlyCalculations";
import { useChartSettingsStore } from "~/lib/chartSettingsStore";
import { GrowthBars } from "./GrowthBars";
import type { BulkSuburbsData } from "~/types";
import type { TimePeriod } from "~/lib/dateUtils";

interface ComparisonViewProps {
    suburbs: string[];
    data: BulkSuburbsData;
}

type GrowthPeriod = "1yr" | "3yr" | "5yr" | "all";

export function ComparisonView({ suburbs, data }: ComparisonViewProps) {
    // Get sync state from store
    const syncEnabled = useChartSettingsStore((state) => state.syncEnabled);
    const globalTimePeriod = useChartSettingsStore(
        (state) => state.globalTimePeriod
    );
    const globalUseSmoothed = useChartSettingsStore(
        (state) => state.globalUseSmoothed
    );
    const setGlobalTimePeriod = useChartSettingsStore(
        (state) => state.setGlobalTimePeriod
    );
    const setGlobalUseSmoothed = useChartSettingsStore(
        (state) => state.setGlobalUseSmoothed
    );

    // Local state for when sync is disabled
    const [localGrowthPeriod, setLocalGrowthPeriod] =
        useState<GrowthPeriod>("5yr");
    const [localUseSmoothed, setLocalUseSmoothed] = useState(false);

    // Helper to convert TimePeriod to GrowthPeriod
    const timePeriodToGrowthPeriod = (period: TimePeriod): GrowthPeriod => {
        if (period === "max") return "all";
        return period;
    };

    // Helper to convert GrowthPeriod to TimePeriod
    const growthPeriodToTimePeriod = (period: GrowthPeriod): TimePeriod => {
        if (period === "all") return "max";
        return period;
    };

    // Use global time period (converted to GrowthPeriod) or local state based on sync
    // Memoize to ensure reactivity when global values change
    const growthPeriod = useMemo(
        () =>
            syncEnabled
                ? timePeriodToGrowthPeriod(globalTimePeriod)
                : localGrowthPeriod,
        [syncEnabled, globalTimePeriod, localGrowthPeriod]
    );
    const useSmoothed = useMemo(
        () => (syncEnabled ? globalUseSmoothed : localUseSmoothed),
        [syncEnabled, globalUseSmoothed, localUseSmoothed]
    );

    const handleGrowthPeriodChange = (period: GrowthPeriod) => {
        if (syncEnabled) {
            // Convert GrowthPeriod to TimePeriod and update store
            setGlobalTimePeriod(growthPeriodToTimePeriod(period));
        } else {
            setLocalGrowthPeriod(period);
        }
    };

    const handleSmoothedChange = (enabled: boolean) => {
        if (syncEnabled) {
            setGlobalUseSmoothed(enabled);
        } else {
            setLocalUseSmoothed(enabled);
        }
    };

    // Sync local state when sync is enabled or when global values change
    useEffect(() => {
        if (syncEnabled) {
            setLocalGrowthPeriod(timePeriodToGrowthPeriod(globalTimePeriod));
            setLocalUseSmoothed(globalUseSmoothed);
        }
    }, [syncEnabled, globalTimePeriod, globalUseSmoothed]);

    // When sync is enabled, ensure we're using global values (reactive to store changes)
    // This ensures the component re-renders when globalTimePeriod changes

    // Get growth value based on selected period. Calc from quarterly data for accuracy.
    // Using this method as backend values for 1 -> 5 yrs don't seem to match? hmmmm
    const getGrowthValue = (suburb: string): number | null => {
        const suburbData = data[suburb];
        if (!suburbData || !suburbData.quarterly) return null;

        const analytics = suburbData.analytics;
        const quarterly = suburbData.quarterly;

        // If using smoothed, prefer backend smoothed values for calculated periods
        if (useSmoothed) {
            switch (growthPeriod) {
                case "1yr":
                    return (
                        analytics?.growth_1yr_percentage_smoothed ??
                        calculatePriceGrowth(quarterly, 1, true)
                    );
                case "3yr":
                    return (
                        analytics?.growth_3yr_percentage_smoothed ??
                        calculatePriceGrowth(quarterly, 3, true)
                    );
                case "5yr":
                    return (
                        analytics?.growth_5yr_percentage_smoothed ??
                        calculatePriceGrowth(quarterly, 5, true)
                    );
                case "all":
                    return (
                        analytics?.growth_since_2005_percentage_smoothed ?? null
                    );
                default:
                    return (
                        analytics?.growth_5yr_percentage_smoothed ??
                        calculatePriceGrowth(quarterly, 5, true)
                    );
            }
        }

        // Use calculated values from quarterly data
        switch (growthPeriod) {
            case "1yr":
                return calculatePriceGrowth(quarterly, 1, false);
            case "3yr":
                return calculatePriceGrowth(quarterly, 3, false);
            case "5yr":
                return calculatePriceGrowth(quarterly, 5, false);
            case "all":
                // For "all", use backend value
                return (
                    suburbData.analytics?.growth_since_2005_percentage ?? null
                );
            default:
                return calculatePriceGrowth(quarterly, 5, false);
        }
    };

    const getGrowthLabel = (): string => {
        switch (growthPeriod) {
            case "1yr":
                return "1-Year Price Growth";
            case "3yr":
                return "3-Year Price Growth";
            case "5yr":
                return "5-Year Price Growth";
            case "all":
                return "Price Growth Since 2005";
            default:
                return "5-Year Price Growth";
        }
    };

    // Get best value for each metric
    const getBestValue = (
        metric: string,
        higherIsBetter: boolean = true
    ): string | null => {
        let bestSuburb: string | null = null;
        let bestValue: number | null = null;

        suburbs.forEach((suburb) => {
            const analytics = data[suburb]?.analytics;
            if (!analytics) return;

            let value: number | null = null;
            switch (metric) {
                case "price":
                    value = analytics.current_median_price ?? null;
                    break;
                case "growth":
                    value = getGrowthValue(suburb);
                    break;
                case "speed":
                    // Lower is better, negative of the value for comparison
                    value =
                        analytics.current_avg_ctsd != null
                            ? -analytics.current_avg_ctsd
                            : null;
                case "sales":
                    value = analytics.current_num_sales ?? null;
                    break;
            }

            if (
                isNumber(value) &&
                (bestValue === null ||
                    (higherIsBetter ? value > bestValue : value < bestValue))
            ) {
                bestValue = value;
                bestSuburb = suburb;
            }
        });

        return bestSuburb;
    };

    const bestPrice = getBestValue("price", true);
    const bestGrowth = getBestValue("growth", true);
    const bestSpeed = getBestValue("speed", false);
    const bestSales = getBestValue("sales", true);

    const comparisonRows = [
        {
            label: "Median Price",
            getValue: (suburb: string) => {
                const analytics = data[suburb]?.analytics;
                const price = useSmoothed
                    ? (analytics?.current_median_price_smoothed ??
                      analytics?.current_median_price)
                    : analytics?.current_median_price;
                return formatPrice(price);
            },
            best: bestPrice,
        },
        {
            label: getGrowthLabel(),
            getValue: (suburb: string) =>
                formatPercentage(getGrowthValue(suburb)),
            best: bestGrowth,
        },
        {
            label: "Contract -> Settlement Days (avg 42)",
            getValue: (suburb: string) => {
                const value = data[suburb]?.analytics?.current_avg_ctsd;
                return isNumber(value) ? `${Math.round(value)} days` : "N/A";
            },
            best: bestSpeed,
        },
        {
            label: "Sales (12m)",
            getValue: (suburb: string) => {
                const value = data[suburb]?.analytics?.current_num_sales;
                return formatSales(value);
            },
            best: bestSales,
        },
    ];

    return (
        <div className="space-y-6 w-full min-w-0 lg:px-0 px-4 pt-4">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold">Comparison</h2>
                <p className="text-sm text-muted-foreground capitalize">
                    Comparing{" "}
                    {suburbs
                        .map((suburb) => suburb.toLocaleLowerCase())
                        .join(", ")}
                    .
                </p>
            </div>

            {/* Comparison Table */}
            <Card className="w-full max-w-full overflow-hidden">
                <CardHeader>
                    <CardTitle>Key Metrics Comparison</CardTitle>
                </CardHeader>
                <CardContent className="w-full min-w-0 p-0 max-w-full">
                    <div className="overflow-x-auto w-full px-6 max-w-full">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-white z-10 min-w-[150px]">
                                        Metric
                                    </TableHead>
                                    {suburbs.map((suburb) => (
                                        <TableHead
                                            key={suburb}
                                            className="text-center min-w-[120px] whitespace-nowrap"
                                        >
                                            {suburb}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {comparisonRows.map((row) => (
                                    <TableRow key={row.label}>
                                        <TableCell className="sticky left-0 bg-white font-medium z-10 max-w-[150px] md:max-w-none md:min-w-[150px] whitespace-normal flex-wrap">
                                            {row.label}
                                        </TableCell>
                                        {suburbs.map((suburb) => (
                                            <TableCell
                                                key={suburb}
                                                className={`text-center whitespace-nowrap ${
                                                    row.best === suburb
                                                        ? "bg-green-50 dark:bg-green-950"
                                                        : ""
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
                        {/* Time Period Selector and Smoothed Toggle */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={
                                        growthPeriod === "1yr"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        handleGrowthPeriodChange("1yr")
                                    }
                                >
                                    1 Year
                                </Button>
                                <Button
                                    variant={
                                        growthPeriod === "3yr"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        handleGrowthPeriodChange("3yr")
                                    }
                                >
                                    3 Years
                                </Button>
                                <Button
                                    variant={
                                        growthPeriod === "5yr"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        handleGrowthPeriodChange("5yr")
                                    }
                                >
                                    5 Years
                                </Button>
                                <Button
                                    variant={
                                        growthPeriod === "all"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        handleGrowthPeriodChange("all")
                                    }
                                >
                                    Since 2005
                                </Button>
                            </div>
                            <SmoothedToggle
                                enabled={useSmoothed}
                                onToggle={handleSmoothedChange}
                            />
                        </div>

                        {/* Growth Bars */}
                        <GrowthBars
                            suburbs={suburbs}
                            getGrowthValue={getGrowthValue}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sales Quantity Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Sales Quantity Overlay</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesQuantityChart data={data} height={400} />
                </CardContent>
            </Card>

            {/* Sales Growth Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Sales Quantity Growth Comparison</CardTitle>
                    <CardDescription>
                        This graph compares the number of sales in the current
                        year to each selected period.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SalesGrowthBarChart data={data} height={300} />
                </CardContent>
            </Card>
        </div>
    );
}
