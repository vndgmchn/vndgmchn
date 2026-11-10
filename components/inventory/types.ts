export type InventoryStatus = 'FOR_SALE' | 'PENDING' | 'RESERVED' | 'SOLD' | 'PERSONAL';

export type CollectionVisibility = 'private' | 'unlisted' | 'public';

export type Collection = {
    id: string;
    name: string;
    description?: string | null;
    visibility?: CollectionVisibility | null;
};

export type SortOption = 'RECENT' | 'OLDEST' | 'PRICE_HIGH_LOW' | 'PRICE_LOW_HIGH' | 'NAME_AZ';

export type InventoryFilters = {
    isSealed: boolean;
    isCard: boolean;
    isEnglish: boolean;
    isJapanese: boolean;
};

export type InventoryItem = {
    id: string;
    owner_id: string;
    title: string;
    quantity: number;
    listing_price: number;
    status: InventoryStatus;
    sold_price: number | null;
    cost_basis: number | null;
    catalog_product_id?: string | null;
    game?: string | null;
    condition?: string | null;
    condition_label?: string | null;
    is_graded?: boolean | null;
    grading_company?: string | null;
    grade?: number | null;
    catalog_products?: {
        external_id?: string | null;
        image_url?: string | null;
        set_name?: string | null;
        set_name_en?: string | null;
        collector_number?: string | null;
        set_total?: number | null;
        set_printed_total?: number | null;
        rarity?: string | null;
        language_code?: string | null;
        kind?: string | null;
        tcgplayer_url?: string | null;
        catalog_prices_current?: {
            market_price: number;
            currency?: string | null;
            source?: string | null;
            last_updated?: string | null;
        } | null;
    } | null;
};
