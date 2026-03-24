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

    return (
        <div
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen"
            style={{ backgroundColor: '#f9fafb' }}
        >
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
                <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: isDefault ? '#ffffff' : (theme.cardBackground ? `${theme.cardBackground}66` : '#ffffff'), border: isDefault ? '1px solid #e5e7eb' : 'none' }}
                >
                    <h2 style={{ color: textColor as string }} className="text-lg font-bold mb-4 tracking-tight">Collections</h2>

                    {collections.length === 0 ? (
                        <div className="text-center py-16 px-4 rounded-2xl border border-dashed" style={{ borderColor: isDefault ? '#e5e7eb' : (theme.textSecondary || undefined) }}>
                            <div className="text-4xl mb-3 opacity-40">📂</div>
                            <h3 style={{ color: textColor as string }} className="text-base font-bold">No public collections yet.</h3>
                            <p style={{ color: mutedTextColor as string }} className="text-sm mt-1 max-w-xs mx-auto">This seller hasn't shared any public collections.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {collections.map((col) => (
                                <button
                                    key={col.id || col.collection_id}
                                    onClick={() => setActiveCollection(col.id || col.collection_id)}
                                    style={{
                                        backgroundColor: (isDefault ? '#fff' : theme.cardBackground) as string,
                                        borderColor: isDefault ? '#e5e7eb' : 'transparent'
                                    }}
                                    className="rounded-2xl border p-5 text-left hover:shadow-md transition-all group"
                                >
                                    {/* Top row: name + item count badge */}
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 style={{ color: textColor as string }} className="text-base font-bold group-hover:opacity-75 transition-opacity leading-snug">{col.name}</h3>
                                        <span
                                            style={{
                                                backgroundColor: isDefault ? '#eff6ff' : 'rgba(255,255,255,0.15)',
                                                color: accentColor as string
                                            }}
                                            className="ml-3 flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                                        >
                                            {col.active_count || 0} items
                                        </span>
                                    </div>

                                    {col.description && (
                                        <p style={{ color: mutedTextColor as string }} className="text-xs mb-3 leading-relaxed">{col.description}</p>
                                    )}

                                    {col.preview_items && col.preview_items.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-hidden">
                                            {col.preview_items.slice(0, 6).map((p: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        backgroundColor: isDefault ? '#f3f4f6' : 'rgba(255,255,255,0.4)',
                                                        borderColor: isDefault ? '#e5e7eb' : 'rgba(0,0,0,0.05)'
                                                    }}
                                                    className="w-11 h-16 rounded-lg border overflow-hidden flex-shrink-0"
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
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 style={{ color: textColor as string }} className="text-xl font-bold leading-tight">{activeCollection?.name}</h2>
                            <p style={{ color: mutedTextColor as string }} className="text-xs mt-0.5">{items.length} items available</p>
                        </div>
                        {loading && <div style={{ borderTopColor: 'transparent', borderColor: accentColor as string }} className="animate-spin h-5 w-5 border-2 rounded-full" />}
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
