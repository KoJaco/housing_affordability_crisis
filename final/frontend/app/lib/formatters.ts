export function formatPrice(
    price: number | null | undefined,
    options?: { decimals?: number; showNA?: boolean }
): string {
    const { decimals = 2, showNA = true } = options || {};

    if (price == null || typeof price !== "number") {
        return showNA ? "N/A" : "$0";
    }

    if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(decimals)}M`;
    }
    if (price >= 1000) {
        return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price.toFixed(0)}`;
}

export function formatPercentage(
    value: number | null | undefined,
    options?: { decimals?: number; showSign?: boolean; showNA?: boolean }
): string {
    const { decimals = 1, showSign = true, showNA = true } = options || {};

    if (value == null || typeof value !== "number") {
        return showNA ? "N/A" : "0%";
    }

    const sign = showSign && value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(decimals)}%`;
}

export function formatSales(value: number | null | undefined): string {
    if (value == null || typeof value !== "number") {
        return "N/A";
    }
    return value.toLocaleString();
}
