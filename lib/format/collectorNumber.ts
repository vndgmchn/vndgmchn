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

/**
 * Formats a set number for display, taking into account external IDs and promotional sets.
 */
export function formatSetNumber(
    externalId?: string | null,
    collectorNumber?: string | null,
    setName?: string | null,
    setPrintedTotal?: number | null,
    setTotal?: number | null
): string {
    let num = collectorNumber ?? null;

    if (!num && typeof externalId === 'string' && externalId.includes('-')) {
        const parts = externalId.split('-');
        const last = parts[parts.length - 1];
        if (last) num = last;
    }

    if (setName && setName.toLowerCase().includes('promo')) {
        return num ? (num.match(/^\d+$/) ? num.padStart(3, '0') : num) : '—';
    }

    let formattedNum = num;
    if (num && num.match(/^\d+$/)) {
        formattedNum = num.padStart(3, '0');
    }

    if (formattedNum && setPrintedTotal) {
        let denomStr = String(setPrintedTotal);
        const effectiveTotal = setTotal ?? setPrintedTotal;
        if (effectiveTotal >= 100) {
            denomStr = denomStr.padStart(3, '0');
        }
        return `${formattedNum}/${denomStr}`;
    }
    if (formattedNum && setTotal) {
        let denomStr = String(setTotal);
        if (setTotal >= 100) {
            denomStr = denomStr.padStart(3, '0');
        }
        return `${formattedNum}/${denomStr}`;
    }
    if (formattedNum) return `${formattedNum}`;
    return '—';
}
