/**
 * Shared currency formatting helpers (web copy).
 * Same logic as lib/format/currency in the mobile app.
 */

export const JPY_TO_USD = Number(
    process.env.NEXT_PUBLIC_JPY_TO_USD_RATE ||
    process.env.EXPO_PUBLIC_JPY_TO_USD_RATE ||
    0.00637
);

/**
 * Converts an amount to USD using the explicit `currency` field.
 * Does NOT use language-code or price-size heuristics.
 */
export function convertToUsd(
    amount: number | null | undefined,
    currency?: string | null,
    rate?: number
): number | null {
    if (amount === null || amount === undefined) return null;
    if (currency === 'JPY') return amount * (rate ?? JPY_TO_USD);
    return amount;
}

/**
 * Converts a price to USD using a language-code + threshold heuristic.
 * Used when the data source does not include an explicit currency field.
 */
export function convertJpyHeuristic(
    amount: number | null | undefined,
    langCode?: string | null,
    rate?: number
): number | null {
    if (amount === null || amount === undefined) return null;
    if (langCode === 'JA' && amount >= 1000) return amount * (rate ?? JPY_TO_USD);
    return amount;
}

/**
 * Formats a USD number as "$1,234.00". Returns '—' if not a valid number.
 */
export function formatUsd(amount: number | null | undefined): string {
    if (typeof amount !== 'number') return '—';
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
