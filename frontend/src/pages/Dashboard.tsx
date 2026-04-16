import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, X, User, Phone, MapPin, Bike, Briefcase, Wallet, LogOut,
  ShieldCheck, TrendingUp, Activity, Cloud, Zap, ChevronRight, Clock,
  Bell, History, CheckCircle2, AlertCircle, Timer, Cpu, Link2, WifiOff,
  Moon, Sun,
} from 'lucide-react';
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
      <div className="flex justify-between text-xs text-stone-400 mb-1.5">
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

/* ─── Component ───────────────────────────────────────────────────────────── */
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
          // FIX: show server-confirmed activeMinutes (heartbeat count), NOT sessionAgeMins
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
        <p className="text-stone-500 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <p className="text-rose-500 font-medium text-lg">Failed to load profile</p>
        <button onClick={() => { setLoading(true); setRefreshKey(v => v + 1); }} className="mt-4 px-6 py-2 bg-stone-200 text-stone-800 rounded-full font-medium hover:bg-stone-300 transition cursor-pointer">Retry</button>
        <button onClick={() => navigate('/signin')} className="mt-4 ml-2 px-6 py-2 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition cursor-pointer">Sign In Again</button>
      </div>
    </div>
  );

  const paidClaims = claims.filter(c => c.status === 'PAID');
  const totalPaidOut = paidClaims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0);
  const daysLeft = policy ? Math.max(0, Math.round((new Date(policy.endDate).getTime() - Date.now()) / 86400000)) : 0;

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            <img src="/KavachPay_logo.png" alt="KavachPay" className="w-9 h-9 object-contain" />
            <span className="text-xl font-bold tracking-tight">KavachPay</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition cursor-pointer"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2.5 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-full transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-stone-700 hidden sm:block">{profile.fullName.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-0.5">
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
              })()}, {profile.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-stone-500 text-sm">Here's your protection dashboard</p>
          </div>
          {policy && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full self-start sm:self-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-700">Policy Active</span>
            </div>
          )}
        </div>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-7">
          {[
            {
              icon: <Activity className={`w-5 h-5 ${workProofActive ? 'text-emerald-600' : 'text-stone-400'}`} />,
              bg: 'bg-emerald-100',
              value: `${sessionActiveMinutes} min`,
              label: 'Active Session',
              dot: true,
              dotOn: workProofActive,
            },
            {
              icon: <Timer className="w-5 h-5 text-indigo-600" />,
              bg: 'bg-indigo-100',
              value: `${activityStats.sessionAgeMins ?? 0} min`,
              label: 'Total Session',
            },
            {
              icon: <Zap className="w-5 h-5 text-blue-600" />,
              bg: 'bg-blue-100',
              value: activityStats.heartbeatCount || 0,
              label: 'Heartbeats',
            },
            {
              icon: <Clock className="w-5 h-5 text-amber-600" />,
              bg: 'bg-amber-100',
              value: `${daysLeft}d`,
              label: 'Policy Days Left',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
              bg: 'bg-purple-100',
              value: policy?.planTier || 'None',
              label: 'Plan Tier',
            },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                {s.dot && <div className={`w-2 h-2 rounded-full ml-auto ${s.dotOn ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-stone-900 leading-none">{s.value}</p>
              <p className="text-xs text-stone-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl w-fit mb-7">
          {([
            { id: 'overview', label: 'Overview', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 'sessions', label: 'Sessions', icon: <History className="w-3.5 h-3.5" /> },
            { id: 'claims',   label: 'Claims',   icon: <TrendingUp className="w-3.5 h-3.5" /> },
          ] as Array<{ id: TabId; label: string; icon: React.ReactNode }>).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Left Column (3/5) ─── Policy + Work-Proof ─────────── */}
            <div className="lg:col-span-3 flex flex-col gap-6">

              {/* Policy card */}
              <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-stone-900">Your Policy</h2>
                      <p className="text-xs text-stone-400">Protection details</p>
                    </div>
                  </div>
                  {policy && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                      {policy.planTier}
                    </span>
                  )}
                </div>

                {policy ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Coverage', value: `₹${policy.coverageAmount?.toLocaleString()}` },
                        { label: 'Premium', value: `₹${policy.premiumPaid}` },
                        { label: 'Claims Paid', value: paidClaims.length },
                      ].map((item, i) => (
                        <div key={i} className="bg-stone-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-stone-400 mb-1">{item.label}</p>
                          <p className="text-lg font-bold text-stone-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Coverage used bar */}
                    <CoverageBar used={totalPaidOut} total={policy.coverageAmount || 0} />

                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => navigate('/policy')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition cursor-pointer"
                      >
                        <Wallet className="w-4 h-4" />
                        Manage Policy
                      </button>
                      <button
                        onClick={() => navigate('/claims')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-200 transition cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                        View Claims
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-stone-400 mb-4 text-sm">You have no active policy</p>
                    <button onClick={() => navigate('/policy')} className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition cursor-pointer">
                      Get Protected
                    </button>
                  </div>
                )}
              </div>

              {/* Work-Proof live block */}
              <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <img src="/KavachPay_logo.png" alt="Protocol" className="w-10 h-10 object-contain" />
                    <div>
                      <h2 className="text-base font-bold text-stone-900">Work-Proof Protocol</h2>
                      <p className="text-xs text-stone-400">Real-time activity verification</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${workProofActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {workProofActive ? '⬤ LIVE' : 'INACTIVE'}
                  </span>
                </div>

                {sessionHash && (
                  <div className="bg-stone-50 rounded-xl p-3 mb-5">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Live Chain Hash</p>
                    <p className="text-xs font-mono text-stone-600 break-all">{sessionHash}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
            { label: 'Beat Gap', value: fmtMs(activityStats.avgHeartbeatGapMs), color: 'bg-stone-50' },
                    { label: 'Jitter',   value: fmtMs(activityStats.jitterMs),           color: 'bg-stone-50' },
                    { label: 'Inputs',   value: activityStats.localInteractions || 0,  color: 'bg-blue-50' },
                    { label: 'Switches', value: activityStats.hiddenSwitches || 0,     color: 'bg-amber-50' },
                  ].map((cell, i) => (
                    <div key={i} className={`${cell.color} rounded-xl p-3`}>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{cell.label}</p>
                      <p className="text-lg font-bold text-stone-900">{cell.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column (2/5) ─── Insights + Claims ──────────── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Insights cards */}
              <div>
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">Insights</h3>
                <div className="flex flex-col gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">Claim Overview</p>
                        <p className="text-xs text-stone-400">{claims.length} total · {paidClaims.length} approved</p>
                      </div>
                    </div>
                    {latestClaim && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <p className="text-xs text-stone-400">Latest</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(latestClaim.status).bg} ${statusColor(latestClaim.status).text}`}>
                          {latestClaim.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">Coverage Status</p>
                        <p className="text-xs text-stone-400">{daysLeft > 0 ? `${daysLeft} days remaining` : 'No active policy'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">Total Paid Out</p>
                        <p className="text-xs text-stone-400">₹{totalPaidOut.toLocaleString()} across {paidClaims.length} claims</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent claims feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Recent Claims</h3>
                  <button onClick={() => navigate('/claims')} className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer">View all</button>
                </div>
                <div className="flex flex-col gap-2">
                  {claims.slice(0, 3).length === 0 ? (
                    <div className="bg-white rounded-2xl p-4 border border-stone-100 text-center">
                      <p className="text-stone-400 text-sm">No claims yet</p>
                    </div>
                  ) : claims.slice(0, 3).map((claim) => (
                    <div key={claim.id} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(claim.status).bg} ${statusColor(claim.status).text}`}>
                          {claim.status}
                        </span>
                        <p className="text-xs text-stone-400">{new Date(claim.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </div>
                      <p className="text-xs font-medium text-stone-600 truncate">
                        {(claim.triggerEvent || '').replace(/_/g, ' ')}
                      </p>
                      {claim.payoutAmount > 0 && (
                        <p className="text-sm font-bold text-emerald-600 mt-1">₹{claim.payoutAmount}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Start a claim */}
              <button
                onClick={triggerSimulation}
                disabled={isSimulating || !policy}
                id="simulate-disruption-btn"
                className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-4 rounded-2xl hover:bg-stone-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Cloud className="w-5 h-5" />
                {isSimulating ? 'Simulating Disruption...' : 'Simulate Disruption'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── SESSIONS TAB ─────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div>
            {/* Current session summary */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon: <Timer className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-100', label: 'Verified Minutes', value: `${sessionActiveMinutes} min`, note: 'Server-confirmed heartbeats' },
                { icon: <Cpu className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-100', label: 'Beat Gap', value: fmtMs(activityStats.avgHeartbeatGapMs), note: 'Avg gap between heartbeats' },
                { icon: <Zap className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-100', label: 'Jitter', value: fmtMs(activityStats.jitterMs), note: 'Timing variance (human = high)' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
                  <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                  <p className="text-sm font-medium text-stone-700 mt-0.5">{s.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{s.note}</p>
                </div>
              ))}
            </div>

            {/* Session history table */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-bold text-stone-900">Session History</h3>
                <p className="text-xs text-stone-400">Last 15 sessions · chain integrity verified</p>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : sessionHistory.length === 0 ? (
                <div className="text-center py-16">
                  <History className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-400 font-medium">No sessions recorded yet</p>
                  <p className="text-stone-300 text-sm mt-1">Sessions are created automatically when you stay active on the dashboard</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-semibold text-stone-400 uppercase tracking-wider bg-stone-50">
                        <th className="px-6 py-3 text-left">Started</th>
                        <th className="px-4 py-3 text-left">Duration</th>
                        <th className="px-4 py-3 text-left">Beats</th>
                        <th className="px-4 py-3 text-left">IP City</th>
                        <th className="px-4 py-3 text-center">Chain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionHistory.map((s, i) => (
                        <tr key={s.id} className={`border-t border-stone-50 ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'} hover:bg-emerald-50/30 transition`}>
                          <td className="px-6 py-3.5">
                            <p className="text-sm font-medium text-stone-900">{fmt(s.startTime)}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-stone-700 font-medium">{s.activeMinutes} min</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-stone-700">{s.heartbeatCount}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-stone-600">{s.ipCity || '—'}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {s.isChainValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                <Link2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                                <WifiOff className="w-3 h-3" /> Broken
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── CLAIMS TAB ───────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'claims' && (
          <div>
            {/* Summary row */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Claims', value: claims.length, color: 'text-stone-900' },
                { label: 'Approved', value: paidClaims.length, color: 'text-emerald-600' },
                { label: 'Total Paid Out', value: `₹${totalPaidOut.toLocaleString()}`, color: 'text-emerald-600' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm text-center">
                  <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-sm text-stone-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Claim cards */}
            <div className="flex flex-col gap-3">
              {claims.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-stone-100 text-center">
                  <ShieldAlert className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-400 font-medium">No claims filed yet</p>
                  <p className="text-stone-300 text-sm mt-1">Use "Simulate Disruption" on the Overview tab to test a claim</p>
                </div>
              ) : claims.map((claim) => (
                <div key={claim.id} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor(claim.status).bg} ${statusColor(claim.status).text}`}>
                          {claim.status}
                        </span>
                        <span className="text-xs text-stone-400">{fmt(claim.createdAt)}</span>
                      </div>
                      <p className="text-sm font-semibold text-stone-800 truncate">
                        {(claim.triggerEvent || '').replace(/_/g, ' ')}
                      </p>
                      {claim.reviewerNotes && (
                        <p className="text-xs text-stone-400 mt-1 line-clamp-1">{claim.reviewerNotes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {claim.payoutAmount > 0 ? (
                        <p className="text-lg font-bold text-emerald-600">₹{claim.payoutAmount}</p>
                      ) : (
                        <p className="text-sm text-stone-300 font-medium">₹0</p>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {claim.isChainValid
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          : <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                        <span className="text-xs text-stone-400">{claim.isChainValid ? 'Chain OK' : 'Chain broken'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-4 rounded-2xl hover:bg-stone-800 transition cursor-pointer"
            >
              <Cloud className="w-5 h-5" />
              Simulate Disruption
            </button>
          </div>
        )}
      </div>

      {/* ── Profile sidebar ──────────────────────────────────────────── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-full sm:max-w-sm bg-white shadow-2xl h-full overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-stone-900">Profile</h2>
                <button onClick={() => setIsProfileOpen(false)} className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 transition cursor-pointer">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-900">{profile.fullName}</h3>
                <p className="text-stone-500 text-sm">{profile.email}</p>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  { icon: <Phone className="w-4 h-4 text-stone-400" />, label: 'Phone', val: profile.phone },
                  { icon: <MapPin className="w-4 h-4 text-stone-400" />, label: 'City', val: profile.city },
                  { icon: <Briefcase className="w-4 h-4 text-stone-400" />, label: 'Platform', val: profile.deliveryPlatform },
                  { icon: <Bike className="w-4 h-4 text-stone-400" />, label: 'Vehicle', val: profile.vehicleType },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl">
                    {row.icon}
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">{row.label}</p>
                      <p className="text-sm font-medium text-stone-700">{row.val || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 font-semibold rounded-xl hover:bg-rose-100 transition cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── No policy modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">No Active Policy</h3>
            <p className="text-stone-500 mb-8">You need an active policy to access weather protection and instant payouts.</p>
            <button onClick={() => navigate('/policy')} className="w-full bg-stone-900 text-white font-semibold py-3.5 rounded-xl hover:bg-stone-800 transition cursor-pointer">
              Activate Policy
            </button>
            <button onClick={() => setShowModal(false)} className="w-full mt-3 text-stone-500 font-medium py-3 hover:text-stone-700 transition cursor-pointer">
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;