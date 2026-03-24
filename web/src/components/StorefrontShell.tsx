'use client';
import { getThemePreset } from '@/constants/storefrontThemes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DiscoveryModal from './DiscoveryModal';
import SafeImage from './SafeImage';
import StorefrontGrid from './StorefrontGrid';

type Profile = {
    handle: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
    theme_preset?: string;
};

type Props = {
    profile: Profile;
    collections: any[];
    initialCollectionId: string | null;
    initialItems?: any[];
};

export default function StorefrontShell({ profile, collections, initialCollectionId, initialItems = [] }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Derive active collection from URL — falls back to SSR-provided initialCollectionId
    const activeCollectionId = searchParams.get('collection') ?? initialCollectionId;

    const setActiveCollection = (id: string | null) => {
        if (id) {
            router.push(`?collection=${encodeURIComponent(id)}`);
        } else {
            router.back();
        }
    };

    const [items, setItems] = useState<any[]>(initialItems);
    const [loading, setLoading] = useState(false);
    const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

    const theme = getThemePreset(profile.theme_preset);
    const isDefault = theme.id === 'default';

    // UI Colors mapping
    const bannerColor = isDefault ? '#2563eb' : theme.buttonSurface; // blue-600
    const accentColor = isDefault ? '#2563eb' : theme.textPrimary;
    const mutedAccent = isDefault ? '#eff6ff' : theme.cardBackground; // blue-50
    const textColor = isDefault ? '#111827' : theme.textPrimary;
    const mutedTextColor = isDefault ? '#6b7280' : theme.textSecondary;

    // Fetch items when collection changes
    useEffect(() => {
        if (!activeCollectionId) {
            setItems([]);
            return;
        }

        const loadItems = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/storefront-items?collection_id=${encodeURIComponent(activeCollectionId)}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(Array.isArray(data) ? data : []);
                }
            } catch {
                // silently fail — items stay []
            }
            setLoading(false);
        };

        // If we have initial items and the ID matches, don't re-fetch
        if (initialCollectionId === activeCollectionId && initialItems.length > 0) {
            setItems(initialItems);
        } else {
            loadItems();
        }
    }, [activeCollectionId]);

    const activeCollection = collections.find(c => (c.id || c.collection_id) === activeCollectionId);
    const isInCollection = !!activeCollectionId;

    const totalItems = items.reduce((acc, current) => acc + (current.quantity || 1), 0);
    const totalMarketValue = items.reduce((acc, current) => {
        const rawMarketPrice = typeof current.market_price === 'number' ? current.market_price : parseFloat(current.market_price || '0');
        return acc + (rawMarketPrice * (current.quantity || 1));
    }, 0);
    const totalListValue = items.reduce((acc, current) => acc + ((parseFloat(current.listing_price) || 0) * (current.quantity || 1)), 0);

    const formatUsd = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-[#f2f2f2] dark:bg-[#121212]">
            <style dangerouslySetInnerHTML={{ __html: `header, footer { display: none !important; }` }} />
            {/* Header / Profile Card - Persistent */}
            <div
                className="rounded-2xl shadow-sm border mb-8"
                style={{
                    backgroundColor: isDefault ? '#ffffff' : (theme.cardBackground || '#ffffff'),
                    borderColor: isDefault ? '#e5e7eb' : 'transparent',
                }}
            >
                {/* Banner — overflow-hidden only here so avatar can overlap */}
                <div style={{ backgroundColor: bannerColor as string }} className="h-28 sm:h-36 relative overflow-hidden rounded-t-2xl">
                    {profile.banner_url && (
                        <img src={profile.banner_url} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
                    )}
                </div>

                {/* Identity Row - avatar left, name/bio right */}
                <div className="px-5 py-4 flex items-start gap-4">
                    {/* Avatar */}
                    <div
                        style={{
                            backgroundColor: (isDefault ? '#eff6ff' : theme.cardBackground) as string,
                            color: accentColor as string,
                            minWidth: 76,
                            minHeight: 76,
                            width: 76,
                            height: 76,
                        }}
                        className="rounded-full shadow-md font-bold text-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.handle} className="w-full h-full object-cover" />
                        ) : (
                            profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* Name / Handle / Bio */}
                    <div className="py-1 min-w-0 flex flex-col justify-center">
                        <h1 style={{ color: textColor as string }} className="text-xl font-extrabold leading-tight truncate">{profile.display_name || `@${profile.handle}`}</h1>
                        <p style={{ color: mutedTextColor as string }} className="text-sm font-medium">@{profile.handle}</p>
                        {profile.bio && (
                            <p style={{ color: (isDefault ? '#374151' : theme.textPrimary) as string }} className="mt-1 text-sm opacity-90 line-clamp-2">{profile.bio}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area - Swaps between Collection List and Items */}
            {!isInCollection ? (
                <div className="rounded-2xl py-5 bg-[#f2f2f2] dark:bg-[#121212]">
                    <h2 className="text-lg font-bold mb-4 tracking-tight text-gray-900 dark:text-gray-100">Collections</h2>

                    {collections.length === 0 ? (
                        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                            <div className="text-4xl mb-3 opacity-40">📂</div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">No public collections yet.</h3>
                            <p className="text-sm mt-1 max-w-xs mx-auto text-gray-500 dark:text-gray-400">This seller hasn't shared any public collections.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {collections.map((col) => (
                                <button
                                    key={col.id || col.collection_id}
                                    onClick={() => setActiveCollection(col.id || col.collection_id)}
                                    className="rounded-2xl border border-gray-200 dark:border-[#2c2c2e] bg-white dark:bg-[#1c1c1e] p-5 text-left hover:shadow-md transition-all group"
                                >
                                    {/* Top row: name + item count badge */}
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:opacity-75 transition-opacity leading-snug">{col.name}</h3>
                                        <span className="ml-3 flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            {col.active_count || 0} items
                                        </span>
                                    </div>

                                    {col.description && (
                                        <p className="text-xs mb-3 leading-relaxed text-gray-500 dark:text-gray-400">{col.description}</p>
                                    )}

                                    {col.preview_items && col.preview_items.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-hidden">
                                            {col.preview_items.slice(0, 6).map((p: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="w-11 h-16 rounded-lg border border-gray-200 dark:border-[#2c2c2e] bg-[#f2f2f2] dark:bg-[#2c2c2e] overflow-hidden flex-shrink-0"
                                                >
                                                    {p.image_url ? (
                                                        <SafeImage src={p.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">📸</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="flex flex-col items-center text-center mb-8">
                        <h2 className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">{activeCollection?.name}</h2>
                        {activeCollection?.description && (
                            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400 max-w-lg">{activeCollection.description}</p>
                        )}
                        
                        {/* Compact Metrics Row */}
                        {!loading && items.length > 0 && (
                            <div className="flex flex-row items-center justify-center gap-3 mt-4 text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems}</span> items
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <span className="text-[10px] uppercase font-semibold">EST. MKT</span> <span className="font-semibold text-gray-900 dark:text-gray-100">{totalMarketValue > 0 ? formatUsd(totalMarketValue) : '--'}</span>
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <span className="text-[10px] uppercase font-semibold">BUY</span> <span className="font-semibold text-gray-900 dark:text-gray-100">{formatUsd(totalListValue)}</span>
                                    {totalMarketValue > 0 && (() => {
                                        const percent = (totalListValue / totalMarketValue) * 100;
                                        let colorClass = "text-gray-500 dark:text-gray-400";
                                        if (percent < 99.5) colorClass = "text-green-600 dark:text-green-400";
                                        else if (percent > 100.5) colorClass = "text-red-500 dark:text-red-400";
                                        return <span className={colorClass}>({percent.toFixed(0)}%)</span>;
                                    })()}
                                </span>
                            </div>
                        )}
                        {loading && (
                            <div className="mt-4 animate-spin h-5 w-5 border-2 rounded-full border-t-transparent border-gray-400 dark:border-gray-500" />
                        )}
                    </div>
                    <StorefrontGrid items={items} theme={theme} onItemClick={() => setShowDiscoveryModal(true)} />
                </div>
            )}

            <DiscoveryModal
                isOpen={showDiscoveryModal}
                onClose={() => setShowDiscoveryModal(false)}
                theme={theme}
            />
        </div>
    );
}
