import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

const TIER_CONFIG: Record<string, { color: string; icon: string; perks: string[] }> = {
  BASIC: {
    color: colors.textMuted,
    icon:  '🥉',
    perks: ['₹1,500 coverage', 'Weather disruptions', 'Basic bot check'],
  },
  STANDARD: {
    color: colors.primary,
    icon:  '🥈',
    perks: ['₹2,000 coverage', 'Weather + AQI', 'Full ML verification', 'Hash chain security'],
  },
  PREMIUM: {
    color: '#F59E0B',
    icon:  '🥇',
    perks: ['₹3,500 coverage', 'All disruption types', 'Priority adjudication', 'GNN fraud ring shield'],
  },
};

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, accent ? { color: accent } : {}]}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: fontSize.md, color: colors.textSecondary },
  value: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
});

export default function PolicyScreen() {
  const { user } = useAuth();

  const { data: policy, isLoading, refetch, isRefetching } = useQuery<any>({
    queryKey: ['policy', user?.id],
    queryFn:  async () => {
      const res = await api.get('/api/policy/');
      return res.data ?? null;
    },
    enabled: !!user,
  });

  const tier   = policy?.planTier  ?? 'STANDARD';
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.STANDARD;
  const start  = policy?.startDate ? new Date(policy.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const end    = policy?.endDate   ? new Date(policy.endDate  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const daysLeft = policy?.endDate
    ? Math.max(0, Math.floor((new Date(policy.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <Text style={styles.screenTitle}>My Policy</Text>

      {/* Policy card */}
      <View style={[styles.policyCard, { borderColor: config.color + '55' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.tierIcon}>{config.icon}</Text>
          <View>
            <Text style={[styles.tierName, { color: config.color }]}>{tier} PLAN</Text>
            <Text style={styles.policyId} numberOfLines={1}>
              {policy?.id ? `ID: ${policy.id.slice(0, 16)}…` : 'No active policy'}
            </Text>
          </View>
          <View style={[styles.statusBadge,
            { backgroundColor: policy?.status === 'ACTIVE' ? colors.successBg : colors.dangerBg,
              borderColor: policy?.status === 'ACTIVE' ? colors.success + '55' : colors.danger + '55' }]}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: policy?.status === 'ACTIVE' ? colors.success : colors.danger }}>
              {policy?.status ?? 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* Coverage gauge */}
        <View style={styles.coverageRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.coverageLabel}>Coverage</Text>
            <Text style={[styles.coverageAmount, { color: config.color }]}>₹{policy?.coverageAmount ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.coverageLabel}>Days Left</Text>
            <Text style={[styles.coverageAmount, { color: daysLeft < 3 ? colors.danger : colors.textPrimary }]}>
              {daysLeft}d
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {policy?.startDate && policy?.endDate && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${Math.min(100, Math.max(0, 100 - (daysLeft / 7) * 100))}%` as any,
                backgroundColor: config.color,
              }]} />
            </View>
            <Text style={styles.progressLabel}>{start} → {end}</Text>
          </View>
        )}
      </View>

      {/* Policy details */}
      <Text style={styles.sectionLabel}>Policy Details</Text>
      <View style={styles.card}>
        <InfoRow label="Plan Tier"      value={tier} />
        <InfoRow label="Premium Paid"   value={`₹${policy?.premiumPaid ?? '—'}`} />
        <InfoRow label="Start Date"     value={start} />
        <InfoRow label="End Date"       value={end} />
        <InfoRow label="Status"         value={policy?.status ?? '—'} accent={policy?.status === 'ACTIVE' ? colors.success : colors.danger} />
      </View>

      {/* Perks */}
      <Text style={styles.sectionLabel}>Covered Under This Plan</Text>
      <View style={styles.card}>
        {config.perks.map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Text style={[styles.perkCheck, { color: config.color }]}>✓</Text>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      {/* How claims work */}
      <Text style={styles.sectionLabel}>How It Works</Text>
      <View style={styles.card}>
        {[
          ['1', 'Disruption detected', 'Our Pillar 2 model scans live weather, AQI & news for your city.'],
          ['2', 'Your session verified', 'Pillar 1 + 3 check your heartbeat chain, jitter, IP, and work hours.'],
          ['3', 'Fraud ring check', 'Pillar 4 GNN scans for coordinated fake claim clusters.'],
          ['4', 'Instant payout', 'If trust score ≥ 0.65, ₹ is sent to your UPI within seconds.'],
        ].map(([step, title, desc]) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: colors.primaryGlow }]}>
              <Text style={[styles.stepNumText, { color: colors.primary }]}>{step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bg },
  content:       { padding: spacing.md, paddingTop: 56, paddingBottom: 48 },
  screenTitle:   { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },

  // Policy card
  policyCard:    { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1.5, padding: spacing.lg, marginBottom: spacing.lg },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  tierIcon:      { fontSize: 32 },
  tierName:      { fontSize: fontSize.lg, fontWeight: '800' },
  policyId:      { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statusBadge:   { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  coverageRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  coverageLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 },
  coverageAmount:{ fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  divider:       { width: 1, height: 48, backgroundColor: colors.border, marginHorizontal: spacing.md },
  progressWrap:  { gap: 6 },
  progressBg:    { height: 5, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 5, borderRadius: 3 },
  progressLabel: { fontSize: fontSize.xs, color: colors.textMuted },

  sectionLabel:  { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  card:          { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },

  perkRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.sm },
  perkCheck:     { fontSize: fontSize.lg, fontWeight: '800', width: 20 },
  perkText:      { fontSize: fontSize.md, color: colors.textSecondary, flex: 1 },

  stepRow:       { flexDirection: 'row', gap: spacing.md, paddingVertical: 10 },
  stepNum:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText:   { fontSize: fontSize.sm, fontWeight: '800' },
  stepTitle:     { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  stepDesc:      { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
});
