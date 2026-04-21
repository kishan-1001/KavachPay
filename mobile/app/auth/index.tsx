import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, ScrollView, Alert, Image
} from 'react-native';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';
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
  const [countdown,   setCountdown]   = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [countdown]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) { shake(); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/login-send-otp', { email: email.trim().toLowerCase() });
      setStep('otp');
      setCountdown(60);
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
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>
            KAVACH<Text style={{ color: colors.primary }}>PAY</Text>
          </Text>
          <Text style={styles.tagline}>Welcome back to secure protection.</Text>
        </View>

        {/* Card */}
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.cardTitle}>
            {step === 'email' ? 'Sign In' : 'Verify Identity'}
          </Text>
          <Text style={styles.cardSub}>
            {step === 'email'
              ? 'Enter your email to receive a login code.'
              : `A 6-digit code has been sent to ${email}`
            }
          </Text>

          {step === 'email' ? (
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onSubmitEditing={handleSendOtp}
              />
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.inputLabel}>ENTER 6-DIGIT CODE</Text>
                {countdown > 0 && <Text style={styles.countdownText}>EXPIRES IN {countdown}S</Text>}
              </View>
              <TextInput
                style={[styles.input, styles.inputOtp]}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                onSubmitEditing={handleVerifyOtp}
                autoFocus
              />
              <TouchableOpacity style={styles.back} onPress={() => { setStep('email'); setOtp(''); }}>
                <Text style={styles.backText}>Change email</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={step === 'email' ? handleSendOtp : handleVerifyOtp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>{step === 'email' ? 'Get Login Code' : 'Secure Login'}</Text>
                {step === 'email' ? <ArrowRight color="#fff" size={18} /> : <ShieldCheck color="#fff" size={18} />}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },

  brand:      { alignItems: 'center', marginBottom: spacing.xl },
  brandTitle: { fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1, color: '#1e3a8a' }, // Tailwind blue-900
  tagline:    { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500', marginTop: 4 },

  card:       { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 5 },
  cardTitle:  { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSub:    { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.lg },

  inputWrap:  { marginBottom: spacing.lg },
  inputLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
  input:      { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: fontSize.md, color: colors.textPrimary },
  
  otpHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  countdownText:{ fontSize: 10, fontWeight: '700', color: colors.danger, letterSpacing: 0.5 },
  inputOtp:     { fontSize: 28, fontWeight: '700', letterSpacing: 12, textAlign: 'center' },

  btn:          { backgroundColor: '#1e3a8a', paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' },
  btnDisabled:  { opacity: 0.7 },
  btnContent:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText:      { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
  
  back:         { alignItems: 'center', marginTop: spacing.md },
  backText:     { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
});
