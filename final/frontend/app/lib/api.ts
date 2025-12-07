/**
 * API client utilities for Sydney Property Analysis
 */

import type {
    SuburbAnalytics,
    QuarterlyStats,
    SuburbSummary,
    AnalyticsListResponse,
    SuburbSearchResponse,
    PropertyType,
    AggregatedSuburbAnalytics,
    SuburbData,
    BulkSuburbsData,
} from "~/types";
import { API_PAGE_LIMIT } from "./constants";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

/**
 * Fetch suburb analytics list
 */
export async function fetchAnalytics(params?: {
    suburb?: string;
    property_type?: "house" | "unit";
    min_price?: number;
    sort_by?: string;
    limit?: number;
    offset?: number;
}): Promise<AnalyticsListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.suburb) searchParams.set("suburb", params.suburb);
    if (params?.property_type)
        searchParams.set("property_type", params.property_type);
    if (params?.min_price !== undefined)
        searchParams.set("min_price", params.min_price.toString());
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const url = `${API_BASE_URL}/api/analytics?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch analytics for a specific suburb
 */
export async function fetchSuburbAnalytics(
    suburb: string,
    property_type?: "house" | "unit"
): Promise<SuburbAnalytics[]> {
    const searchParams = new URLSearchParams();
    if (property_type) {
        searchParams.set("property_type", property_type);
    }

    const url = `${API_BASE_URL}/api/analytics/${encodeURIComponent(suburb)}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Analytics not found for suburb: ${suburb}`);
        }
        throw new Error(
            `Failed to fetch suburb analytics: ${response.statusText}`
        );
    }

    return response.json();
}

/**
 * Fetch quarterly stats for a suburb
 */
export async function fetchSuburbQuarterly(
    suburb: string,
    property_type?: "house" | "unit",
    start_year?: number,
    end_year?: number
): Promise<QuarterlyStats[]> {
    const searchParams = new URLSearchParams();
    if (property_type) {
        searchParams.set("property_type", property_type);
    }
    if (start_year) {
        searchParams.set("start_year", start_year.toString());
    }
    if (end_year) {
        searchParams.set("end_year", end_year.toString());
    }

    const url = `${API_BASE_URL}/api/quarterly/${encodeURIComponent(suburb)}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Quarterly stats not found for suburb: ${suburb}`);
        }
        throw new Error(
            `Failed to fetch quarterly stats: ${response.statusText}`
        );
    }

    return response.json();
}

/**
 * Search suburbs
 */
export async function searchSuburbs(
    query: string,
    limit: number = 20
): Promise<SuburbSearchResponse> {
    const url = `${API_BASE_URL}/api/analytics/search/suburbs?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to search suburbs: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Aggregate analytics for 'all' property type
 * Combines house and unit data with weighted averages based on sales volume
 */
