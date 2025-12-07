export type TimePeriod = "1yr" | "3yr" | "5yr" | "max";

export interface QuarterDate {
    year: number;
    quarter: number;
}

export function calculateCutoffDate(
    timePeriod: TimePeriod,
    defaultStartYear: number = 2000
): QuarterDate {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    switch (timePeriod) {
        case "1yr":
            return { year: currentYear - 1, quarter: currentQuarter };
        case "3yr":
            return { year: currentYear - 3, quarter: currentQuarter };
        case "5yr":
            return { year: currentYear - 5, quarter: currentQuarter };
        case "max":
        default:
            return { year: defaultStartYear, quarter: 1 };
    }
}

export function formatQuarterString(year: number, quarter: number): string {
    return `Q${quarter} ${year}`;
}

export function parseQuarterString(quarterStr: string): QuarterDate | null {
    const match = quarterStr.match(/Q(\d)\s+(\d+)/);
    if (!match) return null;

    const quarter = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    if (quarter < 1 || quarter > 4 || isNaN(year)) {
        return null;
    }

    return { year, quarter };
}

export function sortQuarters(quarters: string[]): string[] {
    return [...quarters].sort((a, b) => {
        const parsedA = parseQuarterString(a);
        const parsedB = parseQuarterString(b);

        if (!parsedA || !parsedB) return 0;

        if (parsedA.year !== parsedB.year) {
            return parsedA.year - parsedB.year;
        }
        return parsedA.quarter - parsedB.quarter;
    });
}

export function filterQuartersByDateRange(
    quarters: string[],
    cutoffDate: QuarterDate,
    timePeriod: TimePeriod
): string[] {
    if (timePeriod === "max") {
        return quarters;
    }

    return quarters.filter((quarterStr) => {
        const parsed = parseQuarterString(quarterStr);
        if (!parsed) return false;

        if (parsed.year > cutoffDate.year) return true;
        if (
            parsed.year === cutoffDate.year &&
            parsed.quarter >= cutoffDate.quarter
        ) {
            return true;
        }
        return false;
    });
}

export function isQuarterInRange(
    year: number,
    quarter: number,
    cutoffDate: QuarterDate,
    timePeriod: TimePeriod
): boolean {
    if (timePeriod === "max") return true;
    if (year > cutoffDate.year) return true;
    if (year === cutoffDate.year && quarter >= cutoffDate.quarter) return true;
    return false;
}
