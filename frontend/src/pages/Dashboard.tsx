import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, X, User, Phone, MapPin, Bike, Briefcase, Wallet, LogOut,
  ShieldCheck, TrendingUp, Activity, Cloud, Zap, ChevronRight, Clock,
  Bell, History, CheckCircle2, AlertCircle, Timer, Cpu, Link2, WifiOff,
  Sun, Moon, ChevronUp, ChevronDown, List, Radar, CloudLightning
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API_BASE_URL from '../lib/api';
import { useTheme } from '../lib/ThemeContext';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type TabId = 'overview' | 'sessions' | 'claims';

interface SessionRecord {
  id: string;
  startTime: string;
  endTime: string | null;
  activeMinutes: number;
  durationMins: number;
  heartbeatCount: number;
  ipCity: string;
  ipAddress: string;
  isChainValid: boolean;
  platformActiveFlag: boolean;
}

function fmtMs(ms: number) {
  if (!ms || ms === 0) return '0ms';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function statusColor(status: string) {
  if (status === 'PAID') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
  if (status === 'REVIEW') return { bg: 'bg-amber-100', text: 'text-amber-700' };
  return { bg: 'bg-rose-100', text: 'text-rose-700' };
}

/* ─── Mini coverage bar ───────────────────────────────────────────────────── */
function CoverageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-stone-500 mb-1.5 font-medium">
        <span>₹{used.toLocaleString()} used</span>
        <span>₹{total.toLocaleString()} total</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 mt-1">{(100 - pct).toFixed(0)}% coverage remaining</p>
    </div>
  );
}

/* ─── Map Helpers ─────────────────────────────────────────────────────────── */
const createLabelIcon = (label: string) => L.divIcon({
  html: `<div style="background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);border:1.5px solid #fca5a5;border-radius:8px;padding:2px 8px;font-size:11px;font-weight:700;color:#e11d48;white-space:nowrap;display:inline-block;transform:translate(-50%,-100%);margin-top:-5px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">${label}</div>`,
  iconAnchor: [0, 0],
  className: ''
});

