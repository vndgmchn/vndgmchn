"use client";

import SafeImage from './SafeImage';
import { StorefrontTheme } from '@/constants/storefrontThemes';

export default function StorefrontGrid({ items, theme, onItemClick }: { items: any[], theme?: StorefrontTheme, onItemClick?: () => void }) {
    const isDefault = !theme || theme.id === 'default';

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatCollectorNumber = (cn: any, total: any) => {
        if (!cn) return null;
        if (!total) return `#${cn}`;
        return `${cn}/${total}`;
    };

    const displayRarity = (rarity: string | null | undefined) => {
        if (!rarity) return null;
        const normalized = rarity.toLowerCase();
        
        const abbreviations = {
            'common': 'C',
            'uncommon': 'UC',
            'rare': 'R',
            'mythic': 'M',
            'mythic rare': 'M',
            'secret rare': 'SEC',
            'ultra rare': 'UR',
            'double rare': 'RR',
            'triple rare': 'RRR',
            'super rare': 'SR',
            'hyper rare': 'HR',
            'illustration rare': 'IR',
            'special illustration rare': 'SIR',
            'promo': 'PR',
            'amazing rare': 'AR',
            'radiant rare': 'RAD'
        };
        
        return abbreviations[normalized as keyof typeof abbreviations] || rarity;
    };

    // UI Colors
    const textColor = isDefault ? '#111827' : theme.textPrimary;
    const priceColor = isDefault ? '#2563eb' : theme.buttonSurface;

    if (items.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">Nothing for sale right now.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3">
                {items.map((item: any, i: number) => (
                    <button 
                        key={item.item_id || i}
                        onClick={onItemClick}
                        className="rounded-xl shadow-sm border border-gray-200 dark:border-[#2c2c2e] bg-white dark:bg-[#1c1c1e] flex flex-col overflow-hidden text-left hover:shadow-md transition-shadow active:scale-[0.98]"
                    >
                        {/* Image area — theme responsive bg with blurred image behind */}
                        <div
                            className="w-full relative flex items-center justify-center overflow-hidden h-48 sm:h-64 bg-[#f2f2f2] dark:bg-[#121212]"
                        >
                            {item.image_url && (
                                <>
                                    <img
                                        src={item.image_url}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
                                        aria-hidden="true"
                                    />
                                    {/* Light/Dark Overlay to tint the blur appropriately */}
                                    <div className="absolute inset-0 bg-white/70 dark:bg-black/50" />
                                </>
                            )}
                            {item.image_url ? (
                                <SafeImage
                                    src={item.image_url}
                                    alt={item.title}
                                    className="relative z-10 h-[88%] w-auto object-contain drop-shadow-md rounded-md"
                                    loading="lazy"
                                />
                            ) : (
                                <span className="relative z-10 text-gray-500 font-medium text-center text-sm">📸 No Image</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="w-full flex-1 flex flex-col justify-between p-4 sm:p-5">
                            <div>
                                <h3 className="font-bold mb-1 line-clamp-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base" title={item.title}>
                                    {item.title}{item.language_code === 'JA' ? ' (JP)' : ''}
                                </h3>
                                {(item.set_name || item.set_name_en || item.collector_number || item.rarity) && (
                                    <p className="font-medium mb-1 truncate text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs">
                                        {[
                                            item.language_code === 'JA' && item.set_name_en ? item.set_name_en : item.set_name,
                                            formatCollectorNumber(item.collector_number, item.set_printed_total ?? item.set_total),
                                            displayRarity(item.rarity)
                                        ].filter(Boolean).join(' • ')}
                                    </p>
                                )}
                                <p className="mb-2 font-medium text-gray-500 dark:text-gray-400 text-xs mt-1">Qty: {item.quantity}</p>
                            </div>
                            {/* MKT / BUY footer — matches mobile two-label layout */}
                            <div className="mt-auto flex justify-between items-end w-full">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">MKT</p>
                                    <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                                        {item.market_price ? `$${parseFloat(item.market_price).toFixed(2)}` : '—'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">BUY</p>
                                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-lg sm:text-xl">
                                        ${parseFloat(item.listing_price || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
