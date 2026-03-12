import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Share } from 'react-native';

// Map common Japanese rarities to standard English abbreviations or names
const JA_RARITY_MAP: Record<string, string> = {
    'コモン': 'Common',
    'アンコモン': 'Uncommon',
    'レア': 'Rare',
    'スーパーレア': 'Super Rare',
    'シークレット': 'Secret',
    'シークレットレア': 'Secret Rare',
    'パラレル': 'Parallel',
    'プロモ': 'Promo',
    'リーダー': 'Leader',
    'スペシャルカード': 'Special Card',
    'トリプルレア': 'Triple Rare',
    'ダブルレア': 'Double Rare',
    'ウルトラレア': 'Ultra Rare',
    'スペシャルアートレア': 'Special Art Rare',
    'シークレットスーパーレア': 'Secret Super Rare',
};

// Fallback heuristic: If it is Japanese and the market price is suspiciously large (e.g. >= 1000), 
// it is likely cached in raw JPY. Convert it.
const JPY_TO_USD = Number(process.env.EXPO_PUBLIC_JPY_TO_USD_RATE || process.env.NEXT_PUBLIC_JPY_TO_USD_RATE || 0.00637);

function adjustMarketPrice(price: number | null | undefined, langCode: string | null | undefined): number | null {
    if (typeof price !== 'number' || price === null) return null;
    if (langCode === 'JA' && price >= 1000) {
       return price * JPY_TO_USD;
    }
    return price;
}

function translateRarity(rarity: string | null | undefined): string {
    if (!rarity) return '';
    return JA_RARITY_MAP[rarity] || rarity;
}

