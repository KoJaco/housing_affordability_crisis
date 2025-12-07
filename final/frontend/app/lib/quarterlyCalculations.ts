/**
 * Utilities for calculating quarterly statistics and growth
 */

import type { QuarterlyStats } from "~/types";
import { isValidPrice } from "./typeGuards";

/**
 * Get average price for a specific year period (yearsAgo = 0 for current year)
 */
function getQuarterlyAveragePrice(
    quarterly: QuarterlyStats[],
    yearsAgo: number,
    useSmoothed: boolean = false
): number | null {
    if (!quarterly || quarterly.length === 0) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const targetYear = currentYear - yearsAgo;

    const prices: number[] = [];
    let quartersFound = 0;

    // Get the last 4 quarters from the target year
    for (let i = 0; i < 4; i++) {
        let year = targetYear;
        let quarter = currentQuarter - i;

        // Handle year rollover
        while (quarter <= 0) {
            quarter += 4;
            year -= 1;
        }

        const quarterData = quarterly.find(
            (q) => q.year === year && q.quarter === quarter
        );
        
        if (!quarterData) continue;
        
        // Prefer smoothed if enabled, fallback to raw
        const price = useSmoothed
            ? (quarterData.median_price_smoothed ?? quarterData.median_price)
            : quarterData.median_price;
        
        if (isValidPrice(price)) {
            prices.push(price);
            quartersFound++;
        }
    }

    if (quartersFound < 2) return null; // Need at least 2 quarters
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

/**
 * Calculate price growth from quarterly data for a given number of years
 */
export function calculatePriceGrowth(
    quarterly: QuarterlyStats[],
    years: number,
    useSmoothed: boolean = false
): number | null {
    const recentPrice = getQuarterlyAveragePrice(quarterly, 0, useSmoothed);
    const pastPrice = getQuarterlyAveragePrice(quarterly, years, useSmoothed);

    if (pastPrice === null || recentPrice === null || pastPrice === 0) {
        return null;
    }

    // Calculate percentage growth
    return ((recentPrice - pastPrice) / pastPrice) * 100;
}

