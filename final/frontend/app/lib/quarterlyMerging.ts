/**
 * Utilities for merging quarterly data from multiple property types
 */

import type { QuarterlyStats, PropertyType } from "~/types";
import { isNumber } from "./typeGuards";

/**
 * Average numeric values from an array, filtering out null values
 */
function averageNumericField<T>(
    items: T[],
    fieldName: keyof T
): number | null {
    const values = items
        .map((item) => item[fieldName])
        .filter((val): val is number => isNumber(val));

    if (values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Merge quarterly data when propertyType is "all" to average house and unit prices
 */
export function mergeQuarterlyData(
    quarterly: QuarterlyStats[],
    propertyType: PropertyType
): QuarterlyStats[] {
    if (propertyType !== "all") {
        // Return original data if filtering by house or unit
        return quarterly;
    }

    // Group by year and quarter
    const grouped = new Map<string, QuarterlyStats[]>();

    quarterly.forEach((item) => {
        const key = `${item.year}-Q${item.quarter}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(item);
    });

    // Merge each group by averaging prices
    const merged: QuarterlyStats[] = [];
    grouped.forEach((items) => {
        if (items.length === 0) return;

        // If only one item, use it directly
        if (items.length === 1) {
            merged.push(items[0]);
            return;
        }

        // Average prices and other numeric fields
        const avgPrice = averageNumericField(items, "median_price");
        if (avgPrice === null) {
            // If no valid prices, use the first item
            merged.push(items[0]);
            return;
        }

        const avgPriceSmoothed = averageNumericField(items, "median_price_smoothed");
        const avgMeanPrice = averageNumericField(items, "mean_price");
        const avgMedianCtsd = averageNumericField(items, "median_ctsd");

        // Sum numeric counts
        const totalSales = items.reduce(
            (sum, item) => sum + (item.num_sales || 0),
            0
        );

        // Use the first item as a template and update averaged values
        const mergedItem: QuarterlyStats = {
            ...items[0],
            median_price: avgPrice,
            median_price_smoothed: avgPriceSmoothed,
            mean_price: avgMeanPrice,
            median_ctsd: avgMedianCtsd,
            num_sales: totalSales,
            // Reset property_type since it's now merged
            property_type: "house", // Keep as house for type compatibility, but it's actually merged
        };

        merged.push(mergedItem);
    });

    // Sort by year and quarter
    return merged.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
    });
}

