import { HitSlop } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function WebViewScreen() {
    const { url } = useLocalSearchParams<{ url: string }>();
    const router = useRouter();
    const theme = useThemeColors();
    const [isLoading, setIsLoading] = useState(true);

    const isValidUrl = url && url.startsWith('https://');

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
            <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                hitSlop={HitSlop}
                accessibilityRole="button"
                accessibilityLabel="Back"
            >
                <Ionicons name="chevron-back" size={24} color={theme.primary} />
                <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>TCGplayer</Text>
            <View style={styles.headerRight} />
        </View>
    );

    if (!isValidUrl) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
                {renderHeader()}
                <View style={[styles.errorContainer, { backgroundColor: theme.surface }]}>
                    <Ionicons name="alert-circle-outline" size={48} color={theme.destructive} style={styles.errorIcon} />
                    <Text style={[styles.errorTitle, { color: theme.text }]}>Invalid URL</Text>
                    <Text style={[styles.errorMessage, { color: theme.mutedText }]}>The provided link is missing or invalid.</Text>
                    <TouchableOpacity onPress={handleBack} style={[styles.errorButton, { backgroundColor: theme.primary }]} accessibilityRole="button">
                        <Text style={styles.errorButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
            {renderHeader()}
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {isLoading && (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                )}
                <WebView
                    source={{ uri: url }}
                    style={styles.webview}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 80,
    },
    backText: {
        fontSize: 17,
        marginLeft: 4,
    },
    title: {
        flexShrink: 1,
        fontSize: 17,
        fontWeight: '600',
    },
    headerRight: {
        minWidth: 80,
    },
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorIcon: {
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    errorButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
