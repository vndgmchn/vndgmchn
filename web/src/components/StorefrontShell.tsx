'use client';
import { getThemePreset } from '@/constants/storefrontThemes';
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
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(initialCollectionId);
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

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            {/* Header / Profile Card - Persistent */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                {/* Banner */}
                <div style={{ backgroundColor: bannerColor as string }} className="h-28 sm:h-36 relative">
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
                        className="rounded-full border-4 border-white shadow-md font-bold text-2xl overflow-hidden flex items-center justify-center flex-shrink-0 -mt-10"
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.handle} className="w-full h-full object-cover" />
                        ) : (
                            profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* Name / Handle / Bio */}
                    <div className="pt-2 min-w-0">
                        {activeCollectionId && (
                            <button
                                onClick={() => setActiveCollectionId(null)}
                                style={{ color: accentColor as string }}
                                className="flex items-center gap-1 text-xs font-semibold mb-2 transition-opacity hover:opacity-75"
                            >
                                ← Back to Store
                            </button>
                        )}
                        <h1 style={{ color: textColor as string }} className="text-xl font-extrabold leading-tight truncate">{profile.display_name || `@${profile.handle}`}</h1>
                        <p style={{ color: mutedTextColor as string }} className="text-sm font-medium">@{profile.handle}</p>
                        {profile.bio && (
                            <p style={{ color: (isDefault ? '#374151' : theme.textPrimary) as string }} className="mt-1 text-sm opacity-90 line-clamp-2">{profile.bio}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area - Swaps between Collection List and Items */}
            {!activeCollectionId ? (
                <div>
                    <h2 style={{ color: textColor as string }} className="text-2xl font-bold mb-6">Collections</h2>
                    
                    {collections.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-xl border border-dashed" style={{ borderColor: isDefault ? '#e5e7eb' : (theme.textSecondary || undefined) }}>
                            <div className="text-4xl mb-4 opacity-50">📂</div>
                            <h3 style={{ color: textColor as string }} className="text-lg font-bold">No public collections available.</h3>
                            <p style={{ color: mutedTextColor as string }} className="text-sm mt-2 max-w-sm mx-auto">This seller hasn't added any public collections to their storefront yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {collections.map((col) => (
                                <button
                                    key={col.id || col.collection_id}
                                    onClick={() => setActiveCollectionId(col.id || col.collection_id)}
                                    style={{
                                        backgroundColor: (isDefault ? '#fff' : theme.cardBackground) as string,
                                        borderColor: isDefault ? '#e5e7eb' : 'transparent'
                                    }}
                                    className="rounded-xl border p-6 text-left hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 style={{ color: textColor as string }} className="text-xl font-bold group-hover:opacity-75 transition-opacity">{col.name}</h3>
                                            {col.description && (
                                                <p style={{ color: mutedTextColor as string }} className="text-sm mt-1">{col.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span style={{ color: accentColor as string }} className="font-semibold text-sm">{col.active_count || 0} items</span>
                                        </div>
                                    </div>

                                    {col.preview_items && col.preview_items.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-hidden">
                                            {col.preview_items.slice(0, 8).map((p: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        backgroundColor: isDefault ? '#f3f4f6' : 'rgba(255,255,255,0.4)',
                                                        borderColor: isDefault ? '#e5e7eb' : 'rgba(0,0,0,0.05)'
                                                    }}
                                                    className="w-12 h-16 rounded border overflow-hidden flex-shrink-0"
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
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 style={{ color: textColor as string }} className="text-2xl font-bold">{activeCollection?.name}</h2>
                            <p style={{ color: mutedTextColor as string }} className="text-sm">{items.length} items available</p>
                        </div>
                        {loading && <div style={{ borderTopColor: 'transparent', borderColor: accentColor as string }} className="animate-spin h-5 w-5 border-2 rounded-full mb-1" />}
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
