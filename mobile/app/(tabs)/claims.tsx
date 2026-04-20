import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PAID:    colors.success,
    REVIEW:  colors.warning,
    PENDING: colors.primary,
    REJECTED:colors.danger,
  };
  const color = colorMap[status] ?? colors.textMuted;
  return (
    <View style={[badge.wrap, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[badge.text, { color }]}>{status}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  text: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.5 },
});

// ── Pillar mini bar ───────────────────────────────────────────────────────────
function MiniBar({ label, value, good = true }: { label: string; value: number; good?: boolean }) {
  const pct = Math.round((value ?? 0) * 100);
  const col = good
    ? pct >= 70 ? colors.success : pct >= 50 ? colors.warning : colors.danger
    : pct <= 35 ? colors.success : pct <= 65 ? colors.warning : colors.danger;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: col }}>{pct}%</Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: 4, backgroundColor: col, borderRadius: 2 }} />
      </View>
    </View>
  );
}

// ── Claim card ────────────────────────────────────────────────────────────────
function ClaimCard({ claim }: { claim: any }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(claim.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const isPaid = claim.status === 'PAID';

  return (
    <View style={cStyles.card}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View style={cStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={cStyles.event} numberOfLines={1}>{claim.triggerEvent ?? 'Disruption'}</Text>
            <Text style={cStyles.date}>{date}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StatusBadge status={claim.status} />
            {isPaid && (
              <Text style={cStyles.payout}>₹{claim.payoutAmount}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={cStyles.breakdown}>
          <Text style={cStyles.breakdownTitle}>ML Breakdown</Text>
          <View style={{ gap: spacing.sm }}>
            <MiniBar label="🤖 Bot Check"    value={claim.behavioralScore ?? 0}  good={true}  />
            <MiniBar label="🔐 Work Proof"   value={claim.workProofScore  ?? 0}  good={true}  />
            <MiniBar label="🕸 Ring Risk"    value={claim.fraudScore      ?? 0}  good={false} />
          </View>
          <View style={cStyles.metaRow}>
            <View style={cStyles.metaItem}>
              <Text style={cStyles.metaLabel}>Chain Valid</Text>
              <Text style={[cStyles.metaValue, { color: claim.isChainValid ? colors.success : colors.danger }]}>
                {claim.isChainValid ? '✓ YES' : '✗ NO'}
              </Text>
            </View>
            <View style={cStyles.metaItem}>
              <Text style={cStyles.metaLabel}>Claim ID</Text>
              <Text style={cStyles.metaValue} numberOfLines={1}>{claim.id?.slice(0, 12)}…</Text>
            </View>
          </View>
          {claim.reviewerNotes ? (
            <View style={cStyles.notes}>
              <Text style={cStyles.notesText}>📝 {claim.reviewerNotes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const cStyles = StyleSheet.create({
  card:           { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  event:          { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  date:           { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  payout:         { fontSize: fontSize.xl, fontWeight: '800', color: colors.success },
  breakdown:      { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.md },
  breakdownTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  metaRow:        { flexDirection: 'row', gap: spacing.sm },
  metaItem:       { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm },
  metaLabel:      { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  metaValue:      { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  notes:          { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm },
  notesText:      { fontSize: fontSize.sm, color: colors.textSecondary },
});

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[sumStyle.card, { borderColor: color + '44' }]}>
      <Text style={sumStyle.icon}>{icon}</Text>
      <Text style={[sumStyle.value, { color }]}>{value}</Text>
      <Text style={sumStyle.label}>{label}</Text>
    </View>
  );
}
const sumStyle = StyleSheet.create({
  card:  { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, alignItems: 'center', gap: 4 },
  icon:  { fontSize: 22 },
  value: { fontSize: fontSize.xl, fontWeight: '800' },
  label: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClaimsScreen() {
  const { user } = useAuth();

  const { data: claims, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ['claims', user?.id],
    queryFn:  async () => {
      const res = await api.get('/api/claim/my-claims');
      return res.data?.claims ?? [];
    },
    enabled: !!user,
    refetchInterval: 30_000,
    placeholderData: [],
  });

  const paid     = (claims ?? []).filter((c) => c.status === 'PAID');
  const review   = (claims ?? []).filter((c) => c.status === 'REVIEW' || c.status === 'PENDING');
  const totalOut = paid.reduce((acc, c) => acc + (c.payoutAmount ?? 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Header */}
      <Text style={styles.screenTitle}>Claims</Text>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <SummaryCard icon="✅" label="Paid"       value={String(paid.length)}   color={colors.success} />
        <SummaryCard icon="⏳" label="In Review"  value={String(review.length)} color={colors.warning} />
        <SummaryCard icon="₹" label="Total Out"  value={`₹${totalOut}`}        color={colors.primary} />
      </View>

      {/* Claims list */}
      <Text style={styles.sectionLabel}>All Claims</Text>
      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading claims…</Text>
        </View>
      ) : (claims ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛡</Text>
          <Text style={styles.emptyTitle}>No Claims Yet</Text>
          <Text style={styles.emptySub}>When a disruption is detected near you, file a claim from the Map tab.</Text>
        </View>
      ) : (
        (claims ?? []).map((claim) => <ClaimCard key={claim.id} claim={claim} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { padding: spacing.md, paddingTop: 56, paddingBottom: 48 },
  screenTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  summaryRow:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  sectionLabel:{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  center:      { alignItems: 'center', paddingVertical: spacing.xl },
  loadingText: { fontSize: fontSize.md, color: colors.textMuted },
  empty:       { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon:   { fontSize: 48 },
  emptyTitle:  { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  emptySub:    { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
