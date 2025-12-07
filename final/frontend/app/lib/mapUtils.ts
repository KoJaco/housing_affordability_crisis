import type { Feature } from "geojson";
import { normalizeSuburbName } from "./suburbUtils";

export function getSuburbNameFromFeature(feature: Feature): string | null {
    if (!feature.properties) return null;

    const props = feature.properties as Record<string, any>;
    const possibleKeys = ["suburb", "suburbname"];

    // Try case-insensitive match
    for (const key of possibleKeys) {
        const lowerKey = key.toLowerCase();
        const propKey = Object.keys(props).find(
            (k) => k.toLowerCase() === lowerKey
        );

        if (propKey) {
            const value = props[propKey];
            if (typeof value === "string" && value.trim()) {
                return normalizeSuburbName(value);
            }
        }
    }

    return null;
}

export function getPriceColor(price: number | null): string {
    if (price === null) return "#e5e7eb"; // Gray for no data

    if (price > 2000000) return "#dc2626"; // Red
    if (price > 1500000) return "#f97316"; // Orange
    if (price > 1000000) return "#fbbf24"; // Yellow
    return "#10b981"; // Green
}

export function isLayerInteractive(layer: any): boolean {
    return typeof layer?.setInteractive === "function";
}

export function disableLayerInteraction(layer: any): void {
    if (!isLayerInteractive(layer)) return;

    layer.setInteractive(false);
    if (typeof layer.off === "function") {
        layer.off("click mouseover mouseout");
    }
    if (typeof layer.setStyle === "function") {
        layer.setStyle({
            fillOpacity: 0,
            opacity: 0,
            weight: 0,
        });
    }
}
