import { setAuthBypass } from '@/lib/authBypass';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function AuthScreen() {
    const theme = useThemeColors();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) Alert.alert(error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) Alert.alert(error.message);
        else if (!session) Alert.alert('Please check your inbox for email verification!');
        setLoading(false);
    }

    const canSubmit = !loading && email.trim().length > 0 && password.length > 0;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">VNDG MCHN</Text>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TextInput
                    style={[
                        styles.input,
                        { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text },
                    ]}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    placeholderTextColor={theme.mutedText}
                    autoCapitalize={'none'}
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    accessibilityLabel="Email"
                />
            </View>
            <View style={styles.verticallySpaced}>
                <TextInput
                    style={[
                        styles.input,
                        { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text },
                    ]}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    placeholderTextColor={theme.mutedText}
                    autoCapitalize={'none'}
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="go"
                    onSubmitEditing={() => canSubmit && signInWithEmail()}
                    accessibilityLabel="Password"
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, opacity: canSubmit ? 1 : 0.5 }]}
                    disabled={!canSubmit}
                    onPress={() => signInWithEmail()}
                    accessibilityRole="button"
                >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Sign in</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.verticallySpaced}>
                <TouchableOpacity
                    style={[styles.buttonOutline, { borderColor: theme.primary, opacity: canSubmit ? 1 : 0.5 }]}
                    disabled={!canSubmit}
                    onPress={() => signUpWithEmail()}
                    accessibilityRole="button"
                >
                    <Text style={[styles.buttonOutlineText, { color: theme.primary }]}>Sign up</Text>
                </TouchableOpacity>
            </View>
            {__DEV__ && (
                <View style={styles.verticallySpaced}>
                    <TouchableOpacity
                        style={styles.skipButton}
                        disabled={loading}
                        onPress={() => setAuthBypass(true)}
                    >
                        <Text style={[styles.skipButtonText, { color: theme.mutedText }]}>Skip login (dev)</Text>
                    </TouchableOpacity>
                </View>
            )}
            {loading && <ActivityIndicator style={styles.mt20} />}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
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
        borderWidth: 1,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    button: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    buttonOutlineText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        padding: 14,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
