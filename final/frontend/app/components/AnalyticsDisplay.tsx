import { useFetcher } from "react-router";
import { SingleSuburbView } from "~/components/SingleSuburbView";
import { ComparisonView } from "~/components/ComparisonView";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { MapPin } from "lucide-react";
import type { PropertyType } from "~/types";
import { useEffect, useState } from "react";

interface AnalyticsDisplayProps {
    selectedSuburbs: string[];
    propertyType: PropertyType;
}

const LOADING_DEBOUNCE_MS = 300; // Show skeleton only if loading takes longer than 300ms

export function AnalyticsDisplay({
    selectedSuburbs,
    propertyType,
}: AnalyticsDisplayProps) {
    const singleFetcher = useFetcher();
    const bulkFetcher = useFetcher();
    const [showSkeleton, setShowSkeleton] = useState(false);

    // Determine if we're currently loading
    const isLoading =
        (selectedSuburbs.length === 1 && singleFetcher.state === "loading") ||
        (selectedSuburbs.length > 1 && bulkFetcher.state === "loading");

    // Debounce skeleton display
    useEffect(() => {
        if (isLoading) {
            // Start timer to show skeleton after debounce delay
            const timer = setTimeout(() => {
                setShowSkeleton(true);
            }, LOADING_DEBOUNCE_MS);

            return () => {
                clearTimeout(timer);
                setShowSkeleton(false);
            };
        } else {
            // Loading completed, hide skeleton immediately
            setShowSkeleton(false);
        }
    }, [isLoading]);

    // Fetch data when suburbs or property type changes
    useEffect(() => {
        if (selectedSuburbs.length === 0) {
            return;
        }

        if (selectedSuburbs.length === 1) {
            const suburb = selectedSuburbs[0];
            singleFetcher.load(
                `/api/suburb/${encodeURIComponent(suburb)}?type=${propertyType}`
            );
        } else {
            const suburbsParam = selectedSuburbs
                .map((s) => encodeURIComponent(s))
                .join(",");
            bulkFetcher.load(
                `/api/suburbs-analytics?suburbs=${suburbsParam}&type=${propertyType}`
            );
        }
    }, [selectedSuburbs.join(","), propertyType]);

    // Empty state
    if (selectedSuburbs.length === 0) {
        return (
            <Card className="m-4 w-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                        No suburbs selected
                    </h3>
                    <p className="text-center text-sm text-muted-foreground">
                        Click on suburbs on the map to view analytics
                    </p>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                        Select up to 5 suburbs to compare
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Loading state - only show skeleton if debounced
    if (isLoading && showSkeleton) {
        return (
            <div className="space-y-6 lg:px-0 px-4 pt-4 w-full animate-pulse">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-gray-200 rounded-md" />
                    <div className="h-4 w-64 bg-gray-200 rounded-md" />
                </div>

                {/* Metric cards skeleton */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-8 w-40 bg-gray-200 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chart cards skeleton */}
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-6 w-32 bg-gray-200 rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] bg-gray-100 rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Error state
    if (
        (selectedSuburbs.length === 1 &&
            (singleFetcher.data?.error ||
                (singleFetcher.state === "idle" && !singleFetcher.data))) ||
        (selectedSuburbs.length > 1 &&
            (bulkFetcher.data?.error ||
                (bulkFetcher.state === "idle" && !bulkFetcher.data)))
    ) {
        const error =
            selectedSuburbs.length === 1
                ? singleFetcher.data?.error
                : bulkFetcher.data?.error;
        const suburb = selectedSuburbs[0];

        // Check if it's a "no data" error
        const isNoDataError =
            error?.includes("not found") ||
            error?.includes("No data found") ||
            error?.includes("404") ||
            (selectedSuburbs.length === 1 && singleFetcher.data === null);

        return (
            <Card className="m-4">
                <CardContent className="py-12">
                    <div className="text-center">
                        {isNoDataError ? (
                            <>
                                <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">
                                    No data available
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {suburb
                                        ? `Analytics unavailable for ${suburb}`
                                        : "No data found for selected suburbs"}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    This suburb may not have sufficient sales
                                    data to generate analytics.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="mb-2 text-lg font-semibold text-destructive">
                                    Error loading data
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {error || "An unexpected error occurred"}
                                </p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Single suburb view
    if (selectedSuburbs.length === 1 && singleFetcher.data) {
        return (
            <SingleSuburbView
                suburb={selectedSuburbs[0]}
                data={singleFetcher.data}
                propertyType={propertyType}
            />
        );
    }

    // Comparison view
    if (selectedSuburbs.length > 1 && bulkFetcher.data) {
        return (
            <ComparisonView suburbs={selectedSuburbs} data={bulkFetcher.data} />
        );
    }

    return null;
}
