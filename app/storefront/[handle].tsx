import { convertJpyHeuristic, displayRarity, formatCollectorNumber, formatUsd } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';
import FilterPill from '@/components/ui/FilterPill';
import ModalShell from '@/components/ui/ModalShell';
import SearchBar from '@/components/ui/SearchBar';
import StorefrontItemBadge from '@/components/storefront/StorefrontItemBadge';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STOREFRONT_THEMES, getThemePreset } from '@/constants/storefrontThemes';
import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Share } from 'react-native';

const StorefrontHeader = ({ profile, theme, insets, onBack }: { profile: any; theme: any; insets: any; onBack: () => void }) => {
    if (!profile) return null;

    const preset = getThemePreset(profile.theme_preset || 'default');
    const isDefault = preset.id === 'default';
    const cardBg = preset.cardBackground || theme.surface;
    const textPrimary = preset.textPrimary || theme.text;
    const textSecondary = preset.textSecondary || theme.mutedText;

    return (
        <View style={styles.listHeaderBlock}>
            <View style={styles.heroSection}>
                <View style={[styles.bannerWrapper, { height: 110 + insets.top }]}>
                    {profile.banner_url ? (
                        <Image
                            source={{ uri: profile.banner_url }}
                            style={styles.bannerImage}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.bannerPlaceholder, { backgroundColor: theme.border }]}>
                            <Ionicons name="image-outline" size={24} color={theme.mutedText} />
                        </View>
                    )}
                    {/* Subtle overlay for icon readability */}
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
                </View>

                {/* Top Utility Row */}
                <View style={[styles.headerRow, { top: insets.top + 8 }]}>
                    <TouchableOpacity 
                        style={styles.utilityBtn} 
                        onPress={onBack}
                    >
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.utilityBtn} 
                        onPress={() => {
                            Share.share({
                                message: `Check out ${profile.display_name || profile.handle}'s storefront: https://vndgmchn.com/${profile.handle}`,
                                url: `https://vndgmchn.com/${profile.handle}`
                            });
                        }}
                    >
                        <Ionicons name="share-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.profileSection}>
                <View style={[styles.identityCard, { backgroundColor: cardBg }]}>
                    <View style={styles.profileRow}>
                        {/* Avatar */}
                        <View style={styles.avatarWrapper}>
                            {profile.avatar_url ? (
                                <Image
                                    source={{ uri: profile.avatar_url }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={[styles.avatarImage, { 
                                    backgroundColor: isDefault ? theme.primary : textPrimary, 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                }]}>
                                    <Text style={[styles.avatarText, { color: isDefault ? '#fff' : cardBg }]}>
                                        {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : (profile?.handle ? profile.handle.charAt(0).toUpperCase() : '?')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Info Column */}
                        <View style={styles.profileInfo}>
                            <Text style={[styles.displayName, { color: textPrimary }]} numberOfLines={1}>
                                {profile.display_name || `@${profile.handle}`}
                            </Text>
                            <Text style={[styles.handle, { color: textSecondary }]}>
                                @{profile.handle}
                            </Text>
                            {profile.bio && (
                                <Text style={[styles.bio, { color: textPrimary }]}>
                                    {profile.bio}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function StorefrontPage() {
    const params = useLocalSearchParams<{ 
        handle: string;
        display_name?: string;
        bio?: string;
        avatar_url?: string;
        banner_url?: string;
        theme_preset?: string;
        collectionId?: string;
    }>();
    const handle = normalizeHandle(params.handle);
    const theme = useThemeColors();
    const insets = useSafeAreaInsets();
 
    const [profile, setProfile] = useState<any | null>(() => {
        if (params.display_name || params.theme_preset) {
            return {
                handle: params.handle,
                display_name: params.display_name || null,
                bio: params.bio || null,
                avatar_url: params.avatar_url || null,
                banner_url: params.banner_url || null,
                theme_preset: params.theme_preset || 'default'
            };
        }
        return null;
    });
 
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [publicCollections, setPublicCollections] = useState<any[] | null>(null);
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(params.collectionId || null);
    
    const [collectionItems, setCollectionItems] = useState<any[] | null>(null);
    const [loadingItems, setLoadingItems] = useState(false);
    const [numColumns, setNumColumns] = useState<number>(2);
    const [storefrontSearchQuery, setStorefrontSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [filterType, setFilterType] = useState<'All' | 'Cards' | 'Sealed'>('All');
    const [filterLang, setFilterLang] = useState<'All' | 'English' | 'Japanese'>('All');
    const [sortBy, setSortBy] = useState<'Recent' | 'Price high-low' | 'Price low-high' | 'Name A-Z'>('Recent');

    const loadStorefront = async (isRefresh: boolean = false) => {
        if (!handle) {
            setError('Invalid handle');
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);
        if (!isRefresh) setPublicCollections(null);

        const { data, error: rpcError } = await supabase.rpc('get_public_collections_by_handle', {
            p_handle: handle
        });

        let finalData = data;
        let finalError = rpcError;

        if (rpcError && rpcError.message.includes('function get_public_collections_by_handle')) {
            const { data: d2, error: e2 } = await supabase.rpc('get_public_collections_by_handle', {
                handle: handle
            });
            finalData = d2;
            finalError = e2;
        }

        if (isRefresh) {
            setRefreshing(false);
        } else {
            setLoading(false);
        }

        if (finalError) {
            setError(finalError.message || 'Unknown error occurred');
            setPublicCollections(null);
        } else if (!finalData || finalData.length === 0) {
            setError(`This storefront is private or doesn't exist`);
            setPublicCollections([]);
        } else {
            const loadedProfile = finalData[0] && finalData[0].profile ? finalData[0].profile : profile;
            if (finalData[0] && finalData[0].profile) {
                setProfile(loadedProfile);
            }
            
            setPublicCollections(finalData);

            // Only auto-select if we didn't land via deep link
            if (finalData.length === 1 && !isRefresh && !activeCollectionId) {
                const item = finalData[0];
                setActiveCollectionId(item.id || item.collection_id);
            }
        }
    };

    const loadCollectionItems = async (collectionId: string, isRefresh: boolean = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoadingItems(true);
            setCollectionItems(null); // Clear stale data immediately
        }

        const { data, error: rpcError } = await supabase.rpc('get_public_collection_items', {
            p_collection_id: collectionId
        });

        let finalData = data;
        if (rpcError && rpcError.message.includes('function get_public_collection_items')) {
            const { data: d2 } = await supabase.rpc('get_public_collection_items', {
                collection_id: collectionId
            });
            finalData = d2;
        }

        if (isRefresh) setRefreshing(false);
        else setLoadingItems(false);

        if (finalData) {
            setCollectionItems(finalData);
        } else {
            setCollectionItems(null);
        }
    };

    useEffect(() => {
        if (activeCollectionId) {
            loadCollectionItems(activeCollectionId, false);
        } else {
            setCollectionItems(null);
        }
    }, [activeCollectionId]);

    useEffect(() => {
        loadStorefront(false);
    }, [handle]);

    const onRefresh = useCallback(() => {
        if (activeCollectionId) {
            loadCollectionItems(activeCollectionId, true);
        } else {
            loadStorefront(true);
        }
    }, [handle, activeCollectionId]);

    // Reset search and filters when exiting a collection natively
    useEffect(() => {
        if (!activeCollectionId) {
            setStorefrontSearchQuery('');
            setFilterType('All');
            setFilterLang('All');
            setSortBy('Recent');
            setSelectedItem(null);
        }
    }, [activeCollectionId]);

    const formatDate = useCallback((dateString?: string | null) => {
        if (!dateString) return 'Missing Cache';
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }, []);

    const renderCollection = useCallback(({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveCollectionId(item.id || item.collection_id)}
                style={{
                    backgroundColor: theme.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    marginHorizontal: 16,
                    borderColor: theme.border,
                    borderWidth: 1,
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{item.name}</Text>
                        {item.description && (
                            <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 4 }}>{item.description}</Text>
                        )}
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                        <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>{item.active_count || 0} items</Text>
                    </View>
                </View>

                {item.preview_items && item.preview_items.length > 0 && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        {item.preview_items.slice(0, 6).map((previewItem: any, index: number) => (
                            <View key={index} style={{ width: 44, height: 60, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
                                {previewItem.image_url ? (
                                    <Image source={{ uri: previewItem.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                ) : (
                                    <Ionicons name="image-outline" size={16} color={theme.mutedText} style={{ alignSelf: 'center', marginTop: 22 }} />
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [theme, profile]);

    const renderItemCard = useCallback(({ item }: { item: any }) => {
        if (!item.item_id) return null;
        const imageUrl = item.image_url;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedItem(item)}
                style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border, maxWidth: numColumns === 2 ? '48%' : '31%' }]}
            >
                <View style={[styles.imagePlaceholder, { backgroundColor: '#121212' }]}>
                    {imageUrl && (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.imageBlur}
                            blurRadius={12}
                        />
                    )}
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '88%', height: '88%', position: 'relative', zIndex: 10 }}
                            contentFit="contain"
                            defaultSource={{ uri: 'https://via.placeholder.com/100x140?text=No+Image' }}
                        />
                    ) : (
                        <Ionicons name="image-outline" size={24} color={theme.mutedText} style={{ zIndex: 10 }} />
                    )}
                </View>

                <View style={styles.itemDetails}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                            <Text style={[styles.itemTitle, { color: theme.text, fontSize: numColumns === 3 ? 12 : 14, flexShrink: 1, marginBottom: 0 }]} numberOfLines={2}>
                                {item.title}{item.language_code === 'JA' ? ' (JP)' : ''}
                            </Text>
                        </View>
                        {(item.set_name || item.set_name_en || item.collector_number || item.rarity) && (
                            <Text style={[styles.itemMeta, { color: theme.mutedText, fontSize: numColumns === 3 ? 9 : 10, marginTop: 2, marginBottom: 4 }]} numberOfLines={1}>
                                {[
                                    item.language_code === 'JA' && item.set_name_en ? item.set_name_en : item.set_name,
                                    formatCollectorNumber(item.collector_number, item.set_printed_total ?? item.set_total),
                                    displayRarity(item.rarity)
                                ].filter(Boolean).join(' • ')}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                            <StorefrontItemBadge item={item} theme={theme} size="sm" />
                            <Text style={[styles.itemMeta, { color: theme.mutedText, fontSize: numColumns === 3 ? 10 : 11, marginTop: 0 }]}>Qty: {item.quantity}</Text>
                        </View>
                    </View>
                    <View style={styles.itemFooter}>
                        <View>
                            <Text style={styles.priceLabel}>MKT</Text>
                            {typeof item.market_price === 'number' ? (
                                <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 11 : 12 }]}>
                                    {formatUsd(convertJpyHeuristic(item.market_price, item.language_code))}
                                </Text>
                            ) : (
                                <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 11 : 12 }]}>
                                    —
                                </Text>
                            )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.priceLabel, { textAlign: 'right', fontWeight: '700' }]}>BUY</Text>
                            <Text style={[styles.itemPrice, { color: theme.text, fontSize: numColumns === 3 ? 15 : 17 }]}>
                                {formatUsd(item.listing_price || 0)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [numColumns, theme, formatDate]);

    const validItems = useMemo(
        () => collectionItems ? collectionItems.filter((row: any) => row.item_id) : [],
        [collectionItems]
    );

    const displayItems = useMemo(() => {
        let items = [...validItems];
        if (storefrontSearchQuery.trim()) {
            const query = storefrontSearchQuery.toLowerCase();
            items = items.filter((item: any) => {
                const titleMatch = (item.title || '').toLowerCase().includes(query);
                const setNameMatch = (item.set_name || '').toLowerCase().includes(query);
                const setNameEnMatch = (item.set_name_en || '').toLowerCase().includes(query);
                return titleMatch || setNameMatch || setNameEnMatch;
            });
        }

        if (filterType === 'Cards') {
            items = items.filter((item: any) => item.kind !== 'SEALED');
        } else if (filterType === 'Sealed') {
            items = items.filter((item: any) => item.kind === 'SEALED');
        }

        if (filterLang === 'English') {
            items = items.filter((item: any) => item.language_code === 'EN' || !item.language_code);
        } else if (filterLang === 'Japanese') {
            items = items.filter((item: any) => item.language_code === 'JA');
        }

        items.sort((a: any, b: any) => {
            if (sortBy === 'Price high-low') return (parseFloat(b.listing_price) || 0) - (parseFloat(a.listing_price) || 0);
            if (sortBy === 'Price low-high') return (parseFloat(a.listing_price) || 0) - (parseFloat(b.listing_price) || 0);
            if (sortBy === 'Name A-Z') return (a.title || '').localeCompare(b.title || '');
            return 0;
        });

        return items;
    }, [validItems, storefrontSearchQuery, filterType, filterLang, sortBy]);
    
    const totalItems = useMemo(() => displayItems.reduce((acc, current) => acc + (current.quantity || 1), 0), [displayItems]);
    const totalMarketValue = useMemo(() => {
        return displayItems.reduce((acc, current) => {
            const rawMarketPrice = typeof current.market_price === 'number' ? current.market_price : parseFloat(current.market_price);
            return acc + ((convertJpyHeuristic(rawMarketPrice, current.language_code) || 0) * (current.quantity || 1));
        }, 0);
    }, [displayItems]);
    const totalListValue = useMemo(() => {
        return displayItems.reduce((acc, current) => acc + ((parseFloat(current.listing_price) || 0) * (current.quantity || 1)), 0);
    }, [displayItems]);

    const activePreset = getThemePreset(profile?.theme_preset || 'default');
 
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {loading && !profile && <ActivityIndicator style={{ marginTop: 40 + insets.top }} />}
 
            {!loading && error && (
                <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>
            )}
 
            {profile ? (
                <View style={styles.resultSection}>
                    <FlatList
                        key={activeCollectionId ? `collection-items-${numColumns}` : "collections-list"}
                        data={activeCollectionId ? displayItems : (publicCollections || [])}
                        keyExtractor={(item, index) => item.item_id || item.id || item.collection_id || index.toString()}
                        renderItem={activeCollectionId ? renderItemCard : renderCollection}
                        numColumns={activeCollectionId ? numColumns : 1}
                        columnWrapperStyle={activeCollectionId ? styles.columnWrapper : undefined}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                        }
                        ListHeaderComponent={
                            <View style={styles.listHeaderBlock}>
                                <StorefrontHeader 
                                    profile={profile} 
                                    theme={theme} 
                                    insets={insets} 
                                    onBack={() => activeCollectionId ? setActiveCollectionId(null) : router.back()} 
                                />
                                {activeCollectionId && (() => {
                                    const activeCol = publicCollections?.find(c => (c.id || c.collection_id) === activeCollectionId);
                                    if (!activeCol) return null;
                                    return (
                                        <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
                                            <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
                                                {activeCol.name}
                                            </Text>
                                            {activeCol.description && (
                                                <Text style={{ fontSize: 13, color: theme.mutedText, marginTop: 4 }}>
                                                    {activeCol.description}
                                                </Text>
                                            )}
                                            
                                            {/* Compact Metrics Row */}
                                            <View style={styles.summaryRow}>
                                                <Text style={[styles.summaryItem, { color: theme.mutedText }]}>
                                                    <Text style={{ fontWeight: '600', color: theme.text }}>{totalItems}</Text> items
                                                </Text>
                                                <View style={[styles.summarySeparator, { backgroundColor: theme.border }]} />
                                                <Text style={[styles.summaryItem, { color: theme.mutedText }]}>
                                                    <Text style={{ fontSize: 9 }}>EST. MKT</Text> <Text style={{ fontWeight: '600', color: theme.text }}>{totalMarketValue > 0 ? formatUsd(totalMarketValue) : '--'}</Text>
                                                </Text>
                                                <View style={[styles.summarySeparator, { backgroundColor: theme.border }]} />
                                                <Text style={[styles.summaryItem, { color: theme.mutedText }]}>
                                                    <Text style={{ fontSize: 9 }}>BUY</Text> <Text style={{ fontWeight: '600', color: theme.text }}>{formatUsd(totalListValue)}</Text>
                                                    {totalMarketValue > 0 && (() => {
                                                        const percent = (totalListValue / totalMarketValue) * 100;
                                                        let color = theme.mutedText;
                                                        if (percent < 99.5) color = theme.success;
                                                        else if (percent > 100.5) color = '#ef4444';
                                                        
                                                        return (
                                                            <Text style={[styles.deltaText, { color }]}>
                                                                {` (${percent.toFixed(0)}%)`}
                                                            </Text>
                                                        );
                                                    })()}
                                                </Text>
                                            </View>

                                            <View style={styles.searchFilterRow}>
                                                <SearchBar
                                                    value={storefrontSearchQuery}
                                                    onChangeText={setStorefrontSearchQuery}
                                                    placeholder="Search items..."
                                                    autoCapitalize="none"
                                                    returnKeyType="done"
                                                    onClear={() => setStorefrontSearchQuery('')}
                                                    style={{ flex: 1, height: 40 }}
                                                />
                                                <TouchableOpacity
                                                    onPress={() => setShowFiltersModal(true)}
                                                    style={[
                                                        styles.filterBtn,
                                                        { backgroundColor: theme.surface },
                                                        (filterType !== 'All' || filterLang !== 'All' || sortBy !== 'Recent') && { backgroundColor: theme.primary + '15' }
                                                    ]}
                                                >
                                                    <Ionicons 
                                                        name="options-outline" 
                                                        size={20} 
                                                        color={(filterType !== 'All' || filterLang !== 'All' || sortBy !== 'Recent') ? theme.primary : theme.text} 
                                                    />
                                                    <Text style={[
                                                        styles.filterBtnText, 
                                                        { color: (filterType !== 'All' || filterLang !== 'All' || sortBy !== 'Recent') ? theme.primary : theme.text }
                                                    ]}>
                                                        Filter
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>
                        }
                        ListEmptyComponent={
                            activeCollectionId ? (
                                loadingItems ? (
                                    <ActivityIndicator style={{ marginTop: 60 }} color={theme.primary} />
                                ) : (
                                    <EmptyState
                                        icon="storefront-outline"
                                        title="Nothing for sale right now."
                                        style={{ marginTop: 40 }}
                                    />
                                )
                            ) : (
                                loading ? (
                                    <ActivityIndicator style={{ marginTop: 60 }} color={theme.primary} />
                                ) : (
                                    <EmptyState
                                        icon="albums-outline"
                                        title="No public collections available."
                                        style={{ marginTop: 40 }}
                                    />
                                )
                            )
                        }
                    />
                </View>
            ) : null}

            {/* Item Detail Modal */}
            <ModalShell
                visible={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                type="bottom-sheet"
                title={selectedItem ? `${selectedItem.title}${selectedItem.language_code === 'JA' ? ' (JP)' : ''}` : undefined}
            >
                {selectedItem && (
                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        <View style={[styles.modalImagePlaceholder, { backgroundColor: theme.border }]}>
                            {selectedItem.image_url ? (
                                <Image
                                    source={{ uri: selectedItem.image_url }}
                                    style={{ width: '100%', height: '100%', borderRadius: 16 }}
                                    contentFit="contain"
                                    defaultSource={{ uri: 'https://via.placeholder.com/300x420?text=No+Image' }}
                                />
                            ) : (
                                <Ionicons name="image-outline" size={64} color={theme.mutedText} />
                            )}
                        </View>

                        {(selectedItem.set_name || selectedItem.set_name_en) && (
                            <Text style={[styles.modalMeta, { color: theme.text, marginTop: 0, marginBottom: 2 }]}>
                                {selectedItem.language_code === 'JA' && selectedItem.set_name_en ? selectedItem.set_name_en : selectedItem.set_name}
                            </Text>
                        )}
                        {(selectedItem.collector_number || selectedItem.rarity) && (
                            <Text style={[styles.modalMeta, { color: theme.mutedText, marginTop: 0, marginBottom: 12 }]}>
                                {[
                                    formatCollectorNumber(selectedItem.collector_number, selectedItem.set_printed_total ?? selectedItem.set_total),
                                    displayRarity(selectedItem.rarity)
                                ].filter(Boolean).join(' • ')}
                            </Text>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                            <StorefrontItemBadge item={selectedItem} theme={theme} size="md" />
                            <Text style={[styles.modalMeta, { color: theme.mutedText, marginTop: 0 }]}>Qty: {selectedItem.quantity}</Text>
                        </View>

                        <View style={styles.modalPriceRow}>
                            <Text style={[styles.modalPrice, { color: theme.success }]}>
                                {formatUsd(selectedItem.listing_price || 0)}
                            </Text>
                        </View>

                        {selectedItem.last_updated && typeof selectedItem.market_price === 'number' ? (
                            <Text style={[styles.modalMeta, { color: theme.mutedText }]}>
                                Current Scrydex Market: {formatUsd(convertJpyHeuristic(selectedItem.market_price, selectedItem.language_code))}
                                {'\n'}As of: {formatDate(selectedItem.last_updated)}
                            </Text>
                        ) : (
                            <Text style={[styles.modalMeta, { color: theme.mutedText }]}>
                                Current Scrydex Market: —
                                {'\n'}Missing cache
                            </Text>
                        )}
                    </ScrollView>
                )}
            </ModalShell>

            {/* Filter & Sort Modal */}
            <ModalShell
                visible={showFiltersModal}
                onClose={() => setShowFiltersModal(false)}
                title="Filter & Sort"
                type="bottom-sheet"
                headerRight={
                    <TouchableOpacity onPress={() => {
                        setFilterType('All');
                        setFilterLang('All');
                        setSortBy('Recent');
                    }}>
                        <Text style={{ color: theme.mutedText, fontSize: 14, fontWeight: '500' }}>Reset</Text>
                    </TouchableOpacity>
                }
            >
                <ScrollView style={styles.modalSheetBody}>
                    {/* View Mode Section */}
                    <Text style={[styles.modalSectionHeading, { color: theme.mutedText }]}>VIEW MODE</Text>
                    <View style={styles.modalToggleGroup}>
                        <TouchableOpacity
                            style={[styles.modalToggleBtn, { backgroundColor: theme.border }, numColumns === 2 && { backgroundColor: theme.primary }]}
                            onPress={() => setNumColumns(2)}
                        >
                            <Ionicons name="grid" size={18} color={numColumns === 2 ? '#fff' : theme.text} />
                            <Text style={[styles.modalToggleText, { color: numColumns === 2 ? '#fff' : theme.text }]}>Grid</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalToggleBtn, { backgroundColor: theme.border }, numColumns === 3 && { backgroundColor: theme.primary }]}
                            onPress={() => setNumColumns(3)}
                        >
                            <Ionicons name="apps" size={18} color={numColumns === 3 ? '#fff' : theme.text} />
                            <Text style={[styles.modalToggleText, { color: numColumns === 3 ? '#fff' : theme.text }]}>Binder</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sort Section */}
                    <Text style={[styles.modalSectionHeading, { color: theme.mutedText, marginTop: 24 }]}>SORT BY</Text>
                    <View style={styles.modalOptionList}>
                        {[
                            { id: 'Recent', label: 'Recently Added' },
                            { id: 'Price high-low', label: 'Price: High to Low' },
                            { id: 'Price low-high', label: 'Price: Low to High' },
                            { id: 'Name A-Z', label: 'Name: A to Z' },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.modalOptionRow}
                                onPress={() => setSortBy(option.id as any)}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    { color: sortBy === option.id ? theme.primary : theme.text, fontWeight: sortBy === option.id ? '700' : '400' }
                                ]}>
                                    {option.label}
                                </Text>
                                {sortBy === option.id && (
                                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Filter Section */}
                    <Text style={[styles.modalSectionHeading, { color: theme.mutedText, marginTop: 24 }]}>FILTERS</Text>
                    
                    <Text style={[styles.modalSubHeading, { color: theme.text }]}>Product Type</Text>
                    <View style={styles.modalChipGroup}>
                        {(['All', 'Cards', 'Sealed'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.modalChip, { backgroundColor: filterType === type ? theme.primary : theme.border }]}
                                onPress={() => setFilterType(type)}
                            >
                                <Text style={{ color: filterType === type ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.modalSubHeading, { color: theme.text, marginTop: 16 }]}>Language</Text>
                    <View style={styles.modalChipGroup}>
                        {(['All', 'English', 'Japanese'] as const).map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                style={[styles.modalChip, { backgroundColor: filterLang === lang ? theme.primary : theme.border }]}
                                onPress={() => setFilterLang(lang)}
                            >
                                <Text style={{ color: filterLang === lang ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>{lang}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </ModalShell>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 100,
    },
    backText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 2,
    },
    pageTitle: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        minWidth: 100,
    },
    errorText: {
        paddingHorizontal: 20,
        paddingTop: 20,
        fontSize: 14,
    },
    resultSection: {
        flex: 1,
    },
    listHeaderBlock: {
        paddingTop: 0,
    },
    heroSection: {
        position: 'relative',
    },
    headerRow: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    utilityBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerWrapper: {
        width: '100%',
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileSection: {
        paddingHorizontal: 16,
    },
    identityCard: {
        marginTop: -44,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        marginRight: 16,
    },
    avatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    handle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    bio: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 6,
    },
    actionButton: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtn: {
        flex: 1,
    },
    secondaryBtn: {
        width: 44,
    },
    actionButtonText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginTop: 12,
    },
    summaryItem: {
        fontSize: 12,
    },
    deltaText: {
        fontSize: 9,
        fontWeight: '700',
    },
    summarySeparator: {
        width: 1,
        height: 10,
        marginHorizontal: 8,
    },
    searchFilterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        marginBottom: 0,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 8,
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    listContent: {
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    itemCard: {
        flex: 1,
        borderRadius: 6,
        overflow: 'hidden',
        marginHorizontal: 4,
    },
    imagePlaceholder: {
        width: '100%',
        aspectRatio: 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
        overflow: 'hidden',
    },
    imageBlur: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        opacity: 0.2,
        transform: [{ scale: 1.15 }],
    },
    itemDetails: {
        padding: 8,
        flex: 1,
        justifyContent: 'space-between',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 1,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 6,
        paddingTop: 8,
    },
    priceLabel: {
        fontSize: 9,
        color: '#A3A3A3',
        fontWeight: '600',
        marginBottom: 1,
        textTransform: 'uppercase',
    },
    itemPrice: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    itemMarketPrice: {
        fontWeight: '600',
    },
    itemMeta: {
        fontSize: 11,
        fontWeight: '500',
    },
    modalScroll: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    modalImagePlaceholder: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalPrice: {
        fontSize: 32,
        fontWeight: '900',
    },
    modalMeta: {
        fontSize: 16,
        marginTop: 8,
    },
    modalSheetBody: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    modalSectionHeading: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
    },
    modalSubHeading: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    modalOptionList: {
        gap: 8,
    },
    modalOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ebebeb',
    },
    modalOptionText: {
        fontSize: 16,
    },
    modalChipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    modalChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    modalToggleGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    modalToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    modalToggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
