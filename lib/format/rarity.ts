/**
 * Shared rarity normalization helpers.
 * Single canonical JA_RARITY_MAP — full superset from all screens.
 */

export const JA_RARITY_MAP: Record<string, string> = {
    // Common
    '通常': 'Common',
    'コモン': 'Common',
    // Uncommon
    '非': 'Uncommon',
    'アンコモン': 'Uncommon',
    // Rare
    '希少': 'Rare',
    'レア': 'Rare',
    // Holo
    'レアホロ': 'Holo Rare',
    'ホロ': 'Holo',
    // Double / Triple
    'ダブルレア': 'Double Rare',
    'トリプルレア': 'Triple Rare',
    // Super / Ultra / Hyper
    'スーパーレア': 'Super Rare',
    'ウルトラレア': 'Ultra Rare',
    'ハイパーレア': 'Hyper Rare',
    '超ウルトラレア': 'Ultra Rare+',
    // Art
    'アートレア': 'Art Rare',
    'スペシャルアートレア': 'Special Art Rare',
    'キャラクターレア': 'Character Rare',
    // Secret
    'シークレット': 'Secret',
    'シークレットレア': 'Secret Rare',
    'シークレットスーパーレア': 'Secret Super Rare',
    // Prism / Promo / Special
    'プリズムレア': 'Prism Rare',
    'プロモ': 'Promo',
    'パラレル': 'Parallel',
    'リーダー': 'Leader',
    'スペシャルカード': 'Special Card',
    // Legacy
    'レジェンド': 'LEGEND',
    '黒白稀': 'BW Rare',
};

/**
 * Returns the canonical English label for a rarity string.
 * Trims input and maps Japanese strings using JA_RARITY_MAP.
 * Falls back to the original trimmed value if not found.
 */
export function normalizeRarity(rawRarity: string | null | undefined): string {
    if (!rawRarity) return '';
    const trimmed = rawRarity.trim();
    return JA_RARITY_MAP[trimmed] ?? trimmed;
}

/**
 * Returns a display-ready rarity label. Empty string if missing.
 */
export function displayRarity(rawRarity: string | null | undefined): string {
    if (!rawRarity) return '';
    return normalizeRarity(rawRarity);
}