function aggregateAnalytics(
    houseAnalytics: SuburbAnalytics | undefined,
    unitAnalytics: SuburbAnalytics | undefined
): AggregatedSuburbAnalytics | null {
    if (!houseAnalytics && !unitAnalytics) {
        return null;
    }

    // If only one type exists, return it as 'all'
    if (!houseAnalytics && unitAnalytics) {
        return {
            ...unitAnalytics,
            property_type: "all",
            unit_analytics: unitAnalytics,
        };
    }
    if (!unitAnalytics && houseAnalytics) {
        return {
            ...houseAnalytics,
            property_type: "all",
            house_analytics: houseAnalytics,
        };
    }

    // Both exist - aggregate
    const house = houseAnalytics!;
    const unit = unitAnalytics!;

    const houseSales = house.current_num_sales || 0;
    const unitSales = unit.current_num_sales || 0;
    const totalSales = houseSales + unitSales;

    if (totalSales === 0) {
        // Fallback to simple average if no sales data
        return {
            ...house,
            property_type: "all",
            house_analytics: house,
            unit_analytics: unit,
            current_median_price:
                house.current_median_price && unit.current_median_price
                    ? (house.current_median_price + unit.current_median_price) /
                      2
                    : house.current_median_price || unit.current_median_price,
        };
    }

    // Weighted aggregation based on sales volume
    const houseWeight = houseSales / totalSales;
    const unitWeight = unitSales / totalSales;

    const aggregate = (
        houseVal: number | null,
        unitVal: number | null
    ): number | null => {
        if (houseVal === null && unitVal === null) return null;
        if (houseVal === null) return unitVal;
        if (unitVal === null) return houseVal;
        return houseVal * houseWeight + unitVal * unitWeight;
    };

    // Fields to aggregate using weighted average
    const fieldsToAggregate: Array<keyof SuburbAnalytics> = [
        "current_median_price",
        "current_median_price_smoothed",
        "current_avg_ctsd",
        "growth_1yr_percentage",
        "growth_3yr_percentage",
        "growth_5yr_percentage",
        "growth_10yr_percentage",
        "growth_since_2005_percentage",
        "cagr_5yr",
        "cagr_10yr",
        "growth_1yr_percentage_smoothed",
        "growth_3yr_percentage_smoothed",
        "growth_5yr_percentage_smoothed",
        "growth_10yr_percentage_smoothed",
        "growth_since_2005_percentage_smoothed",
        "cagr_5yr_smoothed",
        "cagr_10yr_smoothed",
        "volatility_score",
        "max_drawdown_pct",
        "recovery_quarters",
        "avg_quarterly_volume",
        "overall_liquidity_score",
        "market_health_score",
        "q1_avg_premium_percentage",
        "q2_avg_premium_percentage",
        "q3_avg_premium_percentage",
        "q4_avg_premium_percentage",
        "forecast_q1_price",
        "forecast_q1_lower",
        "forecast_q1_upper",
        "forecast_q2_price",
        "forecast_q2_lower",
        "forecast_q2_upper",
        "price_rank",
        "growth_rank",
        "speed_rank",
        "total_quarters_with_data",
        "data_completeness_percentage",
    ];

    // Build aggregated object
    const aggregated: AggregatedSuburbAnalytics = {
        suburb: house.suburb,
        property_type: "all",
        last_updated: house.last_updated || unit.last_updated,
        current_quarter: house.current_quarter || unit.current_quarter,
        current_num_sales:
            (house.current_num_sales || 0) + (unit.current_num_sales || 0),
        best_quarter_to_sell:
            house.best_quarter_to_sell || unit.best_quarter_to_sell,
        price_quarterly: null, // Would need to merge JSON strings
        ctsd_quarterly: null, // Would need to merge JSON strings
        house_analytics: house,
        unit_analytics: unit,
    } as AggregatedSuburbAnalytics;

    // Aggregate all numeric fields
    fieldsToAggregate.forEach((field) => {
        (aggregated as unknown as Record<string, number | null>)[field] =
            aggregate(
                house[field] as number | null,
                unit[field] as number | null
            );
    });

    return aggregated;
}

/**
 * Fetch suburb data (analytics + quarterly) for a specific property type
 */
export async function fetchSuburbData(
    suburb: string,
    propertyType: PropertyType
): Promise<SuburbData | null> {
    try {
        if (propertyType === "all") {
            // Fetch both house and unit data
            const [
                houseAnalytics,
                unitAnalytics,
                houseQuarterly,
                unitQuarterly,
            ] = await Promise.all([
                fetchSuburbAnalytics(suburb, "house").catch(() => []),
                fetchSuburbAnalytics(suburb, "unit").catch(() => []),
                fetchSuburbQuarterly(suburb, "house").catch(() => []),
                fetchSuburbQuarterly(suburb, "unit").catch(() => []),
            ]);

            const house = houseAnalytics[0];
            const unit = unitAnalytics[0];

            const aggregated = aggregateAnalytics(house, unit);
            if (!aggregated) {
                return null;
            }

            // Combine quarterly data, sorted by year and quarter
            const combinedQuarterly = [
                ...houseQuarterly,
                ...unitQuarterly,
            ].sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.quarter - b.quarter;
            });

            return {
                analytics: aggregated,
                quarterly: combinedQuarterly,
            };
        } else {
            // Fetch single property type
            const [analytics, quarterly] = await Promise.all([
                fetchSuburbAnalytics(suburb, propertyType),
                fetchSuburbQuarterly(suburb, propertyType),
            ]);

            if (analytics.length === 0) {
                return null;
            }

            return {
                analytics: analytics[0],
                quarterly,
            };
        }
    } catch (error) {
        console.error(`Error fetching data for ${suburb}:`, error);
        return null;
    }
}

