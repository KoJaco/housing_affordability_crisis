
import { useMemo } from "react";
import type { PropertyType, SuburbSummary, SuburbAnalytics } from "~/types";
import { normalizeSuburbName, getSuburbMedianPrice } from "~/lib/suburbUtils";

interface UseSuburbFiltersParams {
    suburbs: SuburbSummary[];
    searchTerm: string;
    priceRange: [number, number];
    propertyType: PropertyType;
    propertyTypeAnalytics: Map<string, SuburbAnalytics>;
}

export function useSuburbFilters({
    suburbs,
    searchTerm,
    priceRange,
    propertyType,
    propertyTypeAnalytics,
}: UseSuburbFiltersParams) {
    /** Filter suburbs based on search term and price range
     * - Use property-type-specific prices when propertyType is not "all"
     * - GeoJSON is UPPERCASE, Normalize suburb names to that to match
     */
    const filteredSuburbs = useMemo(() => {
        return new Set(
            suburbs
                .filter((s) => {
                    const matchesSearch = s.suburb
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());

                    // Median based on property type
                    const medianPrice = getSuburbMedianPrice(
                        s.suburb,
                        propertyType,
                        suburbs,
                        propertyTypeAnalytics
                    );

                    const matchesPrice =
                        medianPrice !== null &&
                        medianPrice >= priceRange[0] &&
                        medianPrice <= priceRange[1];
                    return matchesSearch && matchesPrice;
                })
                .map((s) => normalizeSuburbName(s.suburb))
        );
    }, [suburbs, searchTerm, priceRange, propertyType, propertyTypeAnalytics]);

    // Autocomplete search results
    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return Array.from(filteredSuburbs)
            .filter((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10);
    }, [filteredSuburbs, searchTerm]);

    /**
     * - Convert suburbs array to map for O(1) lookup
     * - Use property-type-specific prices when propertyType is not "all"
     * - Normalize suburb names to UPPERCASE to match GeoJSON
     */

    const suburbDataMap = useMemo(() => {
        return suburbs.reduce(
            (acc, s) => {
                const medianPrice = getSuburbMedianPrice(
                    s.suburb,
                    propertyType,
                    suburbs,
                    propertyTypeAnalytics
                );
                const normalizedSuburb = normalizeSuburbName(s.suburb);
                acc[normalizedSuburb] = { median_price: medianPrice };
                return acc;
            },
            {} as Record<string, { median_price: number | null }>
        );
    }, [suburbs, propertyType, propertyTypeAnalytics]);

    return {
        filteredSuburbs,
        searchResults,
        suburbDataMap,
    };
}


