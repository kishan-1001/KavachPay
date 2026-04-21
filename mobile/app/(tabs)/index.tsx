import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Alert, Dimensions, ScrollView, Platform,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert, CloudLightning, ShieldCheck, Clock,
  MapPin, Zap, AlertTriangle, CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PANEL_PEEK    = 90;   // height when collapsed (handle + one line)
const PANEL_EXPAND  = Math.min(420, SCREEN_H * 0.55); // full panel

// ── Types ────────────────────────────────────────────────────────────────────

interface DisruptionZone {
  id:           string;
  city:         string;
  lat:          number;
  lon:          number;
  radiusMeters: number;
  score:        number;
  type:         'weather' | 'aqi' | 'combined';
  label:        string;
}

interface FraudCluster {
  id:       string;
  lat:      number;
  lon:      number;
  count:    number;
  riskLevel:'high' | 'medium';
}

interface MapData {
  disruptionZones: DisruptionZone[];
  fraudClusters:   FraudCluster[];
  activeWorkers:   number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isInsideZone(lat: number, lon: number, zone: DisruptionZone): boolean {
  const R    = 6371000;
  const dLat = ((zone.lat - lat) * Math.PI) / 180;
  const dLon = ((zone.lon - lon) * Math.PI) / 180;
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos((lat * Math.PI) / 180)
    * Math.cos((zone.lat * Math.PI) / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= zone.radiusMeters;
}

// ── Score pill ────────────────────────────────────────────────────────────────

function ScorePill({ label, score, good }: { label: string; score: number; good: boolean }) {
  const pct = Math.round(score * 100);
  const col = good
    ? score >= 0.7 ? colors.success : colors.warning
    : score <= 0.4 ? colors.success : colors.danger;
  return (
    <View style={[styles.pill, { borderColor: col + '44' }]}>
      <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.pillValue, { color: col }]}>{pct}%</Text>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const { user } = useAuth();
  const mapRef   = useRef<MapView>(null);

  const [location,        setLocation]        = useState<Location.LocationObject | null>(null);
  const [locationError,   setLocationError]   = useState(false);
  const [insideZone,      setInsideZone]      = useState<DisruptionZone | null>(null);
  const [claimLoading,    setClaimLoading]    = useState(false);
  const [claimResult,     setClaimResult]     = useState<any>(null);
  const [selectedCluster, setSelectedCluster] = useState<FraudCluster | null>(null);
  const [panelExpanded,   setPanelExpanded]   = useState(false);

  // ── Custom bottom panel (Animated.View — zero reanimated) ─────────────────
  const panelHeight = useRef(new Animated.Value(PANEL_PEEK)).current;

  const expandPanel = useCallback(() => {
    setPanelExpanded(true);
    Animated.spring(panelHeight, {
      toValue: PANEL_EXPAND, useNativeDriver: false, bounciness: 4,
    }).start();
  }, [panelHeight]);

  const collapsePanel = useCallback(() => {
    setPanelExpanded(false);
    Animated.spring(panelHeight, {
      toValue: PANEL_PEEK, useNativeDriver: false, bounciness: 4,
    }).start();
  }, [panelHeight]);

  const togglePanel = useCallback(() => {
    panelExpanded ? collapsePanel() : expandPanel();
  }, [panelExpanded, expandPanel, collapsePanel]);

  // ── Pulse animation ───────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Location permission + tracking ───────────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(initial);
      mapRef.current?.animateToRegion({
        latitude:       initial.coords.latitude,
        longitude:      initial.coords.longitude,
        latitudeDelta:  0.04,
        longitudeDelta: 0.04,
      }, 1000);
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 50 },
        (loc) => setLocation(loc),
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  // ── Fetch map data every 30s ──────────────────────────────────────────────
  const { data: mapData, isLoading: mapLoading } = useQuery<MapData>({
    queryKey: ['mapData', user?.city],
    queryFn: async () => {
      const res = await api.get('/api/claim/map-data', { params: { city: user?.city ?? 'Mumbai' } });
      return res.data;
    },
    refetchInterval: 30_000,
    enabled: !!user,
    placeholderData: {
      disruptionZones: [
        { id: 'z1', city: user?.city ?? 'Mumbai', lat: 19.076, lon: 72.877, radiusMeters: 3000, score: 0.72, type: 'weather', label: 'Heavy Rain — IMD Alert' },
        { id: 'z2', city: user?.city ?? 'Mumbai', lat: 19.060, lon: 72.860, radiusMeters: 1800, score: 0.61, type: 'aqi',     label: 'Hazardous AQI > 250' },
      ],
      fraudClusters: [{ id: 'c1', lat: 19.090, lon: 72.895, count: 7, riskLevel: 'high' }],
      activeWorkers: 124,
    },
  });

