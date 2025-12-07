import type { PropertyType, SuburbSummary, SuburbAnalytics } from "~/types";

export function normalizeSuburbName(suburb: string): string {
    return suburb.trim().toUpperCase();
}

export function getSuburbMedianPrice(
    suburb: string,
    propertyType: PropertyType,
    summaries: SuburbSummary[],
    propertyTypeAnalytics: Map<string, SuburbAnalytics>
): number | null {
    const summary = summaries.find((s) => s.suburb === suburb);
    if (!summary) return null;

    if (propertyType === "all") {
        return summary.current_median_price;
    }

    const analytics = propertyTypeAnalytics.get(suburb);
    return analytics?.current_median_price ?? null;
}
