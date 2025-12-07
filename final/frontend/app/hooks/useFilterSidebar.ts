import { useState, useEffect, useMemo, useCallback, useRef } from "react";

const INITIAL_DISPLAY_COUNT = 5;
const LOAD_MORE_COUNT = 10;

interface UseFilterSidebarParams {
    searchTerm: string;
    searchResults: string[];
    priceRange: [number, number];
    onPriceRangeChange: (range: [number, number]) => void;
}

export function useFilterSidebar({
    searchTerm,
    searchResults,
    priceRange,
    onPriceRangeChange,
}: UseFilterSidebarParams) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
    const [localPriceRange, setLocalPriceRange] =
        useState<[number, number]>(priceRange);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSentRangeRef = useRef<[number, number]>(priceRange);

    // Reset display count based on searchTrem change
    useEffect(() => {
        setDisplayCount(INITIAL_DISPLAY_COUNT);
    }, [searchTerm]);

    // Open popover when search term is entered
    useEffect(() => {
        if (searchTerm && !isPopoverOpen) {
            setIsPopoverOpen(true);
        }
    }, [searchTerm, isPopoverOpen]);

    // Sync local state with prop when prop changes externally (like reset).
    useEffect(() => {
        const propChanged =
            priceRange[0] !== lastSentRangeRef.current[0] ||
            priceRange[1] !== lastSentRangeRef.current[1];

        // only sync if prop val is different from what was last sent yea
        if (propChanged) {
            setLocalPriceRange(priceRange);
            lastSentRangeRef.current = priceRange;
        }
    }, [priceRange]);

    // Filtered and limited search results
    const displayedResults = useMemo(() => {
        return searchResults.slice(0, displayCount);
    }, [searchResults, displayCount]);

    // Check if there are more results to load
    const hasMore = searchResults.length > displayCount;

    // lazy loading
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.currentTarget;
            const scrollBottom =
                target.scrollHeight - target.scrollTop - target.clientHeight;

            // Load more when within 50px of bottom
            if (scrollBottom < 50 && hasMore) {
                setDisplayCount((prev) =>
                    Math.min(prev + LOAD_MORE_COUNT, searchResults.length)
                );
            }
        },
        [hasMore, searchResults.length]
    );

    // Debounce price range updates to parent
    useEffect(() => {
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
        }, 150);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [localPriceRange, onPriceRangeChange]);

    return {
        isPopoverOpen,
        setIsPopoverOpen,
        displayCount,
        localPriceRange,
        setLocalPriceRange,
        displayedResults,
        hasMore,
        handleScroll,
    };
}


