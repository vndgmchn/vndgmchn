import AddToCollectionSheet from '@/components/inventory/AddToCollectionSheet';
import CollectionFormSheet from '@/components/inventory/CollectionFormSheet';
import CollectionPickerSheet from '@/components/inventory/CollectionPickerSheet';
import InventoryChip from '@/components/inventory/InventoryChip';
import { getItemDisplay } from '@/components/inventory/itemDisplay';
import ItemFormSheet from '@/components/inventory/ItemFormSheet';
import QuickSellSheet from '@/components/inventory/QuickSellSheet';
import SortFilterSheet from '@/components/inventory/SortFilterSheet';
import type { Collection, CollectionVisibility, InventoryItem } from '@/components/inventory/types';
import EmptyState from '@/components/ui/EmptyState';
import FilterPill from '@/components/ui/FilterPill';
import SearchBar from '@/components/ui/SearchBar';
import { HitSlop } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { convertToUsd, formatSetNumber, formatUsd } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryScreen() {
    const theme = useThemeColors();
    const insets = useSafeAreaInsets();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const didAutoRefreshRef = useRef(false);

    // Collections Phase 2A State
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [collectionModalVisible, setCollectionModalVisible] = useState(false);
    
    // Collections Phase 2B State
    const [itemCollectionsMap, setItemCollectionsMap] = useState<Map<string, Set<string>>>(new Map());

    // Collections Phase 3A State
    const [collectionFormVisible, setCollectionFormVisible] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [collectionName, setCollectionName] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');
    const [collectionVisibility, setCollectionVisibility] = useState<CollectionVisibility>('private');
    const [savingCollection, setSavingCollection] = useState(false);

    // Collections Phase 3B State
    const [addToCollectionModalVisible, setAddToCollectionModalVisible] = useState(false);
    const [itemToAddToCollection, setItemToAddToCollection] = useState<InventoryItem | null>(null);
    const [selectedCollectionIdsForAdd, setSelectedCollectionIdsForAdd] = useState<string[]>([]);
    const [addingToCollections, setAddingToCollections] = useState(false);

    const [filter, setFilter] = useState<'ACTIVE' | 'SOLD'>('ACTIVE');
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'binder'>('list');
    const [sortBy, setSortBy] = useState<'RECENT' | 'OLDEST' | 'PRICE_HIGH_LOW' | 'PRICE_LOW_HIGH' | 'NAME_AZ'>('RECENT');

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
    const [quickSellQuantity, setQuickSellQuantity] = useState('1');

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

    const fetchCollections = async () => {
        const { data, error } = await supabase.rpc('get_my_collections');
        if (!error && data) {
            setCollections(data);
            AsyncStorage.getItem('inventory_selected_collection_id').then(saved => {
                if (saved && data.some((c: Collection) => c.id === saved)) {
                    setSelectedCollectionId(saved);
                }
            });
        }
        
        const { data: mappingData, error: mappingError } = await supabase.rpc('get_my_inventory_collection_ids');
        if (!mappingError && mappingData) {
            const newMap = new Map<string, Set<string>>();
            mappingData.forEach((row: any) => {
                if (!newMap.has(row.inventory_item_id)) {
                    newMap.set(row.inventory_item_id, new Set());
                }
                newMap.get(row.inventory_item_id)!.add(row.collection_id);
            });
            setItemCollectionsMap(newMap);
        }
    };

    // Intercept returning router payload from Universal Search
    useEffect(() => {
        if (selectedCatalogProduct) {
            try {
                const product = JSON.parse(selectedCatalogProduct);
                // Route param from Search prefills the Add modal; this is a one-shot navigation event.
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setEditingItem(null);
                setTitle(product.title || '');
                const defaultUsd = (typeof product.market_price === 'number')
                    ? String(convertToUsd(product.market_price, product.currency) ?? product.market_price)
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

                    supabase.functions.invoke('scrydex-refresh-products', {
                        body: { productIds: productIdsToRefresh }
                    }).then(() => {
                        return fetchInventory(uid, true);
                    }).catch(err => {
                        console.error("Auto-refresh failed:", err);
                    });
                }
            }
        }
        if (!isSilent) setLoading(false);
    };

    const loadInitialData = useEffectEvent(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
                didAutoRefreshRef.current = false;
                fetchInventory(user.id);
                fetchCollections();
            }
        });
    });

    useEffect(() => {
        loadInitialData();
    }, []);

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
            const { data, error } = await supabase
                .from('inventory_items')
                .insert([itemData])
                .select()
                .single();

            if (error) {
                Alert.alert('Error', error.message);
            } else if (data && selectedCollectionId) {
                const { error: collError } = await supabase
                    .from('collection_items')
                    .insert([{
                        collection_id: selectedCollectionId,
                        inventory_item_id: data.id
                    }]);

                if (collError) {
                    console.error("Failed to add new item to current collection:", collError.message);
                } else {
                    fetchCollections(); // Refresh membership map
                }
            }
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
        
        const sellQty = parseInt(quickSellQuantity, 10);
        if (isNaN(sellQty) || sellQty < 1 || sellQty > sellingItem.quantity) {
            Alert.alert("Validation Error", `Quantity must be between 1 and ${sellingItem.quantity}.`);
            return;
        }

        setLoading(true);

        const updates = {
            status: 'SOLD',
            sold_price: quickSoldPrice ? parseFloat(quickSoldPrice) : null,
            cost_basis: quickCostBasis ? parseFloat(quickCostBasis) : null,
            sold_at: new Date().toISOString()
        };

        if (sellQty < sellingItem.quantity) {
            // A. PARTIAL SELL (Stack Split)
            const { id, created_at, updated_at, deleted_at, catalog_products, ...safeItemFields } = sellingItem as any;
            
            const newItemData = {
                ...safeItemFields,
                status: updates.status,
                quantity: sellQty,
                sold_price: updates.sold_price,
                cost_basis: updates.cost_basis,
                sold_at: updates.sold_at,
            };
            
            const { data: newSoldItem, error: insertError } = await supabase.from('inventory_items').insert([newItemData]).select().single();
            if (insertError || !newSoldItem) { 
                Alert.alert("Error", "Failed to create sold item record."); 
                setLoading(false); 
                return; 
            }
            
            const { error: updateError } = await supabase.from('inventory_items').update({ quantity: sellingItem.quantity - sellQty }).eq('id', sellingItem.id).eq('owner_id', userId);
            if (updateError) { 
                Alert.alert("Error", "Failed to decrement remaining quantity."); 
                setLoading(false); 
                return; 
            }
            
            if (selectedCollectionId) {
                const { error: collError } = await supabase.from('collection_items').insert([{ collection_id: selectedCollectionId, inventory_item_id: newSoldItem.id }]);
                if (collError) { 
                    Alert.alert("Error", "Failed to bind sold item to the current collection."); 
                    setLoading(false); 
                    return; 
                }
            }
        } else {
            // B. FULL SELL
            const { error: updateError } = await supabase.from('inventory_items').update(updates).eq('id', sellingItem.id).eq('owner_id', userId);
            if (updateError) { 
                Alert.alert("Error", "Failed to mark item as sold."); 
                setLoading(false); 
                return; 
            }
            
            const { error: wipeError } = await supabase.from('collection_items').delete().eq('inventory_item_id', sellingItem.id);
            if (wipeError) { 
                Alert.alert("Error", "Failed to wipe active collections context."); 
                setLoading(false); 
                return; 
            }
            
            if (selectedCollectionId) {
                const { error: collError } = await supabase.from('collection_items').insert([{ collection_id: selectedCollectionId, inventory_item_id: sellingItem.id }]);
                if (collError) { 
                    Alert.alert("Error", "Failed to map full sold item to current collection."); 
                    setLoading(false); 
                    return; 
                }
            }
        }

        setSoldModalVisible(false);
        setSellingItem(null);

        fetchCollections();
        fetchInventory(userId);
    };

    // --- COLLECTION CRUD ---
    const handleSaveCollection = async () => {
        if (!collectionName.trim()) {
            Alert.alert('Validation Error', 'Collection name is required.');
            return;
        }

        setSavingCollection(true);

        const slug = collectionName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        const collectionData = {
            owner_id: userId,
            name: collectionName.trim(),
            description: collectionDescription.trim() || null,
            visibility: collectionVisibility,
            slug: slug || 'collection',
        };

        let saveError: { message: string } | null = null;
        if (editingCollection) {
            const { error } = await supabase
                .from('collections')
                .update(collectionData)
                .eq('id', editingCollection.id);
            saveError = error;
        } else {
            const { data, error } = await supabase
                .from('collections')
                .insert([collectionData])
                .select()
                .single();
            saveError = error;
            if (!error && data) {
                setSelectedCollectionId(data.id);
                AsyncStorage.setItem('inventory_selected_collection_id', data.id);
            }
        }

        setSavingCollection(false);
        if (saveError) {
            // Keep the form open so the user doesn't lose their input.
            Alert.alert('Error', saveError.message);
            return;
        }
        setCollectionFormVisible(false);
        fetchCollections();
    };

    const promptDeleteCollection = async (collection: Collection) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_collection_delete_summary', { p_collection_id: collection.id });
        setLoading(false);

        if (error) {
            Alert.alert("Error", "Could not load collection details.");
            return;
        }

        const countData = Array.isArray(data) ? data[0] : (data || {});
        const totalItems = countData.total_items ?? 0;
        const exclusiveCount = countData.exclusive_items ?? 0;
        const sharedCount = Math.max(totalItems - exclusiveCount, 0);
        
        let message = `Are you sure you want to delete "${collection.name}"?`;
        
        if (totalItems > 0) {
            message = `This collection contains ${totalItems} total items.\n\n` + 
                      `${exclusiveCount} items exist ONLY in this collection. ` +
                      `${sharedCount} items are shared with other collections.`;
        }

        const options = [
            { text: "Cancel", style: "cancel" as const },
            {
                text: "Delete Collection Only",
                style: "default" as const,
                onPress: () => performDeleteCollection(collection.id, false)
            },
            {
                text: "Delete Collection and Remove Items",
                style: "destructive" as const,
                onPress: () => performDeleteCollection(collection.id, true)
            }
        ];

        Alert.alert("Delete Collection", message, options);
    };

    const performDeleteCollection = async (collectionId: string, deleteItems: boolean) => {
        setLoading(true);
        
        if (deleteItems) {
            // Find exclusive items client-side using our pre-loaded map map
            const exclusiveItemIds: string[] = [];
            itemCollectionsMap.forEach((collectionsSet, itemId) => {
                if (collectionsSet.has(collectionId) && collectionsSet.size === 1) {
                    exclusiveItemIds.push(itemId);
                }
            });

            if (exclusiveItemIds.length > 0) {
                // Soft delete the exclusive items
                await supabase.from('inventory_items')
                    .update({ deleted_at: new Date().toISOString() })
                    .in('id', exclusiveItemIds);
            }
        }
        
        // Delete the collection (cascade should handle collection_items)
        const { error } = await supabase.from('collections').delete().eq('id', collectionId);

        if (error) {
            Alert.alert("Error", "Failed to delete collection.");
            setLoading(false);
        } else {
            setCollectionFormVisible(false);
            if (selectedCollectionId === collectionId) {
                setSelectedCollectionId(null);
                AsyncStorage.removeItem('inventory_selected_collection_id');
            }
            fetchCollections();
            if (userId && deleteItems) fetchInventory(userId); // refresh UI for deleted items
            else setLoading(false);
        }
    };

    const openAddToCollectionModal = (item: InventoryItem) => {
        setItemToAddToCollection(item);
        const existingIds = Array.from(itemCollectionsMap.get(item.id) || []);
        setSelectedCollectionIdsForAdd(existingIds);
        setAddToCollectionModalVisible(true);
    };

    const handleSaveItemToCollections = async () => {
        if (!itemToAddToCollection) return;
        setAddingToCollections(true);

        const itemId = itemToAddToCollection.id;
        const previousIds = Array.from(itemCollectionsMap.get(itemId) || []);
        const newIds = selectedCollectionIdsForAdd;

        const toAdd = newIds.filter(id => !previousIds.includes(id));
        const toRemove = previousIds.filter(id => !newIds.includes(id));

        if (toAdd.length > 0) {
            const inserts = toAdd.map(collectionId => ({
                collection_id: collectionId,
                inventory_item_id: itemId,
            }));
            await supabase.from('collection_items').insert(inserts);
        }

        if (toRemove.length > 0) {
            await supabase.from('collection_items')
                .delete()
                .eq('inventory_item_id', itemId)
                .in('collection_id', toRemove);
        }

        setAddingToCollections(false);
        setAddToCollectionModalVisible(false);
        setItemToAddToCollection(null);
        fetchCollections(); // reloads map
    };

    const performRemoveFromCollection = async (item: InventoryItem) => {
        if (!selectedCollectionId) return;
        setLoading(true);
        const { error } = await supabase.from('collection_items')
            .delete()
            .eq('inventory_item_id', item.id)
            .eq('collection_id', selectedCollectionId);
            
        if (error) {
            Alert.alert("Error", "Failed to remove item from collection.");
        }
        fetchCollections(); // reloads map
        setLoading(false);
    };

    const openActionMenu = (item: InventoryItem) => {
        const statuses = ['FOR_SALE', 'PENDING', 'SOLD', 'PERSONAL'];
        const availableStatuses = statuses.filter(s => s !== item.status);

        const formatStatus = (s: string) => {
            if (s === 'FOR_SALE') return 'Mark For Sale';
            return `Mark ${s.charAt(0) + s.slice(1).toLowerCase()}`;
        };

        const statusOptions = availableStatuses.map(s => formatStatus(s));
        
        const contextualRemoveOption = selectedCollectionId ? ['Remove from Collection'] : [];

        if (Platform.OS === 'ios') {
            const options = ['Cancel', 'Edit', 'Open in TCGplayer', 'Add to Collection', ...contextualRemoveOption, ...statusOptions, 'Delete'];
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: options.length - 1,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) return;
                    const selectedOption = options[buttonIndex];

                    if (selectedOption === 'Edit') {
                        openEditModal(item);
                    } else if (selectedOption === 'Open in TCGplayer') {
                        handleOpenTcgPlayer(item);
                    } else if (selectedOption === 'Add to Collection') {
                        openAddToCollectionModal(item);
                    } else if (selectedOption === 'Remove from Collection') {
                        performRemoveFromCollection(item);
                    } else if (selectedOption === 'Delete') {
                        confirmDelete(item);
                    } else if (selectedOption.startsWith('Mark ')) {
                        const matchedStatus = availableStatuses.find(s => formatStatus(s) === selectedOption);
                        if (matchedStatus) {
                            if (matchedStatus === 'SOLD') {
                                setSellingItem(item);
                                setQuickSoldPrice(item.listing_price ? item.listing_price.toString() : '');
                                setQuickCostBasis(item.cost_basis ? item.cost_basis.toString() : '');
                                setQuickSellQuantity('1');
                                setSoldModalVisible(true);
                            } else {
                                setItemStatus(item, matchedStatus);
                            }
                        }
                    }
                }
            );
        } else {
            const alertOptions: any[] = [
                { text: "Cancel", style: "cancel" as const },
                { text: "Edit", onPress: () => openEditModal(item) },
                { text: "Open in TCGplayer", onPress: () => handleOpenTcgPlayer(item) },
                { text: "Add to Collection", onPress: () => openAddToCollectionModal(item) },
            ];

            if (selectedCollectionId) {
                alertOptions.push({ text: "Remove from Collection", onPress: () => performRemoveFromCollection(item) });
            }

            alertOptions.push(...availableStatuses.map(s => ({
                text: formatStatus(s),
                onPress: () => {
                    if (s === 'SOLD') {
                        setSellingItem(item);
                        setQuickSoldPrice(item.listing_price ? item.listing_price.toString() : '');
                        setQuickCostBasis(item.cost_basis ? item.cost_basis.toString() : '');
                        setQuickSellQuantity('1');
                        setSoldModalVisible(true);
                    } else {
                        setItemStatus(item, s);
                    }
                }
            })));
            
            alertOptions.push({ text: "Delete", style: "destructive" as const, onPress: () => confirmDelete(item) });

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

        if (newStatus === 'SOLD') {
            const hasStackedItems = items.some(item => selectedItemIds.includes(item.id) && item.quantity > 1);
            if (hasStackedItems) {
                Alert.alert("Cannot Bulk Sell", "One or more selected items have a quantity greater than 1.\n\nPlease sell stacked items individually to specify quantities.");
                return;
            }
        }

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

    const getMembershipLabel = (item: InventoryItem) => {
        if (selectedCollectionId) return null;
        const collectionIds = itemCollectionsMap.get(item.id);
        if (!collectionIds || collectionIds.size === 0) return null;
        
        const names = Array.from(collectionIds)
            .map(id => collections.find(c => c.id === id)?.name)
            .filter(Boolean) as string[];
            
        if (names.length === 0) return null;
        return names.length <= 2 ? `In: ${names.join(' • ')}` : `In: ${names[0]} +${names.length - 1}`;
    };

    const renderItem = ({ item }: { item: InventoryItem }) => {
        const { imageUrl, marketPrice, currency, marketLabel, condition, isJapanese, isSealed, isSold, setNameDisplay, metaLine, priceLabel, displayPrice } = getItemDisplay(item);

        let unrealizedStr = null;
        if (item.cost_basis !== null && item.status !== 'SOLD' && item.listing_price > 0) {
            const profit = (item.listing_price - item.cost_basis) * item.quantity;
            unrealizedStr = `Unrealized: ${profit.toFixed(2)}`;
        }

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
                            {isJapanese && <InventoryChip label="JP" />}
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

                        {(() => {
                            const label = getMembershipLabel(item);
                            if (label) {
                                return (
                                    <Text style={{ color: theme.mutedText, fontSize: 10, marginTop: 2, fontStyle: 'italic' }} numberOfLines={1}>
                                        {label}
                                    </Text>
                                );
                            }
                            return null;
                        })()}

                        {/* 4. CHIPS ROW */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
                            {isSealed ? (
                                <InventoryChip label="SEALED" tone="sealed" />
                            ) : condition ? (
                                <InventoryChip label={condition} />
                            ) : null}
                            {item.quantity > 1 && (
                                <Text style={{ fontSize: 11, color: theme.mutedText, fontWeight: 'bold' }}>×{item.quantity}</Text>
                            )}
                            {item.status !== 'FOR_SALE' && (
                                <InventoryChip label={item.status} tone={isSold ? 'sold' : 'neutral'} />
                            )}
                        </View>

                        {unrealizedStr && (
                            <Text style={{ fontSize: 10, color: theme.success, marginTop: 2, fontWeight: '500' }}>
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
                                hitSlop={HitSlop}
                                accessibilityRole="link"
                                accessibilityLabel="Open on TCGplayer"
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleOpenTcgPlayer(item);
                                }}
                                disabled={openingId === item.catalog_product_id && !!item.catalog_product_id}
                            >
                                <Ionicons name="open-outline" size={16} color={theme.mutedText} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: 8, padding: 2 }} hitSlop={HitSlop} accessibilityRole="button" accessibilityLabel="Item actions" onPress={(e) => {
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
                                    {formatUsd(convertToUsd(marketPrice, currency))}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: isSold ? theme.success : theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>
                                    {priceLabel}
                                </Text>
                                <Text style={{ color: isSold ? theme.success : theme.primary, fontSize: 14, fontWeight: 'bold' }}>
                                    {formatUsd(displayPrice)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }: { item: InventoryItem }) => {
        const { imageUrl, marketPrice, currency, marketLabel, condition, isJapanese, isSealed, isSold, setNameDisplay, setNumber, metaLine, priceLabel, displayPrice } = getItemDisplay(item);

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
                    hitSlop={HitSlop}
                    accessibilityRole="button"
                    accessibilityLabel="Item actions"
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
                        {isJapanese && (
                            <View style={{ marginLeft: 4 }}>
                                <InventoryChip label="JP" size="sm" />
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

                    {(() => {
                        const label = getMembershipLabel(item);
                        if (label) {
                            return (
                                <Text style={{ color: theme.mutedText, fontSize: 9, marginBottom: 2, fontStyle: 'italic' }} numberOfLines={1}>
                                    {label}
                                </Text>
                            );
                        }
                        return null;
                    })()}

                    {/* Condition / Grade / Quantity Line */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                        {isSealed ? (
                            <InventoryChip label="SEALED" tone="sealed" size="sm" />
                        ) : condition ? (
                            <InventoryChip label={condition} size="sm" />
                        ) : null}
                        {item.quantity > 1 && <InventoryChip label={`x${item.quantity}`} size="sm" />}
                        {item.status !== 'FOR_SALE' && (
                            <InventoryChip label={item.status} tone={isSold ? 'sold' : 'neutral'} size="sm" />
                        )}
                    </View>

                    {/* Price Line (Stacked) */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                        <View style={{ alignItems: 'flex-start', flexShrink: 1, marginRight: 4 }}>
                            <Text style={{ fontSize: 9, color: theme.mutedText, fontWeight: 'bold', marginBottom: 1 }}>{marketLabel}</Text>
                            <Text style={{ color: theme.mutedText, fontSize: 11 }} numberOfLines={1} adjustsFontSizeToFit>
                                {formatUsd(convertToUsd(marketPrice, currency))}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                            <Text style={{ fontSize: 9, color: isSold ? theme.success : theme.mutedText, fontWeight: 'bold', marginBottom: 1 }}>
                                {priceLabel}
                            </Text>
                            <Text style={{ color: isSold ? theme.success : theme.primary, fontSize: 13, fontWeight: 'bold' }} numberOfLines={1} adjustsFontSizeToFit>
                                {formatUsd(displayPrice)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderBinderItem = ({ item }: { item: InventoryItem }) => {
        const { imageUrl, marketPrice, currency, condition, isSealed, isSold, priceLabel, displayPrice } = getItemDisplay(item);

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
                    hitSlop={HitSlop}
                    accessibilityRole="button"
                    accessibilityLabel="Item actions"
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
                        {isSealed ? (
                            <InventoryChip label="SEALED" tone="sealed" size="xs" onImage />
                        ) : condition ? (
                            <InventoryChip label={condition} size="xs" onImage />
                        ) : null}
                        {item.quantity > 1 && <InventoryChip label={`x${item.quantity}`} size="xs" onImage />}
                        {item.status !== 'FOR_SALE' && (
                            <InventoryChip label={item.status} tone={isSold ? 'sold' : 'neutral'} size="xs" onImage />
                        )}
                    </View>

                    {(() => {
                        const label = getMembershipLabel(item);
                        if (label) {
                            return (
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, marginBottom: 2, fontStyle: 'italic' }} numberOfLines={1}>
                                    {label}
                                </Text>
                            );
                        }
                        return null;
                    })()}

                    {/* Stacked Pricing Block */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9 }} numberOfLines={1} adjustsFontSizeToFit>
                            {formatUsd(convertToUsd(marketPrice, currency))}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: isSold ? theme.success : 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: 'bold', marginBottom: 1 }} numberOfLines={1}>
                                {priceLabel}
                            </Text>
                            <Text style={{ color: isSold ? theme.success : '#fff', fontSize: 10, fontWeight: 'bold' }} numberOfLines={1} adjustsFontSizeToFit>
                                {formatUsd(displayPrice)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const sortedItems = useMemo(() => {
        let filtered = items;
        if (filter === 'ACTIVE') {
            filtered = filtered.filter(i => i.status !== 'SOLD');
        } else if (filter === 'SOLD') {
            filtered = filtered.filter(i => i.status === 'SOLD');
        }

        if (selectedCollectionId) {
            filtered = filtered.filter(i => itemCollectionsMap.get(i.id)?.has(selectedCollectionId));
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

        // Items arrive newest-first from the DB, so RECENT keeps order and OLDEST reverses it.
        if (sortBy === 'OLDEST') return [...filtered].reverse();

        return [...filtered].sort((a, b) => {
            if (sortBy === 'PRICE_HIGH_LOW' || sortBy === 'PRICE_LOW_HIGH') {
                const getPrice = (item: InventoryItem) => item.listing_price || 0;
                return sortBy === 'PRICE_HIGH_LOW' ? getPrice(b) - getPrice(a) : getPrice(a) - getPrice(b);
            }
            if (sortBy === 'NAME_AZ') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
    }, [items, filter, sortBy, searchQuery, activeFilters, selectedCollectionId, itemCollectionsMap]);

    const summaryStats = useMemo(() => {
        let listedValue = 0;
        let marketValue = 0;
        let soldValue = 0;
        let profitValue = 0;

        for (const item of sortedItems) {
            if (item.listing_price) {
                listedValue += item.listing_price * item.quantity;
            }

            const { marketPrice, currency } = getItemDisplay(item);

            if (typeof marketPrice === 'number') {
                marketValue += (convertToUsd(marketPrice, currency) ?? 0) * item.quantity;
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
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        <TouchableOpacity style={{ padding: 4 }} onPress={handleAddItemPress} hitSlop={HitSlop} accessibilityRole="button" accessibilityLabel="Add item">
                            <Ionicons name="add" size={28} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Nav Row for Collection Chooser */}
            {!isSelectMode && (
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}
                    onPress={() => setCollectionModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Choose collection"
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <Ionicons name={selectedCollectionId ? "folder" : "layers"} size={20} color={theme.primary} style={{ marginRight: 10 }} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, flexShrink: 1 }} numberOfLines={1}>
                            {selectedCollectionId && collections.find(c => c.id === selectedCollectionId)
                                ? collections.find(c => c.id === selectedCollectionId)!.name 
                                : 'All Inventory'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={theme.mutedText} />
                </TouchableOpacity>
            )}

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {(['ACTIVE', 'SOLD'] as const).map(f => (
                        <FilterPill
                            key={f}
                            label={f === 'ACTIVE' ? 'Active' : 'Sold'}
                            active={filter === f}
                            onPress={() => setFilter(f)}
                        />
                    ))}
                </ScrollView>
            </View>

            <View style={styles.searchRowContainer}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search inventory..."
                    onClear={() => setSearchQuery('')}
                    style={{ flex: 1, marginRight: 8 }}
                />
                <TouchableOpacity
                    style={[
                        styles.actionBtn,
                        (activeFilters.isSealed || activeFilters.isCard || activeFilters.isEnglish || activeFilters.isJapanese || sortBy !== 'RECENT')
                        && { backgroundColor: theme.primary + '20' }
                    ]}
                    onPress={() => setSortModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Sort and filter"
                >
                    <Ionicons
                        name="filter"
                        size={20}
                        color={(activeFilters.isSealed || activeFilters.isCard || activeFilters.isEnglish || activeFilters.isJapanese || sortBy !== 'RECENT') ? theme.primary : theme.text}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { marginLeft: 0 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`View mode: ${viewMode}`}
                    onPress={() => {
                        const next = viewMode === 'list' ? 'grid' : viewMode === 'grid' ? 'binder' : 'list';
                        setViewMode(next);
                        AsyncStorage.setItem('inventory_view_mode', next);
                    }}
                >
                    <Ionicons name={viewMode === 'list' ? "grid" : viewMode === 'grid' ? "apps" : "list"} size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            {!selectedCollectionId && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
                    {filter === 'ACTIVE' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>LIST VALUE</Text>
                                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>{formatUsd(summaryStats.listedValue)}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>MARKET VALUE</Text>
                                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>{formatUsd(summaryStats.marketValue)}</Text>
                            </View>
                        </View>
                    )}
                    {filter === 'SOLD' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>SOLD VALUE</Text>
                                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 1 }}>{formatUsd(summaryStats.soldValue)}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: theme.mutedText, fontWeight: '500', letterSpacing: 0.4 }}>PROFIT</Text>
                                <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 1, color: summaryStats.profitValue < 0 ? theme.destructive : (summaryStats.profitValue > 0 ? theme.success : theme.text) }}>
                                    {summaryStats.profitValue < 0 ? '-' : ''}{formatUsd(Math.abs(summaryStats.profitValue))}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {loading ? (
                <ActivityIndicator style={styles.mt20} />
            ) : items.length === 0 ? (
                <EmptyState
                    icon="cube-outline"
                    title="Your Inventory is Empty"
                    message="Start adding items to your inventory to track your collection's value."
                    actionLabel="Add First Item"
                    onAction={handleAddItemPress}
                    style={{ marginTop: 60 }}
                />
            ) : sortedItems.length === 0 ? (
                (searchQuery.length > 0 || activeFilters.isSealed || activeFilters.isCard || activeFilters.isEnglish || activeFilters.isJapanese) ? (
                    <EmptyState
                        icon="search-outline"
                        title="No Results Found"
                        message="No items match your current search and filters."
                        actionLabel="Clear Search & Filters"
                        onAction={() => {
                            setSearchQuery('');
                            setActiveFilters({ isCard: false, isSealed: false, isEnglish: false, isJapanese: false });
                        }}
                        style={{ marginTop: 60 }}
                    />
                ) : (
                    <EmptyState
                        icon="folder-open-outline"
                        title={selectedCollectionId ? (filter === 'SOLD' ? "No Sold Items" : "Collection is Empty") : (filter === 'ACTIVE' ? 'No Active Items' : 'No Sold Items')}
                        message={selectedCollectionId ? (filter === 'SOLD' ? "You haven't sold any items from this collection yet." : "You haven't added any items to this collection yet.") : "You don't have any items in this status tab yet."}
                        actionLabel={selectedCollectionId ? "Add to Collection" : undefined}
                        onAction={selectedCollectionId ? handleAddItemPress : undefined}
                        style={{ marginTop: 60 }}
                    />
                )
            ) : (
                <FlatList
                    key={viewMode}
                    data={sortedItems}
                    keyExtractor={(item) => item.id}
                    renderItem={viewMode === 'binder' ? renderBinderItem : viewMode === 'grid' ? renderGridItem : renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        viewMode === 'binder' && { paddingHorizontal: 4 },
                        viewMode === 'grid' && { paddingHorizontal: 8 },
                        isSelectMode && { paddingBottom: 80 },
                    ]}
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
                            style={[styles.bulkActionBtn, { backgroundColor: theme.destructive, opacity: selectedItemIds.length ? 1 : 0.5 }]}
                            disabled={selectedItemIds.length === 0}
                            onPress={promptBulkDelete}
                        >
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <SortFilterSheet
                visible={sortModalVisible}
                onClose={() => setSortModalVisible(false)}
                sortBy={sortBy}
                onChangeSort={(id) => {
                    setSortBy(id);
                    AsyncStorage.setItem('inventory_sort_mode', id);
                }}
                filters={activeFilters}
                onToggleFilter={(key) => setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                onReset={() => {
                    setSortBy('RECENT');
                    AsyncStorage.setItem('inventory_sort_mode', 'RECENT');
                    setActiveFilters({ isCard: false, isSealed: false, isEnglish: false, isJapanese: false });
                }}
            />

            <CollectionPickerSheet
                visible={collectionModalVisible}
                onClose={() => setCollectionModalVisible(false)}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onSelect={(id) => {
                    setSelectedCollectionId(id);
                    if (id) AsyncStorage.setItem('inventory_selected_collection_id', id);
                    else AsyncStorage.removeItem('inventory_selected_collection_id');
                    setCollectionModalVisible(false);
                }}
                onEdit={(c) => {
                    setEditingCollection(c);
                    setCollectionName(c.name);
                    setCollectionDescription(c.description || '');
                    setCollectionVisibility(c.visibility || 'private');
                    setCollectionModalVisible(false);
                    setCollectionFormVisible(true);
                }}
                onDelete={(c) => {
                    setCollectionModalVisible(false);
                    promptDeleteCollection(c);
                }}
                onCreate={() => {
                    setEditingCollection(null);
                    setCollectionName('');
                    setCollectionDescription('');
                    setCollectionVisibility('private');
                    setCollectionModalVisible(false);
                    setCollectionFormVisible(true);
                }}
            />

            <CollectionFormSheet
                visible={collectionFormVisible}
                onClose={() => setCollectionFormVisible(false)}
                isEditing={!!editingCollection}
                name={collectionName}
                onChangeName={setCollectionName}
                description={collectionDescription}
                onChangeDescription={setCollectionDescription}
                visibility={collectionVisibility}
                onChangeVisibility={setCollectionVisibility}
                saving={savingCollection}
                onSave={handleSaveCollection}
                onDelete={() => editingCollection && promptDeleteCollection(editingCollection)}
            />

            <AddToCollectionSheet
                visible={addToCollectionModalVisible}
                onClose={() => setAddToCollectionModalVisible(false)}
                collections={collections}
                selectedIds={selectedCollectionIdsForAdd}
                onToggle={(id) => setSelectedCollectionIdsForAdd(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                )}
                saving={addingToCollections}
                onSave={handleSaveItemToCollections}
            />

            <ItemFormSheet
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    router.setParams({ selectedCatalogProduct: undefined });
                }}
                editingStatus={editingItem?.status ?? null}
                targetCollectionName={selectedCollectionId ? (collections.find(c => c.id === selectedCollectionId)?.name ?? null) : null}
                imageUrl={imageUrl}
                setLine={setName ? `${setName} • ${formatSetNumber(externalId, collectorNumber, setName, setPrintedTotal, setTotal)}` : null}
                titleLocked={!!catalogProductId}
                market={{ price: marketPrice, currency, source }}
                title={title}
                onChangeTitle={setTitle}
                condition={condition}
                onChangeCondition={setCondition}
                isGraded={isGraded}
                onChangeGraded={(val) => {
                    setIsGraded(val);
                    if (val) {
                        setCondition(null);
                    } else {
                        setGradingCompany(null);
                        setGrade(null);
                    }
                }}
                gradingCompany={gradingCompany}
                onChangeGradingCompany={setGradingCompany}
                grade={grade}
                onChangeGrade={setGrade}
                quantity={quantity}
                onChangeQuantity={setQuantity}
                listingPrice={listingPrice}
                onChangeListingPrice={setListingPrice}
                costBasis={costBasis}
                onChangeCostBasis={setCostBasis}
                status={status}
                onChangeStatus={setStatus}
                soldPrice={soldPrice}
                onChangeSoldPrice={setSoldPrice}
                saving={saving}
                onSave={handleSaveItem}
                onDelete={() => editingItem && confirmDelete(editingItem)}
            />

            <QuickSellSheet
                visible={soldModalVisible}
                onClose={() => setSoldModalVisible(false)}
                maxQuantity={sellingItem?.quantity ?? 1}
                quantity={quickSellQuantity}
                onChangeQuantity={setQuickSellQuantity}
                soldPrice={quickSoldPrice}
                onChangeSoldPrice={setQuickSoldPrice}
                costBasis={quickCostBasis}
                onChangeCostBasis={setQuickCostBasis}
                onSave={handleQuickSellSave}
            />
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
        paddingBottom: 12,
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
    mt20: {
        marginTop: 20,
    },
    filterContainer: {
        paddingVertical: 12,
    },
    filterScroll: {
        paddingHorizontal: 16,
    },
    searchRowContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        gap: 12,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bulkActionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
    },
    bulkActionBtn: {
        minHeight: 40,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 20,
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
