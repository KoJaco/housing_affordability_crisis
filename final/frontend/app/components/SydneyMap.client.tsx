import { useEffect, useMemo, useState } from "react";
import {
    MapContainer,
    TileLayer,
    GeoJSON as LeafletGeoJSON,
    useMap,
} from "react-leaflet";
import type { FeatureCollection, Feature } from "geojson";
import { Card } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { cn } from "~/lib/utils";

interface SydneyMapProps {
    geoJsonData: FeatureCollection | null;
    suburbData: Record<string, { median_price: number | null }>;
    selectedSuburbs: string[];
    filteredSuburbs: Set<string>;
    onSuburbClick: (suburb: string) => void;
}

// Component to handle map event listeners
function MapEventHandler({
    onSuburbClick,
}: {
    onSuburbClick: (suburb: string) => void;
}) {
    const map = useMap();

    useEffect(() => {
        const handleClick = (e: L.LeafletMouseEvent) => {
            // Click events are handled by GeoJSON onEachFeature
        };

        map.on("click", handleClick);
        return () => {
            map.off("click", handleClick);
        };
    }, [map, onSuburbClick]);

    return null;
}

// Legend component
function MapLegend() {
    return (
        <Card className="absolute bottom-4 right-4 z-[1000] bg-white/95 p-3 shadow-lg">
            <div className="space-y-2 text-xs">
                <div className="font-semibold">Price Range</div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-red-600"></div>
                    <span>&gt; $2M</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-orange-500"></div>
                    <span>$1.5M - $2M</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-yellow-500"></div>
                    <span>$1M - $1.5M</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-green-500"></div>
                    <span>&lt; $1M</span>
                </div>
                <div className="mt-2 flex items-center gap-2 border-t pt-2">
                    <div className="h-4 w-4 rounded border-4 border-blue-600 bg-transparent"></div>
                    <span>Selected</span>
                </div>
            </div>
        </Card>
    );
}

// Helper function to extract and normalize suburb name from GeoJSON feature
function getSuburbName(feature: Feature): string | null {
    if (!feature.properties) return null;
    
    const props = feature.properties as Record<string, any>;
    
    // Try multiple possible property names (case-insensitive)
    const possibleKeys = ['suburb', 'suburbname', 'SUBURB', 'SUBURBNAME'];
    
    for (const key of possibleKeys) {
        // Try exact match first
        if (key in props && props[key]) {
            const value = props[key];
            if (typeof value === 'string' && value.trim()) {
                return value.trim().toUpperCase();
            }
        }
        
        // Try case-insensitive match
        const lowerKey = key.toLowerCase();
        for (const propKey in props) {
            if (propKey.toLowerCase() === lowerKey && props[propKey]) {
                const value = props[propKey];
                if (typeof value === 'string' && value.trim()) {
                    return value.trim().toUpperCase();
                }
            }
        }
    }
    
    return null;
}