/* ─── Component ───────────────────────────────────────────────────────────── */
const MapUpdater = ({ center }: { center: any }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapRecenter = ({ center, isPanelOpen, onRefreshLocation }: { center: any, isPanelOpen: boolean, onRefreshLocation?: () => void }) => {
  const map = useMap();
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className={`absolute right-4 md:right-8 z-[400] transition-all duration-500 pointer-events-auto ${isPanelOpen ? 'bottom-[78vh] md:bottom-8' : 'bottom-[14vh] md:bottom-8'}`}>
      <button
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          if (onRefreshLocation) {
             setIsRefreshing(true);
             onRefreshLocation();
             setTimeout(() => setIsRefreshing(false), 1000);
          }
          map.setView(center, 14); 
        }}
        className="p-4 rounded-full md:rounded-2xl shadow-xl border border-stone-200/50 backdrop-blur-md bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800 transition cursor-pointer flex items-center justify-center active:scale-95"
        title="Recenter Map"
      >
        <MapPin className={`w-5 h-5 md:w-6 md:h-6 ${isRefreshing ? 'animate-bounce text-emerald-500' : ''}`} />
      </button>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  /* profile / policy */
  const [profile, setProfile] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('kavachpay_user') || 'null'); } catch { return null; }
  });
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isPanelOpen, setIsPanelOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);

  /* map */
  const [mapData, setMapData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  /* work-proof engine */
  const [workProofActive, setWorkProofActive] = useState(false);
  const [sessionActiveMinutes, setSessionActiveMinutes] = useState(0);
  const [sessionHash, setSessionHash] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestClaim, setLatestClaim] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const lastInteractionRef = useRef<number>(Date.now());
  const interactionsCountRef = useRef<number>(0);
  const hiddenSwitchCountRef = useRef<number>(0);
  const [activityStats, setActivityStats] = useState<any>({
    activeMinutes: 0, heartbeatCount: 0, sessionAgeMins: 0,
    lastHeartbeatAgoMins: null, avgHeartbeatGapMs: 0, jitterMs: 0,
    localInteractions: 0, hiddenSwitches: 0,
  });

  /* sessions tab */
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  /* ─── Initial data fetch ─────────────────────────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) { navigate('/signup'); return; }

    const fetchData = async () => {
      const h = { Authorization: `Bearer ${token}` };
      try {
        const [policyRes, profileRes, claimRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/policy`, { headers: h }),
          fetch(`${API_BASE_URL}/api/user/profile`, { headers: h }),
          fetch(`${API_BASE_URL}/api/claim/history`, { headers: h }),
        ]);

        if (profileRes.status === 401 || profileRes.status === 403) {
          localStorage.removeItem('kavachpay_token');
          localStorage.removeItem('kavachpay_user');
          navigate('/signin'); return;
        }

        if (policyRes.ok) {
          const pd = await policyRes.json();
          setPolicy(pd);
          if (!pd) setShowModal(true);
        }

        if (profileRes.ok) {
          const pd = await profileRes.json();
          const cached = (() => { try { return JSON.parse(localStorage.getItem('kavachpay_user') || 'null'); } catch { return null; } })();
          const merged = { ...cached, ...pd, role: pd.role ?? cached?.role };
          setProfile(merged);
          localStorage.setItem('kavachpay_user', JSON.stringify(merged));
        }

        if (claimRes.ok) {
          const cl = await claimRes.json();
          setClaims(cl);
          if (cl.length > 0) setLatestClaim(cl[0]);
        }
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, refreshKey]);

  /* ─── Map data fetch ─────────────────────────────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token || !profile) return;
    const fetchMapData = async () => {
      try {
        const city = profile?.city || 'Mumbai';
        const r = await fetch(`${API_BASE_URL}/api/claim/map-data?city=${encodeURIComponent(city)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) setMapData(await r.json());
      } catch (err) {
        console.error('Map fetch failed', err);
      }
    };
    fetchMapData();
    const interval = setInterval(fetchMapData, 60000);
    return () => clearInterval(interval);
  }, [profile?.city]);

  /* ─── Heartbeat engine ───────────────────────────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
      interactionsCountRef.current += 1;
    };
    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    for (const e of activityEvents) window.addEventListener(e, markInteraction, { passive: true });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenSwitchCountRef.current += 1;
      markInteraction();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const refreshStats = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/session/activity-stats`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const s = await r.json();
          setSessionActiveMinutes(s.activeMinutes || 0);
          setActivityStats({ ...s, localInteractions: interactionsCountRef.current, hiddenSwitches: hiddenSwitchCountRef.current });
        }
      } catch (err) { console.error('Stats fetch failed', err); }
    };

    const sendHeartbeat = async () => {
      if (Date.now() - lastInteractionRef.current > 30 * 60 * 1000) { setWorkProofActive(false); return; }
      try {
        const r = await fetch(`${API_BASE_URL}/api/session/heartbeat`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const d = await r.json();
          setWorkProofActive(true);
          setSessionActiveMinutes(d.activeMinutes);
          setSessionHash(d.sessionHash);
          await refreshStats();
        } else { setWorkProofActive(false); }
      } catch { setWorkProofActive(false); }
    };

    markInteraction();
    sendHeartbeat();
    refreshStats();

    const hbInterval = setInterval(sendHeartbeat, 60000);
    const statsInterval = setInterval(refreshStats, 30000);
    return () => {
      clearInterval(hbInterval);
      clearInterval(statsInterval);
      for (const e of activityEvents) window.removeEventListener(e, markInteraction);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /* ─── Session history loader ─────────────────────────────────────────── */
  useEffect(() => {
    if (activeTab !== 'sessions') return;
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;
    setSessionsLoading(true);
    fetch(`${API_BASE_URL}/api/session/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setSessionHistory)
      .catch(() => setSessionHistory([]))
      .finally(() => setSessionsLoading(false));
  }, [activeTab, refreshKey]);

  /* ─── Actions ────────────────────────────────────────────────────────── */
  const triggerSimulation = async () => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;
    setIsSimulating(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/claim/simulate-disruption`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setLatestClaim(d.claim);
        setClaims(prev => [d.claim, ...prev]);
        setRefreshKey(k => k + 1); // trigger map refresh
      }
    } catch (err) { console.error('Simulation failed', err); }
    finally { setIsSimulating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('kavachpay_token');
    localStorage.removeItem('kavachpay_user');
    navigate('/');
  };

  /* ─── Loading / error screens ────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-stone-500 font-medium">Loading map interface...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <p className="text-rose-500 font-medium text-lg">Failed to load profile</p>
        <button onClick={() => { setLoading(true); setRefreshKey(v => v + 1); }} className="mt-4 px-6 py-2 bg-stone-200 text-stone-800 rounded-full font-medium hover:bg-stone-300 transition cursor-pointer">Retry</button>
      </div>
    </div>
  );

  const paidClaims = claims.filter(c => c.status === 'PAID');
  const totalPaidOut = paidClaims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0);
  const daysLeft = policy ? Math.max(0, Math.round((new Date(policy.endDate).getTime() - Date.now()) / 86400000)) : 0;
  
  const mapCenter = userLocation || (mapData?.disruptionZones?.[0] 
    ? [mapData.disruptionZones[0].lat, mapData.disruptionZones[0].lon] 
    : [19.076, 72.877]); // Default to Mumbai

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <main className={`h-screen w-screen overflow-hidden relative flex flex-col ${isDark ? 'dark bg-stone-900 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* ── FULL SCREEN MAP ──────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter as any} zoom={14} zoomControl={false} style={{ width: '100%', height: '100%' }}>
          <MapUpdater center={mapCenter} />
          <MapRecenter center={mapCenter} isPanelOpen={isPanelOpen} onRefreshLocation={fetchLocation} />
          <TileLayer
            url={isDark 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          {mapData?.disruptionZones?.map((z: any, i: number) => (
            <React.Fragment key={i}>
              <Circle
                center={[z.lat, z.lon]}
                radius={z.radiusMeters}
                pathOptions={{ color: '#e11d48', fillColor: '#e11d48', fillOpacity: 0.12, weight: 2 }}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-stone-900 text-sm mb-1">{z.label}</h3>
                    <p className="text-xs text-stone-500 my-0.5">Score: <span className="font-bold text-rose-600">{Math.round(z.score * 100)}%</span></p>
                    <p className="text-xs text-stone-500 my-0.5">Type: {z.type}</p>
                  </div>
                </Popup>
              </Circle>
              <Marker position={[z.lat, z.lon]} icon={createLabelIcon(z.label)} />
            </React.Fragment>
          ))}
          {mapData?.fraudClusters?.map((c: any, i: number) => {
            const col = c.riskLevel === 'high' ? '#e11d48' : '#d97706';
            return (
              <CircleMarker
                key={'c'+i}
                center={[c.lat, c.lon]}
                radius={14 + c.count}
                pathOptions={{ color: col, fillColor: col, fillOpacity: 0.75, weight: 2 }}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-stone-900 text-sm mb-1">Fraud Ring</h3>
                    <p className="text-xs text-stone-500 my-0.5"><b>{c.count}</b> claims</p>
                    <p className="text-xs text-stone-500 my-0.5">Risk: <span className={`font-bold ${c.riskLevel === 'high' ? 'text-rose-600' : 'text-amber-600'}`}>{c.riskLevel.toUpperCase()}</span></p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
          
          {/* User Heartbeat */}
          {workProofActive && (
            <Marker position={(userLocation || [mapCenter[0] - 0.015, mapCenter[1] - 0.01]) as any} icon={L.divIcon({
              html: `<div class="relative flex items-center justify-center w-6 h-6"><div class="absolute w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div></div>`,
              className: '',
              iconAnchor: [12, 12]
            })} />
          )}
        </MapContainer>
      </div>

      {/* ── FLOATING OVERLAYS (HUD) ──────────────────────────────────── */}
      
      {/* 1. Header Navbar */}
      <nav className="absolute top-0 inset-x-0 z-10 px-4 py-4 md:px-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-sm border border-stone-200/50 w-fit">
              <img src="/KavachPay_logo.png" alt="KavachPay" className="w-7 h-7 object-contain" />
              <span className="text-lg font-bold tracking-tight text-stone-900">KavachPay</span>
            </button>
            
            {/* Live Pill */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl shadow-sm border border-stone-200/50 backdrop-blur-md max-w-xs ${isDark ? 'bg-stone-900/90' : 'bg-white/90'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Radar className={`w-4 h-4 ${workProofActive ? 'text-emerald-500' : 'text-stone-400'}`} />
                  <span className={`text-xs font-bold ${workProofActive ? 'text-emerald-600' : 'text-stone-500'}`}>
                    {workProofActive ? 'BEACON ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                {workProofActive && (
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                )}
              </div>
              {sessionHash && (
                <div className="text-[10px] font-mono text-stone-500 break-all bg-stone-100/50 dark:bg-stone-800/50 p-1.5 rounded-lg border border-stone-200/50 dark:border-stone-700/50 leading-tight">
                  {sessionHash}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl shadow-sm border border-stone-200/50 backdrop-blur-md transition cursor-pointer ${isDark ? 'bg-stone-900/90 text-stone-400' : 'bg-white/90 text-stone-600'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-full shadow-sm border border-stone-200/50 backdrop-blur-md transition cursor-pointer ${isDark ? 'bg-stone-900/90' : 'bg-white/90'}`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User className="w-4 h-4" />
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                {profile.fullName.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Weather/Policy Index (Top Right below Header) */}
      <div className="absolute top-20 right-4 md:right-6 z-10 hidden sm:flex flex-col gap-3 pointer-events-none">
        {/* Protection Status */}
        <div className={`p-4 rounded-2xl shadow-sm border border-stone-200/50 backdrop-blur-md pointer-events-auto ${isDark ? 'bg-stone-900/90' : 'bg-white/90'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${daysLeft > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Protection Status</p>
              <p className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {daysLeft > 0 ? `${daysLeft} Days Left` : 'No Policy'}
              </p>
            </div>
          </div>
        </div>

        {/* Local Weather */}
        <div className={`p-4 rounded-2xl shadow-sm border border-stone-200/50 backdrop-blur-md pointer-events-auto ${isDark ? 'bg-stone-900/90' : 'bg-white/90'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mapData?.disruptionZones?.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
              {mapData?.disruptionZones?.length > 0 ? <CloudLightning className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Local Weather</p>
              <p className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {mapData?.disruptionZones?.length > 0 ? 'Severe Alert' : 'Clear Skies'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SHEET / SIDE PANEL ────────────────────────────────── */}
      <div 
        className={`absolute z-20 flex flex-col transition-all duration-500 ease-in-out shadow-2xl
          ${isDark ? 'bg-stone-900/95 border-stone-800' : 'bg-white/95 border-stone-200'} backdrop-blur-xl border
          
          /* Mobile layout (bottom sheet) */
          inset-x-0 bottom-0 rounded-t-[2.5rem]
          ${isPanelOpen ? 'h-[75vh]' : 'h-[12vh]'}
          
          /* Desktop layout (side panel) */
          md:inset-auto md:left-6 md:top-[11rem] md:bottom-6 md:w-[420px] md:rounded-[2rem] md:h-auto
        `}
      >
        {/* Drag handle & Header */}
        <div 
          className="px-6 py-4 cursor-pointer flex-shrink-0 relative group"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <div className={`w-12 h-1.5 rounded-full mx-auto mb-4 md:hidden transition-colors ${isDark ? 'bg-stone-700 group-hover:bg-stone-600' : 'bg-stone-300 group-hover:bg-stone-400'}`} />
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>Dashboard</h2>
            <button className="md:hidden p-2 -mr-2 text-stone-400">
              {isPanelOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
               {([
                { id: 'overview', icon: <Activity className="w-4 h-4" /> },
                { id: 'claims', icon: <TrendingUp className="w-4 h-4" /> },
                { id: 'sessions', icon: <History className="w-4 h-4" /> },
              ] as Array<{ id: TabId; icon: React.ReactNode }>).map(tab => (
                <button
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                  className={`p-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                >
                  {tab.icon}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'claims', label: 'Claims' },
              { id: 'sessions', label: 'Sessions' },
            ] as Array<{ id: TabId; label: string }>).map(tab => (
              <button
                key={tab.id}
                onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); setIsPanelOpen(true); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? (isDark ? 'bg-stone-800 text-white' : 'bg-stone-900 text-white')
                    : (isDark ? 'bg-stone-800/50 text-stone-400' : 'bg-stone-100 text-stone-500')
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content (Scrollable) */}
        <div className={`flex-1 overflow-y-auto px-6 pb-24 md:pb-6 custom-scrollbar transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
          
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Coverage / Policy */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>Active Policy</h3>
                      <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{policy?.planTier || 'No Plan'}</p>
                    </div>
                  </div>
                </div>
                
                {policy ? (
                  <>
                    <CoverageBar used={totalPaidOut} total={policy.coverageAmount || 0} />
                    <button onClick={() => navigate('/policy')} className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition ${isDark ? 'bg-stone-700 hover:bg-stone-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-800'}`}>
                      Manage Coverage
                    </button>
                  </>
                ) : (
                  <button onClick={() => navigate('/policy')} className="w-full bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition text-sm">
                    Activate Protection
                  </button>
                )}
              </div>

              {/* Activity Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Activity className="w-4 h-4 text-emerald-500" />, label: 'Active Min', val: `${sessionActiveMinutes} min` },
                  { icon: <Timer className="w-4 h-4 text-indigo-500" />, label: 'Total Session', val: `${activityStats.sessionAgeMins || 0} min` },
                  { icon: <Zap className="w-4 h-4 text-amber-500" />, label: 'Heartbeats', val: activityStats.heartbeatCount || 0 },
                  { icon: <Cpu className="w-4 h-4 text-blue-500" />, label: 'Beat Gap', val: fmtMs(activityStats.avgHeartbeatGapMs) },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl p-3.5 border ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {s.icon}
                      <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{s.label}</span>
                    </div>
                    <p className={`text-lg font-bold leading-none ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Work-Proof Diagnostics */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Radar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>Work-Proof Diagnostics</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Jitter', val: fmtMs(activityStats.jitterMs) },
                    { label: 'Inputs', val: activityStats.localInteractions || 0 },
                    { label: 'Switches', val: activityStats.hiddenSwitches || 0 },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-100'}`}>
                      <p className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{s.label}</p>
                      <p className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Claims Mini */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>Recent Claims</h3>
                  <button onClick={() => setActiveTab('claims')} className="text-xs text-emerald-600 font-semibold">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {claims.slice(0,2).map(claim => (
                    <div key={claim.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>{(claim.triggerEvent || '').replace(/_/g, ' ')}</p>
                        <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{fmt(claim.createdAt)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor(claim.status).bg} ${statusColor(claim.status).text}`}>
                        {claim.status}
                      </span>
                    </div>
                  ))}
                  {claims.length === 0 && <p className="text-sm text-stone-500">No recent claims.</p>}
                </div>
              </div>

            </div>
          )}

          {/* ── CLAIMS TAB ── */}
          {activeTab === 'claims' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {claims.length === 0 ? (
                <div className={`p-8 rounded-2xl text-center border ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200/50'}`}>
                  <ShieldAlert className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                  <p className={`font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>No claims filed yet</p>
                  <p className="text-xs text-stone-500 mt-1">Simulate a disruption to test</p>
                </div>
              ) : claims.map(claim => (
                <div key={claim.id} className={`rounded-xl p-4 border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusColor(claim.status).bg} ${statusColor(claim.status).text}`}>
                      {claim.status}
                    </span>
                    <span className="text-[10px] text-stone-400">{fmt(claim.createdAt)}</span>
                  </div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{(claim.triggerEvent || '').replace(/_/g, ' ')}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      {claim.isChainValid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                      <span className="text-[10px] text-stone-500">{claim.isChainValid ? 'Chain OK' : 'Invalid'}</span>
                    </div>
                    {claim.payoutAmount > 0 && <p className="text-sm font-bold text-emerald-600">₹{claim.payoutAmount}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SESSIONS TAB ── */}
          {activeTab === 'sessions' && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {sessionsLoading ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin" /></div>
              ) : sessionHistory.length === 0 ? (
                <div className={`p-8 rounded-2xl text-center border ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200/50'}`}>
                  <History className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                  <p className={`font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>No sessions recorded</p>
                </div>
              ) : sessionHistory.map(s => (
                <div key={s.id} className={`rounded-xl p-4 border flex items-center justify-between ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{fmt(s.startTime)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-stone-500">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-500" /> {s.activeMinutes}m</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.ipCity || '—'}</span>
                    </div>
                  </div>
                  {s.isChainValid ? <Link2 className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FLOATING ACTION BUTTON (Simulate Disruption) ── */}
      <div className={`absolute right-20 md:right-28 z-30 transition-all duration-500 pointer-events-auto ${isPanelOpen ? 'bottom-[78vh] md:bottom-8' : 'bottom-[14vh] md:bottom-8'}`}>
        <button
          onClick={triggerSimulation}
          disabled={isSimulating || !policy}
          className={`flex items-center justify-center gap-2 p-4 md:px-6 md:py-4 rounded-full md:rounded-2xl font-bold shadow-xl transition-all active:scale-95 ${
            !policy 
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'
          }`}
        >
          {isSimulating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Cloud className="w-5 h-5" />}
          <span className="hidden md:inline">{isSimulating ? 'Simulating...' : 'Simulate Disruption'}</span>
        </button>
      </div>

      {/* ── Profile Sidebar & No Policy Modal remain mostly unchanged ── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className={`relative w-full max-w-full sm:max-w-sm shadow-2xl h-full overflow-y-auto ${isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'}`}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Profile</h2>
                <button onClick={() => setIsProfileOpen(false)} className={`p-2 rounded-xl transition ${isDark ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-100 hover:bg-stone-200'}`}>
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">{profile.fullName}</h3>
                <p className="text-stone-500 text-sm">{profile.email}</p>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  { icon: <Phone className="w-4 h-4 text-stone-400" />, label: 'Phone', val: profile.phone },
                  { icon: <MapPin className="w-4 h-4 text-stone-400" />, label: 'City', val: profile.city },
                  { icon: <Briefcase className="w-4 h-4 text-stone-400" />, label: 'Platform', val: profile.deliveryPlatform },
                  { icon: <Bike className="w-4 h-4 text-stone-400" />, label: 'Vehicle', val: profile.vehicleType },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl ${isDark ? 'bg-stone-800/50' : 'bg-stone-50'}`}>
                    {row.icon}
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">{row.label}</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{row.val || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 font-semibold rounded-xl hover:bg-rose-100 transition cursor-pointer">
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className={`relative rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center ${isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'}`}>
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Active Policy</h3>
            <p className="text-stone-500 mb-8">You need an active policy to access weather protection and instant payouts.</p>
            <button onClick={() => navigate('/policy')} className="w-full bg-emerald-500 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-400 transition cursor-pointer">
              Activate Policy
            </button>
            <button onClick={() => setShowModal(false)} className="w-full mt-3 text-stone-500 font-medium py-3 hover:text-stone-400 transition cursor-pointer">
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;