import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X, User, Phone, MapPin, Bike, Briefcase, Wallet, LogOut, ShieldCheck, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      try {
        // Fetch Policy
        const policyRes = await fetch('http://localhost:5000/api/policy', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (policyRes.ok) {
          const policyData = await policyRes.json();
          setPolicy(policyData);
          if (!policyData) setShowModal(true);
        }

        // Fetch User Profile
        const profileRes = await fetch('http://localhost:5000/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch Claim History (Optional, for initial state)
        const claimRes = await fetch('http://localhost:5000/api/claim/history', {
          headers: { 'Authorization': `Bearer ${token}` }
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
  }, [navigate]);

  // Silent Work-Proof Heartbeat Engine (Step 3)
  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
      interactionsCountRef.current += 1;
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

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
        const response = await fetch('http://localhost:5000/api/session/activity-stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const remoteStats = await response.json();
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

      // Keep monitoring alive briefly in background after recent activity.
      if (!isRecentlyActive) {
        setWorkProofActive(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/session/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

    // Fire initial heartbeat
    markInteraction();
    sendHeartbeat();
    refreshActivityStats();

    // Fire every 60 seconds (accelerated for hackathon demo)
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
      const response = await fetch('http://localhost:5000/api/claim/simulate-disruption', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLatestClaim(data.claim);
        // Auto-fetch policy again to update the dashboard status if needed
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

  if (loading) return <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center text-slate-600 font-medium">Loading Dashboard...</div>;
  if (!profile) return <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center text-rose-500 font-medium">Failed to load profile. Please log in again.</div>;

  return (
    <main className="min-h-screen bg-[#eef2f6] text-slate-900 p-6 sm:p-10 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300 opacity-20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 opacity-20 blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">KavachPay</h1>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 bg-white/60 hover:bg-white backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white transition cursor-pointer font-bold text-blue-900 group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
              <User className="w-4 h-4" />
            </div>
            Profile
          </button>
        </header>

        {/* Main Dashboard Area */}
        <div className="space-y-6">
          {/* Welcome Card */}
          <section className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 sm:p-8 transition-all hover:shadow-2xl duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                  Welcome back, {profile.fullName.split(' ')[0]}! 👋
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium">Your KavachPay protection is ready.</p>
              </div>
              {policy && (
                <div className="px-4 py-2 border border-emerald-500/30 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVE POLICY
                </div>
              )}
            </div>
          </section>

          {/* Dashboard Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <h3 className="text-lg font-bold text-slate-800">Work-Proof Protocol</h3>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${workProofActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="font-semibold text-slate-600">
                    {workProofActive ? `Session Active: ${sessionActiveMinutes} min` : 'Session Inactive'}
                  </span>
                </div>
                {sessionHash && (
                  <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2 overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Live Cryptographic Hash</p>
                    <p className="text-xs font-mono text-slate-500 truncate" title={sessionHash}>
                      {sessionHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Your Plan</h3>
                {policy ? (
                  <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="flex justify-between text-sm text-slate-600 mb-2"><span>Tier:</span><span className="font-bold text-slate-900">{policy.planTier}</span></p>
                    <p className="flex justify-between text-sm text-slate-600 mb-2"><span>Coverage:</span><span className="font-bold text-emerald-600">₹{policy.coverageAmount}</span></p>
                    <p className="flex justify-between text-sm text-slate-600 mb-0"><span>Expires:</span><span className="font-semibold text-slate-700">{new Date(policy.endDate).toLocaleDateString()}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">No active policy yet.</p>
                )}
              </div>
              {!policy && (
                <button 
                  onClick={() => navigate('/policy')}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition cursor-pointer"
                >
                  Activate Coverage Now
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
            <h3 className="text-lg font-bold text-slate-800">Live Activity Diagnostics (Web)</h3>
            <p className="text-xs text-slate-500 mt-1">Prototype telemetry from browser + backend session tracker.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Heartbeat Count</p>
                <p className="text-xl font-black text-slate-800">{activityStats.heartbeatCount || 0}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Session Age</p>
                <p className="text-xl font-black text-slate-800">{activityStats.sessionAgeMins || 0} min</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Avg Beat Gap</p>
                <p className="text-xl font-black text-slate-800">{activityStats.avgHeartbeatGapMs || 0} ms</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Timing Jitter</p>
                <p className="text-xl font-black text-slate-800">{activityStats.jitterMs || 0} ms</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-blue-500">Local Interactions</p>
                <p className="text-xl font-black text-blue-700">{activityStats.localInteractions || 0}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-amber-600">App Switches Detected</p>
                <p className="text-xl font-black text-amber-700">{activityStats.hiddenSwitches || 0}</p>
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/claims')}
              className="group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition">Claim History</h3>
                  <p className="text-xs text-slate-400 mt-1">View all claims with full signal breakdown</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/payout')}
              className="group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition">Payout History</h3>
                  <p className="text-xs text-slate-400 mt-1">Track your income protection payouts</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </button>
          </div>

          {/* AI CLAIM ADJUDICATION CARD (Step 5) */}
          {latestClaim && (
            <div className="bg-white/90 backdrop-blur-xl border-2 border-blue-500/20 shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
              <div className="bg-blue-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-white">AI Adjudication Result</h3>
                </div>
                <button 
                  onClick={() => setLatestClaim(null)}
                  className="text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 grid md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-blue-50 to-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">ML Confidence Score</span>
                    <span className="text-blue-600 font-extrabold">{Math.round((1 - latestClaim.fraudScore) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                      style={{ width: `${(1 - latestClaim.fraudScore) * 100}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Work-Proof</p>
                      <p className="text-lg font-black text-emerald-600">{latestClaim.workProofScore}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Fraud Risk</p>
                      <p className="text-lg font-black text-rose-600">{latestClaim.fraudScore}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 border border-white p-5 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest text-center mb-4">Signal Breakdown</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-700 font-semibold">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> IP Location City
                      </span>
                      <span className="text-emerald-600 font-black uppercase">MATCHED</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-700 font-semibold">
                        <div className={`w-1.5 h-1.5 rounded-full ${latestClaim.isChainValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div> 
                        Hash Chain Audit
                      </span>
                      <span className={`${latestClaim.isChainValid ? 'text-emerald-600' : 'text-red-600'} font-black uppercase`}>
                        {latestClaim.isChainValid ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-700 font-semibold">
                        <div className={`w-1.5 h-1.5 rounded-full ${latestClaim.behavioralScore > 0.6 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div> 
                        Behavioral Shield
                      </span>
                      <span className={`${latestClaim.behavioralScore > 0.6 ? 'text-emerald-600' : 'text-amber-600'} font-black uppercase`}>
                        {latestClaim.behavioralScore > 0.8 ? 'HUMAN' : latestClaim.behavioralScore > 0.4 ? 'STABLE' : 'BOT'}
                      </span>
                    </div>
                  </div>
                  
                  {/* AI Adjudication Evidence */}
                  <div className="mt-5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <p className="text-[10px] uppercase font-black text-blue-400 mb-1.5 tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="w-3 H-3" /> ADJUDICATION LOG
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic font-medium">
                      {latestClaim.reviewerNotes || 'Comparing Open-Meteo, NewsAPI & behavioral signals...'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-500 mb-1">Final Decision</p>
                    <p className={`text-xl font-black ${latestClaim.status === 'PAID' ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {latestClaim.status === 'PAID' ? '₹' + latestClaim.payoutAmount + ' PAID' : 'PENDING REVIEW'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SIMULATE STORM BUTTON (Presentation Admin Tool) */}
      <div className="fixed bottom-6 left-6 z-[45]">
        <button 
          onClick={triggerSimulation}
          disabled={isSimulating}
          className={`group flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer font-black tracking-wide border-2 border-white/20 overflow-hidden relative ${isSimulating ? 'opacity-80' : ''}`}
        >
          <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <ShieldAlert className={`w-6 h-6 z-10 ${isSimulating ? 'animate-bounce text-orange-400' : 'text-blue-400'}`} />
          <span className="z-10 text-sm uppercase">
            {isSimulating ? 'Running ML Consensus...' : 'Analyze Environmental Risk'}
          </span>
        </button>
      </div>

      {/* Dimmed Background Overlay */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      {/* Sliding Profile Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isProfileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-8 text-center relative shadow-inner">
          <button 
            onClick={() => setIsProfileOpen(false)}
            className="absolute top-4 left-4 text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/50 mb-3 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <User className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">{profile.fullName}</h3>
          <div className="flex items-center justify-center mt-2">
            <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold text-blue-100 border border-white/20">
              {profile.trustScore >= 0.8 ? (
                <><ShieldCheck className="w-4 h-4 text-emerald-400" /> High Trust Score</>
              ) : (
                <span className="tracking-wide">New Worker Profile</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Scrollable Area */}
        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-slate-50">
          {/* Active Policy Status */}
          {policy ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700 font-bold shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Policy</p>
                  <p className="text-sm font-bold text-emerald-900">{policy.planTier} Tier</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-emerald-700">Coverage</p>
                <p className="text-sm font-extrabold text-emerald-800">₹{policy.coverageAmount}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">No active policy found.</p>
              </div>
              <button 
                onClick={() => { setIsProfileOpen(false); navigate('/policy'); }}
                className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
              >
                Get Covered
              </button>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-110 transition">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</p>
              <p className="text-sm font-semibold text-slate-800">{profile.city}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0 group-hover:scale-110 transition">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{profile.deliveryPlatform}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{profile.vehicleType}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:scale-110 transition">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">UPI ID</p>
              <p className="text-sm font-semibold text-slate-800">{profile.upiId || 'Not provided'}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 group-hover:scale-110 transition">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
              <p className="text-sm font-semibold text-slate-800">{profile.phoneNumber || profile.email}</p>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-6 border-t border-slate-200 bg-white mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-rose-600 font-bold hover:bg-rose-50 border border-rose-100 hover:border-rose-200 transition duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Broad Modal Popup for Unprotected Users */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative transform transition-all scale-100 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-6 flex flex-col items-center relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <ShieldAlert className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center">Your Income is at Risk!</h3>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 text-center text-slate-600">
              <p className="text-lg mb-6 leading-relaxed">
                You are currently <span className="font-bold text-rose-500">unprotected</span> against sudden extreme weather and gig work disruptions. 
                Don't let a heavy downpour or heatwave wipe out your day's earnings.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition order-2 sm:order-1 cursor-pointer"
                >
                  Maybe Later
                </button>
                <button 
                  onClick={() => navigate('/policy')}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition order-1 sm:order-2 cursor-pointer"
                >
                  Secure My Income Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
