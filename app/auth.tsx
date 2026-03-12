import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>VNDG MCHN</Text>
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
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    disabled={loading}
                    onPress={() => signInWithEmail()}
                >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Sign in</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.verticallySpaced}>
                <TouchableOpacity
                    style={[styles.buttonOutline, { borderColor: theme.primary }]}
                    disabled={loading}
                    onPress={() => signUpWithEmail()}
                >
                    <Text style={[styles.buttonOutlineText, { color: theme.primary }]}>Sign up</Text>
                </TouchableOpacity>
            </View>
            {loading && <ActivityIndicator style={styles.mt20} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
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
});
