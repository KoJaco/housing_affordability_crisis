import { useState, useEffect, useMemo, useCallback } from "react";
import type { Route } from "./+types/analyze";
import { useLoaderData } from "react-router";
import { Header } from "~/components/Header";
import { FilterSidebar } from "~/components/FilterSidebar";
import { MobileFilters } from "~/components/MobileFilters";
import { SydneyMap } from "~/components/SydneyMap";
import { AnalyticsDisplay } from "~/components/AnalyticsDisplay";
import { toast } from "sonner";
import type { GeoJSON } from "geojson";
import type { SuburbSummary, PropertyType, SuburbAnalytics } from "~/types";
import {
    fetchSuburbSummaries,
    fetchSuburbAnalytics,
    fetchAnalytics,
} from "~/lib/api";

export async function loader() {
    try {
        const suburbs = await fetchSuburbSummaries();
        return { suburbs };
    } catch (error) {
        console.error("Error loading suburb summaries:", error);
        return { suburbs: [] };
    }
}

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Sydney Property Analysis" },
        {
            name: "description",
            content: "Analyze Sydney property prices across 653 suburbs",
        },
    ];
}

export default function Analyze() {
    const { suburbs } = useLoaderData<typeof loader>();
    const [selectedSuburbs, setSelectedSuburbs] = useState<string[]>([]);
    const [propertyType, setPropertyType] = useState<PropertyType>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [priceRange, setPriceRange] = useState<[number, number]>([
        0, 5000000,
    ]);
    const [geoJsonData, setGeoJsonData] =
        useState<GeoJSON.FeatureCollection | null>(null);
    const [propertyCounts, setPropertyCounts] = useState<{
        all: number;
        house: number;
        unit: number;
    } | null>(null);
    const [propertyTypeAnalytics, setPropertyTypeAnalytics] = useState<
        Map<string, SuburbAnalytics>
    >(new Map());

    // Load GeoJSON
    useEffect(() => {
        fetch("/sydney_suburbs.geojson")
            .then((res) => res.json())
            .then((data) => setGeoJsonData(data))
            .catch((err) => {
                console.error("Failed to load GeoJSON:", err);
                toast.error("Failed to load map data");
            });
    }, []);

    // Fetch property-type-specific analytics when propertyType changes
    useEffect(() => {
        const fetchPropertyTypeAnalytics = async () => {
            if (propertyType === "all") {
                // For "all", use the aggregated summary data (already loaded)
                setPropertyTypeAnalytics(new Map());
                return;
            }

            try {
                // Fetch all analytics for the selected property type
                const response = await fetchAnalytics({
                    property_type: propertyType,
                    limit: 1000, // Get all suburbs
                });

                // Create a map of suburb -> analytics for O(1) lookup
                const analyticsMap = new Map<string, SuburbAnalytics>();
                for (const item of response.items) {
                    analyticsMap.set(item.suburb, item);
                }

                setPropertyTypeAnalytics(analyticsMap);
            } catch (error) {
                console.error("Error fetching property type analytics:", error);
                // On error, clear the map so filtering falls back to summary data
                setPropertyTypeAnalytics(new Map());
            }
        };

        fetchPropertyTypeAnalytics();
    }, [propertyType]);

    // Fetch property counts for selected suburbs
    useEffect(() => {
        if (selectedSuburbs.length === 0) {
            setPropertyCounts(null);
            return;
        }

        const fetchCounts = async () => {
            try {
                const [houseAnalytics, unitAnalytics] = await Promise.all([
                    Promise.all(
                        selectedSuburbs.map((suburb) =>
                            fetchSuburbAnalytics(suburb, "house")
                                .then((data) => data[0]?.current_num_sales ?? 0)
                                .catch(() => 0)
                        )
                    ),
                    Promise.all(
                        selectedSuburbs.map((suburb) =>
                            fetchSuburbAnalytics(suburb, "unit")
                                .then((data) => data[0]?.current_num_sales ?? 0)
                                .catch(() => 0)
                        )
                    ),
                ]);

                const houseCount = houseAnalytics.reduce(
                    (sum, count) => sum + count,
                    0
                );
                const unitCount = unitAnalytics.reduce(
                    (sum, count) => sum + count,
                    0
                );
                const allCount = houseCount + unitCount;

                setPropertyCounts({
                    all: allCount,
                    house: houseCount,
                    unit: unitCount,
                });
            } catch (error) {
                console.error("Error fetching property counts:", error);
                setPropertyCounts(null);
            }
        };

        fetchCounts();
    }, [selectedSuburbs]);

    // Filter suburbs based on search term and price range
    // Use property-type-specific prices when propertyType is not "all"
    const filteredSuburbs = useMemo(() => {
        return new Set(
            suburbs
                .filter((s) => {
                    const matchesSearch = s.suburb
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());

                    // Get the appropriate median price based on property type
                    let medianPrice: number | null = null;
                    if (propertyType === "all") {
                        // Use aggregated summary price
                        medianPrice = s.current_median_price;
                    } else {
                        // Use property-type-specific price
                        const analytics = propertyTypeAnalytics.get(s.suburb);
                        medianPrice = analytics?.current_median_price ?? null;
                    }

                    const matchesPrice =
                        medianPrice !== null &&
                        medianPrice >= priceRange[0] &&
                        medianPrice <= priceRange[1];
                    return matchesSearch && matchesPrice;
                })
                .map((s) => s.suburb)
        );
    }, [suburbs, searchTerm, priceRange, propertyType, propertyTypeAnalytics]);

    // Autocomplete search results
    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return Array.from(filteredSuburbs)
            .filter((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10);
    }, [filteredSuburbs, searchTerm]);

    // Convert suburbs array to map for O(1) lookup
    // Use property-type-specific prices when propertyType is not "all"
    const suburbDataMap = useMemo(() => {
        return suburbs.reduce(
            (acc, s) => {
                let medianPrice: number | null = null;
                if (propertyType === "all") {
                    // Use aggregated summary price
                    medianPrice = s.current_median_price;
                } else {
                    // Use property-type-specific price
                    const analytics = propertyTypeAnalytics.get(s.suburb);
                    medianPrice = analytics?.current_median_price ?? null;
                }
                acc[s.suburb] = { median_price: medianPrice };
                return acc;
            },
            {} as Record<string, { median_price: number | null }>
        );
    }, [suburbs, propertyType, propertyTypeAnalytics]);

    // Event handlers - memoized to prevent unnecessary re-renders
    const handleSuburbClick = useCallback(
        (suburb: string) => {
            setSelectedSuburbs((prev) => {
                if (prev.includes(suburb)) {
                    // Remove if already selected
                    return prev.filter((s) => s !== suburb);
                } else if (prev.length < 5 && filteredSuburbs.has(suburb)) {
                    // Add if under limit and passes filters
                    return [...prev, suburb];
                } else if (prev.length >= 5) {
                    toast.error("Maximum 5 suburbs can be selected");
                    return prev;
                } else if (!filteredSuburbs.has(suburb)) {
                    toast.error(
                        "This suburb is filtered out. Adjust your filters to see it."
                    );
                    return prev;
                }
                return prev;
            });
        },
        [filteredSuburbs]
    );

    const handleRemoveSuburb = useCallback((suburb: string) => {
        setSelectedSuburbs((prev) => prev.filter((s) => s !== suburb));
    }, []);

    const handleClearAll = useCallback(() => {
        setSelectedSuburbs([]);
    }, []);

    const handleReset = useCallback(() => {
        setSearchTerm("");
        setPriceRange([0, 5000000]);
        setPropertyType("all");
    }, []);

    const handleSelectSuburb = useCallback(
        (suburb: string) => {
            // Prevent selection of filtered-out suburbs
            if (!filteredSuburbs.has(suburb)) {
                toast.error(
                    "This suburb is filtered out. Adjust your filters to see it."
                );
                return;
            }

            setSelectedSuburbs((prev) => {
                if (prev.length < 5) {
                    if (!prev.includes(suburb)) {
                        return [...prev, suburb];
                    }
                } else {
                    toast.error("Maximum 5 suburbs can be selected");
                }
                return prev;
            });
        },
        [filteredSuburbs]
    );

    const handlePriceRangeChange = useCallback((range: [number, number]) => {
        setPriceRange(range);
    }, []);

    const filterProps = useMemo(
        () => ({
            searchTerm,
            onSearchChange: setSearchTerm,
            propertyType,
            onPropertyTypeChange: setPropertyType,
            priceRange,
            onPriceRangeChange: handlePriceRangeChange,
            onReset: handleReset,
            allSuburbs: suburbs.map((s) => s.suburb),
            searchResults,
            onSelectSuburb: handleSelectSuburb,
            propertyCounts,
        }),
        [
            searchTerm,
            propertyType,
            priceRange,
            handlePriceRangeChange,
            handleReset,
            handleSelectSuburb,
            suburbs,
            searchResults,
            propertyCounts,
        ]
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                selectedSuburbs={selectedSuburbs}
                onRemoveSuburb={handleRemoveSuburb}
                onClearAll={handleClearAll}
            />

            <div className="flex">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <FilterSidebar {...filterProps} />
                </div>

                {/* Main Content */}
                <main className="flex-1">
                    {/* Mobile Filters */}
                    <div className="lg:hidden p-4">
                        <MobileFilters {...filterProps} />
                    </div>

                    {/* Map */}
                    {geoJsonData ? (
                        <SydneyMap
                            geoJsonData={geoJsonData}
                            suburbData={suburbDataMap}
                            selectedSuburbs={selectedSuburbs}
                            filteredSuburbs={filteredSuburbs}
                            onSuburbClick={handleSuburbClick}
                        />
                    ) : (
                        <div className="flex h-[400px] items-center justify-center bg-gray-100 md:h-[600px]">
                            <div className="text-center">
                                <p className="text-muted-foreground">
                                    Loading map...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Analytics */}
                    <AnalyticsDisplay
                        selectedSuburbs={selectedSuburbs}
                        propertyType={propertyType}
                    />
                </main>
            </div>
        </div>
    );
}
