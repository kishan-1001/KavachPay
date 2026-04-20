import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Platform, Alert, Dimensions,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Svg, Path, Circle as SvgCircle } from 'react-native-svg';
import { colors, spacing, radius, fontSize } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────

interface DisruptionZone {
  id:          string;
  city:        string;
  lat:         number;
  lon:         number;
  radiusMeters:number;
  score:       number;
  type:        'weather' | 'aqi' | 'combined';
  label:       string;
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
  const R    = 6371000; // earth radius m
  const dLat = ((zone.lat - lat) * Math.PI) / 180;
  const dLon = ((zone.lon - lon) * Math.PI) / 180;
  const a    = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((zone.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= zone.radiusMeters;
}

// ── Score pill component ─────────────────────────────────────────────────────

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
  const sheetRef = useRef<BottomSheet>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [location,         setLocation]         = useState<Location.LocationObject | null>(null);
  const [locationError,    setLocationError]     = useState(false);
  const [insideZone,       setInsideZone]       = useState<DisruptionZone | null>(null);
  const [claimLoading,     setClaimLoading]     = useState(false);
  const [claimResult,      setClaimResult]      = useState<any>(null);
  const [selectedCluster,  setSelectedCluster]  = useState<FraudCluster | null>(null);
  const snapPoints = useMemo(() => ['30%', '65%'], []);

  // ── Pulse animation for fraud ring markers ────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
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

  // ── Fetch map data (disruptions + clusters) every 30s ────────────────────
  const { data: mapData, isLoading: mapLoading } = useQuery<MapData>({
    queryKey: ['mapData', user?.city],
    queryFn:  async () => {
      const res = await api.get('/api/claim/map-data', { params: { city: user?.city ?? 'Mumbai' } });
      return res.data;
    },
    refetchInterval: 30_000,
    enabled: !!user,
    // Graceful fallback if backend endpoint not yet deployed
    placeholderData: {
      disruptionZones: [
        {
          id: 'z1', city: user?.city ?? 'Mumbai',
          lat: 19.076, lon: 72.877, radiusMeters: 3000,
          score: 0.72, type: 'weather', label: 'Heavy Rain — IMD Alert',
        },
        {
          id: 'z2', city: user?.city ?? 'Mumbai',
          lat: 19.060, lon: 72.860, radiusMeters: 1800,
          score: 0.61, type: 'aqi', label: 'Hazardous AQI > 250',
        },
      ],
      fraudClusters: [
        { id: 'c1', lat: 19.090, lon: 72.895, count: 7, riskLevel: 'high' },
      ],
      activeWorkers: 124,
    },
  });

  // ── Check if worker is inside any disruption zone ─────────────────────────
  useEffect(() => {
    if (!location || !mapData) return;
    const { latitude, longitude } = location.coords;
    const hit = mapData.disruptionZones.find((z) => isInsideZone(latitude, longitude, z));
    setInsideZone(hit ?? null);
  }, [location, mapData]);

  // ── File a claim ─────────────────────────────────────────────────────────
  const handleFileClaim = useCallback(async () => {
    setClaimLoading(true);
    setClaimResult(null);
    sheetRef.current?.expand();
    try {
      const res = await api.post('/api/claim/simulate-disruption');
      setClaimResult(res.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to process claim');
    } finally {
      setClaimLoading(false);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorSub}>KavachPay needs location access to detect disruptions near you.</Text>
      </View>
    );
  }

  const ml = claimResult?.mlBreakdown;

  return (
    <View style={styles.container}>
      {/* ── Map ─────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        customMapStyle={darkMapStyle}
        showsUserLocation={false}
        initialRegion={{
          latitude:       location?.coords.latitude  ?? 19.076,
          longitude:      location?.coords.longitude ?? 72.877,
          latitudeDelta:  0.04,
          longitudeDelta: 0.04,
        }}
        onPress={() => { setSelectedCluster(null); sheetRef.current?.snapToIndex(0); }}
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
              onPress={() => sheetRef.current?.snapToIndex(0)}
            >
              <View style={styles.zoneLabel}>
                <Text style={styles.zoneLabelText}>⛈ {zone.label}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Fraud ring cluster markers */}
        {mapData?.fraudClusters.map((cluster) => (
          <Marker
            key={cluster.id}
            coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => { setSelectedCluster(cluster); sheetRef.current?.snapToIndex(0); }}
          >
            <View style={styles.clusterMarker}>
              <Text style={styles.clusterText}>⚠ {cluster.count}</Text>
            </View>
          </Marker>
        ))}

        {/* Worker location dot */}
        {location && (
          <Marker
            coordinate={{
              latitude:  location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.workerDotOuter}>
              <View style={styles.workerDotInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── HUD overlay ─────────────────────────────────────── */}
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
            <Text style={styles.alertIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Disruption Detected</Text>
              <Text style={styles.alertSub}>{insideZone.label}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Claim CTA ───────────────────────────────────────── */}
      {insideZone && !claimResult && (
        <View style={styles.ctaContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.ctaButton, claimLoading && styles.ctaLoading]}
            onPress={handleFileClaim}
            disabled={claimLoading}
          >
            {claimLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>🛡 File Disruption Claim</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Sheet ─────────────────────────────────────── */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {selectedCluster ? (
            /* Fraud ring info */
            <View>
              <Text style={styles.sheetTitle}>⚠️ Fraud Ring Alert</Text>
              <Text style={styles.sheetSub}>
                {selectedCluster.count} suspicious claims detected in this area within the last 6 hours.
              </Text>
              <View style={[styles.infoCard, { borderColor: colors.danger + '44' }]}>
                <Text style={styles.infoCardText}>
                  Our Pillar 4 GNN has flagged a coordinated claim cluster originating from the same /24 IP subnet
                  and overlapping minute windows — a classic Telegram fraud ring signature.
                </Text>
              </View>
              <View style={styles.riskBadge}>
                <Text style={[styles.riskBadgeText, { color: selectedCluster.riskLevel === 'high' ? colors.danger : colors.warning }]}>
                  {selectedCluster.riskLevel === 'high' ? '🔴 HIGH RISK' : '🟡 MEDIUM RISK'} cluster
                </Text>
              </View>
            </View>
          ) : ml ? (
            /* Claim ML result */
            <View>
              <Text style={styles.sheetTitle}>
                {claimResult?.claim?.status === 'PAID' ? '✅ Claim Approved' : '⏳ Under Review'}
              </Text>
              <Text style={styles.sheetSub}>
                Payout: ₹{claimResult?.claim?.payoutAmount ?? 0}
              </Text>
              <Text style={styles.sectionLabel}>ML Breakdown</Text>
              <View style={styles.pillRow}>
                <ScorePill label="Bot Check"   score={ml.pillar1Score    ?? 0} good={true}  />
                <ScorePill label="Disruption"  score={ml.envDisruptionScore ?? 0} good={true}  />
                <ScorePill label="Work Proof"  score={ml.pillar3Score    ?? 0} good={true}  />
                <ScorePill label="Ring Risk"   score={ml.pillar4RingRisk ?? 0} good={false} />
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
                  <Text style={styles.metaLabel}>Chain Valid</Text>
                  <Text style={[styles.metaValue, { color: ml.isChainValid ? colors.success : colors.danger }]}>
                    {ml.isChainValid ? '✓ YES' : '✗ NO'}
                  </Text>
                </View>
              </View>
            </View>
          ) : insideZone ? (
            /* Pre-claim info */
            <View>
              <Text style={styles.sheetTitle}>⛈ {insideZone.label}</Text>
              <Text style={styles.sheetSub}>You are inside a verified disruption zone.</Text>
              <View style={[styles.infoCard, { borderColor: colors.danger + '44' }]}>
                <Text style={styles.infoCardText}>
                  Disruption Score: {Math.round((insideZone.score ?? 0) * 100)}%{'\n'}
                  Our Pillar 2 environmental consensus model has confirmed this event using
                  live Open-Meteo weather data, AQI readings, and news signals for {insideZone.city}.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleFileClaim}
                disabled={claimLoading}
              >
                {claimLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.ctaText}>🛡  File Claim Now</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            /* Default state */
            <View>
              <Text style={styles.sheetTitle}>Live Disruption Map</Text>
              <Text style={styles.sheetSub}>Tap any zone or cluster on the map to learn more.</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>Disruption Zone</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                  <Text style={styles.legendText}>Fraud Ring Alert</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.legendText}>Your Location</Text>
                </View>
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

// ── Dark map style (Google Maps JSON) ────────────────────────────────────────
const darkMapStyle = [
  { elementType: 'geometry',   stylers: [{ color: '#0f1923' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1923' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#6b7280' }] },
  { featureType: 'road',       elementType: 'geometry',       stylers: [{ color: '#1c2d40' }] },
  { featureType: 'road',       elementType: 'geometry.stroke',stylers: [{ color: '#0e1c2a' }] },
  { featureType: 'road',       elementType: 'labels.text.fill',stylers: [{ color: '#4b5563' }] },
  { featureType: 'water',      elementType: 'geometry',       stylers: [{ color: '#0a1628' }] },
  { featureType: 'water',      elementType: 'labels.text.fill',stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'poi',        stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',    stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#4b7ab5' }] },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  map:          { flex: 1 },
  center:       { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorIcon:    { fontSize: 48, marginBottom: spacing.md },
  errorTitle:   { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  errorSub:     { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // HUD
  hud:          { position: 'absolute', top: 56, left: 0, right: 0, paddingHorizontal: spacing.md },
  hudTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hudPill:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface + 'EE', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  dot:          { width: 7, height: 7, borderRadius: radius.full, marginRight: 6 },
  hudText:      { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  alertBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.danger + '55', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, gap: spacing.sm },
  alertIcon:    { fontSize: 20 },
  alertTitle:   { fontSize: fontSize.md, fontWeight: '700', color: colors.danger },
  alertSub:     { fontSize: fontSize.sm, color: colors.textSecondary },

  // Markers
  workerDotOuter:{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  workerDotInner:{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  zoneLabel:    { backgroundColor: colors.dangerBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.danger + '55' },
  zoneLabelText:{ fontSize: fontSize.xs, color: colors.danger, fontWeight: '700' },
  clusterMarker:{ backgroundColor: colors.warningBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.warning + '55' },
  clusterText:  { fontSize: fontSize.xs, color: colors.warning, fontWeight: '700' },

  // CTA
  ctaContainer: { position: 'absolute', bottom: 90, left: spacing.md, right: spacing.md },
  ctaButton:    { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  ctaLoading:   { opacity: 0.7 },
  ctaText:      { fontSize: fontSize.lg, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // Bottom sheet
  sheetBg:      { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetContent: { padding: spacing.md, paddingBottom: 48 },
  sheetTitle:   { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  sheetSub:     { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  infoCard:     { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  infoCardText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  riskBadge:    { alignSelf: 'flex-start', backgroundColor: colors.dangerBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  riskBadgeText:{ fontSize: fontSize.sm, fontWeight: '700' },

  // Pills
  pillRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill:         { flex: 1, minWidth: (SCREEN_W - 64) / 2 - 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, alignItems: 'center' },
  pillLabel:    { fontSize: fontSize.xs, fontWeight: '600', marginBottom: 2 },
  pillValue:    { fontSize: fontSize.xl, fontWeight: '800' },

  // Meta
  metaRow:      { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metaItem:     { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  metaLabel:    { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  metaValue:    { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },

  // Legend
  legendRow:    { gap: spacing.sm, marginTop: spacing.sm },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot:    { width: 10, height: 10, borderRadius: 5 },
  legendText:   { fontSize: fontSize.md, color: colors.textSecondary },
});
