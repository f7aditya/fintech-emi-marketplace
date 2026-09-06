import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import AppText from '../../components/AppText';
import GradientHero from '../../components/GradientHero';
import { useAuth } from '../../auth';
import { colors, font, radius, spacing } from '../../theme';

export default function ProfileScreen() {
  const {
    hydrated,
    user,
    pending,
    error,
    googleAvailable,
    mockAvailable,
    signInWithGoogle,
    signInWithMock,
    signOut,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // ---- Signed in -----------------------------------------------------------
  if (user) {
    const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GradientHero safeTop>
          <AppText style={styles.eyebrow}>1FI ACCOUNT</AppText>
          <View style={styles.identityRow}>
            {user.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <AppText style={styles.avatarInitials}>{initials}</AppText>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText style={styles.name}>{user.name}</AppText>
              <AppText style={styles.email}>{user.email}</AppText>
            </View>
          </View>
          <View style={styles.providerPill}>
            <AppText style={styles.providerPillText}>
              {user.provider === 'google' ? 'Signed in with Google' : 'Developer sign-in'}
            </AppText>
          </View>
        </GradientHero>

        <View style={styles.card}>
          <Pressable style={styles.rowLink} onPress={() => router.push('/orders')}>
            <AppText style={styles.rowLinkText}>Your orders</AppText>
            <AppText style={styles.rowChevron}>›</AppText>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.rowLink} onPress={() => router.push('/shop')}>
            <AppText style={styles.rowLinkText}>Browse the Marketplace</AppText>
            <AppText style={styles.rowChevron}>›</AppText>
          </Pressable>
        </View>

        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <AppText style={styles.signOutText}>Sign out</AppText>
        </Pressable>

        <AppText style={styles.footnote}>
          KYC · Bank · Nominee · Settings live in the full 1Fi app — outside this assignment’s scope.
        </AppText>
      </ScrollView>
    );
  }

  // ---- Signed out --------------------------------------------------------
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GradientHero safeTop>
        <AppText style={styles.eyebrow}>1FI ACCOUNT</AppText>
        <AppText style={styles.heroTitle}>Sign in to 1Fi</AppText>
        <AppText style={styles.heroSub}>
          Keep your EMI orders in one place. You can browse and shop without an account — sign in when
          you’re ready to check out.
        </AppText>
      </GradientHero>

      {error && (
        <Pressable style={styles.errorBanner} onPress={clearError}>
          <AppText style={styles.errorText}>{error}</AppText>
          <AppText style={styles.errorDismiss}>Tap to dismiss</AppText>
        </Pressable>
      )}

      <Pressable
        style={[styles.googleBtn, pending && styles.btnDisabled]}
        disabled={pending}
        onPress={signInWithGoogle}>
        {pending ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <GoogleG />
            <AppText style={styles.googleBtnText}>Continue with Google</AppText>
          </>
        )}
      </Pressable>
      {!googleAvailable && (
        <AppText style={styles.hint}>
          Google sign-in isn’t configured on this build yet. Add a Web client ID to{' '}
          <AppText style={styles.mono}>mobile/.env</AppText> (see the README). Use the developer
          sign-in below to test the flow now.
        </AppText>
      )}

      {mockAvailable && (
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Developer sign-in</AppText>
          <AppText style={styles.cardSub}>A local stand-in for Google while you set up OAuth.</AppText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name (optional)"
            placeholderTextColor={colors.mutedText}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedText}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable
            style={[styles.primaryBtn, (!emailValid || pending) && styles.btnDisabled]}
            disabled={!emailValid || pending}
            onPress={() => signInWithMock(email, name)}>
            <AppText style={styles.primaryBtnText}>Sign in</AppText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

/** A tiny four-colour Google "G" built from views — no asset needed. */
function GoogleG() {
  return (
    <View style={styles.gWrap}>
      <AppText style={styles.gText}>G</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: font.bold, letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: font.heavy, marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 18, marginTop: 6 },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 18, fontWeight: font.heavy },
  name: { color: '#fff', fontSize: 18, fontWeight: font.heavy },
  email: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 1 },
  providerPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  providerPillText: { color: '#fff', fontSize: 10.5, fontWeight: font.semibold, letterSpacing: 0.3 },

  errorBanner: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F5C2C2',
    padding: spacing.md,
    gap: 2,
  },
  errorText: { fontSize: 12, color: '#8A2A2A', lineHeight: 17 },
  errorDismiss: { fontSize: 10, color: '#A65454' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md + 2,
    minHeight: 50,
  },
  googleBtnText: { fontSize: 14.5, fontWeight: font.bold, color: colors.ink },
  gWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  gText: { fontSize: 15, fontWeight: font.heavy, color: '#4285F4' },
  btnDisabled: { opacity: 0.5 },

  hint: { fontSize: 11, color: colors.mutedText, lineHeight: 16 },
  mono: { fontFamily: 'Poppins_500Medium', color: colors.bodyText },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 13.5, fontWeight: font.bold, color: colors.ink },
  cardSub: { fontSize: 11.5, color: colors.mutedText, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: font.bold },

  rowLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm + 2 },
  rowLinkText: { fontSize: 13.5, color: colors.bodyText, fontWeight: font.semibold },
  rowChevron: { fontSize: 18, color: colors.mutedText },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },

  signOutBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  signOutText: { fontSize: 14, fontWeight: font.bold, color: colors.danger },
  footnote: { fontSize: 11, color: colors.mutedText, lineHeight: 16, textAlign: 'center' },
});
