import EmptyState from '@/components/ui/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { HitSlop } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function CalculatorScreen() {
    const theme = useThemeColors();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader
                title="Calculator"
                right={
                    <TouchableOpacity
                        onPress={() => router.push('/search')}
                        hitSlop={HitSlop}
                        accessibilityRole="button"
                        accessibilityLabel="Search catalog"
                    >
                        <Ionicons name="search" size={26} color={theme.text} />
                    </TouchableOpacity>
                }
            />
            <EmptyState
                icon="calculator-outline"
                title="Calculator coming soon"
                message="Trade and buylist math will live here."
                style={styles.content}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});
