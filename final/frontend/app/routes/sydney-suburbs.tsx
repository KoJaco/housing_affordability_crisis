import { useState, useMemo, useCallback } from "react";
import type { Route } from "./+types/sydney-suburbs";
import { useLoaderData, useNavigation } from "react-router";
import { Header } from "~/components/Header";
import { FilterSidebar } from "~/components/FilterSidebar";
import { MobileFilters } from "~/components/MobileFilters";
import { SydneyMap } from "~/components/SydneyMap";
import { AnalyticsDisplay } from "~/components/AnalyticsDisplay";
import { PageLoadingOverlay } from "~/components/PageLoadingOverlay";
import { PageTransition } from "~/components/PageTransition";
import type { PropertyType } from "~/types";
import { fetchSuburbSummaries } from "~/lib/api";
import { INITIAL_PRICE_RANGE, MAX_PRICE_RANGE } from "~/lib/constants";
import { useGeoJson } from "~/hooks/useGeoJson";
import { usePropertyTypeAnalytics } from "~/hooks/usePropertyTypeAnalytics";
import { usePropertyCounts } from "~/hooks/usePropertyCounts";
import { useInitialLoad } from "~/hooks/useInitialLoad";
import { useSuburbFilters } from "~/hooks/useSuburbFilters";
import { useSuburbSelection } from "~/hooks/useSuburbSelection";

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
    const navigation = useNavigation();
    const [propertyType, setPropertyType] = useState<PropertyType>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [priceRange, setPriceRange] =
        useState<[number, number]>(INITIAL_PRICE_RANGE);

    // Custom hooks for data fetching and state management
    const geoJsonData = useGeoJson();
    const propertyTypeAnalytics = usePropertyTypeAnalytics(propertyType);
    const isInitialLoad = useInitialLoad(suburbs, geoJsonData);

    // Track if we're loading (either from navigation or initial data load)
    const isLoading =
        navigation.state === "loading" ||
        (isInitialLoad && (!suburbs || suburbs.length === 0)) ||
        (isInitialLoad && !geoJsonData);

    // Filtering logic
    const { filteredSuburbs, searchResults, suburbDataMap } = useSuburbFilters({
        suburbs,
        searchTerm,
        priceRange,
        propertyType,
        propertyTypeAnalytics,
    });

    // Suburb selection logic
    const {
        selectedSuburbs,
        handleSuburbClick,
        handleRemoveSuburb,
        handleClearAll,
        handleSelectSuburb,
    } = useSuburbSelection(filteredSuburbs);

    // Property counts for selected suburbs
    const propertyCounts = usePropertyCounts(selectedSuburbs);

    // Event handlers
    const handleReset = useCallback(() => {
        setSearchTerm("");
        setPriceRange(INITIAL_PRICE_RANGE);
        setPropertyType("all");
        handleClearAll();
    }, []);

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
        <>
            <PageLoadingOverlay
                isLoading={isLoading}
                message="Loading Sydney suburbs..."
            />
            <PageTransition>
                <div className="min-h-screen bg-background overflow-x-hidden">
                    <Header />

                    <div className="flex max-w-7xl mx-auto lg:mt-10 pr-4 min-w-0">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block pr-4">
                            <FilterSidebar
                                {...filterProps}
                                onRemoveSuburb={handleRemoveSuburb}
                                onClearAll={handleClearAll}
                                selectedSuburbs={selectedSuburbs}
                            />
                        </div>

                        {/* Main Content */}
                        <main className="flex-1 flex flex-col items-center justify-start pb-10 lg:pl-0 pl-4 min-w-0 max-w-full">
                            {/* Mobile Filters */}
                            <div className="lg:hidden py-4 w-full">
                                <MobileFilters
                                    {...filterProps}
                                    selectedSuburbs={selectedSuburbs}
                                    onRemoveSuburb={handleRemoveSuburb}
                                    onClearAll={handleClearAll}
                                />
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
            </PageTransition>
        </>
    );
}
