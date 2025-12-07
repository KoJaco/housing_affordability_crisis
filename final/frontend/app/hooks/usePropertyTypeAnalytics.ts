import { useState, useEffect } from "react";
import type { PropertyType, SuburbAnalytics } from "~/types";
import { fetchAnalytics } from "~/lib/api";
import { API_PAGE_LIMIT } from "~/lib/constants";

export function usePropertyTypeAnalytics(propertyType: PropertyType) {
    const [propertyTypeAnalytics, setPropertyTypeAnalytics] = useState<
        Map<string, SuburbAnalytics>
    >(new Map());

    useEffect(() => {
        const fetchPropertyTypeAnalytics = async () => {
            if (propertyType === "all") {
                // use aggregated data (should be already loaded)
                setPropertyTypeAnalytics(new Map());
                return;
            }

            try {
                const response = await fetchAnalytics({
                    property_type: propertyType,
                    limit: API_PAGE_LIMIT, // Get all suburbs (limit is 1000, handles fetching the rest after first request)
                });

                // Create a map of suburb --> analytics for O(1) lookup
                const analyticsMap = new Map<string, SuburbAnalytics>();
                for (const item of response.items) {
                    analyticsMap.set(item.suburb, item);
                }

                setPropertyTypeAnalytics(analyticsMap);
            } catch (error) {
                console.error("Error fetching property type analytics:", error);
                // clear map to fall back to summary data
                setPropertyTypeAnalytics(new Map());
            }
        };

        fetchPropertyTypeAnalytics();
    }, [propertyType]);

    return propertyTypeAnalytics;
}
