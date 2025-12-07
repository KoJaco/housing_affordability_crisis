import { useState, useEffect } from "react";
import type { SuburbSummary } from "~/types";

export function useInitialLoad(
    suburbs: SuburbSummary[],
    geoJsonData: GeoJSON.FeatureCollection | null
) {
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (suburbs && suburbs.length > 0 && geoJsonData) {
            // subtle debounce for smooth transition
            const timer = setTimeout(() => {
                setIsInitialLoad(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [suburbs, geoJsonData]);

    return isInitialLoad;
}