/**
 * Fetch bulk suburbs data
 */
export async function fetchBulkSuburbsData(
    suburbs: string[],
    propertyType: PropertyType
): Promise<BulkSuburbsData> {
    const results: BulkSuburbsData = {};

    // Fetch all suburbs in parallel
    const promises = suburbs.map(async (suburb) => {
        const data = await fetchSuburbData(suburb, propertyType);
        if (data) {
            results[suburb] = data;
        }
    });

    await Promise.all(promises);
    return results;
}

/**
 * Get suburb summary for initial map load
 * Fetches all suburbs without property_type filter, then aggregates per suburb
 */
export async function fetchSuburbSummaries(): Promise<SuburbSummary[]> {
    // Fetch all analytics (both house and unit)
    // Note: We need to fetch all records via pagination because there are 1157+ records
    // (645 suburbs × 2 property types), and the API limit is 1000 per request.
    // VAUCLUSE is at position 1057, so it gets cut off with limit 1000.
    const allItems: SuburbAnalytics[] = [];
    let offset = 0;
    const limit = API_PAGE_LIMIT;
    let totalRecords = 0;

    // Fetch all records via pagination
    while (true) {
        const response = await fetchAnalytics({ limit, offset });
        allItems.push(...response.items);

        // Track total records from API response
        totalRecords = response.total;

        // Stop if we've fetched all records
        // Condition 1: Got fewer items than requested (last page)
        // Condition 2: Already fetched all records (safety check)
        if (response.items.length < limit || allItems.length >= totalRecords) {
            break;
        }

        // Move to next page
        offset += limit;
    }

    // Log for debugging (can be removed in production)
    if (allItems.length < totalRecords) {
        console.warn(
            `Warning: Fetched ${allItems.length} items but API reports ${totalRecords} total. ` +
                `Some suburbs may be missing from the map.`
        );
    }

    // Group by suburb and aggregate
    const suburbMap = new Map<
        string,
        { prices: number[]; growths: number[]; ctss: number[] }
    >();

    for (const item of allItems) {
        if (!suburbMap.has(item.suburb)) {
            suburbMap.set(item.suburb, { prices: [], growths: [], ctss: [] });
        }
        const data = suburbMap.get(item.suburb)!;
        if (item.current_median_price !== null) {
            data.prices.push(item.current_median_price);
        }
        if (item.growth_5yr_percentage !== null) {
            data.growths.push(item.growth_5yr_percentage);
        }
        if (item.current_avg_ctsd !== null) {
            data.ctss.push(item.current_avg_ctsd);
        }
    }

    // Convert to summary array
    const summaries: SuburbSummary[] = [];
    for (const [suburb, data] of suburbMap.entries()) {
        // Calculate median price (average of house and unit if both exist)
        const medianPrice =
            data.prices.length > 0
                ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length
                : null;

        // Average growth
        const growth =
            data.growths.length > 0
                ? data.growths.reduce((a, b) => a + b, 0) / data.growths.length
                : null;

        // Average CTSD
        const ctsd =
            data.ctss.length > 0
                ? data.ctss.reduce((a, b) => a + b, 0) / data.ctss.length
                : null;

        summaries.push({
            suburb,
            current_median_price: medianPrice,
            growth_5yr_percentage: growth,
            current_avg_ctsd: ctsd,
        });
    }

    return summaries;
}
