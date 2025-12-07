export function isNumber(value: unknown): value is number {
    return value != null && typeof value === "number";
}

export function isValidPrice(value: unknown): value is number {
    return isNumber(value) && value >= 0;
}

export function isValidSales(value: unknown): value is number {
    return isNumber(value) && value >= 0;
}

export function isValidPercentage(value: unknown): value is number {
    return isNumber(value);
}
