import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, X, User, Phone, MapPin, Bike, Briefcase, Wallet, LogOut, ShieldCheck, TrendingUp,
  Activity, Cloud, Zap, ChevronRight, Clock, Settings, Bell
} from 'lucide-react';
import API_BASE_URL from '../lib/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('kavachpay_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Work-Proof Engine State
  const [workProofActive, setWorkProofActive] = useState(false);
  const [sessionActiveMinutes, setSessionActiveMinutes] = useState(0);
  const [sessionHash, setSessionHash] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestClaim, setLatestClaim] = useState<any>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const interactionsCountRef = useRef<number>(0);
  const hiddenSwitchCountRef = useRef<number>(0);
  const [activityStats, setActivityStats] = useState<any>({
    activeMinutes: 0,
    heartbeatCount: 0,
    sessionAgeMins: 0,
    lastHeartbeatAgoMins: null,
    avgHeartbeatGapMs: 0,
    jitterMs: 0,
    localInteractions: 0,
    hiddenSwitches: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) {
      navigate('/signup');
      return;
    }

    const fetchData = async () => {
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const fetchProfileWithRetry = async () => {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const profileRes = await fetch(`${API_BASE_URL}/api/user/profile`, {
              headers: authHeaders
            });

            if (profileRes.status === 401 || profileRes.status === 403) {
              localStorage.removeItem('kavachpay_token');
              localStorage.removeItem('kavachpay_user');
              navigate('/signin');
              return;
            }

            if (profileRes.ok) {
              const profileData = await profileRes.json();
              let cachedUser: any = null;
              try {
                const rawCachedUser = localStorage.getItem('kavachpay_user');
                cachedUser = rawCachedUser ? JSON.parse(rawCachedUser) : null;
              } catch {
                cachedUser = null;
              }

              const mergedProfile = {
                ...cachedUser,
                ...profileData,
                role: profileData.role ?? cachedUser?.role,
              };

              setProfile(mergedProfile);
              localStorage.setItem('kavachpay_user', JSON.stringify(mergedProfile));
              return;
            }
          } catch (err) {
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              continue;
            }
            throw err;
          }
        }
      };

      try {
        const policyRes = await fetch(`${API_BASE_URL}/api/policy`, {
          headers: authHeaders
        });
        if (policyRes.ok) {
          const policyData = await policyRes.json();
          setPolicy(policyData);
          if (!policyData) setShowModal(true);
        }

        await fetchProfileWithRetry();

        const claimRes = await fetch(`${API_BASE_URL}/api/claim/history`, {
          headers: authHeaders
        });
        if (claimRes.ok) {
          const claims = await claimRes.json();
          if (claims.length > 0) setLatestClaim(claims[0]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, refreshKey]);

  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
      interactionsCountRef.current += 1;
    };

    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markInteraction, { passive: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenSwitchCountRef.current += 1;
      }
      markInteraction();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    const refreshActivityStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/session/activity-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const remoteStats = await response.json();
          setSessionActiveMinutes(remoteStats.activeMinutes || 0);
          setActivityStats({
            ...remoteStats,
            localInteractions: interactionsCountRef.current,
            hiddenSwitches: hiddenSwitchCountRef.current,
          });
        }
      } catch (err) {
        console.error('Activity stats fetch failed', err);
      }
    };

    const sendHeartbeat = async () => {
      const isRecentlyActive = Date.now() - lastInteractionRef.current <= 30 * 60 * 1000;
      if (!isRecentlyActive) {
        setWorkProofActive(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/session/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWorkProofActive(true);
          setSessionActiveMinutes(data.activeMinutes);
          setSessionHash(data.sessionHash);
          await refreshActivityStats();
        } else {
          setWorkProofActive(false);
        }
      } catch (err) {
        console.error('WorkProof Heartbeat failed', err);
        setWorkProofActive(false);
      }
    };

    markInteraction();
    sendHeartbeat();
    refreshActivityStats();

    const interval = setInterval(sendHeartbeat, 60000);
    const statsInterval = setInterval(refreshActivityStats, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(statsInterval);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markInteraction);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const triggerSimulation = async () => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;

    setIsSimulating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/claim/simulate-disruption`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLatestClaim(data.claim);
      }
    } catch (err) {
      console.error('Simulation Failed', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kavachpay_token');
    localStorage.removeItem('kavachpay_user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-500 font-medium text-lg">Failed to load profile</p>
          <button onClick={() => { setLoading(true); setRefreshKey((v) => v + 1); }} className="mt-4 px-6 py-2 bg-stone-200 text-stone-800 rounded-full font-medium hover:bg-stone-300 transition cursor-pointer">
            Retry
          </button>
          <button onClick={() => navigate('/signin')} className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition cursor-pointer">
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            <img 
              src="/KavachPay_logo.png" 
              alt="KavachPay" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold tracking-tight">KavachPay</span>
          </button>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button className="p-2.5 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-full transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User className="w-4 h-4" />
              </div>
              <span className="font-semibold text-stone-700 hidden sm:block">{profile.fullName.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
                Welcome back, {profile.fullName.split(' ')[0]}
              </h1>
              <p className="text-stone-500">Here&apos;s an overview of your protection status</p>
            </div>
            {policy && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700">Policy Active</span>
              </div>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Activity className={`w-5 h-5 ${workProofActive ? 'text-emerald-600' : 'text-stone-400'}`} />
              </div>
              <div className={`w-2 h-2 rounded-full ${workProofActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`}></div>
            </div>
            <p className="text-2xl font-bold text-stone-900">{sessionActiveMinutes} min</p>
            <p className="text-sm text-stone-500">Active Session</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900">{activityStats.heartbeatCount || 0}</p>
            <p className="text-sm text-stone-500">Heartbeats</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900">{activityStats.sessionAgeMins || 0} min</p>
            <p className="text-sm text-stone-500">Session Age</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900">{policy?.planTier || 'None'}</p>
            <p className="text-sm text-stone-500">Plan Tier</p>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Work-Proof Protocol Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img 
                  src="/KavachPay_logo.png" 
                  alt="Protocol" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Work-Proof Protocol</h2>
                  <p className="text-sm text-stone-500">Real-time activity verification</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${workProofActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                {workProofActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>

            {sessionHash && (
              <div className="bg-stone-50 rounded-2xl p-4 mb-6">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Live Cryptographic Hash</p>
                <p className="text-sm font-mono text-stone-600 break-all">{sessionHash}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Beat Gap</p>
                <p className="text-xl font-bold text-stone-900">{activityStats.avgHeartbeatGapMs || 0}ms</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Jitter</p>
                <p className="text-xl font-bold text-stone-900">{activityStats.jitterMs || 0}ms</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Interactions</p>
                <p className="text-xl font-bold text-blue-700">{activityStats.localInteractions || 0}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase mb-1">App Switches</p>
                <p className="text-xl font-bold text-amber-700">{activityStats.hiddenSwitches || 0}</p>
              </div>
            </div>
          </div>

          {/* Policy Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-5 sm:p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Your Plan</h2>
                <p className="text-sm text-stone-400">Protection details</p>
              </div>
            </div>

            {policy ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-stone-400">Tier</span>
                  <span className="font-bold text-emerald-400">{policy.planTier}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-stone-400">Coverage</span>
                  <span className="font-bold">Rs. {policy.coverageAmount}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-stone-400">Expires</span>
                  <span className="font-medium">{new Date(policy.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-stone-400 mb-4">You are currently unprotected</p>
                <button
                  onClick={() => navigate('/policy')}
                  className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition cursor-pointer"
                >
                  Get Protected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <button
            onClick={() => navigate('/claims')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 transition" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-4">Claim History</h3>
            <p className="text-sm text-stone-500 mt-1">View all your claims</p>
          </button>

          <button
            onClick={() => navigate('/payout')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-blue-200 hover:shadow-md transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-blue-500 transition" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-4">Payout History</h3>
            <p className="text-sm text-stone-500 mt-1">Track your payouts</p>
          </button>

          <button
            onClick={() => navigate('/policy')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-purple-200 hover:shadow-md transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-purple-500 transition" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-4">Manage Policy</h3>
            <p className="text-sm text-stone-500 mt-1">View or upgrade</p>
          </button>

          <button
            onClick={triggerSimulation}
            disabled={isSimulating || !policy}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-amber-200 hover:shadow-md transition text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition">
                <Cloud className="w-6 h-6 text-amber-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-4">
              {isSimulating ? 'Simulating...' : 'Test Disruption'}
            </h3>
            <p className="text-sm text-stone-500 mt-1">Simulate weather event</p>
          </button>
        </section>

        {/* Latest Claim */}
        {latestClaim && (
          <section className="mt-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-900">Latest Claim</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${latestClaim.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    latestClaim.status === 'REVIEW' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                  }`}>
                  {latestClaim.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-stone-400 uppercase font-semibold mb-1">Trigger</p>
                  <p className="text-sm font-medium text-stone-700">{latestClaim.triggerEvent.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase font-semibold mb-1">Amount</p>
                  <p className="text-sm font-bold text-emerald-600">Rs. {latestClaim.payoutAmount}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase font-semibold mb-1">Date</p>
                  <p className="text-sm font-medium text-stone-700">{new Date(latestClaim.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Profile Sidebar */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}></div>
          <div className="relative w-full max-w-full sm:max-w-sm bg-white shadow-2xl h-full overflow-y-auto">
            <div className="p-4 sm:p-6">
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
                <p className="text-stone-500">{profile.email}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <Phone className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-400 uppercase font-semibold">Phone</p>
                    <p className="text-sm font-medium text-stone-700">{profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-400 uppercase font-semibold">City</p>
                    <p className="text-sm font-medium text-stone-700">{profile.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <Briefcase className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-400 uppercase font-semibold">Platform</p>
                    <p className="text-sm font-medium text-stone-700">{profile.gigPlatform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <Bike className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-400 uppercase font-semibold">Vehicle</p>
                    <p className="text-sm font-medium text-stone-700">{profile.vehicleType}</p>
                  </div>
                </div>
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

      {/* Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">No Active Policy</h3>
            <p className="text-stone-500 mb-8">You need an active policy to access weather protection and instant payouts.</p>
            <button
              onClick={() => navigate('/policy')}
              className="w-full bg-stone-900 text-white font-semibold py-3.5 rounded-xl hover:bg-stone-800 transition cursor-pointer"
            >
              Activate Policy
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-3 text-stone-500 font-medium py-3 hover:text-stone-700 transition cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;