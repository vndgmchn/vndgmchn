import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
// Types — match exact RPC output columns
// ─────────────────────────────────────────────

/** One row returned by get_storefront_by_handle or get_storefront_by_id. */
export type StorefrontRow = {
    handle: string;
    display_name: string;
    bio: string | null;
    is_public: boolean;
    avatar_url?: string | null;
    banner_url?: string | null;
    theme_preset?: string | null;
    item_id: string | null;
    catalog_product_id: string | null;
    title: string | null;
    quantity: number | null;
    listing_price: number | null;
    image_url: string | null;
    set_name: string | null;
    collector_number: string | null;
    set_total: number | null;
    set_printed_total: number | null;
    market_price: number | null;
    last_updated: string | null;
    condition: string | null;
    is_graded: boolean | null;
    grading_company: string | null;
    grade: number | null;
    kind: string | null;
    language_code: string | null;
    rarity: string | null;
    set_name_en: string | null;
};

/** A single FOR_SALE inventory item on the storefront. */
export type StorefrontItem = {
    item_id: string;
    catalog_product_id: string | null;
    title: string;
    quantity: number;
    listing_price: number;
    image_url: string | null;
    set_name: string | null;
    collector_number: string | null;
    set_total: number | null;
    set_printed_total: number | null;
    market_price: number | null;
    last_updated: string | null;
    condition: string | null;
    is_graded: boolean | null;
    grading_company: string | null;
    grade: number | null;
    kind: string | null;
    language_code: string | null;
    rarity: string | null;
    set_name_en: string | null;
};

/** Normalized storefront page data: owner identity + FOR_SALE items. */
export type StorefrontData = {
    handle: string;
    display_name: string;
    bio: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    theme_preset?: string | null;
    items: StorefrontItem[];
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Converts raw RPC rows into a single StorefrontData object.
 * Returns null if rows are empty (private or not found).
 */
function normalizeRows(rows: StorefrontRow[]): StorefrontData | null {
    if (!rows || rows.length === 0) {
        console.log('[storefront] normalizeRows: empty rows → returning null');
        return null;
    }

    const first = rows[0];

    // Filter rows that have an actual item (RPC returns null item_id when
    // the storefront exists but has no FOR_SALE items).
    const items: StorefrontItem[] = rows
        .filter((row) => row.item_id !== null)
        .map((row) => ({
            item_id: row.item_id as string,
            catalog_product_id: row.catalog_product_id,
            title: row.title ?? '',
            quantity: row.quantity ?? 1,
            listing_price: row.listing_price ?? 0,
            image_url: row.image_url,
            set_name: row.set_name,
            collector_number: row.collector_number,
            set_total: row.set_total,
            set_printed_total: row.set_printed_total,
            market_price: row.market_price,
            last_updated: row.last_updated,
            condition: row.condition,
            is_graded: row.is_graded,
            grading_company: row.grading_company,
            grade: row.grade,
            kind: row.kind,
            language_code: row.language_code,
            rarity: row.rarity,
            set_name_en: row.set_name_en,
        }));

    const result: StorefrontData = {
        handle: first.handle,
        display_name: first.display_name,
        bio: first.bio,
        avatar_url: first.avatar_url,
        banner_url: first.banner_url,
        theme_preset: first.theme_preset,
        items,
    };

    console.log(`[storefront] normalizeRows: returning storefront "${result.handle}" with ${result.items.length} item(s)`);
    return result;
}

// ─────────────────────────────────────────────
// Public fetch functions
// ─────────────────────────────────────────────

/**
 * Fetch a public storefront by handle.
 * Used by the /[handle] route.
 * Returns null if the storefront is private or the handle does not exist.
 */
export async function getStorefrontByHandle(
    handle: string
): Promise<StorefrontData | null> {
    console.log('[storefront] getStorefrontByHandle called with:', handle);

    const { data, error } = await supabase.rpc('get_storefront_by_handle', {
        p_handle: handle.trim().toLowerCase(),
    });

    console.log('[storefront] getStorefrontByHandle error:', error ?? null);
    console.log('[storefront] getStorefrontByHandle data is null:', data === null);
    if (Array.isArray(data)) {
        console.log('[storefront] getStorefrontByHandle row count:', data.length);
    }

    if (error || !data) return null;
    return normalizeRows(data as StorefrontRow[]);
}

/**
 * Fetch a public storefront by user ID.
 * Used by the /u/[userId] route (permanent QR code route).
 * Returns null if the storefront is private or the user ID does not exist.
 */
export async function getStorefrontById(
    userId: string
): Promise<StorefrontData | null> {
    console.log('[storefront] getStorefrontById called with:', userId);

    const { data, error } = await supabase.rpc('get_storefront_by_id', {
        p_user_id: userId,
    });

    console.log('[storefront] getStorefrontById error:', error ?? null);
    console.log('[storefront] getStorefrontById data is null:', data === null);
    if (Array.isArray(data)) {
        console.log('[storefront] getStorefrontById row count:', data.length);
    }

    if (error || !data) return null;
    return normalizeRows(data as StorefrontRow[]);
}