  // ── Zone proximity check ──────────────────────────────────────────────────
  useEffect(() => {
    if (!location || !mapData) return;
    const { latitude, longitude } = location.coords;
    const hit = mapData.disruptionZones.find((z) => isInsideZone(latitude, longitude, z));
    setInsideZone(hit ?? null);
    if (hit) expandPanel();
  }, [location, mapData]);

  // ── File claim ────────────────────────────────────────────────────────────
  const handleFileClaim = useCallback(async () => {
    setClaimLoading(true);
    setClaimResult(null);
    expandPanel();
    try {
      const res = await api.post('/api/claim/simulate-disruption');
      setClaimResult(res.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to process claim');
    } finally {
      setClaimLoading(false);
    }
  }, [expandPanel]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (locationError) {
    return (
      <View style={styles.center}>
        <MapPin color={colors.textMuted} size={48} />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorSub}>KavachPay needs location access to detect disruptions near you.</Text>
      </View>
    );
  }

  const ml = claimResult?.mlBreakdown;

  return (
    <View style={styles.container}>
      {/* ── Map ───────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        customMapStyle={LIGHT_MAP_STYLE}
        showsUserLocation={false}
        initialRegion={{
          latitude:       location?.coords.latitude  ?? 19.076,
          longitude:      location?.coords.longitude ?? 72.877,
          latitudeDelta:  0.04,
          longitudeDelta: 0.04,
        }}
        onPress={() => { setSelectedCluster(null); collapsePanel(); }}
      >
        {/* Disruption zone circles */}
        {mapData?.disruptionZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Circle
              center={{ latitude: zone.lat, longitude: zone.lon }}
              radius={zone.radiusMeters}
              fillColor={colors.disruptionFill}
              strokeColor={colors.disruptionStroke}
              strokeWidth={1.5}
            />
            <Marker
              coordinate={{ latitude: zone.lat, longitude: zone.lon }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={expandPanel}
            >
              <View style={styles.zoneLabel}>
                <CloudLightning color={colors.danger} size={12} />
                <Text style={styles.zoneLabelText}>{zone.label}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Fraud cluster markers */}
        {mapData?.fraudClusters.map((cluster) => (
          <Marker
            key={cluster.id}
            coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => { setSelectedCluster(cluster); expandPanel(); }}
          >
            <View style={styles.clusterMarker}>
              <AlertTriangle color={colors.warning} size={12} />
              <Text style={styles.clusterText}>{cluster.count}</Text>
            </View>
          </Marker>
        ))}

        {/* Worker GPS dot */}
        {location && (
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Animated.View style={[styles.workerDotOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.workerDotInner} />
            </Animated.View>
          </Marker>
        )}
      </MapView>

      {/* ── HUD overlay ─────────────────────────────────── */}
      <View style={styles.hud} pointerEvents="none">
        <View style={styles.hudTop}>
          <View style={styles.hudPill}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.hudText}>{mapData?.activeWorkers ?? '—'} Active Workers</Text>
          </View>
          {mapLoading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {insideZone && (
          <View style={styles.alertBanner}>
            <Zap color={colors.danger} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Disruption Detected</Text>
              <Text style={styles.alertSub}>{insideZone.label}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── CTA (when inside zone & no claim yet) ────────── */}
      {insideZone && !claimResult && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, claimLoading && styles.ctaLoading]}
            onPress={handleFileClaim}
            disabled={claimLoading}
          >
            {claimLoading ? <ActivityIndicator color="#fff" /> : (
              <View style={styles.ctaRow}>
                <ShieldCheck color="#fff" size={20} />
                <Text style={styles.ctaText}>File Disruption Claim</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Custom Animated Bottom Panel ─────────────────── */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        {/* Drag handle */}
        <TouchableOpacity onPress={togglePanel} style={styles.panelHandle} activeOpacity={0.7}>
          <View style={styles.handleBar} />
        </TouchableOpacity>

        <ScrollView
          scrollEnabled={panelExpanded}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelContent}
        >
          {selectedCluster ? (
            <View>
              <View style={styles.rowGap}>
                <ShieldAlert color={colors.textPrimary} size={20} />
                <Text style={styles.panelTitle}>Fraud Ring Alert</Text>
              </View>
              <Text style={styles.panelSub}>
                {selectedCluster.count} suspicious claims detected in this area in the last 6h.
              </Text>
              <View style={[styles.infoCard, { borderColor: colors.danger + '44' }]}>
                <Text style={styles.infoCardText}>
                  Pillar 4 GNN flagged coordinated claims from the same /24 IP subnet — a classic Telegram ring signature.
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: selectedCluster.riskLevel === 'high' ? colors.dangerBg : colors.warningBg }]}>
                <Text style={[styles.riskBadgeText, { color: selectedCluster.riskLevel === 'high' ? colors.danger : colors.warning }]}>
                  {selectedCluster.riskLevel === 'high' ? '● HIGH RISK' : '● MEDIUM RISK'} cluster
                </Text>
              </View>
            </View>
          ) : ml ? (
            <View>
              <View style={styles.rowGap}>
                {claimResult?.claim?.status === 'PAID'
                  ? <CheckCircle2 color={colors.success} size={20} />
                  : <Clock color={colors.warning} size={20} />}
                <Text style={styles.panelTitle}>
                  {claimResult?.claim?.status === 'PAID' ? 'Claim Approved' : 'Under Review'}
                </Text>
              </View>
              <Text style={styles.panelSub}>Payout: ₹{claimResult?.claim?.payoutAmount ?? 0}</Text>
              <Text style={styles.sectionLabel}>ML Breakdown</Text>
              <View style={styles.pillRow}>
                <ScorePill label="Bot Check"  score={ml.pillar1Score       ?? 0} good={true}  />
                <ScorePill label="Disruption" score={ml.envDisruptionScore ?? 0} good={true}  />
                <ScorePill label="Work Proof" score={ml.pillar3Score       ?? 0} good={true}  />
                <ScorePill label="Ring Risk"  score={ml.pillar4RingRisk    ?? 0} good={false} />
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Trust Score</Text>
                  <Text style={[styles.metaValue, { color: colors.primary }]}>{(ml.trustScore ?? 0).toFixed(3)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Decision</Text>
                  <Text style={[styles.metaValue, { color: claimResult?.claim?.status === 'PAID' ? colors.success : colors.warning }]}>
                    {claimResult?.claim?.status}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Chain</Text>
                  <Text style={[styles.metaValue, { color: ml.isChainValid ? colors.success : colors.danger }]}>
                    {ml.isChainValid ? '✓ Valid' : '✗ Broken'}
                  </Text>
                </View>
              </View>
            </View>
          ) : insideZone ? (
            <View>
              <View style={styles.rowGap}>
                <CloudLightning color={colors.textPrimary} size={20} />
                <Text style={styles.panelTitle}>{insideZone.label}</Text>
              </View>
              <Text style={styles.panelSub}>You are inside a verified disruption zone.</Text>
              <View style={[styles.infoCard, { borderColor: colors.danger + '44' }]}>
                <Text style={styles.infoCardText}>
                  Disruption Score: {Math.round((insideZone.score ?? 0) * 100)}%{'\n'}
                  Pillar 2 environmental consensus confirmed this event using live Open-Meteo weather + AQI data for {insideZone.city}.
                </Text>
              </View>
              <TouchableOpacity style={styles.ctaButton} onPress={handleFileClaim} disabled={claimLoading}>
                {claimLoading ? <ActivityIndicator color="#fff" /> : (
                  <View style={styles.ctaRow}>
                    <ShieldCheck color="#fff" size={18} />
                    <Text style={styles.ctaText}>File Claim Now</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.panelTitle}>Live Disruption Map</Text>
              <Text style={styles.panelSub}>Tap any zone or cluster marker to learn more.</Text>
              <View style={styles.legendRow}>
                {[
                  { color: colors.danger,  label: 'Disruption Zone' },
                  { color: colors.warning, label: 'Fraud Ring Alert' },
                  { color: colors.primary, label: 'Your Location'    },
                ].map((l) => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Light map style (matches web stone palette) ────────────────────────────
const LIGHT_MAP_STYLE = [
  { elementType: 'geometry',              stylers: [{ color: '#f5f5f4' }] },
  { elementType: 'labels.text.fill',      stylers: [{ color: '#78716c' }] },
  { elementType: 'labels.text.stroke',    stylers: [{ color: '#fafaf9' }] },
  { featureType: 'road',  elementType: 'geometry',        stylers: [{ color: '#e7e5e4' }] },
  { featureType: 'road',  elementType: 'geometry.stroke', stylers: [{ color: '#d6d3d1' }] },
  { featureType: 'road',  elementType: 'labels.text.fill',stylers: [{ color: '#78716c' }] },
  { featureType: 'water', elementType: 'geometry',        stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'poi',   stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1d4ed8' }] },
];

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  center:     { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  errorSub:   { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // HUD
  hud:        { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 44, left: 0, right: 0, paddingHorizontal: spacing.md },
  hudTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hudPill:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface + 'F0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  dot:        { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  hudText:    { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  alertBanner:{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.danger + '55', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, gap: spacing.sm },
  alertTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.danger },
  alertSub:   { fontSize: fontSize.sm, color: colors.textSecondary },

  // Markers
  workerDotOuter:{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary + '44' },
  workerDotInner:{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  zoneLabel:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.danger + '55', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  zoneLabelText: { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: '700' },
  clusterMarker: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.warning + '55', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  clusterText:   { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: '700' },

  // CTA
  ctaContainer:  { position: 'absolute', bottom: PANEL_PEEK + 12, left: spacing.md, right: spacing.md },
  ctaButton:     { backgroundColor: '#1e3a8a', paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center', shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  ctaLoading:    { opacity: 0.7 },
  ctaRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText:       { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  // Panel
  panel:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12 },
  panelHandle:   { alignItems: 'center', paddingVertical: 12 },
  handleBar:     { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  panelContent:  { paddingHorizontal: spacing.md, paddingBottom: 48 },
  panelTitle:    { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  panelSub:      { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  sectionLabel:  { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  infoCard:      { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  infoCardText:  { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  riskBadge:     { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  riskBadgeText: { fontSize: fontSize.sm, fontWeight: '700' },
  rowGap:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },

  // Pills
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill:       { flex: 1, minWidth: (SCREEN_W - 64) / 2 - 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, alignItems: 'center' },
  pillLabel:  { fontSize: fontSize.xs, fontWeight: '600', marginBottom: 2 },
  pillValue:  { fontSize: fontSize.xl, fontWeight: '800' },

  // Meta
  metaRow:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metaItem: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  metaLabel:{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  metaValue:{ fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },

  // Legend
  legendRow:  { gap: spacing.sm, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: fontSize.md, color: colors.textSecondary },
});
