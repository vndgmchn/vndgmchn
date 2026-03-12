/**
 * Shared relative time formatting helpers.
 */

/**
 * Returns a short relative time string: "5m ago", "2h ago", "3d ago".
 * Returns null if timestamp is missing.
 */
export function formatRelativeTime(timestamp: string | null | undefined): string | null {
    if (!timestamp) return null;
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (diffMs < 0) return '0m ago';
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / 3_600_000);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffMs / 86_400_000);
    return `${diffDays}d ago`;
}

/**
 * Returns "Updated 5m ago" style label, or null if timestamp is missing.
 */
export function formatUpdatedLabel(timestamp: string | null | undefined): string | null {
    const rel = formatRelativeTime(timestamp);
    return rel ? `Updated ${rel}` : null;
}
