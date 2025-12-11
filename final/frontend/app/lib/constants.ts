/**
 * Application-wide constants
 */

export const MAX_PRICE_RANGE = 35_000_000; // $70M max to accommodate highest suburb (POINT PIPER at $60.5M)
export const MAX_SELECTED_SUBURBS = 10;
export const API_PAGE_LIMIT = 1000;
export const INITIAL_PRICE_RANGE: [number, number] = [0, MAX_PRICE_RANGE];
