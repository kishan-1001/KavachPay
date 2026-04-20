import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';
import { colors, spacing, radius, fontSize } from '../../lib/theme';

type Step = 'email' | 'otp';

export default function AuthScreen() {
  const { login } = useAuth();
  const [step,        setStep]        = useState<Step>('email');
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOtp = async () => {
    if (!email.trim()) { shake(); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/send-otp', { email: email.trim().toLowerCase() });
      setStep('otp');
    } catch (e: any) {
      shake();
      Alert.alert('Error', e?.response?.data?.error ?? 'Could not send OTP. Check the email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { shake(); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), otp.trim());
    } catch (e: any) {
      shake();
      setOtp('');
      Alert.alert('Invalid OTP', 'The code you entered is incorrect or expired. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <Text style={styles.logo}>🛡</Text>
          <Text style={styles.brandName}>KavachPay</Text>
          <Text style={styles.tagline}>Zero-Trust Insurance for Gig Workers</Text>
        </View>

        {/* Card */}
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.cardTitle}>
            {step === 'email' ? 'Sign In' : 'Enter OTP'}
          </Text>
          <Text style={styles.cardSub}>
            {step === 'email'
              ? 'Enter your registered email to receive a one-time code.'
              : `We sent a 6-digit code to ${email}`
            }
          </Text>

          {step === 'email' ? (
            <>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="arjun@zomato.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onSubmitEditing={handleSendOtp}
                />
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP →</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>6-Digit Code</Text>
                <TextInput
                  style={[styles.input, styles.inputOtp]}
                  placeholder="888888"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  onSubmitEditing={handleVerifyOtp}
                  autoFocus
                />
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Sign In</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.back} onPress={() => { setStep('email'); setOtp(''); }}>
                <Text style={styles.backText}>← Change email</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* How ML works blurb */}
        <View style={styles.infoRow}>
          {['🤖 Bot Check', '⛈ Real Weather', '🔐 Work Proof', '🕸 Ring Detect'].map((item) => (
            <View key={item} style={styles.infoChip}>
              <Text style={styles.infoChipText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },

  brand:     { alignItems: 'center', marginBottom: spacing.xl },
  logo:      { fontSize: 52, marginBottom: spacing.sm },
  brandName: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  tagline:   { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },

  card:      { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
  cardTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  cardSub:   { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },

  inputWrap: { marginBottom: spacing.md },
  inputLabel:{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input:     { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: fontSize.md, color: colors.textPrimary },
  inputOtp:  { fontSize: 24, fontWeight: '700', letterSpacing: 12, textAlign: 'center' },

  btn:       { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: radius.md, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  btnText:   { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  back:      { alignItems: 'center', marginTop: spacing.md },
  backText:  { fontSize: fontSize.md, color: colors.textSecondary },

  infoRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  infoChip:  { backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  infoChipText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
});