export default function MarketplaceScreen() {
    const theme = useThemeColors();
    const [searchHandle, setSearchHandle] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [storefrontRows, setStorefrontRows] = useState<any[] | null>(null);
    const [numColumns, setNumColumns] = useState<number>(2);

    // Filter & Sort State
    const [storefrontSearchQuery, setStorefrontSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Cards' | 'Sealed'>('All');
    const [filterLang, setFilterLang] = useState<'All' | 'English' | 'Japanese'>('All');
    const [sortBy, setSortBy] = useState<'Recent' | 'Price high-low' | 'Price low-high' | 'Name A-Z'>('Recent');

    // Modal State
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const executeSearch = async (handleToSearch: string, isRefresh: boolean = false) => {
        if (!handleToSearch.trim()) {
            setError("Please enter a handle");
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);
        if (!isRefresh) setStorefrontRows(null);

        const cleanHandle = normalizeHandle(handleToSearch);

        const { data, error: rpcError } = await supabase.rpc('get_storefront_by_handle', {
            p_handle: cleanHandle
        });

        let finalData = data;
        let finalError = rpcError;

        if (rpcError && rpcError.message.includes('function get_storefront_by_handle')) {
            const { data: d2, error: e2 } = await supabase.rpc('get_storefront_by_handle', {
                handle: cleanHandle
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
            setError(finalError.message || "Unknown finalError occurred");
            setStorefrontRows(null);
        } else if (!finalData || finalData.length === 0) {
            setError(`This storefront is private or doesn’t exist`);
            setStorefrontRows([]);
        } else {
            setStorefrontRows(current => {
                if (!current) return finalData;
                return finalData.map((newRow: any) => {
                    const existing = current.find(c => c.item_id === newRow.item_id);
                    if (existing && existing.last_updated && (!newRow.last_updated || typeof newRow.market_price !== 'number')) {
                        return { ...newRow, market_price: existing.market_price, last_updated: existing.last_updated };
                    }
                    return newRow;
                });
            });
        }
    };

    const handleSearch = () => executeSearch(searchHandle, false);
    const onRefresh = useCallback(() => executeSearch(searchHandle, true), [searchHandle]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Missing Cache';
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const padIfNumeric = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        return /^\d+$/.test(s) ? s.padStart(3, '0') : s;
    };


    const renderItem = ({ item }: { item: any }) => {
        if (!item.item_id) return null;

        const imageUrl = item.image_url;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedItem(item)}
                style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border, maxWidth: numColumns === 2 ? '48%' : '31%' }]}
            >
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.background }]}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                            defaultSource={{ uri: 'https://via.placeholder.com/100x140?text=No+Image' }}
                        />
                    ) : (
                        <Ionicons name="image-outline" size={24} color={theme.mutedText} />
                    )}
                </View>

                <View style={styles.itemDetails}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                            <Text style={[styles.itemTitle, { color: theme.text, fontSize: numColumns === 3 ? 12 : 14, flexShrink: 1, marginBottom: 0 }]} numberOfLines={2}>
                                {item.title}{item.language_code === 'JA' ? ' (JP)' : ''}
                            </Text>
                        </View>
                        {(item.set_name || item.set_name_en) && (
                            <Text style={[styles.itemMeta, { color: theme.text, fontSize: numColumns === 3 ? 10 : 11, marginTop: 0, marginBottom: 2 }]} numberOfLines={1}>
                                {item.language_code === 'JA' && item.set_name_en ? item.set_name_en : item.set_name}
                            </Text>
                        )}
                        {(item.collector_number || item.rarity) && (
                            <Text style={[styles.itemMeta, { color: theme.mutedText, fontSize: numColumns === 3 ? 9 : 10, marginTop: 0, marginBottom: 6 }]} numberOfLines={1}>
                                {[
                                    item.collector_number ? `${padIfNumeric(item.collector_number)}${(item.set_printed_total ?? item.set_total) != null ? `/${padIfNumeric(item.set_printed_total ?? item.set_total)}` : ''}` : '',
                                    translateRarity(item.rarity)
                                ].filter(Boolean).join(' • ')}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            {item.kind === 'SEALED' ? (
                                <View style={{ backgroundColor: theme.sealed || '#10b981', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: 'bold' }}>SEALED</Text>
                                </View>
                            ) : item.is_graded && item.grading_company && item.grade != null ? (
                                <View style={{ backgroundColor: theme.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>{item.grading_company} {item.grade}</Text>
                                </View>
                            ) : item.condition ? (
                                <View style={{ backgroundColor: theme.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>{item.condition}</Text>
                                </View>
                            ) : null}
                            <Text style={[styles.itemMeta, { color: theme.mutedText, fontSize: numColumns === 3 ? 10 : 11, marginTop: 0 }]}>Qty: {item.quantity}</Text>
                        </View>
                    </View>
                    <View style={styles.itemFooter}>
                        <Text style={[styles.itemPrice, { color: theme.success, fontSize: numColumns === 3 ? 13 : 16 }]}>{formatCurrency(item.listing_price || 0)}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            {item.last_updated && typeof item.market_price === 'number' ? (
                                <>
                                    <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 9 : 10 }]}>
                                        Mkt: {formatCurrency(adjustMarketPrice(item.market_price, item.language_code) || 0)}
                                    </Text>
                                    <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 8 : 9 }]}>
                                        As of: {formatDate(item.last_updated)}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 9 : 10 }]}>
                                        Mkt: —
                                    </Text>
                                    <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 8 : 9 }]}>
                                        Missing cache
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const profile = storefrontRows && storefrontRows.length > 0 ? storefrontRows[0] : null;
    const validItems = storefrontRows ? storefrontRows.filter(row => row.item_id) : [];

    // Computations
    const totalListValue = validItems.reduce((acc, current) => acc + ((parseFloat(current.listing_price) || 0) * (current.quantity || 1)), 0);
    const totalMarketValue = validItems.reduce((acc, current) => {
        const rawMarketPrice = typeof current.market_price === 'number' ? current.market_price : parseFloat(current.market_price);
        return acc + ((adjustMarketPrice(rawMarketPrice, current.language_code) || 0) * (current.quantity || 1));
    }, 0);

    const displayItems = useMemo(() => {
        let items = [...validItems];

        if (storefrontSearchQuery.trim()) {
            const query = storefrontSearchQuery.toLowerCase();
            items = items.filter(item => {
                const titleMatch = (item.title || '').toLowerCase().includes(query);
                const setNameMatch = (item.set_name || '').toLowerCase().includes(query);
                const setNameEnMatch = (item.set_name_en || '').toLowerCase().includes(query);
                return titleMatch || setNameMatch || setNameEnMatch;
            });
        }

        if (filterType === 'Cards') {
            items = items.filter(item => item.kind !== 'SEALED');
        } else if (filterType === 'Sealed') {
            items = items.filter(item => item.kind === 'SEALED');
        }

        if (filterLang === 'English') {
            items = items.filter(item => item.language_code === 'EN' || !item.language_code);
        } else if (filterLang === 'Japanese') {
            items = items.filter(item => item.language_code === 'JA');
        }

        items.sort((a, b) => {
            if (sortBy === 'Price high-low') {
                return (parseFloat(b.listing_price) || 0) - (parseFloat(a.listing_price) || 0);
            }
            if (sortBy === 'Price low-high') {
                return (parseFloat(a.listing_price) || 0) - (parseFloat(b.listing_price) || 0);
            }
            if (sortBy === 'Name A-Z') {
                return (a.title || '').localeCompare(b.title || '');
            }
            return 0; // Recent
        });
        
        return items;
    }, [validItems, storefrontSearchQuery, filterType, filterLang, sortBy]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={[styles.title, { color: theme.text }]}>Marketplace</Text>
                <TouchableOpacity style={{ padding: 4 }} onPress={() => router.push('/search')}>
                    <Ionicons name="search" size={28} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchRow}>
                    <Text style={[styles.atSymbol, { color: theme.mutedText }]}>@</Text>
                    <TextInput
                        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                        value={searchHandle}
                        onChangeText={setSearchHandle}
                        placeholder="mystic_vendor"
                        placeholderTextColor={theme.mutedText}
                        autoCapitalize="none"
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={handleSearch}
                        disabled={loading || !searchHandle.trim()}
                    >
                        <Text style={styles.buttonText}>{loading ? '...' : 'Search'}</Text>
                    </TouchableOpacity>
                </View>

                {error && (
                    <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>
                )}
            </View>

            {loading && <ActivityIndicator style={{ marginTop: 40 }} />}

            {!loading && profile ? (
                <View style={styles.resultSection}>
                    <FlatList
                        key={`grid-${numColumns}`}
                        data={displayItems}
                        keyExtractor={(item, index) => item.item_id || index.toString()}
                        renderItem={renderItem}
                        numColumns={numColumns}
                        columnWrapperStyle={styles.columnWrapper}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                        }
                        ListHeaderComponent={
                            <View style={styles.listHeaderBlock}>
                                {/* Storefront Header */}
                                <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={styles.profileRow}>
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
                                            <Text style={[styles.avatarText, { color: '#fff' }]}>
                                                {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.profileInfo}>
                                            <Text style={[styles.displayName, { color: theme.text }]} numberOfLines={1}>
                                                {profile.display_name || `@${profile.handle}`}
                                            </Text>
                                            <Text style={[styles.handleDesc, { color: theme.mutedText }]}>
                                                @{profile.handle}
                                            </Text>
                                            {profile.bio && (
                                                <Text style={[styles.bio, { color: theme.text }]} numberOfLines={4}>
                                                    {profile.bio}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.profileActions}>
                                            <TouchableOpacity 
                                                style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                                onPress={() => {
                                                    Share.share({
                                                        message: `Check out ${profile.display_name || profile.handle}'s storefront: https://vndgmchn.com/${profile.handle}`,
                                                        url: `https://vndgmchn.com/${profile.handle}`
                                                    });
                                                }}
                                            >
                                                <Ionicons name="share-outline" size={18} color={theme.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Aggregates */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statColumn}>
                                        <Text style={[styles.statLabel, { color: theme.mutedText }]}>Total Listing Value</Text>
                                        <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(totalListValue)}</Text>
                                    </View>
                                    <View style={styles.statColumn}>
                                        <Text style={[styles.statLabel, { color: theme.mutedText }]}>Total Market Value</Text>
                                        <Text style={[styles.statValue, { color: theme.text }]}>
                                            {totalMarketValue > 0 ? formatCurrency(totalMarketValue) : '--'}
                                        </Text>
                                    </View>
                                    <View style={[styles.statColumn, { alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 2 }]}>
                                        <Text style={[styles.statLabel, { color: theme.mutedText, fontSize: 13, textTransform: 'none', letterSpacing: 0, fontWeight: '600' }]}>
                                            {validItems.length} listing{validItems.length !== 1 && 's'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Grid/Binder Toggle */}
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, numColumns === 2 && { backgroundColor: theme.secondary + '20' }]}
                                        onPress={() => setNumColumns(2)}
                                    >
                                        <Ionicons name="grid-outline" size={20} color={numColumns === 2 ? theme.secondary : theme.mutedText} />
                                        <Text style={[styles.toggleText, { color: numColumns === 2 ? theme.secondary : theme.mutedText }]}>Grid</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, numColumns === 3 && { backgroundColor: theme.secondary + '20' }]}
                                        onPress={() => setNumColumns(3)}
                                    >
                                        <Ionicons name="apps-outline" size={20} color={numColumns === 3 ? theme.secondary : theme.mutedText} />
                                        <Text style={[styles.toggleText, { color: numColumns === 3 ? theme.secondary : theme.mutedText }]}>Binder</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Filters & Sort */}
                                <View style={styles.filterSection}>
                                    <TextInput
                                        style={[styles.smallInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                                        value={storefrontSearchQuery}
                                        onChangeText={setStorefrontSearchQuery}
                                        placeholder="Search title or set..."
                                        placeholderTextColor={theme.mutedText}
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                    />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
                                        {/* Type Filter */}
                                        {(['All', 'Cards', 'Sealed'] as const).map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[styles.filterChip, { borderColor: theme.border }, filterType === type && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                                onPress={() => setFilterType(type)}
                                            >
                                                <Text style={[styles.filterChipText, { color: theme.text }, filterType === type && { color: '#fff' }]}>{type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        
                                        <View style={[styles.filterSeparator, { backgroundColor: theme.border }]} />
                                        
                                        {/* Language Filter */}
                                        {(['All', 'English', 'Japanese'] as const).map(lang => (
                                            <TouchableOpacity
                                                key={lang}
                                                style={[styles.filterChip, { borderColor: theme.border }, filterLang === lang && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                                onPress={() => setFilterLang(lang)}
                                            >
                                                <Text style={[styles.filterChipText, { color: theme.text }, filterLang === lang && { color: '#fff' }]}>{lang === 'All' ? 'All Langs' : lang === 'English' ? 'EN' : 'JP'}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        
                                        <View style={[styles.filterSeparator, { backgroundColor: theme.border }]} />
                                        
                                        {/* Sort */}
                                        {(['Recent', 'Price high-low', 'Price low-high', 'Name A-Z'] as const).map(sort => (
                                            <TouchableOpacity
                                                key={sort}
                                                style={[styles.filterChip, { borderColor: theme.border }, sortBy === sort && { backgroundColor: theme.secondary, borderColor: theme.secondary }]}
                                                onPress={() => setSortBy(sort)}
                                            >
                                                <Text style={[styles.filterChipText, { color: theme.text }, sortBy === sort && { color: '#fff' }]}>{sort === 'Recent' ? 'Recent' : sort === 'Price high-low' ? '$$ - $' : sort === 'Price low-high' ? '$ - $$' : 'A-Z'}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <View style={[styles.divider, { backgroundColor: theme.border, marginTop: 10 }]} />
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="storefront-outline" size={48} color={theme.mutedText} style={{ marginBottom: 16 }} />
                                <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                                    Nothing for sale right now.
                                </Text>
                            </View>
                        }
                    />
                </View>
            ) : null}

            {/* Item Detail Modal */}
            <Modal
                visible={!!selectedItem}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <ScrollView contentContainerStyle={styles.modalScroll}>
                                <View style={[styles.modalImagePlaceholder, { backgroundColor: theme.border }]}>
                                    {selectedItem.image_url ? (
                                        <Image
                                            source={{ uri: selectedItem.image_url }}
                                            style={{ width: '100%', height: '100%', borderRadius: 16 }}
                                            resizeMode="cover"
                                            defaultSource={{ uri: 'https://via.placeholder.com/300x420?text=No+Image' }}
                                        />
                                    ) : (
                                        <Ionicons name="image-outline" size={64} color={theme.mutedText} />
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <Text style={[styles.modalTitle, { color: theme.text, flexShrink: 1, marginBottom: 0 }]}>
                                        {selectedItem.title}{selectedItem.language_code === 'JA' ? ' (JP)' : ''}
                                    </Text>
                                </View>

                                {(selectedItem.set_name || selectedItem.set_name_en) && (
                                    <Text style={[styles.modalMeta, { color: theme.text, marginTop: 0, marginBottom: 2 }]}>
                                        {selectedItem.language_code === 'JA' && selectedItem.set_name_en ? selectedItem.set_name_en : selectedItem.set_name}
                                    </Text>
                                )}
                                {(selectedItem.collector_number || selectedItem.rarity) && (
                                    <Text style={[styles.modalMeta, { color: theme.mutedText, marginTop: 0, marginBottom: 12 }]}>
                                        {[
                                            selectedItem.collector_number ? `${padIfNumeric(selectedItem.collector_number)}${(selectedItem.set_printed_total ?? selectedItem.set_total) != null ? `/${padIfNumeric(selectedItem.set_printed_total ?? selectedItem.set_total)}` : ''}` : '',
                                            translateRarity(selectedItem.rarity)
                                        ].filter(Boolean).join(' • ')}
                                    </Text>
                                )}

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                                    {selectedItem.kind === 'SEALED' ? (
                                        <View style={{ backgroundColor: theme.sealed || '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                                            <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>SEALED</Text>
                                        </View>
                                    ) : selectedItem.is_graded && selectedItem.grading_company && selectedItem.grade != null ? (
                                        <View style={{ backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                                            <Text style={{ fontSize: 10, color: theme.text, fontWeight: 'bold' }}>{selectedItem.grading_company} {selectedItem.grade}</Text>
                                        </View>
                                    ) : selectedItem.condition ? (
                                        <View style={{ backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                                            <Text style={{ fontSize: 10, color: theme.text, fontWeight: 'bold' }}>{selectedItem.condition}</Text>
                                        </View>
                                    ) : null}
                                    <Text style={[styles.modalMeta, { color: theme.mutedText, marginTop: 0 }]}>Qty: {selectedItem.quantity}</Text>
                                </View>

                                <View style={styles.modalPriceRow}>
                                    <Text style={[styles.modalPrice, { color: theme.success }]}>
                                        {formatCurrency(selectedItem.listing_price || 0)}
                                    </Text>
                                </View>

                                {selectedItem.last_updated && typeof selectedItem.market_price === 'number' ? (
                                    <Text style={[styles.modalMeta, { color: theme.mutedText }]}>
                                        Current Scrydex Market: {formatCurrency(adjustMarketPrice(selectedItem.market_price, selectedItem.language_code) || 0)}
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
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    atSymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginRight: 10,
    },
    button: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorText: {
        marginTop: 8,
    },
    resultSection: {
        flex: 1,
    },
    listHeaderBlock: {
        paddingTop: 10,
    },
    profileHeader: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }
        }),
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 3,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
            }
        }),
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 32, 
        marginTop: 2,
    },
    displayName: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    handleDesc: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    bio: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
    },
    profileActions: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
        gap: 12,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    itemCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginHorizontal: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            }
        }),
    },
    imagePlaceholder: {
        width: '100%',
        aspectRatio: 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    itemDetails: {
        padding: 10,
        flex: 1,
        justifyContent: 'space-between',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemMarketPrice: {
        fontSize: 10,
    },
    itemMeta: {
        fontSize: 11,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
    },
    statColumn: {
        justifyContent: 'flex-start',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    filterSection: {
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 6,
    },
    smallInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        marginBottom: 10,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterScrollContent: {
        alignItems: 'center',
        paddingBottom: 4,
    },
    filterChip: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterSeparator: {
        width: 1,
        height: 20,
        marginRight: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '60%',
        maxHeight: '90%',
    },
    modalHeader: {
        alignItems: 'flex-end',
        padding: 16,
    },
    closeButton: {
        padding: 8,
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
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        lineHeight: 32,
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
    }
});
