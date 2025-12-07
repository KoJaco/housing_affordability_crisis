import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Filter, ListFilterIcon } from "lucide-react";
import { FilterSidebar } from "~/components/FilterSidebar";
import type { PropertyType } from "~/types";

interface MobileFiltersProps {
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

export function MobileFilters(props: MobileFiltersProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                    <ListFilterIcon className="mr-2 h-4 w-4" />
                    Filters
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[300px] sm:w-[350px] h-screen overflow-x-hidden z-1000"
            >
                <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                    <FilterSidebar {...props} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
