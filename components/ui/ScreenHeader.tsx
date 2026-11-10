import { FontSize, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    title: string;
    right?: ReactNode;
    style?: ViewStyle;
};

export default function ScreenHeader({ title, right, style }: Props) {
    const theme = useThemeColors();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }, style]}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1} accessibilityRole="header">
                {title}
            </Text>
            {right ? <View style={styles.right}>{right}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
    },
    title: {
        flexShrink: 1,
        fontSize: FontSize.title,
        fontWeight: 'bold',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        marginLeft: Spacing.md,
    },
});
