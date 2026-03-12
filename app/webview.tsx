import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen() {
    const { url } = useLocalSearchParams<{ url: string }>();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // Validate the URL: check if it exists and starts with https://
    const isValidUrl = url && url.startsWith('https://');

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>TCGplayer</Text>
            <View style={styles.headerRight} />
        </View>
    );

    // Error State
    if (!isValidUrl) {
        return (
            <SafeAreaView style={styles.safeArea}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" style={styles.errorIcon} />
                    <Text style={styles.errorTitle}>Invalid URL</Text>
                    <Text style={styles.errorMessage}>The provided link is missing or invalid.</Text>
                    <TouchableOpacity onPress={handleBack} style={styles.errorButton}>
                        <Text style={styles.errorButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // WebView State
    return (
        <SafeAreaView style={styles.safeArea}>
            {renderHeader()}
            <View style={styles.container}>
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
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
        backgroundColor: '#FFFFFF',
        // Apply padding top for Android due to lack of SafeAreaView support for status bar natively
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 80, // Ensures header layout balance
    },
    backText: {
        fontSize: 17,
        color: '#007AFF',
        marginLeft: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    headerRight: {
        minWidth: 80, // Balances the header based on back button width
    },
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F2F2F7',
    },
    errorIcon: {
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButton: {
        backgroundColor: '#007AFF',
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
