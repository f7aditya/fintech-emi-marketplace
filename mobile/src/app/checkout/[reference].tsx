import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '../../components/AppHeader';
import AppText from '../../components/AppText';
import EmptyState from '../../components/EmptyState';
import Segmented from '../../components/Segmented';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useCart } from '../../cart';
import { colors, font, radius, spacing } from '../../theme';
import type { Order, Payment, PaymentMethod } from '../../types';

type Phase = 'loading' | 'form' | 'processing' | 'failed' | 'error';

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'];

const TEST_CARDS = {
  success: { number: '4242 4242 4242 4242', label: 'Success' },
  decline: { number: '4000 0000 0000 0002', label: 'Decline' },
};

const groupCard = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const groupExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

export default function CheckoutScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const insets = useSafeAreaInsets();
  const { clear } = useCart();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [force, setForce] = useState<'auto' | 'success' | 'failure'>('auto');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState(BANKS[0]);

  useEffect(() => {
    let alive = true;
    api
      .getPayment(String(reference))
      .then((d) => {
        if (!alive) return;
        setOrder(d.order);
        setPayment(d.payment);
        setMethod(d.payment.method);
        if (d.payment.status === 'SUCCESS') {
          router.replace(`/order/${d.order.reference}`);
          return;
        }
        if (d.payment.status === 'FAILED' && d.payment.failureReason) {
          setErrorText(d.payment.failureReason);
          setPhase('failed');
          return;
        }
        setPhase('form');
      })
      .catch(() => alive && setPhase('error'));
    return () => {
      alive = false;
    };
  }, [reference]);

  const amount = payment?.amount.display ?? order?.downPayment.display ?? '';

  const canPay = useMemo(() => {
    if (force !== 'auto') return true;
    if (method === 'CARD')
      return (
        card.number.replace(/\s/g, '').length === 16 &&
        card.name.trim().length > 1 &&
        /^\d{2}\/\d{2}$/.test(card.expiry) &&
        /^\d{3}$/.test(card.cvv)
      );
    if (method === 'UPI') return /^[a-z0-9.\-_]{2,}@[a-z]{2,}$/i.test(upiId.trim());
    return true;
  }, [force, method, card, upiId]);

  async function pay() {
    setErrorText(null);
    setPhase('processing');
    try {
      const { order: updated } = await api.confirmPayment(String(reference), {
        method,
        ...(method === 'CARD' && { card }),
        ...(method === 'UPI' && { upiId: upiId.trim() }),
        ...(method === 'NETBANKING' && { bank }),
        ...(force !== 'auto' && { simulate: force }),
      });
      clear();
      router.replace(`/order/${updated.reference}`);
    } catch (e) {
      const err = e as Error & { status?: number; body?: { payment?: Payment } };
      if (err.body?.payment) setPayment(err.body.payment);
      setErrorText(err.message || 'Payment could not be completed.');
      // A 400 is a bad instrument (fix and retry inline); anything else is a decline.
      setPhase(err.status === 400 ? 'form' : 'failed');
    }
  }

  if (phase === 'loading') {
    return (
      <View style={styles.screen}>
        <AppHeader title="Payment" showBack={false} showCart={false} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (phase === 'error' || !order || !payment) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Payment" showBack showCart={false} />
        <EmptyState emoji="🔌" title="Checkout unavailable" message={`No pending payment for “${reference}”.`} />
        <View style={{ alignItems: 'center' }}>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/cart')}>
            <AppText style={styles.primaryBtnText}>Back to bucket</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'processing') {
    return (
      <View style={styles.screen}>
        <AppHeader title="1Fi Pay" showBack={false} showCart={false} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={styles.processingTitle}>Contacting {payment.gateway}…</AppText>
          <AppText style={styles.processingSub}>Charging {amount} · do not close this screen</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="1Fi Pay" showBack showCart={false} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 150 }]}>
        {user ? (
          <View style={styles.signedInNote}>
            <AppText style={styles.signedInText}>Paying as {user.name} · order saved to your account</AppText>
          </View>
        ) : (
          <Pressable style={styles.signInNote} onPress={() => router.push('/profile')}>
            <AppText style={styles.signInText}>Sign in to track this order in your account ›</AppText>
          </Pressable>
        )}

        <View style={styles.merchantCard}>
          <View style={styles.merchantTop}>
            <AppText style={styles.merchantName}>1Fi Marketplace</AppText>
            <View style={styles.testPill}>
              <AppText style={styles.testPillText}>TEST MODE</AppText>
            </View>
          </View>
          <AppText style={styles.amount}>{amount}</AppText>
          <AppText style={styles.merchantSub}>
            Due today · Order {order.reference} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
          </AppText>
          <AppText style={styles.merchantSub}>
            EMI of {order.monthly.display}/mo starts next month
          </AppText>
        </View>

        {errorText && (
          <View style={styles.errorBanner}>
            <AppText style={styles.errorTitle}>
              {phase === 'failed' ? 'Payment declined' : 'Check your details'}
            </AppText>
            <AppText style={styles.errorBody}>{errorText}</AppText>
            {phase === 'failed' && payment.attempts > 0 && (
              <AppText style={styles.errorMeta}>Attempt {payment.attempts} · try another method or card</AppText>
            )}
          </View>
        )}

        <AppText style={styles.sectionLabel}>Payment method</AppText>
        <Segmented
          value={method}
          onChange={(m) => {
            setMethod(m as PaymentMethod);
            setErrorText(null);
            if (phase === 'failed') setPhase('form');
          }}
          options={[
            { value: 'CARD', label: 'Card' },
            { value: 'UPI', label: 'UPI' },
            { value: 'NETBANKING', label: 'Netbanking' },
          ]}
        />

        {method === 'CARD' && (
          <View style={styles.card}>
            <Field label="Card number">
              <TextInput
                style={styles.input}
                value={card.number}
                onChangeText={(t) => setCard((c) => ({ ...c, number: groupCard(t) }))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                maxLength={19}
              />
            </Field>
            <Field label="Name on card">
              <TextInput
                style={styles.input}
                value={card.name}
                onChangeText={(t) => setCard((c) => ({ ...c, name: t }))}
                placeholder="HIMANSHU KUMAR"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="characters"
              />
            </Field>
            <View style={styles.row}>
              <Field label="Expiry" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={card.expiry}
                  onChangeText={(t) => setCard((c) => ({ ...c, expiry: groupExpiry(t) }))}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </Field>
              <Field label="CVV" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={card.cvv}
                  onChangeText={(t) => setCard((c) => ({ ...c, cvv: t.replace(/\D/g, '').slice(0, 3) }))}
                  placeholder="123"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                />
              </Field>
            </View>
            <View style={styles.chipRow}>
              {(['success', 'decline'] as const).map((k) => (
                <Pressable
                  key={k}
                  style={styles.chip}
                  onPress={() =>
                    setCard({ number: TEST_CARDS[k].number, name: 'HIMANSHU KUMAR', expiry: '12/34', cvv: '123' })
                  }>
                  <AppText style={styles.chipText}>Fill {TEST_CARDS[k].label} card</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {method === 'UPI' && (
          <View style={styles.card}>
            <Field label="UPI ID">
              <TextInput
                style={styles.input}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@bank"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </Field>
            <AppText style={styles.hint}>
              Any valid-looking VPA is approved. Use one containing “fail” (e.g. fail@upi) to test a decline.
            </AppText>
          </View>
        )}

        {method === 'NETBANKING' && (
          <View style={styles.card}>
            {BANKS.map((b, idx) => {
              const active = b === bank;
              return (
                <Pressable key={b} onPress={() => setBank(b)} style={[styles.bankRow, idx > 0 && styles.bankDivider]}>
                  <AppText style={[styles.bankName, active && styles.bankNameActive]}>{b}</AppText>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <AppText style={styles.sectionLabel}>Force outcome (demo)</AppText>
        <Segmented
          value={force}
          onChange={(f) => setForce(f as typeof force)}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'success', label: 'Success' },
            { value: 'failure', label: 'Failure' },
          ]}
        />
        <AppText style={styles.hint}>
          “Auto” decides from the details you enter. “Success” / “Failure” override the gateway — no valid
          details needed.
        </AppText>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <View>
          <AppText style={styles.ctaLabel}>Paying now</AppText>
          <AppText style={styles.ctaValue}>{amount}</AppText>
        </View>
        <Pressable
          style={[styles.payBtn, !canPay && styles.payBtnDisabled]}
          disabled={!canPay}
          onPress={pay}>
          <AppText style={styles.payBtnText}>Pay {amount}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.md },
  processingTitle: { fontSize: 15, fontWeight: font.bold, color: colors.ink, marginTop: spacing.sm },
  processingSub: { fontSize: 12, color: colors.mutedText },

  signInNote: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  signInText: { fontSize: 12, fontWeight: font.semibold, color: colors.primaryDark },
  signedInNote: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  signedInText: { fontSize: 11.5, fontWeight: font.semibold, color: colors.success },
  merchantCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: 3,
  },
  merchantTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  merchantName: { fontSize: 13, fontWeight: font.bold, color: colors.bodyText },
  testPill: { backgroundColor: colors.star, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  testPillText: { fontSize: 9, fontWeight: font.heavy, color: '#fff', letterSpacing: 0.6 },
  amount: { fontSize: 26, fontWeight: font.heavy, color: colors.ink, marginTop: 2 },
  merchantSub: { fontSize: 11.5, color: colors.mutedText },

  errorBanner: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F5C2C2',
    padding: spacing.md,
    gap: 2,
  },
  errorTitle: { fontSize: 13, fontWeight: font.bold, color: colors.danger },
  errorBody: { fontSize: 12, color: '#8A2A2A', lineHeight: 17 },
  errorMeta: { fontSize: 10.5, color: '#A65454', marginTop: 2 },

  sectionLabel: { fontSize: 12, fontWeight: font.bold, color: colors.mutedText, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: font.semibold, color: colors.mutedText, letterSpacing: 0.3 },
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
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: { fontSize: 11, fontWeight: font.semibold, color: colors.primary },
  hint: { fontSize: 11, color: colors.mutedText, lineHeight: 16 },

  bankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm + 2 },
  bankDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  bankName: { fontSize: 13, color: colors.bodyText },
  bankNameActive: { fontWeight: font.bold, color: colors.ink },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },

  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  ctaLabel: { fontSize: 11, color: colors.mutedText },
  ctaValue: { fontSize: 16, fontWeight: font.heavy, color: colors.ink },
  payBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  payBtnDisabled: { backgroundColor: colors.mutedText, opacity: 0.6 },
  payBtnText: { color: '#fff', fontSize: 14.5, fontWeight: font.bold },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: font.bold },
});
