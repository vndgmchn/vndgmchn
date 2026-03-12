/**
 * Shared collector/set number formatting helpers.
 * Unifies padIfNumeric + set-number display across all screens.
 */

function padNum(val: string | number): string {
    const s = String(val);
    return /^\d+$/.test(s) ? s.padStart(3, '0') : s;
}

/**
 * Formats a collector number for display.
 * - Purely numeric values are zero-padded to 3 digits (e.g. "5" → "005")
 * - Alphanumeric values are preserved as-is (e.g. "SWSH123" stays "SWSH123")
 * - If setTotal is provided, formats as "005/100" or "005/100"
 * - Returns empty string if collectorNumber is missing
 */
export function formatCollectorNumber(
    collectorNumber: string | number | null | undefined,
    setTotal?: number | null
): string {
    if (collectorNumber === null || collectorNumber === undefined) return '';
    const padded = padNum(collectorNumber);
    if (setTotal != null) {
        const totalStr = setTotal >= 100 ? String(setTotal).padStart(3, '0') : String(setTotal);
        return `${padded}/${totalStr}`;
    }
    return padded;
}
