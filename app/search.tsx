import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { HitSlop } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { convertToUsd, displayRarity, formatRelativeTime, formatSetNumber, formatUsd } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type CatalogProduct = {
    id: string;
    game: 'POKEMON' | 'ONE_PIECE';
    name: string;
    name_en?: string | null;
    set_name: string;
    set_name_en?: string | null;
    collector_number: string | null;
    set_total: number | null;
    set_printed_total: number | null;
    rarity: string | null;
    image_url: string | null;
    market_price: number | null;
    currency?: string | null;
    external_id: string;
    last_updated?: string | null;
    language_code?: string | null;
    source?: string | null;
    tcgplayer_url?: string | null;
};


export default function UniversalSearchModal() {
    const theme = useThemeColors();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [openingId, setOpeningId] = useState<string | null>(null);

    const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
    const didAutoRefreshRef = useRef('');

    const searchLocalCache = async (searchTerm: string, isRetry = false) => {
        if (!isRetry) {
            setLoading(true);
            setErrorMsg(null);
        }

        const { data, error } = await supabase.functions.invoke('scrydex-search', {
            body: { query: searchTerm, limit: 20 }
        });

        if (error) {
            const res: Response | undefined = error instanceof FunctionsHttpError ? error.context : undefined;
            if (res?.status === 401) {
                console.warn('[Search][Edge] Not signed in; search requires an authenticated user.');
                if (!isRetry) setErrorMsg('Sign in to search the catalog.');
            } else {
                const detail = res ? await res.text().catch(() => '') : '';
                console.error(`[Search][Edge] ${error.message}${res ? ` (HTTP ${res.status})` : ''}`, detail);
                if (!isRetry) setErrorMsg('Search failed. Please try again.');
            }
        }

        if (!error && data?.data) {
            const rowData = data.data;

            const mapped = rowData.map((row: any) => {
                return {
                    ...row,
                    set_total: typeof row.set_total === 'number' ? row.set_total : (row.set_total ? Number(row.set_total) : null),
                    set_printed_total: typeof row.set_printed_total === 'number' ? row.set_printed_total : (row.set_printed_total ? Number(row.set_printed_total) : null),
                    market_price: typeof row.market_price === 'number' ? row.market_price : null,
                    currency: row.currency || null,
                    last_updated: row.last_updated || null
                };
            });

            // If cache results are poor, hit Edge Function fallback
            if (mapped.length === 0 && !isRetry) {
                setResults([]);
                setLoading(false);
            } else {
                setResults(current => {
                    return mapped.map((newRow: any) => {
                        const existing = current.find(c => c.id === newRow.id);
                        if (existing && existing.last_updated && (!newRow.last_updated || typeof newRow.market_price !== 'number')) {
                            return { ...newRow, market_price: existing.market_price, last_updated: existing.last_updated };
                        }
                        return newRow;
                    });
                });

                // Trigger auto-refresh for stale results in background
                const currentSearchKey = searchTerm;
                if (didAutoRefreshRef.current !== currentSearchKey) {
                    const productIdsToRefresh = mapped.map((r: any) => r.id).filter(Boolean).slice(0, 100);

                    if (productIdsToRefresh.length > 0) {
                        didAutoRefreshRef.current = currentSearchKey;
                        setIsUpdatingPrices(true);

                        supabase.functions.invoke('scrydex-refresh-products', {
                            body: { productIds: productIdsToRefresh }
                        }).then(() => {
                            return searchLocalCache(searchTerm, true);
                        }).catch(err => {
                            console.error("Auto-refresh failed:", err);
                        }).finally(() => {
                            setIsUpdatingPrices(false);
                        });
                    }
                }

                if (!isRetry) setLoading(false);
            }
        } else {
            setResults([]);
            if (!isRetry) setLoading(false);
        }
    };

    const runSearch = useEffectEvent((term: string) => searchLocalCache(term));

    // Initial cache-load when query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                runSearch(query.trim());
            } else {
                setResults([]);
                setErrorMsg(null);
            }
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelectProduct = (product: CatalogProduct) => {
        // Map native normalized "name" field into inventory's "title" fallback expectation
        const displayName = product.language_code === 'JA' ? (product.name_en ?? product.name) : product.name;

        const unifiedPayload = {
            ...product,
            title: displayName
        };
        // Pass payload back to the inventory tab matching stringified JSON
        router.back();
        router.replace({
            pathname: '/(tabs)/inventory',
            params: { selectedCatalogProduct: JSON.stringify(unifiedPayload) }
        });
    };

    const buildTcgplayerSearchUrl = (item: CatalogProduct) => {
        const queryParts: string[] = [item.name];
        if (item.set_name) queryParts.push(item.set_name);
        if (item.collector_number) queryParts.push(item.collector_number);
        if (item.language_code === 'JA') queryParts.push('Japanese');
        return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(queryParts.join(' '))}`;
    };

    const resolveTcgplayerUrl = async (productId: string): Promise<string | null> => {
        const { data, error } = await supabase.functions.invoke('tcgcsv-resolve-tcgplayer-urls', {
            body: { productIds: [productId] }
        });
        if (error) return null;
        const url = data?.data?.[0]?.url ?? null;
        return typeof url === 'string' && url.startsWith('https://') ? url : null;
    };

    const handleOpenTcgPlayer = async (item: CatalogProduct) => {
        if (openingId === item.id) return;
        setOpeningId(item.id);

        try {
            if (item.tcgplayer_url) {
                router.push({ pathname: "/webview", params: { url: item.tcgplayer_url } });
                return;
            }
            if (item.language_code === 'JA') {
                router.push({ pathname: "/webview", params: { url: buildTcgplayerSearchUrl(item) } });
                return;
            }
            const exactUrl = await resolveTcgplayerUrl(item.id);
            const urlToOpen = exactUrl ?? buildTcgplayerSearchUrl(item);
            router.push({ pathname: "/webview", params: { url: urlToOpen } });
        } finally {
            setOpeningId(null);
        }
    };

    const renderItem = ({ item }: { item: CatalogProduct }) => {
        const displayName = item.language_code === 'JA' ? (item.name_en ?? item.name) : item.name;
        const displaySet = item.language_code === 'JA' ? (item.set_name_en ?? item.set_name) : item.set_name;

        const setNumber = formatSetNumber(item.external_id, item.collector_number, displaySet, item.set_printed_total, item.set_total);
        const rarity = item.language_code === 'JA' ? displayRarity(item.rarity) : (item.rarity || null);

        let subtitle = `${displaySet} • ${setNumber}`;
        if (rarity) {
            subtitle += ` • ${rarity}`;
        }

        return (
            <TouchableOpacity
                style={[styles.resultCard, { backgroundColor: theme.surface }]}
                onPress={() => handleSelectProduct(item)}
            >
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.background, overflow: 'hidden' }]}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="image-outline" size={24} color={theme.mutedText} />
                    )}
                </View>
                <View style={styles.resultInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={[styles.resultTitle, { color: theme.text, flexShrink: 1, marginBottom: 0 }]} numberOfLines={2}>
                            {displayName}
                        </Text>
                        {item.language_code === 'JA' && (
                            <View style={{ backgroundColor: theme.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginLeft: 6 }}>
                                <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>JP</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.resultSet, { color: theme.mutedText }]} numberOfLines={2}>
                        {subtitle}
                    </Text>
                </View>
                <View style={[styles.priceContainer, { minWidth: 72, marginLeft: 8, alignItems: 'flex-end' }]}>
                    {item.last_updated && typeof item.market_price === 'number' ? (
                        <>
                            <Text style={[styles.priceTag, { color: theme.success, fontSize: 13, fontWeight: 'bold' }]} adjustsFontSizeToFit numberOfLines={1}>
                                {item.source ?? 'MKT'}: {formatUsd(convertToUsd(item.market_price, item.currency))}
                            </Text>
                            <Text style={[styles.dateLabel, { color: theme.mutedText, fontSize: 11, marginTop: 2 }]}>{formatRelativeTime(item.last_updated) ?? 'Missing cache'}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.priceTag, { color: theme.mutedText }]}>—</Text>
                            <Text style={[styles.dateLabel, { color: theme.mutedText, fontSize: 11, marginTop: 2 }]}>Missing cache</Text>
                        </>
                    )}
                </View>
                <TouchableOpacity
                    style={{ padding: 8, justifyContent: 'center' }}
                    hitSlop={HitSlop}
                    accessibilityRole="link"
                    accessibilityLabel="Open on TCGplayer"
                    onPress={(e) => {
                        e.stopPropagation();
                        handleOpenTcgPlayer(item);
                    }}
                    disabled={openingId === item.id}
                >
                    {openingId === item.id ? (
                        <ActivityIndicator size="small" color={theme.mutedText} />
                    ) : (
                        <Ionicons name="open-outline" size={20} color={theme.mutedText} />
                    )}
                </TouchableOpacity>
            </TouchableOpacity >
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.closeBtn}
                    hitSlop={HitSlop}
                    accessibilityRole="button"
                    accessibilityLabel="Close search"
                >
                    <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>Add Catalog Item</Text>
                <View style={styles.headerSpacer} />
            </View>

            <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Search cards and sealed products..."
                onClear={() => setQuery('')}
                autoFocus
                autoCorrect={false}
                style={{ marginHorizontal: 16, marginBottom: 16 }}
            />

            {/* Loading State or Results */}
            {errorMsg ? (
                <View style={styles.centerBox}>
                    <Ionicons name="warning-outline" size={48} color={theme.destructive} />
                    <Text style={[styles.emptyText, { color: theme.destructive, textAlign: 'center', paddingHorizontal: 20 }]}>
                        {errorMsg}
                    </Text>
                </View>
            ) : loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.mutedText }]}>Searching catalog cache...</Text>
                </View>
            ) : results.length === 0 && query.trim().length >= 2 ? (
                <EmptyState
                    icon="search-outline"
                    title="No matching items found."
                    style={styles.centerBox}
                />
            ) : (
                <>
                    {isUpdatingPrices && results.length > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={{ marginLeft: 8, color: theme.mutedText, fontSize: 13 }}>Updating prices...</Text>
                        </View>
                    )}
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        keyboardShouldPersistTaps="handled"
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 12,
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    resultCard: {
        flexDirection: 'row',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
    imagePlaceholder: {
        width: 60,
        height: 84,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    resultInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    resultSet: {
        fontSize: 13,
    },
    priceContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    priceTag: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateLabel: {
        fontSize: 10,
    },
    emptyText: {
        fontSize: 16,
    },
    safeArea: {
        flex: 1,
    },
    closeBtn: {
        padding: 8,
        width: 44,
    },
    headerSpacer: {
        width: 44,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    }
});
