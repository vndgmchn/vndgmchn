'use client';

import { useState, useEffect } from 'react';
import StorefrontGrid from './StorefrontGrid';
import SafeImage from './SafeImage';
import DiscoveryModal from './DiscoveryModal';
import { supabase } from '@/lib/supabase';
import { getThemePreset } from '@/lib/storefrontThemes';

type Profile = {
    handle: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
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
            const { data, error } = await supabase.rpc('get_public_collection_items', {
                p_collection_id: activeCollectionId
            });

            if (!error && data) {
                setItems(data);
            }
            setLoading(false);
        };

        // If we have initial items and the ID matches, don't re-fetch
        if (initialCollectionId === activeCollectionId && initialItems.length > 0) {
            setItems(initialItems);
        } else {
            loadItems();
        }
    }, [activeCollectionId, initialCollectionId, initialItems]);

    const activeCollection = collections.find(c => (c.id || c.collection_id) === activeCollectionId);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            {/* Header / Profile Card - Persistent */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div style={{ backgroundColor: bannerColor as string }} className="h-24 sm:h-32"></div>
                <div className="px-6 pb-6 relative">
                    <div 
                        style={{ 
                            backgroundColor: (isDefault ? '#eff6ff' : theme.cardBackground) as string,
                            color: accentColor as string
                        }} 
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white flex items-center justify-center absolute -top-12 sm:-top-16 shadow-md font-bold text-3xl overflow-hidden"
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.handle} className="w-full h-full object-cover" />
                        ) : (
                            profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="mt-14 sm:mt-18">
                        {activeCollectionId && (
                            <button 
                                onClick={() => setActiveCollectionId(null)}
                                style={{ color: accentColor as string }}
                                className="flex items-center text-sm font-semibold mb-4 transition-opacity hover:opacity-75"
                            >
                                ← Back to Store
                            </button>
                        )}
                        <h1 style={{ color: textColor as string }} className="text-3xl font-extrabold">{profile.display_name || `@${profile.handle}`}</h1>
                        <p style={{ color: mutedTextColor as string }} className="text-lg font-medium">@{profile.handle}</p>
                        {profile.bio && (
                            <p style={{ color: (isDefault ? '#374151' : theme.textPrimary) as string }} className="mt-4 max-w-2xl opacity-90">{profile.bio}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area - Swaps between Collection List and Items */}
            {!activeCollectionId ? (
                <div>
                    <h2 style={{ color: textColor as string }} className="text-2xl font-bold mb-6">Collections</h2>
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
