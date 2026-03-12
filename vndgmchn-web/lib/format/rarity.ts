/**
 * Shared rarity normalization helpers (web copy).
 * Same JA_RARITY_MAP superset as mobile lib/format/rarity.
 */

export const JA_RARITY_MAP: Record<string, string> = {
    '通常': 'Common',
    'コモン': 'Common',
    '非': 'Uncommon',
    'アンコモン': 'Uncommon',
    '希少': 'Rare',
    'レア': 'Rare',
    'レアホロ': 'Holo Rare',
    'ホロ': 'Holo',
    'ダブルレア': 'Double Rare',
    'トリプルレア': 'Triple Rare',
    'スーパーレア': 'Super Rare',
    'ウルトラレア': 'Ultra Rare',
    'ハイパーレア': 'Hyper Rare',
    '超ウルトラレア': 'Ultra Rare+',
    'アートレア': 'Art Rare',
    'スペシャルアートレア': 'Special Art Rare',
    'キャラクターレア': 'Character Rare',
    'シークレット': 'Secret',
    'シークレットレア': 'Secret Rare',
    'シークレットスーパーレア': 'Secret Super Rare',
    'プリズムレア': 'Prism Rare',
    'プロモ': 'Promo',
    'パラレル': 'Parallel',
    'リーダー': 'Leader',
    'スペシャルカード': 'Special Card',
    'レジェンド': 'LEGEND',
    '黒白稀': 'BW Rare',
};

export function normalizeRarity(rawRarity: string | null | undefined): string {
    if (!rawRarity) return '';
    const trimmed = rawRarity.trim();
    return JA_RARITY_MAP[trimmed] ?? trimmed;
}

export function displayRarity(rawRarity: string | null | undefined): string {
    if (!rawRarity) return '';
    return normalizeRarity(rawRarity);
}
