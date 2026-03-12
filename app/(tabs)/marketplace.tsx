import { convertJpyHeuristic, displayRarity, formatCollectorNumber, formatUsd } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';
import FilterPill from '@/components/ui/FilterPill';
import ModalShell from '@/components/ui/ModalShell';
import SearchBar from '@/components/ui/SearchBar';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Share } from 'react-native';

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

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Missing Cache';
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
                                    formatCollectorNumber(item.collector_number, item.set_printed_total ?? item.set_total),
                                    displayRarity(item.rarity)
                                ].filter(Boolean).join(' • ')}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            {item.kind === 'SEALED' ? (
                                <View style={{ backgroundColor: theme.sealed || '#10b981', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: 'bold' }}>SEALED</Text>
                                </View>
                            ) : item.is_graded && item.grading_company && item.grade != null ? (
                                <View style={{ backgroundColor: theme.background, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>{item.grading_company} {item.grade}</Text>
                                </View>
                            ) : item.condition ? (
                                <View style={{ backgroundColor: theme.background, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>{item.condition}</Text>
                                </View>
                            ) : null}
                            <Text style={[styles.itemMeta, { color: theme.mutedText, fontSize: numColumns === 3 ? 10 : 11, marginTop: 0 }]}>Qty: {item.quantity}</Text>
                        </View>
                    </View>
                    <View style={styles.itemFooter}>
                        <Text style={[styles.itemPrice, { color: theme.success, fontSize: numColumns === 3 ? 13 : 16 }]}>{formatUsd(item.listing_price || 0)}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            {item.last_updated && typeof item.market_price === 'number' ? (
                                <>
                                    <Text style={[styles.itemMarketPrice, { color: theme.mutedText, fontSize: numColumns === 3 ? 9 : 10 }]}>
                                        Mkt: {formatUsd(convertJpyHeuristic(item.market_price, item.language_code))}
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
        return acc + ((convertJpyHeuristic(rawMarketPrice, current.language_code) || 0) * (current.quantity || 1));
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
                    <SearchBar
                        style={{ flex: 1, marginRight: 10 }}
                        value={searchHandle}
                        onChangeText={setSearchHandle}
                        placeholder="mystic_vendor"
                        autoCapitalize="none"
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                        onClear={() => setSearchHandle('')}
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
                                <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
                                    <View style={styles.profileRow}>
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
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
                                                style={[styles.iconButton, { backgroundColor: theme.background }]}
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
                                        <Text style={[styles.statValue, { color: theme.text }]}>{formatUsd(totalListValue)}</Text>
                                    </View>
                                    <View style={styles.statColumn}>
                                        <Text style={[styles.statLabel, { color: theme.mutedText }]}>Total Market Value</Text>
                                        <Text style={[styles.statValue, { color: theme.text }]}>
                                            {totalMarketValue > 0 ? formatUsd(totalMarketValue) : '--'}
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
                                    <SearchBar
                                        style={{ marginBottom: 12 }}
                                        value={storefrontSearchQuery}
                                        onChangeText={setStorefrontSearchQuery}
                                        placeholder="Search title or set..."
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                        onClear={() => setStorefrontSearchQuery('')}
                                    />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
                                    {(['All', 'Cards', 'Sealed'] as const).map(type => (
                                        <FilterPill
                                            key={type}
                                            label={type}
                                            active={filterType === type}
                                            onPress={() => setFilterType(type)}
                                        />
                                    ))}

                                    <View style={[styles.filterSeparator, { backgroundColor: theme.border }]} />

                                    {(['All', 'English', 'Japanese'] as const).map(lang => (
                                        <FilterPill
                                            key={lang}
                                            label={lang === 'All' ? 'All Langs' : lang === 'English' ? 'EN' : 'JP'}
                                            active={filterLang === lang}
                                            onPress={() => setFilterLang(lang)}
                                        />
                                    ))}

                                    <View style={[styles.filterSeparator, { backgroundColor: theme.border }]} />

                                    {(['Recent', 'Price high-low', 'Price low-high', 'Name A-Z'] as const).map(sort => (
                                        <FilterPill
                                            key={sort}
                                            label={sort === 'Recent' ? 'Recent' : sort === 'Price high-low' ? '$$ - $' : sort === 'Price low-high' ? '$ - $$' : 'A-Z'}
                                            active={sortBy === sort}
                                            onPress={() => setSortBy(sort)}
                                            activeColor={theme.secondary}
                                        />
                                    ))}
                                    </ScrollView>
                                </View>

                                <View style={{ height: 16 }} />
                            </View>
                        }
                        ListEmptyComponent={
                            <EmptyState
                                icon="storefront-outline"
                                title="Nothing for sale right now."
                                style={{ marginTop: 40 }}
                            />
                        }
                    />
                </View>
            ) : null}

            {/* Item Detail Modal */}
            <ModalShell
                visible={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                type="bottom-sheet"
            >

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
                                            formatCollectorNumber(selectedItem.collector_number, selectedItem.set_printed_total ?? selectedItem.set_total),
                                            displayRarity(selectedItem.rarity)
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
    button: {
        padding: 14,
        borderRadius: 6,
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
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        borderRadius: 6,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
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
        marginBottom: 16,
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
        marginHorizontal: 16,
        paddingBottom: 16,
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
        paddingHorizontal: 16,
        marginBottom: 10,
        marginTop: 6,
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
