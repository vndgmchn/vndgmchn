import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchBar from '@/components/ui/SearchBar';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { getThemePreset } from '@/constants/storefrontThemes';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type StorefrontResult = {
    user_id: string;
    handle: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    is_public: boolean;
    theme_preset: string | null;
};

export default function MarketplaceScreen() {
    const theme = useThemeColors();
    const [searchHandle, setSearchHandle] = useState('');

    // ── Recent Searches ───────────────────────────────────────────────────────
    const RECENT_KEY = 'marketplace_recent_searches';
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        AsyncStorage.getItem(RECENT_KEY).then(raw => {
            if (raw) {
                try { setRecentSearches(JSON.parse(raw)); } catch { /* ignore malformed */ }
            }
        });
    }, []);

    const saveRecentSearch = async (handle: string) => {
        const normalized = handle.trim().replace(/^@/, '').toLowerCase();
        if (!normalized) return;
        const updated = [normalized, ...recentSearches.filter(h => h !== normalized)].slice(0, 10);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    };

    const clearRecentSearches = async () => {
        setRecentSearches([]);
        await AsyncStorage.removeItem(RECENT_KEY);
    };

    // ── Storefront Search (debounced) ─────────────────────────────────────────
    const [searchResults, setSearchResults] = useState<StorefrontResult[] | null>(null);
    const [searching, setSearching] = useState(false);

    const runStorefrontSearch = async (query: string) => {
        setSearching(true);
        const { data, error } = await supabase.rpc('search_storefronts', { query });
        setSearching(false);
        if (!error && data) {
            setSearchResults(data as StorefrontResult[]);
        } else {
            setSearchResults([]);
        }
    };

    useEffect(() => {
        const normalized = normalizeHandle(searchHandle);
        if (!normalized) {
            setSearchResults(null);
            return;
        }
        const timer = setTimeout(() => runStorefrontSearch(normalized), 300);
        return () => clearTimeout(timer);
    }, [searchHandle]);

    // ── Search button / Enter: fire immediately, no navigation ───────────────
    const handleSearch = () => {
        const normalized = normalizeHandle(searchHandle);
        if (normalized) runStorefrontSearch(normalized);
    };

    // ── Navigation: result tap or recent search tap only ─────────────────────
    const navigateToStorefront = async (handle: string, metadata?: Partial<StorefrontResult>) => {
        const normalized = normalizeHandle(handle);
        if (!normalized) return;
        await saveRecentSearch(normalized);
        router.push({ 
            pathname: '/storefront/[handle]', 
            params: { 
                handle: normalized,
                display_name: metadata?.display_name || '',
                bio: metadata?.bio || '',
                avatar_url: metadata?.avatar_url || '',
                theme_preset: metadata?.theme_preset || ''
            } 
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Marketplace</Text>
            </View>

            {/* Search Input */}
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
                        disabled={!searchHandle.trim()}
                    >
                        <Text style={styles.buttonText}>Search</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* IDLE state: no query typed */}
            {!searching && searchResults === null && (
                <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={[styles.discoverHeading, { color: theme.text }]}>Discover Storefronts</Text>
                    <Text style={[styles.discoverSubtext, { color: theme.mutedText }]}>
                        Search any VNDG MCHN by handle to browse their listings.
                    </Text>

                    {recentSearches.length > 0 && (
                        <View style={{ marginTop: 28 }}>
                            <View style={styles.recentLabelRow}>
                                <Text style={[styles.recentLabel, { color: theme.mutedText }]}>Recent Searches</Text>
                                <TouchableOpacity onPress={clearRecentSearches} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Text style={[styles.clearAllText, { color: theme.mutedText }]}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                            {recentSearches.map(handle => (
                                <TouchableOpacity
                                    key={handle}
                                    style={[styles.recentRow, { borderBottomColor: theme.border }]}
                                    onPress={() => navigateToStorefront(handle)}
                                    activeOpacity={0.6}
                                >
                                    <Ionicons name="time-outline" size={16} color={theme.mutedText} style={{ marginRight: 10 }} />
                                    <Text style={[styles.recentHandle, { color: theme.text }]}>@{handle}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* RESULTS state: debounced storefront search */}
            {(searching || searchResults !== null) && (
                <View style={{ flex: 1 }}>
                    {searching && <ActivityIndicator style={{ marginTop: 24 }} />}
                    {!searching && searchResults !== null && searchResults.length === 0 && (
                        <View style={{ paddingHorizontal: 20, paddingTop: 32, alignItems: 'center' }}>
                            <Text style={[styles.discoverSubtext, { color: theme.mutedText, textAlign: 'center' }]}>
                                No storefronts found.
                            </Text>
                        </View>
                    )}
                    {!searching && searchResults !== null && searchResults.length > 0 && (
                        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                            {searchResults.map(result => {
                                const preset = getThemePreset(result.theme_preset);
                                const isDefault = preset.id === 'default';
                                
                                const cardBg = (isDefault ? 'transparent' : preset.cardBackground) as string;
                                const textPrimary = (isDefault ? theme.text : preset.textPrimary) as string;
                                const textSecondary = (isDefault ? theme.mutedText : preset.textSecondary) as string;

                                return (
                                    <TouchableOpacity
                                        key={result.user_id}
                                        style={[
                                            styles.resultRow, 
                                            { 
                                                borderBottomColor: isDefault ? theme.border : 'transparent',
                                                backgroundColor: cardBg,
                                                paddingHorizontal: isDefault ? 0 : 12,
                                                marginBottom: isDefault ? 0 : 8,
                                                borderRadius: isDefault ? 0 : 12,
                                            }
                                        ]}
                                        onPress={() => navigateToStorefront(result.handle, result)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.resultAvatar, 
                                            { backgroundColor: isDefault ? theme.primary : textPrimary }
                                        ]}>
                                            {result.avatar_url ? (
                                                <Image
                                                    source={{ uri: result.avatar_url }}
                                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                                />
                                            ) : (
                                                <Text style={[styles.resultAvatarText, { color: (isDefault ? '#fff' : cardBg) as string }]}>
                                                    {(result.display_name || result.handle).charAt(0).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.resultDisplayName, { color: textPrimary as string }]} numberOfLines={1}>
                                                {result.display_name || `@${result.handle}`}
                                            </Text>
                                            <Text style={[styles.resultHandle, { color: textSecondary as string }]} numberOfLines={1}>
                                                @{result.handle}
                                            </Text>
                                            {result.bio ? (
                                                <Text style={[styles.resultBio, { color: textSecondary as string }]} numberOfLines={1}>
                                                    {result.bio}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={textSecondary as string} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            )}
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
    discoverHeading: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.4,
        marginBottom: 8,
    },
    discoverSubtext: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    recentLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    recentLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '600',
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    recentHandle: {
        fontSize: 15,
        fontWeight: '500',
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    resultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    resultAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    resultDisplayName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 1,
    },
    resultHandle: {
        fontSize: 12,
        fontWeight: '500',
    },
    resultBio: {
        fontSize: 12,
        marginTop: 2,
    },
});
