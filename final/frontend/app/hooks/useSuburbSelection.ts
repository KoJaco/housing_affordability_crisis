import { useState, useCallback } from "react";
import { toast } from "sonner";
import { normalizeSuburbName } from "~/lib/suburbUtils";
import { MAX_SELECTED_SUBURBS } from "~/lib/constants";

export function useSuburbSelection(filteredSuburbs: Set<string>) {
    const [selectedSuburbs, setSelectedSuburbs] = useState<string[]>([]);

    const handleSuburbClick = useCallback(
        (suburb: string) => {
            // Normalize suburb name to UPPERCASE to match filteredSuburbs
            const normalizedSuburb = normalizeSuburbName(suburb);
            setSelectedSuburbs((prev) => {
                // want to remove if already selected
                if (prev.includes(normalizedSuburb)) {
                    return prev.filter((s) => s !== normalizedSuburb);
                } else if (
                    prev.length < MAX_SELECTED_SUBURBS &&
                    filteredSuburbs.has(normalizedSuburb)
                ) {
                    // Add if under limit and passes filters (... not filtered out)
                    return [...prev, normalizedSuburb];
                } else if (prev.length >= MAX_SELECTED_SUBURBS) {
                    toast.error(
                        `Maximum ${MAX_SELECTED_SUBURBS} suburbs can be selected`
                    );
                    return prev;
                } else if (!filteredSuburbs.has(normalizedSuburb)) {
                    toast.error(
                        "This suburb is filtered out. Adjust your filters to see it."
                    );
                    return prev;
                }
                return prev;
            });
        },
        [filteredSuburbs]
    );

    const handleRemoveSuburb = useCallback((suburb: string) => {
        setSelectedSuburbs((prev) => prev.filter((s) => s !== suburb));
    }, []);

    const handleClearAll = useCallback(() => {
        setSelectedSuburbs([]);
    }, []);

    const handleSelectSuburb = useCallback(
        (suburb: string) => {
            // Prevent selection of filtered-out suburbs
            if (!filteredSuburbs.has(suburb)) {
                toast.error(
                    "This suburb is filtered out. Adjust your filters to see it."
                );
                return;
            }

            setSelectedSuburbs((prev) => {
                if (prev.length < MAX_SELECTED_SUBURBS) {
                    if (!prev.includes(suburb)) {
                        return [...prev, suburb];
                    }
                } else {
                    toast.error(
                        `Maximum ${MAX_SELECTED_SUBURBS} suburbs can be selected`
                    );
                }
                return prev;
            });
        },
        [filteredSuburbs]
    );

    return {
        selectedSuburbs,
        handleSuburbClick,
        handleRemoveSuburb,
        handleClearAll,
        handleSelectSuburb,
    };
}
