import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export default function CreateProfileScreen() {
    const theme = useThemeColors();
    const router = useRouter();
    const [handle, setHandle] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const displayNameRef = useRef<TextInput>(null);
    const bioRef = useRef<TextInput>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
            }
        });
    }, []);

    const validateHandle = (h: string) => {
        const regex = /^[a-z0-9_]{3,20}$/;
        return regex.test(h);
    };

    const handleCreateProfile = async () => {
        if (!userId) return;

        const cleanHandle = normalizeHandle(handle);

        if (!validateHandle(cleanHandle)) {
            Alert.alert(
                'Invalid Handle',
                'Handle must be 3-20 characters and contain only lowercase letters, numbers, and underscores.'
            );
            return;
        }

        setLoading(true);

        const { error } = await supabase.from('profiles').insert({
            id: userId,
            handle: cleanHandle,
            display_name: displayName,
            bio: bio,
            is_public: true, // Default to public
        });

        setLoading(false);

        if (error) {
            if (error.code === '23505') { // Postgres unique constraint violation
                Alert.alert('Handle Taken', 'This handle is already taken. Please choose another one.');
            } else {
                Alert.alert('Error', error.message);
            }
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.title, { color: theme.text }]}>Create Profile</Text>

                    <View style={[styles.verticallySpaced, styles.mt20]}>
                        <Text style={[styles.label, { color: theme.text }]}>Handle (required)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: theme.surface, color: theme.text },
                            ]}
                            onChangeText={setHandle}
                            value={handle}
                            placeholder="e.g. mystic_vendor"
                            placeholderTextColor={theme.mutedText}
                            autoCapitalize={'none'}
                            maxLength={20}
                            returnKeyType="next"
                            onSubmitEditing={() => displayNameRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                    </View>

                    <View style={styles.verticallySpaced}>
                        <Text style={[styles.label, { color: theme.text }]}>Display Name (optional)</Text>
                        <TextInput
                            ref={displayNameRef}
                            style={[
                                styles.input,
                                { backgroundColor: theme.surface, color: theme.text },
                            ]}
                            onChangeText={setDisplayName}
                            value={displayName}
                            placeholder="e.g. Mystic Vendor"
                            placeholderTextColor={theme.mutedText}
                            returnKeyType="next"
                            onSubmitEditing={() => bioRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                    </View>

                    <View style={styles.verticallySpaced}>
                        <Text style={[styles.label, { color: theme.text }]}>Bio (optional)</Text>
                        <TextInput
                            ref={bioRef}
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: theme.surface, color: theme.text },
                            ]}
                            onChangeText={setBio}
                            value={bio}
                            placeholder="Tell us about your store..."
                            placeholderTextColor={theme.mutedText}
                            multiline
                            numberOfLines={4}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                        />
                    </View>

                    <View style={[styles.verticallySpaced, styles.mt20, styles.buttonContainer]}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.primary }]}
                            disabled={loading || !handle}
                            onPress={handleCreateProfile}
                        >
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Create Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && <ActivityIndicator style={styles.mt20} />}
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500',
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    mt20: {
        marginTop: 20,
    },
    input: {
        padding: 16,
        borderRadius: 6,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        marginBottom: 20,
    },
    button: {
        padding: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
