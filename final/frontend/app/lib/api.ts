/**
 * API client utilities for Sydney Property Analysis
 */

import type {
    SuburbAnalytics,
    QuarterlyStats,
    SuburbSummary,
    AnalyticsListResponse,
    QuarterlyStatsListResponse,
    SuburbSearchResponse,
    PropertyType,
    AggregatedSuburbAnalytics,
    SuburbData,
    BulkSuburbsData,
} from "~/types";

const API_BASE_URL = "http://localhost:8000";

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

    return {
        suburb: house.suburb,
        property_type: "all",
        last_updated: house.last_updated || unit.last_updated,
        current_quarter: house.current_quarter || unit.current_quarter,
        current_median_price: aggregate(
            house.current_median_price,
            unit.current_median_price
        ),
        current_avg_ctsd: aggregate(
            house.current_avg_ctsd,
            unit.current_avg_ctsd
        ),
        current_num_sales:
            (house.current_num_sales || 0) + (unit.current_num_sales || 0),
        growth_1yr_percentage: aggregate(
            house.growth_1yr_percentage,
            unit.growth_1yr_percentage
        ),
        growth_3yr_percentage: aggregate(
            house.growth_3yr_percentage,
            unit.growth_3yr_percentage
        ),
        growth_5yr_percentage: aggregate(
            house.growth_5yr_percentage,
            unit.growth_5yr_percentage
        ),
        growth_10yr_percentage: aggregate(
            house.growth_10yr_percentage,
            unit.growth_10yr_percentage
        ),
        growth_since_2005_percentage: aggregate(
            house.growth_since_2005_percentage,
            unit.growth_since_2005_percentage
        ),
        cagr_5yr: aggregate(house.cagr_5yr, unit.cagr_5yr),
        cagr_10yr: aggregate(house.cagr_10yr, unit.cagr_10yr),
        volatility_score: aggregate(
            house.volatility_score,
            unit.volatility_score
        ),
        max_drawdown_pct: aggregate(
            house.max_drawdown_pct,
            unit.max_drawdown_pct
        ),
        recovery_quarters: aggregate(
            house.recovery_quarters,
            unit.recovery_quarters
        ),
        avg_quarterly_volume: aggregate(
            house.avg_quarterly_volume,
            unit.avg_quarterly_volume
        ),
        overall_liquidity_score: aggregate(
            house.overall_liquidity_score,
            unit.overall_liquidity_score
        ),
        market_health_score: aggregate(
            house.market_health_score,
            unit.market_health_score
        ),
        q1_avg_premium_percentage: aggregate(
            house.q1_avg_premium_percentage,
            unit.q1_avg_premium_percentage
        ),
        q2_avg_premium_percentage: aggregate(
            house.q2_avg_premium_percentage,
            unit.q2_avg_premium_percentage
        ),
        q3_avg_premium_percentage: aggregate(
            house.q3_avg_premium_percentage,
            unit.q3_avg_premium_percentage
        ),
        q4_avg_premium_percentage: aggregate(
            house.q4_avg_premium_percentage,
            unit.q4_avg_premium_percentage
        ),
        best_quarter_to_sell:
            house.best_quarter_to_sell || unit.best_quarter_to_sell,
        forecast_q1_price: aggregate(
            house.forecast_q1_price,
            unit.forecast_q1_price
        ),
        forecast_q1_lower: aggregate(
            house.forecast_q1_lower,
            unit.forecast_q1_lower
        ),
        forecast_q1_upper: aggregate(
            house.forecast_q1_upper,
            unit.forecast_q1_upper
        ),
        forecast_q2_price: aggregate(
            house.forecast_q2_price,
            unit.forecast_q2_price
        ),
        forecast_q2_lower: aggregate(
            house.forecast_q2_lower,
            unit.forecast_q2_lower
        ),
        forecast_q2_upper: aggregate(
            house.forecast_q2_upper,
            unit.forecast_q2_upper
        ),
        price_rank: aggregate(house.price_rank, unit.price_rank),
        growth_rank: aggregate(house.growth_rank, unit.growth_rank),
        speed_rank: aggregate(house.speed_rank, unit.speed_rank),
        total_quarters_with_data: aggregate(
            house.total_quarters_with_data,
            unit.total_quarters_with_data
        ),
        data_completeness_percentage: aggregate(
            house.data_completeness_percentage,
            unit.data_completeness_percentage
        ),
        price_quarterly: null, // Would need to merge JSON strings
        ctsd_quarterly: null, // Would need to merge JSON strings
        house_analytics: house,
        unit_analytics: unit,
    };
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
    const response = await fetchAnalytics({ limit: 1000 });

    // Group by suburb and aggregate
    const suburbMap = new Map<
        string,
        { prices: number[]; growths: number[]; ctss: number[] }
    >();

    for (const item of response.items) {
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
