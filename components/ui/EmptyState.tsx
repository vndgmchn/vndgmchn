/**
 * EmptyState — shared empty state UI primitive.
 * Accepts icon, title, optional message, and optional action CTA.
 * Does not own any business logic.
 */

import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
    /** Ionicons icon name */
    icon: IoniconName;
    /** Bold title text */
    title: string;
    /** Optional secondary message text */
    message?: string;
    /** Optional CTA button label */
    actionLabel?: string;
    /** Called when the CTA button is pressed */
    onAction?: () => void;
    /** Optional outer container style override */
    style?: ViewStyle;
};

export default function EmptyState({ icon, title, message, actionLabel, onAction, style }: Props) {
    const theme = useThemeColors();

    return (
        <View style={[styles.container, style]}>
            <Ionicons name={icon} size={48} color={theme.border} style={styles.icon} />
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {message && (
                <Text style={[styles.message, { color: theme.mutedText }]}>{message}</Text>
            )}
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={onAction}
                >
                    <Text style={[styles.actionText, { color: theme.text }]}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 14,
    },
});
