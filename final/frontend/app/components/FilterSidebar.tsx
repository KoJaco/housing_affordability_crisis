import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import { Search, X } from "lucide-react";
import type { PropertyType } from "~/types";
import { cn } from "~/lib/utils";

interface FilterSidebarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    propertyType: PropertyType;
    onPropertyTypeChange: (type: PropertyType) => void;
    priceRange: [number, number];
    onPriceRangeChange: (range: [number, number]) => void;
    onReset: () => void;
    allSuburbs: string[];
    searchResults: string[];
    onSelectSuburb: (suburb: string) => void;
    propertyCounts: { all: number; house: number; unit: number } | null;
}

export function FilterSidebar({
    searchTerm,
    onSearchChange,
    propertyType,
    onPropertyTypeChange,
    priceRange,
    onPriceRangeChange,
    onReset,
    allSuburbs,
    searchResults,
    onSelectSuburb,
    propertyCounts,
}: FilterSidebarProps) {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [localPriceRange, setLocalPriceRange] =
        useState<[number, number]>(priceRange);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSentRangeRef = useRef<[number, number]>(priceRange);

    // Sync local state with prop when prop changes externally (e.g., reset)
    // Only sync if the prop value is different from what we last sent
    useEffect(() => {
        const propChanged =
            priceRange[0] !== lastSentRangeRef.current[0] ||
            priceRange[1] !== lastSentRangeRef.current[1];

        if (propChanged) {
            setLocalPriceRange(priceRange);
            lastSentRangeRef.current = priceRange;
        }
    }, [priceRange]);

    // Debounce price range updates to parent
    useEffect(() => {
        // Skip if local range matches what we last sent
        if (
            localPriceRange[0] === lastSentRangeRef.current[0] &&
            localPriceRange[1] === lastSentRangeRef.current[1]
        ) {
            return;
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            lastSentRangeRef.current = [...localPriceRange] as [number, number];
            onPriceRangeChange([...localPriceRange]);
        }, 150); // 150ms debounce

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [localPriceRange, onPriceRangeChange]);

    const formatPrice = (price: number): string => {
        if (price >= 1000000) {
            return `$${(price / 1000000).toFixed(1)}M`;
        }
        return `$${(price / 1000).toFixed(0)}K`;
    };

    return (
        <aside className="w-80 border-r bg-white p-4">
            <div className="space-y-6">
                {/* Search */}
                <div className="relative space-y-2">
                    <Label htmlFor="search">Search Suburbs</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="search"
                            type="text"
                            placeholder="Type suburb name..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() =>
                                setTimeout(() => setIsSearchFocused(false), 200)
                            }
                            className="pl-9 pr-9"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {isSearchFocused && searchResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
                            {searchResults.map((suburb) => (
                                <button
                                    key={suburb}
                                    onClick={() => {
                                        onSelectSuburb(suburb);
                                        onSearchChange("");
                                        setIsSearchFocused(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                >
                                    {suburb}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Property Type */}
                <div className="space-y-3">
                    <Label>Property Type</Label>
                    <RadioGroup
                        value={propertyType}
                        onValueChange={(value) =>
                            onPropertyTypeChange(value as PropertyType)
                        }
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="all" />
                                <Label
                                    htmlFor="all"
                                    className="cursor-pointer font-normal"
                                >
                                    All Properties
                                </Label>
                            </div>
                            {propertyCounts && (
                                <span className="text-sm text-muted-foreground">
                                    {propertyCounts.all.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="house" id="house" />
                                <Label
                                    htmlFor="house"
                                    className="cursor-pointer font-normal"
                                >
                                    Houses
                                </Label>
                            </div>
                            {propertyCounts && (
                                <span className="text-sm text-muted-foreground">
                                    {propertyCounts.house.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unit" id="unit" />
                                <Label
                                    htmlFor="unit"
                                    className="cursor-pointer font-normal"
                                >
                                    Apartments
                                </Label>
                            </div>
                            {propertyCounts && (
                                <span className="text-sm text-muted-foreground">
                                    {propertyCounts.unit.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </RadioGroup>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Price Range</Label>
                        <span className="text-sm text-muted-foreground">
                            {formatPrice(localPriceRange[0])} -{" "}
                            {formatPrice(localPriceRange[1])}
                        </span>
                    </div>
                    <Slider
                        value={localPriceRange}
                        onValueChange={(values) =>
                            setLocalPriceRange([values[0], values[1]])
                        }
                        min={0}
                        max={5000000}
                        step={50000}
                        className="w-full"
                    />
                </div>

                {/* Reset Button */}
                <Button variant="outline" onClick={onReset} className="w-full">
                    Reset Filters
                </Button>
            </div>
        </aside>
    );
}
