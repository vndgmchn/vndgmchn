/**
 * Shared price display helpers.
 * Composes currency + time helpers into display-ready strings.
 */

import { convertToUsd, formatUsd } from './currency';
import { formatUpdatedLabel } from './time';

/**
 * Returns a formatted USD display string for a price value.
 * Handles null/undefined with a configurable fallback.
 */
export function getDisplayPrice(
    amount: number | null | undefined,
    currency?: string | null,
    fallback = '—'
): string {
    const usd = convertToUsd(amount, currency);
    if (usd === null) return fallback;
    return formatUsd(usd);
}

/**
 * Returns a price staleness label like "Updated 5m ago", or null if not applicable.
 * Returns null if price is missing or updatedAt is missing.
 */
export function getPriceStatusLabel(
    updatedAt: string | null | undefined,
    hasPrice: boolean
): string | null {
    if (!hasPrice || !updatedAt) return null;
    return formatUpdatedLabel(updatedAt);
}
