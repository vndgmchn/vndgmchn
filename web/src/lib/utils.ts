export function normalizeHandle(input: string | null | undefined): string {
    if (!input) return '';
    return input.trim().replace(/^@/, '').toLowerCase();
}
