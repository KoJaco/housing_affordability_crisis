import { lazy, Suspense, useState, useEffect } from "react";
import { LoadingSpinner } from "~/components/LoadingSpinner";

interface SydneyMapProps {
    geoJsonData: GeoJSON.FeatureCollection | null;
    suburbData: Record<string, { median_price: number | null }>;
    selectedSuburbs: string[];
    filteredSuburbs: Set<string>;
    onSuburbClick: (suburb: string) => void;
}

// Dynamically import the client-side map component
const SydneyMapClient = lazy(() => import("./SydneyMap.client"));

export function SydneyMap(props: SydneyMapProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Show loading state during SSR or while client component loads
    if (!isClient) {
        return (
            <div className="flex h-[400px] items-center justify-center bg-gray-100 md:h-[600px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <Suspense
            fallback={
                <div className="flex h-[400px] items-center justify-center bg-gray-100 md:h-[600px]">
                    <LoadingSpinner size="lg" />
                </div>
            }
        >
            <SydneyMapClient {...props} />
        </Suspense>
    );
}
