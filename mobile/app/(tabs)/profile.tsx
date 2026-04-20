import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Svg, Circle, Path } from 'react-native-svg';
import { colors, spacing, radius, fontSize } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

const { width: W } = Dimensions.get('window');
const RING_SIZE    = 180;
const RING_STROKE  = 14;
const RING_R       = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMF      = 2 * Math.PI * RING_R;

// ── Animated trust ring ──────────────────────────────────────────────────────
function TrustRing({ score }: { score: number }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const dashOffset = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [CIRCUMF, CIRCUMF * (1 - score)],
  });

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  const pct   = Math.round(score * 100);
  const color = score >= 0.75 ? colors.success : score >= 0.55 ? colors.warning : colors.danger;
  const label = score >= 0.75 ? 'Trusted' : score >= 0.55 ? 'Fair' : 'At Risk';

  return (
    <View style={ringStyles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={ringStyles.svg}>
        {/* Background track */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" stroke={colors.surfaceAlt} strokeWidth={RING_STROKE}
        />
      </Svg>
      {/* Animated foreground — use JS-driven animation */}
      <Svg width={RING_SIZE} height={RING_SIZE} style={[ringStyles.svg, ringStyles.svgOverlay]}>
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" stroke={color} strokeWidth={RING_STROKE}
          strokeDasharray={`${CIRCUMF}`}
          strokeDashoffset={CIRCUMF * (1 - score)}
          strokeLinecap="round"
          rotation="-90" originX={RING_SIZE / 2} originY={RING_SIZE / 2}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={[ringStyles.pct, { color }]}>{pct}%</Text>
        <Text style={ringStyles.label}>{label}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: { width: RING_SIZE, height: RING_SIZE, alignSelf: 'center' },
  svg:       { position: 'absolute', top: 0, left: 0 },
  svgOverlay:{ position: 'absolute', top: 0, left: 0 },
  center:    { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  pct:       { fontSize: 36, fontWeight: '800' },
  label:     { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
});

// ── Pillar row ───────────────────────────────────────────────────────────────
function PillarRow({ icon, name, score, desc, good = true }: {
  icon: string; name: string; score: number; desc: string; good?: boolean;
}) {
  const pct   = Math.round(score * 100);
  const color = good
    ? score >= 0.7 ? colors.success : score >= 0.5 ? colors.warning : colors.danger
    : score <= 0.35 ? colors.success : score <= 0.65 ? colors.warning : colors.danger;

  return (
    <View style={pStyles.row}>
      <Text style={pStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={pStyles.topRow}>
          <Text style={pStyles.name}>{name}</Text>
          <Text style={[pStyles.score, { color }]}>{pct}%</Text>
        </View>
        <View style={pStyles.barBg}>
          <View style={[pStyles.bar, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={pStyles.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const pStyles = StyleSheet.create({
  row:    { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  icon:   { fontSize: 22, marginTop: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name:   { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  score:  { fontSize: fontSize.md, fontWeight: '800' },
  barBg:  { height: 5, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  bar:    { height: 5, borderRadius: 3 },
  desc:   { fontSize: fontSize.xs, color: colors.textMuted },
});

// ── Session card ─────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: any }) {
  const trust = session.trustScore ?? 0.5;
  const col   = trust >= 0.65 ? colors.success : colors.warning;
  const date  = new Date(session.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return (
    <View style={sStyles.card}>
      <View style={{ flex: 1 }}>
        <Text style={sStyles.date}>{date}</Text>
        <Text style={sStyles.detail}>
          {session.activeMinutes}m active · {session.ipCity ?? '—'}
        </Text>
      </View>
      <View style={[sStyles.badge, { backgroundColor: col + '22', borderColor: col + '55' }]}>
        <Text style={[sStyles.badgeText, { color: col }]}>{Math.round(trust * 100)}%</Text>
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  date:      { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  detail:    { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  badge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  badgeText: { fontSize: fontSize.sm, fontWeight: '800' },
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const { data: sessions, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ['sessions', user?.id],
    queryFn:  async () => {
      const res = await api.get('/api/session/history');
      return Array.isArray(res.data) ? res.data : (res.data?.sessions ?? []);
    },
    enabled: !!user,
    placeholderData: [],
  });

  const trust   = user?.trustScore ?? 0.72;
  // Derive pillar scores from trust for demo (real data would come from the latest claim)
  const p1Score = Math.min(1, trust + 0.05);
  const p3Score = Math.min(1, trust + 0.08);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Trust Score</Text>
          <Text style={styles.name}>{user?.fullName ?? '—'}</Text>
          <Text style={styles.platform}>{user?.deliveryPlatform ?? '—'} · {user?.city ?? '—'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Trust ring */}
      <View style={styles.ringCard}>
        <TrustRing score={trust} />
        <Text style={styles.ringCaption}>
          Based on your last verified session. Updates after each claim.
        </Text>
      </View>

      {/* Pillar breakdown */}
      <Text style={styles.sectionLabel}>ML Pillar Breakdown</Text>
      <View style={styles.card}>
        <PillarRow icon="🤖" name="Pillar 1 — Bot Check"       score={p1Score}  desc="IsolationForest on heartbeat jitter + login hour"          good={true}  />
        <PillarRow icon="⛈" name="Pillar 2 — Environmental"   score={0.65}     desc="GBR on live Open-Meteo weather + AQI"                     good={true}  />
        <PillarRow icon="🔐" name="Pillar 3 — Work Proof"      score={p3Score}  desc="GBC + HMAC chain validity + IP city match"                good={true}  />
        <PillarRow icon="🕸" name="Pillar 4 — Fraud Ring Risk" score={0.12}     desc="PyTorch GCN on co-claim graph (lower = safer)"           good={false} />
      </View>

      {/* Worker info */}
      <Text style={styles.sectionLabel}>Worker Details</Text>
      <View style={styles.card}>
        {[
          ['UPI ID',           user?.upiId ?? '—'],
          ['Weekly Earnings',  `₹${user?.weeklyEarnings ?? 0}`],
          ['Delivery Platform',user?.deliveryPlatform ?? '—'],
          ['Registered City',  user?.city ?? '—'],
        ].map(([label, value]) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Session history */}
      <Text style={styles.sectionLabel}>Recent Sessions</Text>
      {(sessions ?? []).length === 0
        ? <Text style={styles.empty}>No sessions recorded yet.</Text>
        : (sessions ?? []).slice(0, 5).map((s: any) => <SessionCard key={s.id} session={s} />)
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.md, paddingTop: 56, paddingBottom: 48 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  greeting:     { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  name:         { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  platform:     { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 2 },
  logoutBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  logoutText:   { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },

  ringCard:     { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  ringCaption:  { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },

  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  card:         { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel:  { fontSize: fontSize.md, color: colors.textSecondary },
  detailValue:  { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  empty:        { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
