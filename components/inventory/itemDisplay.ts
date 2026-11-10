import { displayRarity, formatSetNumber } from '@/lib/format';
import type { InventoryItem } from './types';

export function getItemDisplay(item: InventoryItem) {
    const prod = item.catalog_products;
    // Supabase returns the joined price row as either an object or a one-element array.
    const pricesPayload = prod?.catalog_prices_current;
    const priceRow = Array.isArray(pricesPayload) ? pricesPayload[0] : pricesPayload;

    let marketLabel = 'MKT';
    if (priceRow?.source === 'TCGCSV') marketLabel = 'TCG';
    if (priceRow?.source === 'SCRYDEX') marketLabel = 'SCR';

    let condition: string | number | null | undefined;
    if (item.is_graded) {
        condition = item.grading_company && item.grade !== null && item.grade !== undefined
            ? `${item.grading_company} ${item.grade}`
            : item.grade;
    } else {
        condition = item.condition || item.condition_label;
    }

    const isJapanese = prod?.language_code === 'JA';
    const setNameOriginal = isJapanese ? (prod?.set_name_en ?? prod?.set_name) : prod?.set_name;
    const setNameDisplay = isJapanese ? (prod?.set_name_en ?? prod?.set_name) : (prod?.set_name || 'Unknown Set');
    const setNumber = formatSetNumber(prod?.external_id, prod?.collector_number, setNameOriginal, prod?.set_printed_total, prod?.set_total);
    const rarity = isJapanese ? displayRarity(prod?.rarity) : (prod?.rarity || null);
    const metaLine = [setNumber, rarity].filter(Boolean).join(' • ');

    const isSold = item.status === 'SOLD';

    return {
        prod,
        imageUrl: prod?.image_url,
        marketPrice: priceRow?.market_price,
        currency: priceRow?.currency,
        marketLabel,
        condition: condition ? String(condition) : null,
        isJapanese,
        isSealed: prod?.kind === 'SEALED',
        isSold,
        setNameDisplay,
        setNumber,
        metaLine,
        priceLabel: `${isSold ? 'SOLD' : 'YOU'} ${item.quantity > 1 ? '(ea)' : ''}`,
        displayPrice: isSold && item.sold_price !== null ? item.sold_price : item.listing_price,
    };
}
