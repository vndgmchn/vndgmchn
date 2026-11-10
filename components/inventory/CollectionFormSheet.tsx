import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sheetStyles as styles } from './sheetStyles';
import type { CollectionVisibility } from './types';

const VISIBILITY_OPTIONS: { value: CollectionVisibility; label: string; desc: string }[] = [
    { value: 'private', label: 'Private', desc: 'Only you can see this collection.' },
    { value: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link can view it, but it won\'t appear on your storefront.' },
    { value: 'public', label: 'Public', desc: 'Appears on your storefront for everyone to browse.' },
];

type Props = {
    visible: boolean;
    onClose: () => void;
    isEditing: boolean;
    name: string;
    onChangeName: (value: string) => void;
    description: string;
    onChangeDescription: (value: string) => void;
    visibility: CollectionVisibility;
    onChangeVisibility: (value: CollectionVisibility) => void;
    saving: boolean;
    onSave: () => void;
    onDelete: () => void;
};

export default function CollectionFormSheet({
    visible, onClose, isEditing, name, onChangeName, description, onChangeDescription,
    visibility, onChangeVisibility, saving, onSave, onDelete,
}: Props) {
    const theme = useThemeColors();
    const inputStyle = [styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }];

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={isEditing ? 'Edit Collection' : 'Create Collection'}
            type="page-sheet"
            hideClose
            useKeyboardAvoiding
            headerRight={
                <TouchableOpacity onPress={onClose} accessibilityRole="button">
                    <Text style={{ color: theme.primary, fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
            }
        >
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
                <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
                <TextInput
                    style={inputStyle}
                    value={name}
                    onChangeText={onChangeName}
                    placeholder="e.g. Base Set Master"
                    placeholderTextColor={theme.mutedText}
                />

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Description</Text>
                <TextInput
                    style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={onChangeDescription}
                    placeholder="Optional details about this collection..."
                    placeholderTextColor={theme.mutedText}
                    multiline
                />

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Visibility</Text>
                <View style={{ gap: 12 }}>
                    {VISIBILITY_OPTIONS.map(opt => {
                        const isActive = visibility === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => onChangeVisibility(opt.value)}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isActive }}
                                style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: isActive ? theme.primary : theme.border, backgroundColor: isActive ? theme.primary + '10' : theme.surface }}
                            >
                                <Ionicons name={isActive ? 'radio-button-on' : 'radio-button-off'} size={20} color={isActive ? theme.primary : theme.mutedText} />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>{opt.label}</Text>
                                    <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 4 }}>{opt.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary, marginTop: 32 }]}
                    onPress={onSave}
                    disabled={saving}
                    accessibilityRole="button"
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Collection</Text>}
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity style={{ padding: 16, alignItems: 'center', marginTop: 16 }} onPress={onDelete} accessibilityRole="button">
                        <Text style={{ color: theme.destructive, fontWeight: 'bold' }}>Delete Collection</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>
        </ModalShell>
    );
}
