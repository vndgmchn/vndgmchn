import { useColorScheme } from '@/hooks/use-color-scheme';
import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatUsd } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Profile = {
  handle: string;
  display_name: string;
  is_public: boolean;
  bio: string | null;
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

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('handle, display_name, is_public, bio')
      .eq('id', user.id)
      .single();

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


  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Simple Header */}
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        <TouchableOpacity style={{ padding: 4 }} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Storefront</Text>
      {profile && (
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: theme.text }]}>
            {profile.display_name || `@${profile.handle}`}
          </Text>
          <Text style={[styles.handle, { color: theme.mutedText }]}>
            @{profile.handle}
          </Text>
          {profile.bio && (
            <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>
          )}

          <View style={{ width: '100%', marginBottom: 16, marginTop: 8 }}>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>Public Storefront</Text>
              <Switch
                value={profile.is_public}
                onValueChange={togglePublic}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </View>

          {profile.is_public ? (
            <View style={{ width: '100%' }}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.background }]} onPress={copyLink}>
                  <Ionicons name="copy-outline" size={20} color={theme.text} style={{ marginBottom: 4 }} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.background }]} onPress={shareLinks}>
                  <Ionicons name="share-outline" size={20} color={theme.text} style={{ marginBottom: 4 }} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={() => setQrModalVisible(true)}>
                  <Ionicons name="qr-code-outline" size={20} color="#fff" style={{ marginBottom: 4 }} />
                  <Text style={[styles.actionButtonText, { color: '#fff' }]}>QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={[styles.linkPreview, { color: theme.mutedText, backgroundColor: theme.background }]}>
              Storefront is private
            </Text>
          )}
        </View>
      )}

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
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
        <View style={{ paddingVertical: 12 }}>
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
    padding: 16,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
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
    borderRadius: 6,
    fontSize: 16,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 16,
  },
  metricsGrid: {
    marginBottom: 8,
  },
  metricCard: {
    padding: 16,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCardHalf: {
    width: '48%',
    padding: 16,
    borderRadius: 6,
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
    padding: 16,
    borderRadius: 6,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  countValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
