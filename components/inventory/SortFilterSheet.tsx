import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { sheetStyles as styles } from './sheetStyles';
import type { InventoryFilters, SortOption } from './types';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: 'RECENT', label: 'Recently Added' },
    { id: 'OLDEST', label: 'Oldest Added' },
    { id: 'PRICE_HIGH_LOW', label: 'Price: High to Low' },
    { id: 'PRICE_LOW_HIGH', label: 'Price: Low to High' },
    { id: 'NAME_AZ', label: 'Name: A to Z' },
];

type Props = {
    visible: boolean;
    onClose: () => void;
    sortBy: SortOption;
    onChangeSort: (sort: SortOption) => void;
    filters: InventoryFilters;
    onToggleFilter: (key: keyof InventoryFilters) => void;
    onReset: () => void;
};

export default function SortFilterSheet({ visible, onClose, sortBy, onChangeSort, filters, onToggleFilter, onReset }: Props) {
    const theme = useThemeColors();

    const renderToggle = (key: keyof InventoryFilters, label: string, activeColor: string) => (
        <TouchableOpacity
            style={[styles.filterChipToggle, { backgroundColor: filters[key] ? activeColor : theme.border }]}
            onPress={() => onToggleFilter(key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: filters[key] }}
        >
            <Text style={{ color: filters[key] ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title="Sort & Filter"
            type="bottom-sheet"
            headerRight={
                <TouchableOpacity onPress={onReset} accessibilityRole="button">
                    <Text style={{ color: theme.mutedText, fontSize: 14, fontWeight: '500' }}>Reset</Text>
                </TouchableOpacity>
            }
        >
            <ScrollView style={styles.sheetBody}>
                <Text style={[styles.sectionHeading, { color: theme.mutedText }]}>SORT BY</Text>
                <View style={styles.optionList}>
                    {SORT_OPTIONS.map((option) => {
                        const isActive = sortBy === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.optionRow}
                                onPress={() => onChangeSort(option.id)}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[styles.optionText, { color: isActive ? theme.primary : theme.text, fontWeight: isActive ? '700' : '400' }]}>
                                    {option.label}
                                </Text>
                                {isActive && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={[styles.sectionHeading, { color: theme.mutedText, marginTop: 24 }]}>FILTERS</Text>

                <Text style={[styles.filterSubHeading, { color: theme.text }]}>Type</Text>
                <View style={styles.filterChipGroup}>
                    {renderToggle('isCard', 'Cards Only', theme.primary)}
                    {renderToggle('isSealed', 'Sealed Only', theme.sealed)}
                </View>

                <Text style={[styles.filterSubHeading, { color: theme.text, marginTop: 16 }]}>Language</Text>
                <View style={styles.filterChipGroup}>
                    {renderToggle('isEnglish', 'English (EN)', theme.primary)}
                    {renderToggle('isJapanese', 'Japanese (JA)', theme.primary)}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ModalShell>
    );
}
