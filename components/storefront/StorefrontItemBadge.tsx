import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    item: {
        kind?: string;
        is_graded?: boolean;
        grading_company?: string | null;
        grade?: string | number | null;
        condition?: string | null;
    };
    theme: any;
    size?: 'sm' | 'md';
};

export default function StorefrontItemBadge({ item, theme, size = 'sm' }: Props) {
    if (item.kind === 'SEALED') {
        return (
            <View style={[
                styles.badge, 
                { backgroundColor: theme.sealed || '#10b981' },
                size === 'sm' ? styles.badgeSm : styles.badgeMd
            ]}>
                <Text style={[
                    styles.text, 
                    { color: '#fff' },
                    size === 'sm' ? styles.textSm : styles.textMd
                ]}>SEALED</Text>
            </View>
        );
    }

    if (item.is_graded && item.grading_company && item.grade != null) {
        return (
            <View style={[
                styles.badge, 
                { backgroundColor: '#121212' },
                size === 'sm' ? styles.badgeSm : styles.badgeMd
            ]}>
                <Text style={[
                    styles.text, 
                    { color: '#A3A3A3' },
                    size === 'sm' ? styles.textSm : styles.textMd
                ]}>
                    {item.grading_company} {item.grade}
                </Text>
            </View>
        );
    }

    if (item.condition) {
        return (
            <View style={[
                styles.badge, 
                { backgroundColor: '#121212' },
                size === 'sm' ? styles.badgeSm : styles.badgeMd
            ]}>
                <Text style={[
                    styles.text, 
                    { color: '#A3A3A3' },
                    size === 'sm' ? styles.textSm : styles.textMd
                ]}>
                    {item.condition}
                </Text>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 4,
    },
    badgeSm: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginRight: 6,
    },
    badgeMd: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 8,
    },
    text: {
        fontWeight: 'bold',
    },
    textSm: {
        fontSize: 9,
    },
    textMd: {
        fontSize: 10,
    },
});
