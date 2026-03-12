import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

type InventoryItem = {
    id: string;
    owner_id: string;
    title: string;
    quantity: number;
    listing_price: number;
    status: 'FOR_SALE' | 'PENDING' | 'RESERVED' | 'SOLD' | 'PERSONAL';
    sold_price: number | null;
    cost_basis: number | null;
    catalog_product_id?: string | null;
    game?: string | null;
    condition?: string | null;
    is_graded?: boolean | null;
    grading_company?: string | null;
    grade?: number | null;
    catalog_products?: {
        external_id?: string | null;
        image_url?: string | null;
        set_name?: string | null;
        set_name_en?: string | null;
        collector_number?: string | null;
        set_total?: number | null;
        set_printed_total?: number | null;
        rarity?: string | null;
        language_code?: string | null;
        kind?: string | null;
        tcgplayer_url?: string | null;
        catalog_prices_current?: {
            market_price: number;
            currency?: string | null;
            source?: string | null;
            last_updated?: string | null;
        } | null;
    } | null;
};

const JPY_TO_USD = Number(process.env.EXPO_PUBLIC_JPY_TO_USD_RATE || 0.00637);

function toUsd(amount: number, currency?: string | null): number {
    if (currency === 'JPY') return amount * JPY_TO_USD;
    return amount;
}

function formatUsd(amount: number | null, currency?: string | null): string {
    if (typeof amount !== 'number') return '—';
    const usd = toUsd(amount, currency);
    return `$${usd.toFixed(2)}`;
}

