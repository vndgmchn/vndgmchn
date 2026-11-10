import ModalShell from '@/components/ui/ModalShell';
import { HitSlop } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { sheetStyles as styles } from './sheetStyles';
import type { Collection } from './types';

type Props = {
    visible: boolean;
    onClose: () => void;
    collections: Collection[];
    selectedCollectionId: string | null;
    onSelect: (collectionId: string | null) => void;
    onEdit: (collection: Collection) => void;
    onDelete: (collection: Collection) => void;
    onCreate: () => void;
};

export default function CollectionPickerSheet({ visible, onClose, collections, selectedCollectionId, onSelect, onEdit, onDelete, onCreate }: Props) {
    const theme = useThemeColors();

    const renderLabel = (label: string, isActive: boolean) => (
        <Text
            style={[styles.optionText, { color: isActive ? theme.primary : theme.text, fontWeight: isActive ? '700' : '400', flex: 1 }]}
            numberOfLines={1}
        >
            {label}
        </Text>
    );

    return (
        <ModalShell visible={visible} onClose={onClose} title="Select Context" type="bottom-sheet">
            <ScrollView style={styles.sheetBody}>
                <TouchableOpacity
                    style={[styles.optionRow, { paddingRight: 80 }]}
                    onPress={() => onSelect(null)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedCollectionId === null }}
                >
                    {renderLabel('All Inventory', selectedCollectionId === null)}
                    {selectedCollectionId === null && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                </TouchableOpacity>

                {collections.length > 0 && (
                    <Text style={[styles.sectionHeading, { color: theme.mutedText, marginTop: 16 }]}>MY COLLECTIONS</Text>
                )}

                {collections.map(c => {
                    const isActive = selectedCollectionId === c.id;
                    return (
                        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[styles.optionRow, { flex: 1, borderBottomWidth: 0, paddingRight: 8 }]}
                                onPress={() => onSelect(c.id)}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isActive }}
                            >
                                {renderLabel(c.name, isActive)}
                                {isActive && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ padding: 8, marginRight: 2 }}
                                hitSlop={HitSlop}
                                accessibilityRole="button"
                                accessibilityLabel={`Edit ${c.name}`}
                                onPress={() => onEdit(c)}
                            >
                                <Ionicons name="pencil" size={16} color={theme.mutedText} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ padding: 8, marginRight: 8 }}
                                hitSlop={HitSlop}
                                accessibilityRole="button"
                                accessibilityLabel={`Delete ${c.name}`}
                                onPress={() => onDelete(c)}
                            >
                                <Ionicons name="trash-outline" size={16} color={theme.destructive} />
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <View style={{ height: 16 }} />
                <TouchableOpacity
                    style={[styles.optionRow, { justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.border }]}
                    onPress={onCreate}
                    accessibilityRole="button"
                >
                    <Ionicons name="add" size={20} color={theme.text} />
                    <Text style={{ color: theme.text, marginLeft: 8, fontWeight: '600' }}>Create New Collection</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ModalShell>
    );
}
