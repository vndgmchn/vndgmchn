import { useColorScheme } from '@/hooks/use-color-scheme';
import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatUsd } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { uploadProfileAvatar, uploadProfileBanner } from '@/lib/storage';
import { normalizeHandle } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STOREFRONT_THEMES, getThemePreset } from '@/constants/storefrontThemes';

type Profile = {
  handle: string;
  display_name: string;
  is_public: boolean;
  bio: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  theme_preset?: string | null;
};

type InventoryMetrics = {
  totalInventoryValue: number;
  totalSoldRevenue: number;
  realizedProfit: number;
  counts: {
    FOR_SALE: number;
    PENDING: number;
    SOLD: number;
    RESERVED: number;
    PERSONAL: number;
  };
};

export default function HomeScreen() {
  const theme = useThemeColors();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalInventoryValue: 0,
    totalSoldRevenue: 0,
    realizedProfit: 0,
    counts: { FOR_SALE: 0, PENDING: 0, SOLD: 0, RESERVED: 0, PERSONAL: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit state — populated when the modal opens
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [editBannerUri, setEditBannerUri] = useState<string | null>(null);
  const [editThemePreset, setEditThemePreset] = useState('default');
  const [saving, setSaving] = useState(false);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    // Fetch Profile — try with image columns first (requires migration to be applied).
    // Fall back to base columns if the query errors (e.g. migration not yet pushed to remote).
    let profileData: Profile | null = null;
    const { data: fullData, error: fullError } = await supabase
      .from('profiles')
      .select('handle, display_name, is_public, bio, avatar_url, banner_url, theme_preset')
      .eq('id', user.id)
      .single();

    if (fullError) {
      // Columns may not exist yet — fall back to base select so the card still renders
      const { data: baseData } = await supabase
        .from('profiles')
        .select('handle, display_name, is_public, bio, avatar_url, banner_url')
        .eq('id', user.id)
        .single();
      if (baseData) profileData = { ...baseData, theme_preset: 'default' };
    } else {
      profileData = fullData;
    }

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch Inventory to aggregate metrics
    const { data: inventoryData } = await supabase
      .from('inventory_items')
      .select('quantity, listing_price, status, sold_price, cost_basis')
      .eq('owner_id', user.id);

    if (inventoryData) {
      let totalValue = 0;
      let totalRevenue = 0;
      let totalProfit = 0;
      const counts = { FOR_SALE: 0, PENDING: 0, SOLD: 0, RESERVED: 0, PERSONAL: 0 };

      inventoryData.forEach((item) => {
        // Increment Status Counts
        const s = item.status as keyof typeof counts;
        if (counts[s] !== undefined) {
          counts[s] += item.quantity;
        }

        // Aggregate Financials
        if (item.status === 'SOLD') {
          const soldPrice = item.sold_price || 0;
          const costBasis = item.cost_basis || 0;
          totalRevenue += soldPrice * item.quantity;
          totalProfit += (soldPrice - costBasis) * item.quantity;
        } else {
          // Assuming everything not SOLD is still "Inventory"
          totalValue += (item.listing_price || 0) * item.quantity;
        }
      });

      setMetrics({
        totalInventoryValue: totalValue,
        totalSoldRevenue: totalRevenue,
        realizedProfit: totalProfit,
        counts
      });
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const toggleTheme = async (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    Appearance.setColorScheme(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  const togglePublic = async (value: boolean) => {
    if (!profile || !userId) return;

    // Optimistically update
    setProfile({ ...profile, is_public: value });

    await supabase
      .from('profiles')
      .update({ is_public: value })
      .eq('id', userId);
  };

  const shareLinks = async () => {
    if (!profile || !userId) return;
    try {
      await Share.share({
        message: `Check out my storefront! https://vndgmchn.com/${normalizeHandle(profile.handle)}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const copyLink = async () => {
    if (!profile) return;
    await Clipboard.setStringAsync(`https://vndgmchn.com/${normalizeHandle(profile.handle)}`);
    Alert.alert('Copied!', 'Storefront link copied to clipboard.');
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditDisplayName(profile.display_name || '');
    setEditBio(profile.bio || '');
    setEditAvatarUri(null);
    setEditBannerUri(null);
    setEditThemePreset(profile.theme_preset || 'default');
    setEditModalVisible(true);
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setEditAvatarUri(result.assets[0].uri);
    }
  };

  const pickBanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setEditBannerUri(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!userId || !profile) return;

    if (editBio.length > 120) {
      Alert.alert('Error', 'Bio cannot exceed 120 characters.');
      return;
    }

    setSaving(true);

    let newAvatarUrl = profile.avatar_url ?? null;
    let newBannerUrl = profile.banner_url ?? null;
    if (editAvatarUri) {
      const url = await uploadProfileAvatar(userId, editAvatarUri);
      if (url) newAvatarUrl = url;
    }
    if (editBannerUri) {
      const url = await uploadProfileBanner(userId, editBannerUri);
      if (url) newBannerUrl = url;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editDisplayName.trim() || null,
        bio: editBio.trim() || null,
        avatar_url: newAvatarUrl,
        banner_url: newBannerUrl,
        theme_preset: editThemePreset,
      })
      .eq('id', userId);

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setProfile({
        ...profile,
        display_name: editDisplayName.trim() || profile.handle,
        bio: editBio.trim() || null,
        avatar_url: newAvatarUrl,
        banner_url: newBannerUrl,
        theme_preset: editThemePreset,
      });
      setEditModalVisible(false);
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {profile && (
        <View style={styles.heroSection}>
          {/* Banner */}
          <View style={[styles.bannerWrapper, { height: 110 + insets.top }]}>
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.85} style={{ width: '100%', height: '100%' }}>
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
            </TouchableOpacity>
          </View>

          {/* Top Utility Row - Absolute Positioned */}
          <View style={[styles.header, { 
            position: 'absolute', 
            top: insets.top + 8, 
            left: 16, 
            right: 16, 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            zIndex: 10,
          }]}>
            <TouchableOpacity 
              style={[styles.utilityBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
              onPress={openEditModal}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.utilityBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {profile && (
        <View style={styles.profileSection}>
          {(() => {
            const preset = getThemePreset(profile.theme_preset);
            const isDefault = preset.id === 'default';
            
            const cardBg = preset.cardBackground || theme.surface;
            const textPrimary = preset.textPrimary || theme.text;
            const textSecondary = preset.textSecondary || theme.mutedText;
            
            // For buttons: use preset values if available, otherwise fall back to system-aware defaults
            const btnSurface = preset.buttonSurface || (isDarkMode ? '#222' : theme.text);
            const btnText = preset.buttonText || '#fff';
            
            // Secondary button surface: use preset surface if available, otherwise semi-transparent or system background
            const secondaryBtnSurface = preset.buttonSurface 
              ? `${preset.buttonSurface}20` // Slightly transparent version of the preset primary button
              : (isDefault ? theme.background : 'rgba(255,255,255,0.1)');

            return (
              <TouchableOpacity 
                style={[styles.identityCard, { backgroundColor: cardBg }]}
                onPress={openEditModal}
                activeOpacity={0.9}
              >
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
                          {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()}
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

                {/* Actions */}
                <View style={{ marginTop: 12 }}>
                  {profile.is_public ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryBtn, { backgroundColor: btnSurface }]} 
                        onPress={() => setQrModalVisible(true)}
                      >
                        <Ionicons name="qr-code-outline" size={16} color={btnText} style={{ marginRight: 6 }} />
                        <Text style={[styles.actionButtonText, { color: btnText }]}>QR Code</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryBtn, { backgroundColor: secondaryBtnSurface }]} 
                        onPress={shareLinks}
                      >
                        <Ionicons name="share-outline" size={20} color={isDefault ? textPrimary : btnSurface} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[styles.linkPreview, { color: textSecondary, backgroundColor: isDefault ? theme.background : 'rgba(0,0,0,0.03)' }]}>
                      Storefront is private
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })()}
        </View>
      )}

      {/* Edit Storefront Modal */}
      <ModalShell
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        type="bottom-sheet"
        useKeyboardAvoiding={true}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editSection}>
            <Text style={[styles.editModalTitle, { color: theme.text, marginBottom: 4 }]}>Edit Storefront</Text>
            <Text style={[styles.editHelperText, { color: theme.mutedText }]}>Update how your storefront appears to buyers.</Text>
          </View>
 
          {/* Live Preview section */}
          {(() => {
            const preset = getThemePreset(editThemePreset);
            const cardBg = preset.cardBackground || theme.surface;
            const textPrimary = preset.textPrimary || theme.text;
            const textSecondary = preset.textSecondary || theme.mutedText;
            const isDefault = preset.id === 'default';

            return (
              <View style={styles.editSection}>
                <Text style={[styles.editLabel, { color: theme.mutedText }]}>Live Preview</Text>
                <View style={[styles.previewContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {/* Mini Banner */}
                  <View style={styles.previewBanner}>
                    {editBannerUri || profile?.banner_url ? (
                      <Image
                        source={{ uri: editBannerUri ?? profile!.banner_url! }}
                        style={styles.previewBannerImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.previewBannerImage, { backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image-outline" size={16} color={theme.mutedText} />
                      </View>
                    )}
                  </View>
                  {/* Mini Identity Card */}
                  <View style={[styles.previewCard, { backgroundColor: cardBg }]}>
                    <View style={styles.previewProfileRow}>
                      <View style={styles.previewAvatarWrapper}>
                        {editAvatarUri || profile?.avatar_url ? (
                          <Image
                            source={{ uri: editAvatarUri ?? profile!.avatar_url! }}
                            style={styles.previewAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.previewAvatar, { 
                            backgroundColor: isDefault ? theme.primary : textPrimary, 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                          }]}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDefault ? '#fff' : cardBg }}>
                              {(editDisplayName || profile?.handle || 'V').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.previewInfo}>
                        <Text style={[styles.previewName, { color: textPrimary }]} numberOfLines={1}>
                          {editDisplayName || (profile ? `@${profile.handle}` : 'Store Name')}
                        </Text>
                        <Text style={[styles.previewHandle, { color: textSecondary }]}>
                          @{profile?.handle || 'handle'}
                        </Text>
                        {editBio ? (
                          <Text style={[styles.previewBio, { color: textPrimary }]} numberOfLines={1}>
                            {editBio}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })()}
 
          {/* Media section */}
          <View style={styles.editSection}>
            <Text style={[styles.editLabel, { color: theme.mutedText }]}>Media Settings</Text>
            
            <TouchableOpacity 
              style={[styles.pickerRow, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 12 }]} 
              onPress={pickBanner}
            >
              <View style={styles.pickerThumbContainer}>
                {editBannerUri || profile?.banner_url ? (
                  <Image source={{ uri: editBannerUri ?? profile!.banner_url! }} style={styles.pickerThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.pickerThumb, { backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={14} color={theme.mutedText} />
                  </View>
                )}
              </View>
              <View style={styles.pickerLabelStack}>
                <Text style={[styles.pickerLabel, { color: theme.text }]}>Store Banner</Text>
                <Text style={[styles.pickerSubtext, { color: theme.mutedText }]}>3:1 horizontal hero image</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.border} />
            </TouchableOpacity>
 
            <TouchableOpacity 
              style={[styles.pickerRow, { backgroundColor: theme.surface, borderColor: theme.border }]} 
              onPress={pickAvatar}
            >
              <View style={styles.pickerThumbContainer}>
                {editAvatarUri || profile?.avatar_url ? (
                  <Image source={{ uri: editAvatarUri ?? profile!.avatar_url! }} style={[styles.pickerThumb, { borderRadius: 20 }]} contentFit="cover" />
                ) : (
                  <View style={[styles.pickerThumb, { borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>
                      {(editDisplayName || profile?.handle || 'V').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.pickerLabelStack}>
                <Text style={[styles.pickerLabel, { color: theme.text }]}>Store Avatar</Text>
                <Text style={[styles.pickerSubtext, { color: theme.mutedText }]}>1:1 circular identity icon</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.border} />
            </TouchableOpacity>
          </View>
 
          {/* Store Details section */}
          <View style={styles.editSection}>
            <Text style={[styles.editLabel, { color: theme.mutedText }]}>Store Identity</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.editSubLabel, { color: theme.mutedText }]}>Public Name</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, borderWidth: 1 }]}
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                placeholder="e.g. Mystic Vendor"
                placeholderTextColor={theme.mutedText}
                maxLength={50}
                returnKeyType="next"
              />
            </View>
 
            <View>
              <Text style={[styles.editSubLabel, { color: theme.mutedText }]}>Short Bio</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, borderWidth: 1 }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell buyers about your store..."
                placeholderTextColor={theme.mutedText}
                multiline
                numberOfLines={3}
                maxLength={120}
              />
              <Text style={[
                styles.charCounter, 
                { color: editBio.length > 100 ? '#f59e0b' : theme.mutedText }
              ]}>
                {editBio.length} / 120
              </Text>
            </View>
          </View>
 
          {/* Theme Selector section */}
          <View style={styles.editSection}>
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.editLabel, { color: theme.mutedText, marginBottom: 4 }]}>Card Theme</Text>
              <Text style={[styles.editHelperText, { color: theme.mutedText }]}>Choose a color palette for your identity card.</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10, paddingRight: 20 }}>
              {STOREFRONT_THEMES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeChip,
                    { 
                      backgroundColor: t.cardBackground || theme.surface, 
                      borderColor: editThemePreset === t.id ? theme.primary : theme.border 
                    }
                  ]}
                  onPress={() => setEditThemePreset(t.id)}
                >
                  <Text style={[styles.themeChipText, { color: t.textPrimary || theme.text }]}>{t.name}</Text>
                  {editThemePreset === t.id && (
                    <View style={styles.themeCheck}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>


          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </ModalShell>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance</Text>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.metricLabel, { color: theme.mutedText }]}>Total Inventory Value</Text>
          <Text style={[styles.metricValue, { color: theme.primary }]}>{formatUsd(metrics.totalInventoryValue)}</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={[styles.metricCardHalf, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricLabel, { color: theme.mutedText }]}>Sold Revenue</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{formatUsd(metrics.totalSoldRevenue)}</Text>
          </View>
          <View style={[styles.metricCardHalf, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricLabel, { color: theme.mutedText }]}>Realized Profit</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{formatUsd(metrics.realizedProfit)}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventory</Text>
      <View style={[styles.countsCard, { backgroundColor: theme.surface }]}>
        {Object.entries(metrics.counts).map(([status, count]) => (
          <View key={status} style={styles.countRow}>
            <Text style={[styles.countLabel, { color: theme.text }]}>{status.replace('_', ' ')}</Text>
            <Text style={[styles.countValue, { color: theme.primary }]}>{count}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
      <View style={[styles.countsCard, { backgroundColor: theme.surface }]}>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Public Storefront</Text>
          <Switch
            value={profile?.is_public ?? false}
            onValueChange={togglePublic}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
        <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Text style={{ color: theme.destructive, fontSize: 16, fontWeight: '500' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />

      {/* QR Code Modal for Permanent Links */}
      <ModalShell
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        type="center"
      >
        <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 }}>
          <Text style={[styles.qrLabel, { color: theme.text, marginBottom: 16 }]}>Your Storefront QR</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={`https://vndgmchn.com/${profile?.handle}`}
              size={200}
              color="#000"
              backgroundColor="#fff"
            />
          </View>
          <Text style={[styles.qrFooter, { color: theme.mutedText, marginTop: 16 }]}>
            vndgmchn.com/{profile?.handle}
          </Text>
        </View>
      </ModalShell>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
  },
  header: {
    marginBottom: 0,
  },
  utilityBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  profileSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  bannerWrapper: {
    width: '100%',
    marginHorizontal: 0,
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
  identityCard: {
    marginTop: -44,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginBottom: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 16,
  },
  qrLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  qrFooter: {
    fontSize: 14,
  },
  linkPreview: {
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  actionButton: {
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
  },
  secondaryBtn: {
    width: 44,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  metricsGrid: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  metricCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCardHalf: {
    width: '48.5%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countsCard: {
    padding: 0,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  countValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  editSection: {
    marginTop: 20,
  },
  imagePicker: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 100,
  },
  imagePickerBanner: {
    width: '100%',
    height: 100,
  },
  imagePickerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerHint: {
    fontSize: 13,
  },
  avatarPickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
  },
  avatarPickerImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  editInput: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  editTextArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  charCounter: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
  },
  editHeader: {
    marginBottom: 20,
    marginTop: 4,
  },
  editHelperText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  editSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
  },
  previewBanner: {
    height: 64,
    width: '100%',
  },
  previewBannerImage: {
    width: '100%',
    height: '100%',
  },
  previewCard: {
    marginTop: -24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  previewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatarWrapper: {
    marginRight: 10,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  previewHandle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  previewBio: {
    fontSize: 10,
    lineHeight: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerThumbContainer: {
    marginRight: 14,
  },
  pickerThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  pickerLabelStack: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
    position: 'relative',
  },
  themeChipText: {
    fontWeight: '700',
    fontSize: 13,
  },
  themeCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 8,
  }
});