export default function SydneyMap({
    geoJsonData,
    suburbData,
    selectedSuburbs,
    filteredSuburbs,
    onSuburbClick,
}: SydneyMapProps) {
    const [hoveredSuburb, setHoveredSuburb] = useState<string | null>(null);

    // Debug: Log suburb matching statistics
    useEffect(() => {
        if (!geoJsonData || !suburbData) return;
        
        const geoJsonSuburbs = new Set<string>();
        const matchedSuburbs = new Set<string>();
        const unmatchedSuburbs = new Set<string>();
        
        geoJsonData.features.forEach((feature) => {
            const suburbName = getSuburbName(feature);
            if (suburbName) {
                geoJsonSuburbs.add(suburbName);
                if (suburbName in suburbData) {
                    matchedSuburbs.add(suburbName);
                } else {
                    unmatchedSuburbs.add(suburbName);
                }
            }
        });
        
        console.log(`[Map Debug] GeoJSON suburbs: ${geoJsonSuburbs.size}`);
        console.log(`[Map Debug] Matched with data: ${matchedSuburbs.size}`);
        console.log(`[Map Debug] Unmatched (no data): ${unmatchedSuburbs.size}`);
        
        if (unmatchedSuburbs.size > 0 && unmatchedSuburbs.size <= 20) {
            console.log(`[Map Debug] Unmatched suburbs:`, Array.from(unmatchedSuburbs).slice(0, 20));
        }
    }, [geoJsonData, suburbData]);

    // Get color based on median price
    const getPriceColor = (price: number | null): string => {
        if (price === null) return "#e5e7eb"; // Gray for no data

        if (price > 2000000) return "#dc2626"; // Red
        if (price > 1500000) return "#f97316"; // Orange
        if (price > 1000000) return "#fbbf24"; // Yellow
        return "#10b981"; // Green
    };

    // Style function for GeoJSON features
    const styleFeature = useMemo(() => {
        return (feature?: Feature): any => {
            if (!feature) {
                return {
                    fillColor: "#e5e7eb",
                    fillOpacity: 0.3,
                    color: "#9ca3af",
                    weight: 1,
                };
            }
            const suburbName = getSuburbName(feature);
            if (!suburbName) {
                return {
                    fillColor: "#e5e7eb",
                    fillOpacity: 0.3,
                    color: "#9ca3af",
                    weight: 1,
                };
            }

            const isSelected = selectedSuburbs.includes(suburbName);
            const isFiltered = filteredSuburbs.has(suburbName);
            const isHovered = hoveredSuburb === suburbName;

            // Blank out suburbs that don't match the filter
            // Make them completely non-interactive
            if (!isFiltered) {
                return {
                    fillColor: "#e5e7eb",
                    fillOpacity: 0,
                    color: "#e5e7eb",
                    weight: 0,
                    opacity: 0,
                    interactive: false, // Disable interaction for filtered-out suburbs
                };
            }

            const price = suburbData[suburbName]?.median_price ?? null;
            const fillColor = getPriceColor(price);

            return {
                fillColor: isSelected ? "#3b82f6" : fillColor,
                fillOpacity: isHovered ? 0.9 : 0.7,
                color: isSelected ? "#1e40af" : "#6b7280",
                weight: isSelected ? 4 : isHovered ? 2 : 1,
                opacity: 1,
            };
        };
    }, [suburbData, selectedSuburbs, filteredSuburbs, hoveredSuburb]);

    // Handle feature events
    const onEachFeature = (feature: Feature, layer: any) => {
        const suburbName = getSuburbName(feature);
        if (!suburbName) return;

        const isFiltered = filteredSuburbs.has(suburbName);

        // Only add interactivity for filtered suburbs
        if (!isFiltered) {
            // Disable all interaction for filtered-out suburbs
            if (layer) {
                // Disable pointer events and interaction
                if (typeof layer.setInteractive === "function") {
                    layer.setInteractive(false);
                }
                // Remove any existing event handlers
                if (typeof layer.off === "function") {
                    layer.off("click mouseover mouseout");
                }
                // Set style to invisible
                if (typeof layer.setStyle === "function") {
                    layer.setStyle({
                        fillOpacity: 0,
                        opacity: 0,
                        weight: 0,
                    });
                }
            }
            return;
        }

        // Enable interaction for filtered suburbs
        if (layer && typeof layer.setInteractive === "function") {
            layer.setInteractive(true);
        }

        // Add suburb name label only for filtered suburbs
        if (layer && typeof layer.bindTooltip === "function") {
            layer.bindTooltip(suburbName, {
                permanent: false,
                direction: "center",
                className: "suburb-label",
            });
        }

        // Only add event handlers for filtered suburbs
        layer.on({
            click: () => {
                // Double-check that suburb is still filtered (should always be true here)
                if (filteredSuburbs.has(suburbName)) {
                    onSuburbClick(suburbName);
                }
            },
            mouseover: () => {
                setHoveredSuburb(suburbName);
                if (layer && typeof layer.setStyle === "function") {
                    layer.setStyle({
                        fillOpacity: 0.9,
                        weight: 2,
                    });
                    if (typeof layer.openTooltip === "function") {
                        layer.openTooltip();
                    }
                }
            },
            mouseout: () => {
                setHoveredSuburb(null);
                // Reset to original style
                if (layer && typeof layer.setStyle === "function") {
                    const style = styleFeature(feature);
                    layer.setStyle(style);
                    if (typeof layer.closeTooltip === "function") {
                        layer.closeTooltip();
                    }
                }
            },
        });
    };

    if (!geoJsonData) {
        return (
            <div className="flex h-[400px] items-center justify-center bg-gray-100 md:h-[600px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="relative h-[400px] w-full md:h-[600px]">
            <MapContainer
                center={[-33.87, 151.21]}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <LeafletGeoJSON
                    data={geoJsonData}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                />
                <MapEventHandler onSuburbClick={onSuburbClick} />
            </MapContainer>
            <MapLegend />
        </div>
    );
}
