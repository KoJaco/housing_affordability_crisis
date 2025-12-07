import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "~/components/ui/command";
import { Search, X, Check, Link, RotateCcwIcon } from "lucide-react";
import { formatPrice } from "~/lib/formatters";
import { cn } from "~/lib/utils";
import { useChartSettingsStore } from "~/lib/chartSettingsStore";
import { MAX_PRICE_RANGE, MAX_SELECTED_SUBURBS } from "~/lib/constants";
import { useFilterSidebar } from "~/hooks/useFilterSidebar";
import type { PropertyType } from "~/types";
import { Badge } from "./ui/badge";

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
    selectedSuburbs: string[];
    onRemoveSuburb: (suburb: string) => void;
    onClearAll: () => void;
}

export function FilterSidebar({
    searchTerm,
    onSearchChange,
    propertyType,
    onPropertyTypeChange,
    priceRange,
    onPriceRangeChange,
    onReset,
    searchResults,
    onSelectSuburb,
    propertyCounts,
    selectedSuburbs,
    onRemoveSuburb,
    onClearAll,
}: FilterSidebarProps) {
    // Chart sync settings
    const syncEnabled = useChartSettingsStore((state) => state.syncEnabled);
    const setSyncEnabled = useChartSettingsStore(
        (state) => state.setSyncEnabled
    );

    // Use custom hook for sidebar state management
    const {
        isPopoverOpen,
        setIsPopoverOpen,
        localPriceRange,
        setLocalPriceRange,
        displayedResults,
        displayCount,
        hasMore,
        handleScroll,
    } = useFilterSidebar({
        searchTerm,
        searchResults,
        priceRange,
        onPriceRangeChange,
    });

    return (
        <aside className="sticky top-10 h-screen w-full lg:w-80 overflow-y-auto px-2 lg:px-4 text-foreground/75">
            <div className="md:space-y-8 space-y-6">
                {/* Search Filter */}
                <div className="space-y-2">
                    <Label
                        htmlFor="search"
                        className="text-sm font-semibold text-foreground"
                    >
                        Search Suburbs
                    </Label>
                    <Popover
                        open={isPopoverOpen}
                        onOpenChange={setIsPopoverOpen}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isPopoverOpen}
                                className="w-full justify-between font-normal"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="truncate">
                                        {searchTerm || "Type suburb name..."}
                                    </span>
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSearchChange("");
                                        }}
                                        className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                        >
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Search suburbs..."
                                    value={searchTerm}
                                    onValueChange={(value) => {
                                        onSearchChange(value);
                                        setIsPopoverOpen(true);
                                    }}
                                />
                                <CommandList
                                    onScroll={handleScroll}
                                    className="max-h-[300px]"
                                >
                                    <CommandEmpty>
                                        {searchTerm
                                            ? "No suburbs found."
                                            : "Start typing to search..."}
                                    </CommandEmpty>
                                    {displayedResults.length > 0 && (
                                        <CommandGroup>
                                            {displayedResults.map((suburb) => {
                                                const isSelected =
                                                    selectedSuburbs.includes(
                                                        suburb
                                                    );
                                                return (
                                                    <CommandItem
                                                        key={suburb}
                                                        value={suburb}
                                                        onSelect={() => {
                                                            if (!isSelected) {
                                                                onSelectSuburb(
                                                                    suburb
                                                                );
                                                            }
                                                            onSearchChange("");
                                                            setIsPopoverOpen(
                                                                false
                                                            );
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <span>{suburb}</span>
                                                    </CommandItem>
                                                );
                                            })}
                                            {hasMore && (
                                                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                                                    Scroll for more results (
                                                    {searchResults.length -
                                                        displayCount}{" "}
                                                    remaining)
                                                </div>
                                            )}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {selectedSuburbs.length > 0 && (
                    <div className="flex flex-1 flex-wrap items-center gap-2 w-full">
                        <div className="flex flex-col gap-2 w-full min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-foreground shrink-0">
                                    Selected Suburbs
                                </h3>
                                <span className="text-xs lg:text-sm text-foreground/50 whitespace-nowrap">
                                    ({selectedSuburbs.length}/
                                    {MAX_SELECTED_SUBURBS} selected)
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedSuburbs.map((suburb) => (
                                    <Badge
                                        key={suburb}
                                        variant="default"
                                        className="flex items-center gap-1 px-2 lg:px-3 py-1.5 max-w-full"
                                    >
                                        <span className="truncate max-w-[200px] lg:max-w-none">
                                            {suburb}
                                        </span>
                                        <Button
                                            onClick={() =>
                                                onRemoveSuburb(suburb)
                                            }
                                            size="icon"
                                            variant="ghost"
                                            className="ml-1 rounded-full hover:bg-gray-300 p-0 w-4 h-4 cursor-pointer shrink-0"
                                            aria-label={`Remove ${suburb}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Property Type Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">
                        Property Type
                    </Label>
                    <RadioGroup
                        value={propertyType}
                        onValueChange={(value) =>
                            onPropertyTypeChange(value as PropertyType)
                        }
                    >
                        {[
                            {
                                value: "all",
                                id: "all",
                                label: "All Properties",
                                countKey: "all" as const,
                            },
                            {
                                value: "house",
                                id: "house",
                                label: "Houses",
                                countKey: "house" as const,
                            },
                            {
                                value: "unit",
                                id: "unit",
                                label: "Apartments",
                                countKey: "unit" as const,
                            },
                        ].map((type) => (
                            <div
                                key={type.value}
                                className="flex items-center justify-between gap-2"
                            >
                                <div className="flex items-center space-x-2 min-w-0">
                                    <RadioGroupItem
                                        value={type.value}
                                        id={type.id}
                                        className="shrink-0"
                                    />
                                    <Label
                                        htmlFor={type.id}
                                        className="cursor-pointer font-normal truncate"
                                    >
                                        {type.label}
                                    </Label>
                                </div>
                                {propertyCounts && (
                                    <span className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap shrink-0">
                                        {propertyCounts[
                                            type.countKey
                                        ].toLocaleString()}
                                    </span>
                                )}
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm font-semibold text-foreground shrink-0">
                            Price Range
                        </Label>
                        <span className="text-xs lg:text-sm text-muted-foreground text-right whitespace-nowrap">
                            {formatPrice(localPriceRange[0], { decimals: 1 })} -{" "}
                            {formatPrice(localPriceRange[1], { decimals: 1 })}
                        </span>
                    </div>
                    <Slider
                        value={localPriceRange}
                        onValueChange={(values) =>
                            setLocalPriceRange([values[0], values[1]])
                        }
                        min={0}
                        max={MAX_PRICE_RANGE}
                        step={100000}
                        className="w-full"
                    />
                </div>

                {/* Chart Sync Settings */}
                <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-foreground">
                            Chart Settings
                        </Label>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-2 lg:p-3 gap-2">
                        <div className="flex items-center gap-2 pr-1 min-w-0 flex-1">
                            <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                    Sync Charts
                                </p>

                                {syncEnabled ? (
                                    <p className="text-xs text-muted-foreground break-words">
                                        Settings are synced between all charts
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground break-words">
                                        Apply settings to all charts
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant={syncEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSyncEnabled(!syncEnabled)}
                            className="shrink-0"
                        >
                            <span className="hidden sm:inline">
                                {syncEnabled ? "Synced" : "Independent"}
                            </span>
                            <span className="sm:hidden">
                                {syncEnabled ? "On" : "Off"}
                            </span>
                        </Button>
                    </div>
                </div>

                <Button variant="outline" onClick={onReset} className="w-full">
                    <RotateCcwIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">Reset Filters</span>
                </Button>
            </div>
        </aside>
    );
}
