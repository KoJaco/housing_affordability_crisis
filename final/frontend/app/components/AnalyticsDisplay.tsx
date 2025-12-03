import { useFetcher } from "react-router";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { SingleSuburbView } from "~/components/SingleSuburbView";
import { ComparisonView } from "~/components/ComparisonView";
import { Card, CardContent } from "~/components/ui/card";
import { MapPin } from "lucide-react";
import type { PropertyType } from "~/types";
import { useEffect } from "react";

interface AnalyticsDisplayProps {
    selectedSuburbs: string[];
    propertyType: PropertyType;
}

export function AnalyticsDisplay({
    selectedSuburbs,
    propertyType,
}: AnalyticsDisplayProps) {
    const singleFetcher = useFetcher();
    const bulkFetcher = useFetcher();

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
            <Card className="m-4">
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

    // Loading state
    if (
        (selectedSuburbs.length === 1 && singleFetcher.state === "loading") ||
        (selectedSuburbs.length > 1 && bulkFetcher.state === "loading")
    ) {
        return (
            <Card className="m-4">
                <CardContent className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                </CardContent>
            </Card>
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
