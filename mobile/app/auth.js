import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/lib/auth';
import { Button, Card, Input, Label, Divider } from '../src/components/ui';
import { colors, fonts, radius } from '../src/lib/theme';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('yashvaan999@gmail.com');
  const [password, setPassword] = useState('Happyheart@54321');
  const [fullName, setFullName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      if (mode === 'login') {
        const u = await login(email, password);
        router.replace(u?.onboarding_complete ? '/dashboard' : '/onboarding');
      } else {
        const u = await register(email, password, fullName);
        if (u) router.replace('/onboarding');
        else setErr('Check your inbox to confirm your account, then sign in.');
      }
    } catch (e) {
      setErr(e?.message || 'Could not complete request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandWrap}>
          <Image
            source={require('../assets/brand-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Psycheveda — empower your mind"
          />
        </View>

        <Card style={{ marginTop: 32 }}>
          {mode === 'login' ? null : (
            <Text style={styles.heading}>Begin your practice</Text>
          )}
          <Text style={styles.sub}>
            {mode === 'login'
              ? 'Step into your daily ritual of clarity.'
              : 'Five minutes a day. Lasting transformation.'}
          </Text>

          <View style={{ gap: 14, marginTop: 24 }}>
            {mode === 'register' && (
              <View>
                <Label>Full Name</Label>
                <Input value={fullName} onChangeText={setFullName} placeholder="As you would like to be called" />
              </View>
            )}
            <View>
              <Label>Email</Label>
              <Input
                value={email} onChangeText={setEmail}
                autoCapitalize="none" keyboardType="email-address"
                placeholder="you@example.com"
              />
            </View>
            <View>
              <Label>Password</Label>
              <Input
                value={password} onChangeText={setPassword}
                secureTextEntry placeholder="••••••••"
              />
            </View>
            {err ? (
              <View style={styles.errBox}>
                <Text style={styles.errText}>{err}</Text>
              </View>
            ) : null}
            <Button onPress={submit} disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Enter' : 'Create account'}
            </Button>
          </View>

          <Divider label="or" />
          <Button variant="secondary" onPress={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
            {mode === 'login' ? 'Create a new account' : 'I already have an account'}
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brandWrap: { alignItems: 'center', marginTop: 12 },
  logo: { width: 180, height: 123 },
  heading: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  sub: { color: colors.subtext, fontSize: 14, marginTop: 6, fontFamily: fonts.body },
  errBox: {
    backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder,
    padding: 12, borderRadius: radius.xl,
  },
  errText: { color: colors.danger, fontSize: 13, fontFamily: fonts.body },
});
