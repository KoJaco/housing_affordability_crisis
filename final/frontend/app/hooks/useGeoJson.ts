import { useState, useEffect } from "react";
import type { GeoJSON } from "geojson";
import { toast } from "sonner";

export function useGeoJson() {
    const [geoJsonData, setGeoJsonData] =
        useState<GeoJSON.FeatureCollection | null>(null);

    useEffect(() => {
        fetch("/sydney_suburbs.geojson")
            .then((res) => res.json())
            .then((data) => {
                setGeoJsonData(data);
            })
            .catch((err) => {
                console.error("Failed to load GeoJSON:", err);
                toast.error("Failed to load map data");
            });
    }, []);

    return geoJsonData;
}