export function formatTimeAgo(lastUpdated?: string | null): string {
    if (!lastUpdated) return 'Missing cache';
    const diffMs = Date.now() - new Date(lastUpdated).getTime();
    if (diffMs < 0) return '0m ago';

    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${diffDays}d ago`;
}

const JP_RARITY_MAP: Record<string, string> = {
    "通常": "Common",
    "非": "Uncommon",
    "プロモ": "Promo",
    "希少": "Rare",
    "レアホロ": "Holo Rare",
    "ホロ": "Holo",
    "ダブルレア": "Double Rare",
    "トリプルレア": "Triple Rare",
    "スーパーレア": "Super Rare",
    "ウルトラレア": "Ultra Rare",
    "ハイパーレア": "Hyper Rare",
    "アートレア": "Art Rare",
    "スペシャルアートレア": "Special Art Rare",
    "キャラクターレア": "Character Rare",
    "シークレットスーパーレア": "Secret Super Rare",
    "プリズムレア": "Prism Rare",
    "レジェンド": "LEGEND",
    "超ウルトラレア": "Ultra Rare+",
    "黒白稀": "BW Rare"
};

export function displayRarity(item: { rarity?: string | null, language_code?: string | null }): string | null {
    if (!item.rarity) return null;
    return item.language_code === 'JA' ? (JP_RARITY_MAP[item.rarity] ?? item.rarity) : item.rarity;
}

export default function InventoryScreen() {
    const theme = useThemeColors();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
    const didAutoRefreshRef = useRef(false);

    const [filter, setFilter] = useState<'FOR_SALE' | 'PENDING' | 'PERSONAL' | 'SOLD' | 'ALL'>('FOR_SALE');
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'binder'>('list');

    // Restore persisted view mode and sort mode on mount
    useEffect(() => {
        AsyncStorage.getItem('inventory_view_mode').then(saved => {
            if (saved === 'list' || saved === 'grid' || saved === 'binder') {
                setViewMode(saved);
            }
        });
        AsyncStorage.getItem('inventory_sort_mode').then(saved => {
            if (saved === 'RECENT' || saved === 'OLDEST' || saved === 'PRICE_HIGH_LOW' || saved === 'PRICE_LOW_HIGH' || saved === 'NAME_AZ') {
                setSortBy(saved);
            }
        });
    }, []);
    const [sortBy, setSortBy] = useState<'RECENT' | 'OLDEST' | 'PRICE_HIGH_LOW' | 'PRICE_LOW_HIGH' | 'NAME_AZ'>('RECENT');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortModalVisible, setSortModalVisible] = useState(false);

    // Multi-Select & Bulk Actions
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    const [activeFilters, setActiveFilters] = useState({
        isSealed: false,
        isCard: false,
        isEnglish: false,
        isJapanese: false,
    });

    const router = useRouter();
    const { selectedCatalogProduct } = useLocalSearchParams<{ selectedCatalogProduct?: string }>();

    // Modal state for Add/Edit
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Modal state for Quick Sell
    const [soldModalVisible, setSoldModalVisible] = useState(false);
    const [sellingItem, setSellingItem] = useState<InventoryItem | null>(null);
    const [quickSoldPrice, setQuickSoldPrice] = useState('');
    const [quickCostBasis, setQuickCostBasis] = useState('');

    // New constraints from Scrydex payload map
    const [catalogProductId, setCatalogProductId] = useState<string | null>(null);
    const [game, setGame] = useState<string | null>(null);
    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [currency, setCurrency] = useState<string | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [setName, setSetName] = useState<string | null>(null);
    const [collectorNumber, setCollectorNumber] = useState<string | null>(null);
    const [setTotal, setSetTotal] = useState<number | null>(null);
    const [setPrintedTotal, setSetPrintedTotal] = useState<number | null>(null);
    const [externalId, setExternalId] = useState<string | null>(null);
    const [openingId, setOpeningId] = useState<string | null>(null);
    const [condition, setCondition] = useState<string | null>(null);
    const [isGraded, setIsGraded] = useState<boolean>(false);
    const [gradingCompany, setGradingCompany] = useState<string | null>(null);
    const [grade, setGrade] = useState<number | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [listingPrice, setListingPrice] = useState('');
    const [status, setStatus] = useState<InventoryItem['status']>('FOR_SALE');
    const [soldPrice, setSoldPrice] = useState('');
    const [costBasis, setCostBasis] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
                didAutoRefreshRef.current = false;
                fetchInventory(user.id);
            }
        });
    }, []);

    // Intercept returning router payload from Universal Search
    useEffect(() => {
        if (selectedCatalogProduct) {
            try {
                const product = JSON.parse(selectedCatalogProduct);
                setEditingItem(null);
                setTitle(product.title || '');
                const defaultUsd = (typeof product.market_price === 'number')
                    ? toUsd(product.market_price, product.currency).toFixed(2)
                    : '';
                setListingPrice(defaultUsd); // Auto-fill with market price
                setQuantity('1');
                setStatus('FOR_SALE');
                setSoldPrice('');
                setCostBasis('');

                // Track Scrydex mappings
                setCatalogProductId(product.id);
                setGame(product.game);
                setMarketPrice(product.market_price);
                setCurrency(product.currency || null);
                setSource(product.source || null);
                setImageUrl(product.image_url);
                setSetName(product.set_name);
                setCollectorNumber(product.collector_number);
                setSetTotal(product.set_total || null);
                setSetPrintedTotal(product.set_printed_total || null);
                setExternalId(product.external_id || null);

                setCondition('NM');
                setIsGraded(false);
                setGradingCompany(null);
                setGrade(null);

                setModalVisible(true);
            } catch (e) {
                console.error("Payload parse error:", e);
            }
        }
    }, [selectedCatalogProduct]);

    const fetchInventory = async (uid: string, isSilent = false) => {
        if (!isSilent) setLoading(true);
        // Include recursive join to extract pre-cached Market Prices directly
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
                *,
                catalog_products (
                   external_id,
                   image_url,
                   name,
                   name_en,
                   set_name,
                   set_name_en,
                   collector_number,
                   set_total,
                   set_printed_total,
                   rarity,
                   language_code,
                   kind,
                   tcgplayer_url,
                   catalog_prices_current (
                       market_price,
                       currency,
                       source,
                       last_updated
                   )
                )
            `)
            .eq('owner_id', uid)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`[Inventory] Supabase Error: ${error.message} (Code: ${error.code})`, error.details, error.hint);
        }

        if (!error && data) {
            console.log(`[Inventory] Returned ${data.length} rows for user "${uid}"`);
            setItems(current => {
                return (data as InventoryItem[]).map(newItem => {
                    const existing = current.find(c => c.id === newItem.id);
                    const newPrices = newItem.catalog_products?.catalog_prices_current;
                    const newLastUp = Array.isArray(newPrices) ? newPrices[0]?.last_updated : newPrices?.last_updated;
                    const newMarketPrice = Array.isArray(newPrices) ? newPrices[0]?.market_price : newPrices?.market_price;

                    if (existing && existing.catalog_products?.catalog_prices_current?.last_updated) {
                        if (!newLastUp || typeof newMarketPrice !== 'number') {
                            return {
                                ...newItem,
                                catalog_products: {
                                    ...newItem.catalog_products,
                                    catalog_prices_current: existing.catalog_products.catalog_prices_current
                                }
                            };
                        }
                    }
                    return newItem;
                });
            });

            if (!didAutoRefreshRef.current) {
                const productIdsToRefresh = Array.from(new Set(data.filter((r: any) => r.catalog_product_id).map((r: any) => r.catalog_product_id))).slice(0, 100);

                if (productIdsToRefresh.length > 0) {
                    didAutoRefreshRef.current = true;
                    setIsUpdatingPrices(true);

                    supabase.functions.invoke('scrydex-refresh-products', {
                        body: { productIds: productIdsToRefresh }
                    }).then(() => {
                        return fetchInventory(uid, true);
                    }).catch(err => {
                        console.error("Auto-refresh failed:", err);
                    }).finally(() => {
                        setIsUpdatingPrices(false);
                    });
                }
            }
        }
        if (!isSilent) setLoading(false);
    };

    const handleSaveItem = async () => {
        if (!userId || !title || !listingPrice) {
            Alert.alert('Validation Error', 'Title and Listing Price are required.');
            return;
        }
        if (isGraded) {
            if (!gradingCompany || grade === null) {
                Alert.alert('Validation Error', 'Please select a Grading Company and Grade.');
                return;
            }
        } else {
            if (!condition) {
                Alert.alert('Validation Error', 'Please select a Condition (NM, LP, MP, HP, or DMG).');
                return;
            }
        }

        setSaving(true);

        const itemData = {
            owner_id: userId,
            title,
            quantity: parseInt(quantity) || 1,
            listing_price: parseFloat(listingPrice) || 0,
            status,
            sold_price: status === 'SOLD' && soldPrice ? parseFloat(soldPrice) : null,
            cost_basis: costBasis ? parseFloat(costBasis) : null,
            catalog_product_id: catalogProductId || null,
            game: game || null,
            condition: isGraded ? null : condition,
            is_graded: isGraded,
            grading_company: isGraded ? gradingCompany : null,
            grade: isGraded ? grade : null,
        };

        if (editingItem) {
            const { error } = await supabase
                .from('inventory_items')
                .update(itemData)
                .eq('id', editingItem.id);

            if (error) Alert.alert('Error', error.message);
        } else {
            const { error } = await supabase
                .from('inventory_items')
                .insert([itemData]);

            if (error) Alert.alert('Error', error.message);
        }

        setSaving(false);
        setModalVisible(false);
        if (userId) fetchInventory(userId);
    };

    const handleAddItemPress = () => {
        // Users choose item via Universal Search first
        router.push('/search');
    };


    const confirmDelete = (item: InventoryItem) => {
        Alert.alert(
            "Remove Item",
            "Remove this item from your inventory?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteItem(item.id)
                }
            ]
        );
    };

    const deleteItem = async (itemId: string) => {
        if (!userId) return;
        setLoading(true);
        const { error } = await supabase
            .from('inventory_items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', itemId)
            .eq('owner_id', userId);

        if (error) {
            Alert.alert("Error", "Failed to delete item.");
            setLoading(false);
        } else {
            setModalVisible(false);
            fetchInventory(userId);
        }
    };

    const setItemStatus = async (item: InventoryItem, newStatus: string) => {
        if (!userId) return;
        setLoading(true);
        const { error } = await supabase
            .from('inventory_items')
            .update({ status: newStatus })
            .eq('id', item.id)
            .eq('owner_id', userId);

        if (error) {
            Alert.alert("Error", "Failed to update status.");
            setLoading(false);
        } else {
            fetchInventory(userId);
        }
    };

    const handleQuickSellSave = async () => {
        if (!userId || !sellingItem) return;
        setLoading(true);

        const updates = {
            status: 'SOLD',
            sold_price: quickSoldPrice ? parseFloat(quickSoldPrice) : null,
            cost_basis: quickCostBasis ? parseFloat(quickCostBasis) : null,
            sold_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', sellingItem.id)
            .eq('owner_id', userId);

        setSoldModalVisible(false);
        setSellingItem(null);

        if (error) {
            Alert.alert("Error", "Failed to mark as sold.");
            setLoading(false);
        } else {
            fetchInventory(userId);
        }
    };

    const openActionMenu = (item: InventoryItem) => {
        const statuses = ['FOR_SALE', 'PENDING', 'SOLD', 'PERSONAL'];
        const availableStatuses = statuses.filter(s => s !== item.status);

        const formatStatus = (s: string) => {
            if (s === 'FOR_SALE') return 'Mark For Sale';
            return `Mark ${s.charAt(0) + s.slice(1).toLowerCase()}`;
        };

        const statusOptions = availableStatuses.map(s => formatStatus(s));

        if (Platform.OS === 'ios') {
            const options = ['Cancel', 'Edit', 'Open in TCGplayer', ...statusOptions, 'Delete'];
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: options.length - 1,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        openEditModal(item);
                    } else if (buttonIndex === 2) {
                        handleOpenTcgPlayer(item);
                    } else if (buttonIndex > 2 && buttonIndex < options.length - 1) {
                        const selectedStatus = availableStatuses[buttonIndex - 3];
                        if (selectedStatus === 'SOLD') {
                            setSellingItem(item);
                            setQuickSoldPrice(item.listing_price ? item.listing_price.toString() : '');
                            setQuickCostBasis(item.cost_basis ? item.cost_basis.toString() : '');
                            setSoldModalVisible(true);
                        } else {
                            setItemStatus(item, selectedStatus);
                        }
                    } else if (buttonIndex === options.length - 1) {
                        confirmDelete(item);
                    }
                }
            );
        } else {
            const alertOptions = [
                { text: "Cancel", style: "cancel" as const },
                { text: "Edit", onPress: () => openEditModal(item) },
                { text: "Open in TCGplayer", onPress: () => handleOpenTcgPlayer(item) },
                ...availableStatuses.map(s => ({
                    text: formatStatus(s),
                    onPress: () => {
                        if (s === 'SOLD') {
                            setSellingItem(item);
                            setQuickSoldPrice(item.listing_price ? item.listing_price.toString() : '');
                            setQuickCostBasis(item.cost_basis ? item.cost_basis.toString() : '');
                            setSoldModalVisible(true);
                        } else {
                            setItemStatus(item, s);
                        }
                    }
                })),
                { text: "Delete", style: "destructive" as const, onPress: () => confirmDelete(item) }
            ];

            Alert.alert(
                "Item Actions",
                undefined,
                alertOptions,
                { cancelable: true }
            );
        }
    };

    // --- BULK ACTIONS ---
    const promptBulkDelete = () => {
        if (selectedItemIds.length === 0) return;
        Alert.alert(
            "Delete Items",
            `Remove ${selectedItemIds.length} items from your inventory?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => performBulkDelete()
                }
            ]
        );
    };

    const performBulkDelete = async () => {
        if (!userId || selectedItemIds.length === 0) return;
        setLoading(true);
        const { error } = await supabase
            .from('inventory_items')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', selectedItemIds)
            .eq('owner_id', userId);

        if (error) {
            Alert.alert("Error", "Failed to delete items.");
            setLoading(false);
        } else {
            setIsSelectMode(false);
            setSelectedItemIds([]);
            fetchInventory(userId);
        }
    };

    const promptBulkStatus = () => {
        if (selectedItemIds.length === 0) return;
        const options = ['Cancel', 'FOR_SALE', 'PENDING', 'SOLD', 'PERSONAL'];

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: options.map(o => o.replace('_', ' ')),
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        performBulkStatus(options[buttonIndex]);
                    }
                }
            );
        } else {
            Alert.alert(
                "Change Status",
                "Select a new status for the selected items:",
                [
                    { text: "Cancel", style: "cancel", onPress: () => { } },
                    ...options.slice(1).map(opt => ({
                        text: opt.replace('_', ' '),
                        onPress: () => { performBulkStatus(opt); }
                    }))
                ],
                { cancelable: true }
            );
        }
    };

    const performBulkStatus = async (newStatus: string) => {
        if (!userId || selectedItemIds.length === 0) return;
        setLoading(true);
        const { error } = await supabase
            .from('inventory_items')
            .update({ status: newStatus })
            .in('id', selectedItemIds)
            .eq('owner_id', userId);

        if (error) {
            Alert.alert("Error", "Failed to update status.");
            setLoading(false);
        } else {
            setIsSelectMode(false);
            setSelectedItemIds([]);
            fetchInventory(userId);
        }
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setTitle(item.title);
        setQuantity(item.quantity.toString());
        setListingPrice(item.listing_price.toString());
        setStatus(item.status);
        setSoldPrice(item.sold_price ? item.sold_price.toString() : '');
        setCostBasis(item.cost_basis ? item.cost_basis.toString() : '');

        // Restore Scrydex metadata if it exists
        if (item.catalog_product_id) {
            setCatalogProductId(item.catalog_product_id);
            setGame(item.game || null);

            const cp = item.catalog_products;
            if (cp) {
                const pricesPayload = cp.catalog_prices_current;
                const mPrice = Array.isArray(pricesPayload) ? pricesPayload[0]?.market_price : pricesPayload?.market_price;
                const curr = Array.isArray(pricesPayload) ? pricesPayload[0]?.currency : pricesPayload?.currency;
                const src = Array.isArray(pricesPayload) ? pricesPayload[0]?.source : pricesPayload?.source;
                setMarketPrice(mPrice || null);
                setCurrency(curr || null);
                setSource(src || null);
                setImageUrl(cp.image_url || null);
                setSetName(cp.set_name || null);
                setCollectorNumber(cp.collector_number || null);
                setSetTotal(cp.set_total || null);
                setSetPrintedTotal(cp.set_printed_total || null);
                setExternalId(cp.external_id || null);
            } else {
                setMarketPrice(null);
                setCurrency(null);
                setSource(null);
                setImageUrl(null);
                setSetName(null);
                setCollectorNumber(null);
                setSetTotal(null);
                setSetPrintedTotal(null);
                setExternalId(null);
            }
        } else {
            setCatalogProductId(null);
            setGame(null);
            setMarketPrice(null);
            setCurrency(null);
            setSource(null);
            setImageUrl(null);
            setSetName(null);
            setCollectorNumber(null);
            setSetTotal(null);
            setSetPrintedTotal(null);
            setExternalId(null);
        }

        setCondition(item.condition ?? null);
        setIsGraded(!!item.is_graded);
        setGradingCompany(item.grading_company ?? null);
        setGrade(item.grade ?? null);
        setModalVisible(true);
    };

    const formatSetNumber = (externalId?: string | null, collectorNumber?: string | null, setName?: string | null, setPrintedTotal?: number | null, setTotal?: number | null) => {
        let num = collectorNumber ?? null;

        if (!num && typeof externalId === 'string' && externalId.includes('-')) {
            const parts = externalId.split('-');
            const last = parts[parts.length - 1];
            if (last) num = last;
        }

        if (setName && setName.toLowerCase().includes('promo')) {
            return num ? `${num}` : '—';
        }

        if (num && setPrintedTotal) {
            let denomStr = String(setPrintedTotal);
            if (setTotal && setTotal >= 100) {
                denomStr = denomStr.padStart(3, '0');
            }
            return `${num}/${denomStr}`;
        }
        if (num && setTotal) return `${num}/${setTotal}`;
        if (num) return `${num}`;
        return '—';
    };

    const buildTcgplayerSearchUrl = (product: { title: string; catalog_products?: any }) => {
        const queryParts: string[] = [product.title];
        if (product.catalog_products) {
            if (product.catalog_products.set_name) queryParts.push(product.catalog_products.set_name);
            if (product.catalog_products.collector_number) queryParts.push(product.catalog_products.collector_number);
            if (product.catalog_products.language_code === 'JA') queryParts.push('Japanese');
        }
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

    const handleOpenTcgPlayer = async (item: InventoryItem) => {
        if (!item.catalog_product_id) {
            const searchUrl = buildTcgplayerSearchUrl(item);
            router.push({ pathname: "/webview", params: { url: searchUrl } });
            return;
        }

        if (openingId === item.catalog_product_id) return;
        setOpeningId(item.catalog_product_id);

        try {
            const storedUrl = item.catalog_products?.tcgplayer_url;
            if (storedUrl) {
                router.push({ pathname: "/webview", params: { url: storedUrl } });
                return;
            }
            if (item.catalog_products?.language_code === 'JA') {
                router.push({ pathname: "/webview", params: { url: buildTcgplayerSearchUrl(item) } });
                return;
            }
            const exactUrl = await resolveTcgplayerUrl(item.catalog_product_id);
            const urlToOpen = exactUrl ?? buildTcgplayerSearchUrl(item);
            router.push({ pathname: "/webview", params: { url: urlToOpen } });
        } finally {
            setOpeningId(null);
        }
    };

    const renderItem = ({ item }: { item: InventoryItem }) => {
        const pricesPayload = item.catalog_products?.catalog_prices_current;
        const marketPrice = Array.isArray(pricesPayload) ? pricesPayload[0]?.market_price : pricesPayload?.market_price;
        const currency = Array.isArray(pricesPayload) ? pricesPayload[0]?.currency : pricesPayload?.currency;
        const source = Array.isArray(pricesPayload) ? pricesPayload[0]?.source : pricesPayload?.source;
        const lastUpdated = Array.isArray(pricesPayload) ? pricesPayload[0]?.last_updated : pricesPayload?.last_updated;

        const usdMarketPrice = typeof marketPrice === 'number' ? toUsd(marketPrice, currency) : null;

        let marketLabel = 'MKT';
        if (source === 'TCGCSV') marketLabel = 'TCG';
        if (source === 'SCRYDEX') marketLabel = 'SCR';

        let unrealizedStr = null;
        if (item.cost_basis !== null && item.status !== 'SOLD' && item.listing_price > 0) {
            const profit = (item.listing_price - item.cost_basis) * item.quantity;
            unrealizedStr = `Unrealized: ${profit.toFixed(2)}`;
        }

        const imageUrl = item.catalog_products?.image_url;
        const prod = item.catalog_products; // Alias for brevity

        let condition = null;
        if (item.is_graded) {
            condition = item.grading_company && item.grade !== null && item.grade !== undefined
                ? `${item.grading_company} ${item.grade}`
                : (item as any).grade;
        } else {
            condition = (item as any).condition || (item as any).condition_label;
        }

        const setNameDisplay = prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : (prod?.set_name || 'Unknown Set');
        const setNameOriginal = prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : prod?.set_name;
        const setNumber = formatSetNumber(prod?.external_id, prod?.collector_number, setNameOriginal, prod?.set_printed_total, prod?.set_total);
        const rarity = displayRarity(prod || {});
        const metaLine = [setNumber, rarity].filter(Boolean).join(' • ');

        const isSelected = selectedItemIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.itemCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelectMode && isSelected && { backgroundColor: theme.primary + '15' },
                    isSelectMode && !isSelected && { opacity: 0.7 }
                ]}
                onPress={() => {
                    if (isSelectMode) {
                        setSelectedItemIds(prev =>
                            prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        );
                    } else {
                        openEditModal(item);
                    }
                }}
            >
                {/* Selection Checkbox */}
                {isSelectMode && (
                    <View style={{ justifyContent: 'center', paddingRight: 12 }}>
                        <Ionicons
                            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                            size={22}
                            color={isSelected ? theme.primary : theme.mutedText}
                        />
                    </View>
                )}

                {/* Image */}
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.background }]}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                            defaultSource={{ uri: 'https://via.placeholder.com/60x84?text=No+Image' }}
                        />
                    ) : (
                        <Ionicons name="image-outline" size={20} color={theme.mutedText} />
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, marginLeft: 10, flexDirection: 'row', justifyContent: 'space-between' }}>

                    {/* LEFT COLUMN */}
                    <View style={{ flex: 1, marginRight: 8, justifyContent: 'center', paddingVertical: 2 }}>
                        {/* 1. Item Name / JP tag */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginRight: 6, flexShrink: 1 }]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            {prod?.language_code === 'JA' && (
                                <View style={{ backgroundColor: theme.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>JP</Text>
                                </View>
                            )}
                        </View>

                        {/* 2. Set Name */}
                        <Text style={[{ color: theme.mutedText, fontSize: 11, marginTop: 2 }]} numberOfLines={1}>
                            {setNameDisplay}
                        </Text>

                        {/* 3. Set Number and Rarity */}
                        {metaLine.length > 0 && (
                            <Text style={[{ color: theme.mutedText, fontSize: 11, marginTop: 1 }]} numberOfLines={1}>
                                {metaLine}
                            </Text>
                        )}

                        {/* 4. CHIPS ROW */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            {prod?.kind === 'SEALED' ? (
                                <View style={{ backgroundColor: theme.sealed, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 4 }}>
                                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: 'bold' }}>SEALED</Text>
                                </View>
                            ) : condition && (
                                <View style={{ backgroundColor: theme.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 4 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>{condition}</Text>
                                </View>
                            )}
                            {item.quantity > 1 && (
                                <Text style={{ fontSize: 11, color: theme.mutedText, fontWeight: 'bold', marginRight: 4 }}>×{item.quantity}</Text>
                            )}
                            {filter === 'ALL' && (
                                <View style={[styles.badge, { backgroundColor: item.status === 'SOLD' ? '#d1e7dd' : theme.border, margin: 0, paddingHorizontal: 4, paddingVertical: 1 }]}>
                                    <Text style={[styles.badgeText, { color: item.status === 'SOLD' ? '#0f5132' : theme.text, fontSize: 9 }]}>{item.status}</Text>
                                </View>
                            )}
                        </View>

                        {unrealizedStr && (
                            <Text style={{ fontSize: 10, color: '#10b981', marginTop: 2, fontWeight: '500' }}>
                                {unrealizedStr}
                            </Text>
                        )}
                    </View>

                    {/* RIGHT COLUMN */}
                    <View style={{ alignItems: 'flex-end', flexShrink: 0, justifyContent: 'space-between', paddingVertical: 2 }}>
                        {/* Top-right: actions row */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <TouchableOpacity
                                style={{ padding: 2, opacity: openingId === item.catalog_product_id && item.catalog_product_id ? 0.5 : 1 }}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleOpenTcgPlayer(item);
                                }}
                                disabled={openingId === item.catalog_product_id && !!item.catalog_product_id}
                            >
                                <Ionicons name="open-outline" size={16} color={theme.mutedText} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: 4, padding: 2 }} onPress={(e) => {
                                e.stopPropagation();
                                openActionMenu(item);
                            }}>
                                <Ionicons name="ellipsis-vertical" size={16} color={theme.mutedText} />
                            </TouchableOpacity>
                        </View>

                        {/* Market/Listing prices stacked */}
                        <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <Text style={{ fontSize: 9, color: theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>{marketLabel}</Text>
                                <Text style={{ color: theme.mutedText, fontSize: 12 }}>
                                    {formatUsd(marketPrice, currency)}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>YOU</Text>
                                <Text style={{ color: theme.primary, fontSize: 14, fontWeight: 'bold' }}>
                                    ${item.listing_price.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }: { item: InventoryItem }) => {
        const pricesPayload = item.catalog_products?.catalog_prices_current;
        const marketPrice = Array.isArray(pricesPayload) ? pricesPayload[0]?.market_price : pricesPayload?.market_price;
        const currency = Array.isArray(pricesPayload) ? pricesPayload[0]?.currency : pricesPayload?.currency;
        const source = Array.isArray(pricesPayload) ? pricesPayload[0]?.source : pricesPayload?.source;

        let marketLabel = 'MKT';
        if (source === 'TCGCSV') marketLabel = 'TCG';
        if (source === 'SCRYDEX') marketLabel = 'SCR';

        const imageUrl = item.catalog_products?.image_url;
        const prod = item.catalog_products;

        let condition = null;
        if (item.is_graded) {
            condition = item.grading_company && item.grade !== null && item.grade !== undefined
                ? `${item.grading_company} ${item.grade}`
                : (item as any).grade;
        } else {
            condition = (item as any).condition || (item as any).condition_label;
        }

        const setNameOriginal = prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : prod?.set_name;
        const setNameDisplay = prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : (prod?.set_name || 'Unknown Set');
        const setNumber = formatSetNumber(prod?.external_id, prod?.collector_number, setNameOriginal, prod?.set_printed_total, prod?.set_total);
        const rarity = displayRarity(prod || {});
        const metaLine = [setNumber, rarity].filter(Boolean).join(' • ');

        const isSelected = selectedItemIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.gridItemCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelectMode && isSelected && { backgroundColor: theme.primary + '15', borderColor: theme.primary },
                    isSelectMode && !isSelected && { opacity: 0.7 }
                ]}
                onPress={() => {
                    if (isSelectMode) {
                        setSelectedItemIds(prev =>
                            prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        );
                    } else {
                        openEditModal(item);
                    }
                }}
            >
                {/* Select Checkbox Overlay (Top Left) */}
                {isSelectMode && (
                    <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 10, backgroundColor: theme.surface, borderRadius: 12 }}>
                        <Ionicons
                            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                            size={22}
                            color={isSelected ? theme.primary : theme.mutedText}
                        />
                    </View>
                )}

                {/* Ellipsis Action (Top Right) */}
                <TouchableOpacity
                    style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }}
                    onPress={(e) => {
                        e.stopPropagation();
                        openActionMenu(item);
                    }}
                >
                    <Ionicons name="ellipsis-vertical" size={11} color={theme.mutedText} />
                </TouchableOpacity>

                {/* Image */}
                <View style={[styles.gridImagePlaceholder, { backgroundColor: theme.background }]}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                            defaultSource={{ uri: 'https://via.placeholder.com/150x210?text=No+Image' }}
                        />
                    ) : (
                        <Ionicons name="image-outline" size={32} color={theme.mutedText} />
                    )}
                </View>

                {/* Title & JP Badge */}
                <View style={{ padding: 8, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold', flexShrink: 1 }} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {prod?.language_code === 'JA' && (
                            <View style={{ backgroundColor: theme.border, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, marginLeft: 4 }}>
                                <Text style={{ fontSize: 8, color: theme.text, fontWeight: 'bold' }}>JP</Text>
                            </View>
                        )}
                    </View>

                    {/* Set Name */}
                    <Text style={{ color: theme.mutedText, fontSize: 10, marginBottom: 0 }} numberOfLines={1}>
                        {setNameDisplay}
                    </Text>

                    {/* Set Num/Rarity */}
                    <Text style={{ color: theme.mutedText, fontSize: 10, marginBottom: 2 }} numberOfLines={1}>
                        {metaLine || setNumber}
                    </Text>

                    {/* Condition / Grade / Quantity Line */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        {prod?.kind === 'SEALED' ? (
                            <View style={{ backgroundColor: theme.sealed, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, marginRight: 4 }}>
                                <Text style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>SEALED</Text>
                            </View>
                        ) : condition && (
                            <View style={{ backgroundColor: theme.border, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, marginRight: 4 }}>
                                <Text style={{ fontSize: 8, color: theme.text, fontWeight: 'bold' }}>{condition}</Text>
                            </View>
                        )}
                        {item.quantity > 1 && (
                            <View style={{ backgroundColor: theme.border, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, marginRight: 4 }}>
                                <Text style={{ fontSize: 8, color: theme.text, fontWeight: 'bold' }}>x{item.quantity}</Text>
                            </View>
                        )}
                    </View>

                    {/* Price Line (Stacked) */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                        <View style={{ alignItems: 'flex-start', flexShrink: 1, marginRight: 4 }}>
                            <Text style={{ fontSize: 9, color: theme.mutedText, fontWeight: 'bold', marginBottom: 1 }}>{marketLabel}</Text>
                            <Text style={{ color: theme.mutedText, fontSize: 11 }} numberOfLines={1} adjustsFontSizeToFit>
                                {formatUsd(marketPrice, currency)}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                            <Text style={{ fontSize: 9, color: theme.mutedText, fontWeight: 'bold', marginBottom: 1 }}>YOU</Text>
                            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: 'bold' }} numberOfLines={1} adjustsFontSizeToFit>
                                ${item.listing_price.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderBinderItem = ({ item }: { item: InventoryItem }) => {
        const pricesPayload = item.catalog_products?.catalog_prices_current;
        const marketPrice = Array.isArray(pricesPayload) ? pricesPayload[0]?.market_price : pricesPayload?.market_price;
        const currency = Array.isArray(pricesPayload) ? pricesPayload[0]?.currency : pricesPayload?.currency;

        const imageUrl = item.catalog_products?.image_url;
        const prod = item.catalog_products;

        let condition = null;
        if (item.is_graded) {
            condition = item.grading_company && item.grade !== null && item.grade !== undefined
                ? `${item.grading_company} ${item.grade}`
                : (item as any).grade;
        } else {
            condition = (item as any).condition || (item as any).condition_label;
        }

        const isSelected = selectedItemIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.binderItemCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelectMode && isSelected && { backgroundColor: theme.primary + '15' },
                    isSelectMode && !isSelected && { opacity: 0.7 }
                ]}
                onPress={() => {
                    if (isSelectMode) {
                        setSelectedItemIds(prev =>
                            prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        );
                    } else {
                        openEditModal(item);
                    }
                }}
            >
                {/* Select Checkbox Overlay (Top Left) */}
                {isSelectMode && (
                    <View style={{ position: 'absolute', top: 4, left: 4, zIndex: 10, backgroundColor: theme.surface, borderRadius: 12 }}>
                        <Ionicons
                            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={isSelected ? theme.primary : theme.mutedText}
                        />
                    </View>
                )}

                {/* Ellipsis Action (Top Right) */}
                <TouchableOpacity
                    style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }}
                    onPress={(e) => {
                        e.stopPropagation();
                        openActionMenu(item);
                    }}
                >
                    <Ionicons name="ellipsis-vertical" size={10} color={theme.mutedText} />
                </TouchableOpacity>

                {/* Full Card Image Background */}
                <View style={[styles.binderImagePlaceholder, { backgroundColor: theme.background }]}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                            defaultSource={{ uri: 'https://via.placeholder.com/150x210?text=No+Image' }}
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={32} color={theme.mutedText} />
                        </View>
                    )}
                </View>

                {/* Bottom Overlay Panel — compact, lighter */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 5, paddingTop: 6, paddingBottom: 5 }}>
                    {/* Title */}
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold', marginBottom: 2 }} numberOfLines={1}>
                        {item.title}
                    </Text>

                    {/* Condition / Grade / Quantity Line */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 2 }}>
                        {prod?.kind === 'SEALED' ? (
                            <View style={{ backgroundColor: theme.sealed, paddingHorizontal: 2, paddingVertical: 0, borderRadius: 2 }}>
                                <Text style={{ fontSize: 6, color: '#fff', fontWeight: 'bold' }}>SEALED</Text>
                            </View>
                        ) : condition && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 2, paddingVertical: 0, borderRadius: 2 }}>
                                <Text style={{ fontSize: 6, color: '#fff', fontWeight: 'bold' }}>{condition}</Text>
                            </View>
                        )}
                        {item.quantity > 1 && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 2, paddingVertical: 0, borderRadius: 2 }}>
                                <Text style={{ fontSize: 6, color: '#fff', fontWeight: 'bold' }}>x{item.quantity}</Text>
                            </View>
                        )}
                    </View>

                    {/* Stacked Pricing Block */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9 }} numberOfLines={1} adjustsFontSizeToFit>
                            {formatUsd(marketPrice, currency)}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }} numberOfLines={1} adjustsFontSizeToFit>
                            ${item.listing_price.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const sortedItems = useMemo(() => {
        let filtered = items;
        if (filter !== 'ALL') {
            filtered = filtered.filter(i => i.status === filter);
        }

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(i => {
                const matchTitle = i.title.toLowerCase().includes(lowerQuery);
                const matchSet = i.catalog_products?.set_name?.toLowerCase().includes(lowerQuery);
                return matchTitle || matchSet;
            });
        }

        // Apply Native Popup Filters
        const { isCard, isSealed, isEnglish, isJapanese } = activeFilters;

        // Product Type Filter
        if (isCard !== isSealed) { // If both or neither, ignore filtering
            const targetKind = 'SEALED';
            filtered = filtered.filter(i => isSealed
                ? i.catalog_products?.kind === targetKind
                : i.catalog_products?.kind !== targetKind
            );
        }

        // Language Filter
        if (isEnglish !== isJapanese) { // If both or neither, ignore filtering
            const jaCode = 'JA';
            filtered = filtered.filter(i => isJapanese
                ? i.catalog_products?.language_code === jaCode
                : i.catalog_products?.language_code !== jaCode
            );
        }

        return filtered.sort((a, b) => {
            if (sortBy === 'PRICE_HIGH_LOW' || sortBy === 'PRICE_LOW_HIGH') {
                const getPrice = (item: InventoryItem) => item.listing_price || 0;
                return sortBy === 'PRICE_HIGH_LOW' ? getPrice(b) - getPrice(a) : getPrice(a) - getPrice(b);
            }
            if (sortBy === 'NAME_AZ') {
                return a.title.localeCompare(b.title);
            }
            if (sortBy === 'OLDEST') {
                // Since `fetchInventory` defaults to returning most recent first, we can just invert the index naturally if no explicit date exists in the type, but let's assume they are chronologically ordered in `items` or we fallback to string locale diff on IDs if necessary.
                // Reversing index implies oldest items first:
                // Note: items are already pre-sorted newest first from DB
                return 1;
            }
            return 0; // RECENT (default based on fetchInventory sort)
        });
    }, [items, filter, sortBy, searchQuery, activeFilters]);

    const summaryStats = useMemo(() => {
        let listedValue = 0;
        let marketValue = 0;
        let soldValue = 0;
        let profitValue = 0;

        for (const item of sortedItems) {
            if (item.listing_price) {
                listedValue += item.listing_price * item.quantity;
            }

            const pricesPayload = item.catalog_products?.catalog_prices_current;
            const marketPrice = Array.isArray(pricesPayload) ? pricesPayload[0]?.market_price : pricesPayload?.market_price;
            const currency = Array.isArray(pricesPayload) ? pricesPayload[0]?.currency : pricesPayload?.currency;

            if (typeof marketPrice === 'number') {
                marketValue += toUsd(marketPrice, currency) * item.quantity;
            }

            if (item.status === 'SOLD' && typeof item.sold_price === 'number') {
                soldValue += item.sold_price * item.quantity;
                if (typeof item.cost_basis === 'number') {
                    profitValue += (item.sold_price - item.cost_basis) * item.quantity;
                }
            }
        }

        return {
            listedValue,
            marketValue,
            soldValue,
            profitValue
        };
    }, [sortedItems]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {isSelectMode ? `${selectedItemIds.length} Selected` : 'Inventory'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    {isSelectMode && (
                        <TouchableOpacity
                            disabled={sortedItems.length === 0}
                            style={{ opacity: sortedItems.length === 0 ? 0.3 : 1 }}
                            onPress={() => {
                                const allVisibleSelected = sortedItems.length > 0 &&
                                    sortedItems.every(i => selectedItemIds.includes(i.id));
                                if (allVisibleSelected) {
                                    setSelectedItemIds([]);
                                } else {
                                    setSelectedItemIds(sortedItems.map(i => i.id));
                                }
                            }}>
                            <Text style={{
                                color: theme.primary,
                                fontSize: 16,
                                fontWeight: '600'
                            }}>
                                {sortedItems.length > 0 && sortedItems.every(i => selectedItemIds.includes(i.id)) ? 'Clear All' : 'Select All'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => {
                        setIsSelectMode(!isSelectMode);
                        if (isSelectMode) setSelectedItemIds([]);
                    }}>
                        <Text style={{
                            color: isSelectMode ? theme.primary : theme.text,
                            fontSize: 16,
                            fontWeight: '600'
                        }}>
                            {isSelectMode ? 'Cancel' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                    {!isSelectMode && (
                        <TouchableOpacity style={{ padding: 4 }} onPress={handleAddItemPress}>
                            <Ionicons name="add" size={28} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['ALL', 'FOR_SALE', 'PENDING', 'SOLD', 'PERSONAL'].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterTab,
                                filter === f ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface }
                            ]}
                            onPress={() => setFilter(f as any)}
                        >
                            <Text style={{
                                color: filter === f ? '#fff' : theme.text,
                                fontSize: 13,
                                fontWeight: filter === f ? 'bold' : '600'
                            }}>
                                {f.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.searchRowContainer}>
                <View style={[styles.searchInputWrapper, { backgroundColor: theme.surface }]}>
                    <Ionicons name="search" size={18} color={theme.mutedText} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search inventory..."
                        placeholderTextColor={theme.mutedText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                            <Ionicons name="close-circle" size={16} color={theme.mutedText} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[
                        styles.actionBtn,
                        (activeFilters.isSealed || activeFilters.isCard || activeFilters.isEnglish || activeFilters.isJapanese || sortBy !== 'RECENT')
                        && { backgroundColor: theme.primary + '20' }
                    ]}
                    onPress={() => setSortModalVisible(true)}
                >
                    <Ionicons
                        name="filter"
                        size={20}
                        color={(activeFilters.isSealed || activeFilters.isCard || activeFilters.isEnglish || activeFilters.isJapanese || sortBy !== 'RECENT') ? theme.primary : theme.text}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { marginLeft: 0 }]}
                    onPress={() => {
                        const next = viewMode === 'list' ? 'grid' : viewMode === 'grid' ? 'binder' : 'list';
                        setViewMode(next);
                        AsyncStorage.setItem('inventory_view_mode', next);
                    }}
                >
                    <Ionicons name={viewMode === 'list' ? "grid" : viewMode === 'grid' ? "apps" : "list"} size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
                {(filter === 'FOR_SALE' || filter === 'PENDING') && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>LIST VALUE</Text>
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>${summaryStats.listedValue.toFixed(2)}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>MARKET VALUE</Text>
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>${summaryStats.marketValue.toFixed(2)}</Text>
                        </View>
                    </View>
                )}
                {filter === 'PERSONAL' && (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>MARKET VALUE</Text>
                        <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>${summaryStats.marketValue.toFixed(2)}</Text>
                    </View>
                )}
                {filter === 'SOLD' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>SOLD VALUE</Text>
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>${summaryStats.soldValue.toFixed(2)}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>PROFIT</Text>
                            <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 1, color: summaryStats.profitValue < 0 ? '#ef4444' : (summaryStats.profitValue > 0 ? '#10b981' : theme.text) }}>
                                {summaryStats.profitValue < 0 ? '-' : ''}${Math.abs(summaryStats.profitValue).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {loading ? (
                <ActivityIndicator style={styles.mt20} />
            ) : items.length === 0 ? (
                <View style={[styles.emptyState, { marginTop: 60 }]}>
                    <Ionicons name="cube-outline" size={48} color={theme.border} style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Your Inventory is Empty</Text>
                    <Text style={{ fontSize: 14, color: theme.mutedText, textAlign: 'center', marginHorizontal: 32, marginBottom: 24 }}>
                        Start adding items to your inventory to track your collection's value.
                    </Text>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary, width: 200, marginBottom: 0 }]}
                        onPress={handleAddItemPress}
                    >
                        <Text style={styles.saveButtonText}>Add First Item</Text>
                    </TouchableOpacity>
                </View>
            ) : sortedItems.length === 0 ? (
                (searchQuery.length > 0 || activeFilters.isSealed || activeFilters.isCard || activeFilters.isEnglish || activeFilters.isJapanese) ? (
                    <View style={[styles.emptyState, { marginTop: 60 }]}>
                        <Ionicons name="search-outline" size={48} color={theme.border} style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8 }}>No Results Found</Text>
                        <Text style={{ fontSize: 14, color: theme.mutedText, textAlign: 'center', marginHorizontal: 32, marginBottom: 24 }}>
                            No items match your current search and filters.
                        </Text>
                        <TouchableOpacity
                            style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                            onPress={() => {
                                setSearchQuery('');
                                setActiveFilters({ isCard: false, isSealed: false, isEnglish: false, isJapanese: false });
                            }}
                        >
                            <Text style={{ color: theme.text, fontWeight: '600' }}>Clear Search & Filters</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.emptyState, { marginTop: 60 }]}>
                        <Ionicons name="folder-open-outline" size={48} color={theme.border} style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                            {filter === 'ALL' ? 'No Items' : `No ${filter.replace('_', ' ')} Items`}
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.mutedText, textAlign: 'center', marginHorizontal: 32 }}>
                            You don't have any items in this status tab yet.
                        </Text>
                    </View>
                )
            ) : (
                <FlatList
                    key={viewMode}
                    data={sortedItems}
                    keyExtractor={(item) => item.id}
                    renderItem={viewMode === 'binder' ? renderBinderItem : viewMode === 'grid' ? renderGridItem : renderItem}
                    contentContainerStyle={viewMode === 'binder' ? [styles.listContent, { paddingHorizontal: 4 }] : viewMode === 'grid' ? [styles.listContent, { paddingHorizontal: 8 }] : styles.listContent}
                    numColumns={viewMode === 'binder' ? 3 : viewMode === 'grid' ? 2 : 1}
                    columnWrapperStyle={viewMode === 'binder' ? styles.binderRow : viewMode === 'grid' ? styles.gridRow : undefined}
                />
            )}

            {/* Bulk Action Bottom Bar */}
            {isSelectMode && (
                <View style={[styles.bulkActionBar, { backgroundColor: theme.surface, borderTopColor: theme.border, justifyContent: 'flex-end' }]}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.bulkActionBtn, { backgroundColor: theme.border, opacity: selectedItemIds.length ? 1 : 0.5 }]}
                            disabled={selectedItemIds.length === 0}
                            onPress={promptBulkStatus}
                        >
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Status</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bulkActionBtn, { backgroundColor: '#ef4444', opacity: selectedItemIds.length ? 1 : 0.5 }]}
                            disabled={selectedItemIds.length === 0}
                            onPress={promptBulkDelete}
                        >
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={sortModalVisible}
                onRequestClose={() => setSortModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
                        {/* Header */}
                        <View style={styles.sheetHeader}>
                            <Text style={[styles.sheetTitle, { color: theme.text }]}>Sort & Filter</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <TouchableOpacity onPress={() => {
                                    setSortBy('RECENT');
                                    AsyncStorage.setItem('inventory_sort_mode', 'RECENT');
                                    setActiveFilters({ isCard: false, isSealed: false, isEnglish: false, isJapanese: false });
                                }}>
                                    <Text style={{ color: theme.mutedText, fontSize: 14, fontWeight: '500' }}>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView style={styles.sheetBody}>
                            {/* Sort Section */}
                            <Text style={[styles.sectionHeading, { color: theme.mutedText }]}>SORT BY</Text>
                            <View style={styles.sortList}>
                                {[
                                    { id: 'RECENT', label: 'Recently Added' },
                                    { id: 'OLDEST', label: 'Oldest Added' },
                                    { id: 'PRICE_HIGH_LOW', label: 'Price: High to Low' },
                                    { id: 'PRICE_LOW_HIGH', label: 'Price: Low to High' },
                                    { id: 'NAME_AZ', label: 'Name: A to Z' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={styles.sortOptionRow}
                                        onPress={() => {
                                            setSortBy(option.id as any);
                                            AsyncStorage.setItem('inventory_sort_mode', option.id);
                                        }}
                                    >
                                        <Text style={[
                                            styles.sortOptionText,
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
                            <Text style={[styles.sectionHeading, { color: theme.mutedText, marginTop: 24 }]}>FILTERS</Text>

                            <Text style={[styles.filterSubHeading, { color: theme.text }]}>Type</Text>
                            <View style={styles.filterChipGroup}>
                                <TouchableOpacity
                                    style={[styles.filterChipToggle, { backgroundColor: activeFilters.isCard ? theme.primary : theme.border }]}
                                    onPress={() => setActiveFilters(prev => ({ ...prev, isCard: !prev.isCard }))}
                                >
                                    <Text style={{ color: activeFilters.isCard ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>Cards Only</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChipToggle, { backgroundColor: activeFilters.isSealed ? theme.sealed : theme.border }]}
                                    onPress={() => setActiveFilters(prev => ({ ...prev, isSealed: !prev.isSealed }))}
                                >
                                    <Text style={{ color: activeFilters.isSealed ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>Sealed Only</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.filterSubHeading, { color: theme.text, marginTop: 16 }]}>Language</Text>
                            <View style={styles.filterChipGroup}>
                                <TouchableOpacity
                                    style={[styles.filterChipToggle, { backgroundColor: activeFilters.isEnglish ? theme.primary : theme.border }]}
                                    onPress={() => setActiveFilters(prev => ({ ...prev, isEnglish: !prev.isEnglish }))}
                                >
                                    <Text style={{ color: activeFilters.isEnglish ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>English (EN)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChipToggle, { backgroundColor: activeFilters.isJapanese ? theme.primary : theme.border }]}
                                    onPress={() => setActiveFilters(prev => ({ ...prev, isJapanese: !prev.isJapanese }))}
                                >
                                    <Text style={{ color: activeFilters.isJapanese ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>Japanese (JA)</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editingItem ? 'Edit Item' : 'Add Item'}
                        </Text>
                        <TouchableOpacity onPress={() => {
                            setModalVisible(false);
                            // Clear params so it doesn't re-trigger
                            router.setParams({ selectedCatalogProduct: undefined });
                        }}>
                            <Text style={{ color: theme.primary, fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {imageUrl && (
                            <View style={{ alignItems: 'center', marginBottom: 12 }}>
                                <Image source={{ uri: imageUrl }} style={{ width: 150, height: 210, borderRadius: 8 }} resizeMode="cover" />
                            </View>
                        )}
                        {setName && (
                            <Text style={[{ color: theme.mutedText, textAlign: 'center', marginBottom: 20 }]}>
                                {setName} • {formatSetNumber(externalId, collectorNumber, setName, setPrintedTotal, setTotal)}
                            </Text>
                        )}
                        <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Charizard Base Set"
                            placeholderTextColor={theme.mutedText}
                            editable={!catalogProductId} // Lock field since we pulled from catalog
                        />

                        {/* Item Details */}
                        <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Item Details</Text>

                        {/* Condition chips — only when not graded */}
                        {!isGraded && (
                            <View style={{ marginBottom: 12 }}>
                                <Text style={[styles.label, { color: theme.mutedText, fontSize: 12 }]}>Condition</Text>
                                <View style={styles.statusContainer}>
                                    {(['NM', 'LP', 'MP', 'HP', 'DMG'] as const).map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: condition === c ? theme.primary : theme.surface, borderColor: theme.border }
                                            ]}
                                            onPress={() => setCondition(condition === c ? null : c)}
                                        >
                                            <Text style={{ color: condition === c ? '#fff' : theme.text, fontSize: 12 }}>{c}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Graded toggle */}
                        <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }]}>
                            <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Graded</Text>
                            <Switch
                                value={isGraded}
                                onValueChange={(val) => {
                                    setIsGraded(val);
                                    if (val) {
                                        setCondition(null);
                                    } else {
                                        setGradingCompany(null);
                                        setGrade(null);
                                    }
                                }}
                                trackColor={{ false: '#767577', true: '#93c5fd' }}
                                thumbColor={isGraded ? '#3b82f6' : '#f4f3f4'}
                            />
                        </View>

                        {/* Grading fields — only when graded */}
                        {isGraded && (
                            <View style={{ marginBottom: 12 }}>
                                <Text style={[styles.label, { color: theme.mutedText, fontSize: 12 }]}>Grading Company</Text>
                                <View style={styles.statusContainer}>
                                    {(['PSA', 'BGS', 'CGC', 'SGC', 'Other'] as const).map((co) => (
                                        <TouchableOpacity
                                            key={co}
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: gradingCompany === co ? theme.primary : theme.surface, borderColor: theme.border }
                                            ]}
                                            onPress={() => setGradingCompany(co)}
                                        >
                                            <Text style={{ color: gradingCompany === co ? '#fff' : theme.text, fontSize: 12 }}>{co}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={[styles.label, { color: theme.mutedText, fontSize: 12, marginTop: 10 }]}>Grade</Text>
                                <View style={styles.statusContainer}>
                                    {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: grade === g ? theme.primary : theme.surface, borderColor: theme.border }
                                            ]}
                                            onPress={() => setGrade(g)}
                                        >
                                            <Text style={{ color: grade === g ? '#fff' : theme.text, fontSize: 12 }}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Pricing */}
                        {marketPrice !== null && (
                            <View style={styles.marketPriceBanner}>
                                <Ionicons name="trending-up" size={16} color={theme.primary} />
                                <Text style={styles.marketPriceLabel}>
                                    Current {source ?? 'MKT'} Market Price: <Text style={{ fontWeight: 'bold' }}>{formatUsd(marketPrice, currency)}</Text>
                                </Text>
                            </View>
                        )}

                        <View style={styles.row}>
                            <View style={styles.halfCol}>
                                <Text style={[styles.label, { color: theme.text }]}>Quantity</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.halfCol}>
                                <Text style={[styles.label, { color: theme.text }]}>Listing Price ($)</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                                    value={listingPrice}
                                    onChangeText={setListingPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <View style={[styles.row, { marginTop: 0 }]}>
                            <View style={styles.halfCol}></View>
                            <View style={styles.halfCol}>
                                <Text style={[styles.label, { color: theme.text }]}>Bought For ($) <Text style={{ fontWeight: 'normal', color: theme.mutedText }}>(Optional)</Text></Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                                    value={costBasis}
                                    onChangeText={setCostBasis}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={theme.mutedText}
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: theme.text }]}>Status</Text>
                        <View style={styles.statusContainer}>
                            {['FOR_SALE', 'PENDING', 'SOLD', 'PERSONAL'].map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: status === s ? theme.primary : theme.surface, borderColor: theme.border }
                                    ]}
                                    onPress={() => setStatus(s as any)}
                                >
                                    <Text style={{ color: status === s ? '#fff' : theme.text, fontSize: 12 }}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {status === 'SOLD' && (
                            <View style={[styles.soldContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.label, { color: theme.text }]}>Sale Details</Text>
                                <View style={styles.row}>
                                    <View style={styles.halfCol}>
                                        <Text style={[styles.label, { color: theme.mutedText, fontSize: 12 }]}>Sold Price ($)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                            value={soldPrice}
                                            onChangeText={setSoldPrice}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.halfCol}>
                                        <Text style={[styles.label, { color: theme.mutedText, fontSize: 12 }]}>Cost Basis ($)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                            value={costBasis}
                                            onChangeText={setCostBasis}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary, marginTop: 30, marginBottom: editingItem ? 16 : 40 }]}
                            onPress={handleSaveItem}
                            disabled={saving}
                        >
                            <Text style={styles.saveButtonText}>
                                {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Inventory'}
                            </Text>
                        </TouchableOpacity>

                        {editingItem && (
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444', marginBottom: 40 }]}
                                onPress={() => confirmDelete(editingItem)}
                                disabled={saving}
                            >
                                <Text style={[styles.saveButtonText, { color: '#ef4444' }]}>
                                    Delete item
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>


                </View>
            </Modal>

            {/* Quick Sold Modal */}
            <Modal visible={soldModalVisible} animationType="slide" transparent={true} onRequestClose={() => setSoldModalVisible(false)}>
                <KeyboardAvoidingView
                    style={[styles.modalOverlay, { justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }]}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
                        <View style={styles.sheetHeader}>
                            <Text style={[styles.sheetTitle, { color: theme.text }]}>Mark as Sold</Text>
                            <TouchableOpacity onPress={() => setSoldModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sheetBody}>
                            <Text style={[styles.label, { color: theme.text, marginBottom: 8 }]}>Sold For ($)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                value={quickSoldPrice}
                                onChangeText={setQuickSoldPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor={theme.mutedText}
                                autoFocus
                            />

                            <Text style={[styles.label, { color: theme.text, marginTop: 12, marginBottom: 8 }]}>Bought For ($) <Text style={{ fontWeight: 'normal', color: theme.mutedText }}>(Optional)</Text></Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                value={quickCostBasis}
                                onChangeText={setQuickCostBasis}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor={theme.mutedText}
                            />

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.primary, marginTop: 24 }]}
                                onPress={handleQuickSellSave}
                            >
                                <Text style={styles.saveButtonText}>Save Sale</Text>
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    binderItemCard: {
        width: '32%',
        aspectRatio: 0.75,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }
        }),
    },
    binderImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    gridItemCard: {
        flex: 1,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 10,
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
    gridImagePlaceholder: {
        width: '100%',
        aspectRatio: 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    mt20: {
        marginTop: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
    filterContainer: {
        paddingVertical: 12,
    },
    filterScroll: {
        paddingHorizontal: 16,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 24,
        marginRight: 8,
    },
    searchRowContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        gap: 12,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ebebeb',
    },
    sortChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
    },
    modalOverlay: {
        flex: 1,
    },
    bottomSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sheetBody: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
    },
    filterSubHeading: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    sortList: {
        gap: 8,
    },
    sortOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ebebeb',
    },
    sortOptionText: {
        fontSize: 16,
    },
    filterChipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterChipToggle: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bulkActionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
    },
    bulkActionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    itemCard: {
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
        flexDirection: 'row',
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
        width: 60,
        height: 84,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: 4,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemMarketPrice: {
        fontSize: 12,
        marginTop: 2,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemMeta: {
        fontSize: 14,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    marketPriceBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#e0f7fa',
        borderRadius: 8,
        marginBottom: 16,
        gap: 6
    },
    marketPriceLabel: {
        fontSize: 14,
        color: '#006064',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfCol: {
        width: '48%',
    },
    statusContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    soldContainer: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    saveButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    gridRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    binderRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        gap: 2,
    },
});
