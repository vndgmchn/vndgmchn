/**
 * Shared collector/set number formatting helpers (web copy).
 */

function padNum(val: string | number): string {
    const s = String(val);
    return /^\d+$/.test(s) ? s.padStart(3, '0') : s;
}

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
