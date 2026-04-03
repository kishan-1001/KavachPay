import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, X, User, Phone, MapPin, Bike, Briefcase, Wallet, LogOut, ShieldCheck, TrendingUp,
  Activity, Cloud, Zap, ChevronRight, Clock, Settings, Bell
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState&lt;any&gt;(null);
  const [policy, setPolicy] = useState&lt;any&gt;(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Work-Proof Engine State
  const [workProofActive, setWorkProofActive] = useState(false);
  const [sessionActiveMinutes, setSessionActiveMinutes] = useState(0);
  const [sessionHash, setSessionHash] = useState&lt;string | null&gt;(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestClaim, setLatestClaim] = useState&lt;any&gt;(null);
  const lastInteractionRef = useRef&lt;number&gt;(Date.now());
  const interactionsCountRef = useRef&lt;number&gt;(0);
  const hiddenSwitchCountRef = useRef&lt;number&gt;(0);
  const [activityStats, setActivityStats] = useState&lt;any&gt;({
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
        const policyRes = await fetch('http://localhost:5000/api/policy', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (policyRes.ok) {
          const policyData = await policyRes.json();
          setPolicy(policyData);
          if (!policyData) setShowModal(true);
        }

        const profileRes = await fetch('http://localhost:5000/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

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

  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
      interactionsCountRef.current += 1;
    };

    const activityEvents: Array&lt;keyof WindowEventMap&gt; = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

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
          headers: { 'Authorization': `Bearer ${token}` }
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
      const isRecentlyActive = Date.now() - lastInteractionRef.current &lt;= 30 * 60 * 1000;
      if (!isRecentlyActive) {
        setWorkProofActive(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/session/heartbeat', {
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
      const response = await fetch('http://localhost:5000/api/claim/simulate-disruption', {
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
      &lt;div className="min-h-screen bg-stone-50 flex items-center justify-center"&gt;
        &lt;div className="flex flex-col items-center gap-4"&gt;
          &lt;div className="w-12 h-12 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin"&gt;&lt;/div&gt;
          &lt;p className="text-stone-500 font-medium"&gt;Loading your dashboard...&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    );
  }

  if (!profile) {
    return (
      &lt;div className="min-h-screen bg-stone-50 flex items-center justify-center"&gt;
        &lt;div className="text-center"&gt;
          &lt;ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" /&gt;
          &lt;p className="text-rose-500 font-medium text-lg"&gt;Failed to load profile&lt;/p&gt;
          &lt;button onClick={() =&gt; navigate('/signin')} className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition cursor-pointer"&gt;
            Sign In Again
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    );
  }

  return (
    &lt;main className="min-h-screen bg-stone-50 text-stone-900"&gt;
      {/* Top Navigation */}
      &lt;nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100"&gt;
        &lt;div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"&gt;
          &lt;button onClick={() =&gt; navigate('/')} className="flex items-center gap-2 cursor-pointer"&gt;
            &lt;div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center"&gt;
              &lt;ShieldCheck className="w-5 h-5 text-emerald-400" /&gt;
            &lt;/div&gt;
            &lt;span className="text-xl font-bold tracking-tight"&gt;KavachPay&lt;/span&gt;
          &lt;/button&gt;
          
          &lt;div className="flex items-center gap-3"&gt;
            &lt;button className="p-2.5 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition cursor-pointer"&gt;
              &lt;Bell className="w-5 h-5" /&gt;
            &lt;/button&gt;
            &lt;button 
              onClick={() =&gt; setIsProfileOpen(true)}
              className="flex items-center gap-3 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-full transition cursor-pointer"
            &gt;
              &lt;div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"&gt;
                &lt;User className="w-4 h-4" /&gt;
              &lt;/div&gt;
              &lt;span className="font-semibold text-stone-700 hidden sm:block"&gt;{profile.fullName.split(' ')[0]}&lt;/span&gt;
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/nav&gt;

      &lt;div className="max-w-6xl mx-auto px-6 py-8"&gt;
        {/* Welcome Section */}
        &lt;section className="mb-8"&gt;
          &lt;div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"&gt;
            &lt;div&gt;
              &lt;h1 className="text-3xl font-bold text-stone-900 mb-1"&gt;
                Welcome back, {profile.fullName.split(' ')[0]}
              &lt;/h1&gt;
              &lt;p className="text-stone-500"&gt;Here&apos;s an overview of your protection status&lt;/p&gt;
            &lt;/div&gt;
            {policy &amp;&amp; (
              &lt;div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full"&gt;
                &lt;div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"&gt;&lt;/div&gt;
                &lt;span className="text-sm font-semibold text-emerald-700"&gt;Policy Active&lt;/span&gt;
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Stats Grid */}
        &lt;section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"&gt;
          &lt;div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"&gt;
            &lt;div className="flex items-center gap-3 mb-3"&gt;
              &lt;div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"&gt;
                &lt;Activity className={`w-5 h-5 ${workProofActive ? 'text-emerald-600' : 'text-stone-400'}`} /&gt;
              &lt;/div&gt;
              &lt;div className={`w-2 h-2 rounded-full ${workProofActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`}&gt;&lt;/div&gt;
            &lt;/div&gt;
            &lt;p className="text-2xl font-bold text-stone-900"&gt;{sessionActiveMinutes} min&lt;/p&gt;
            &lt;p className="text-sm text-stone-500"&gt;Active Session&lt;/p&gt;
          &lt;/div&gt;

          &lt;div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"&gt;
            &lt;div className="flex items-center gap-3 mb-3"&gt;
              &lt;div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"&gt;
                &lt;Zap className="w-5 h-5 text-blue-600" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;p className="text-2xl font-bold text-stone-900"&gt;{activityStats.heartbeatCount || 0}&lt;/p&gt;
            &lt;p className="text-sm text-stone-500"&gt;Heartbeats&lt;/p&gt;
          &lt;/div&gt;

          &lt;div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"&gt;
            &lt;div className="flex items-center gap-3 mb-3"&gt;
              &lt;div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"&gt;
                &lt;Clock className="w-5 h-5 text-amber-600" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;p className="text-2xl font-bold text-stone-900"&gt;{activityStats.sessionAgeMins || 0} min&lt;/p&gt;
            &lt;p className="text-sm text-stone-500"&gt;Session Age&lt;/p&gt;
          &lt;/div&gt;

          &lt;div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"&gt;
            &lt;div className="flex items-center gap-3 mb-3"&gt;
              &lt;div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"&gt;
                &lt;ShieldCheck className="w-5 h-5 text-purple-600" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;p className="text-2xl font-bold text-stone-900"&gt;{policy?.planTier || 'None'}&lt;/p&gt;
            &lt;p className="text-sm text-stone-500"&gt;Plan Tier&lt;/p&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Main Content Grid */}
        &lt;div className="grid lg:grid-cols-3 gap-6"&gt;
          {/* Work-Proof Protocol Card */}
          &lt;div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-100 shadow-sm"&gt;
            &lt;div className="flex items-center justify-between mb-6"&gt;
              &lt;div className="flex items-center gap-3"&gt;
                &lt;div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center"&gt;
                  &lt;Activity className="w-6 h-6 text-emerald-400" /&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h2 className="text-lg font-bold text-stone-900"&gt;Work-Proof Protocol&lt;/h2&gt;
                  &lt;p className="text-sm text-stone-500"&gt;Real-time activity verification&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div className={`px-3 py-1.5 rounded-full text-xs font-bold ${workProofActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}&gt;
                {workProofActive ? 'ACTIVE' : 'INACTIVE'}
              &lt;/div&gt;
            &lt;/div&gt;

            {sessionHash &amp;&amp; (
              &lt;div className="bg-stone-50 rounded-2xl p-4 mb-6"&gt;
                &lt;p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2"&gt;Live Cryptographic Hash&lt;/p&gt;
                &lt;p className="text-sm font-mono text-stone-600 break-all"&gt;{sessionHash}&lt;/p&gt;
              &lt;/div&gt;
            )}

            &lt;div className="grid grid-cols-2 sm:grid-cols-4 gap-4"&gt;
              &lt;div className="bg-stone-50 rounded-xl p-4"&gt;
                &lt;p className="text-xs font-semibold text-stone-400 uppercase mb-1"&gt;Beat Gap&lt;/p&gt;
                &lt;p className="text-xl font-bold text-stone-900"&gt;{activityStats.avgHeartbeatGapMs || 0}ms&lt;/p&gt;
              &lt;/div&gt;
              &lt;div className="bg-stone-50 rounded-xl p-4"&gt;
                &lt;p className="text-xs font-semibold text-stone-400 uppercase mb-1"&gt;Jitter&lt;/p&gt;
                &lt;p className="text-xl font-bold text-stone-900"&gt;{activityStats.jitterMs || 0}ms&lt;/p&gt;
              &lt;/div&gt;
              &lt;div className="bg-blue-50 rounded-xl p-4"&gt;
                &lt;p className="text-xs font-semibold text-blue-500 uppercase mb-1"&gt;Interactions&lt;/p&gt;
                &lt;p className="text-xl font-bold text-blue-700"&gt;{activityStats.localInteractions || 0}&lt;/p&gt;
              &lt;/div&gt;
              &lt;div className="bg-amber-50 rounded-xl p-4"&gt;
                &lt;p className="text-xs font-semibold text-amber-600 uppercase mb-1"&gt;App Switches&lt;/p&gt;
                &lt;p className="text-xl font-bold text-amber-700"&gt;{activityStats.hiddenSwitches || 0}&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          {/* Policy Card */}
          &lt;div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-6 text-white"&gt;
            &lt;div className="flex items-center gap-3 mb-6"&gt;
              &lt;div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"&gt;
                &lt;ShieldCheck className="w-6 h-6 text-emerald-400" /&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;h2 className="text-lg font-bold"&gt;Your Plan&lt;/h2&gt;
                &lt;p className="text-sm text-stone-400"&gt;Protection details&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {policy ? (
              &lt;div className="space-y-4"&gt;
                &lt;div className="flex justify-between items-center py-3 border-b border-white/10"&gt;
                  &lt;span className="text-stone-400"&gt;Tier&lt;/span&gt;
                  &lt;span className="font-bold text-emerald-400"&gt;{policy.planTier}&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="flex justify-between items-center py-3 border-b border-white/10"&gt;
                  &lt;span className="text-stone-400"&gt;Coverage&lt;/span&gt;
                  &lt;span className="font-bold"&gt;Rs. {policy.coverageAmount}&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="flex justify-between items-center py-3"&gt;
                  &lt;span className="text-stone-400"&gt;Expires&lt;/span&gt;
                  &lt;span className="font-medium"&gt;{new Date(policy.endDate).toLocaleDateString()}&lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            ) : (
              &lt;div className="text-center py-6"&gt;
                &lt;p className="text-stone-400 mb-4"&gt;You are currently unprotected&lt;/p&gt;
                &lt;button 
                  onClick={() =&gt; navigate('/policy')}
                  className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition cursor-pointer"
                &gt;
                  Get Protected
                &lt;/button&gt;
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Quick Navigation */}
        &lt;section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"&gt;
          &lt;button
            onClick={() =&gt; navigate('/claims')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition text-left cursor-pointer"
          &gt;
            &lt;div className="flex items-center justify-between"&gt;
              &lt;div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition"&gt;
                &lt;ShieldCheck className="w-6 h-6 text-emerald-600" /&gt;
              &lt;/div&gt;
              &lt;ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 transition" /&gt;
            &lt;/div&gt;
            &lt;h3 className="text-base font-bold text-stone-900 mt-4"&gt;Claim History&lt;/h3&gt;
            &lt;p className="text-sm text-stone-500 mt-1"&gt;View all your claims&lt;/p&gt;
          &lt;/button&gt;

          &lt;button
            onClick={() =&gt; navigate('/payout')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-blue-200 hover:shadow-md transition text-left cursor-pointer"
          &gt;
            &lt;div className="flex items-center justify-between"&gt;
              &lt;div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition"&gt;
                &lt;TrendingUp className="w-6 h-6 text-blue-600" /&gt;
              &lt;/div&gt;
              &lt;ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-blue-500 transition" /&gt;
            &lt;/div&gt;
            &lt;h3 className="text-base font-bold text-stone-900 mt-4"&gt;Payout History&lt;/h3&gt;
            &lt;p className="text-sm text-stone-500 mt-1"&gt;Track your payouts&lt;/p&gt;
          &lt;/button&gt;

          &lt;button
            onClick={() =&gt; navigate('/policy')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-purple-200 hover:shadow-md transition text-left cursor-pointer"
          &gt;
            &lt;div className="flex items-center justify-between"&gt;
              &lt;div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition"&gt;
                &lt;Settings className="w-6 h-6 text-purple-600" /&gt;
              &lt;/div&gt;
              &lt;ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-purple-500 transition" /&gt;
            &lt;/div&gt;
            &lt;h3 className="text-base font-bold text-stone-900 mt-4"&gt;Manage Policy&lt;/h3&gt;
            &lt;p className="text-sm text-stone-500 mt-1"&gt;View or upgrade plan&lt;/p&gt;
          &lt;/button&gt;

          &lt;button
            onClick={() =&gt; navigate('/how-it-works')}
            className="group bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-amber-200 hover:shadow-md transition text-left cursor-pointer"
          &gt;
            &lt;div className="flex items-center justify-between"&gt;
              &lt;div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition"&gt;
                &lt;Cloud className="w-6 h-6 text-amber-600" /&gt;
              &lt;/div&gt;
              &lt;ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition" /&gt;
            &lt;/div&gt;
            &lt;h3 className="text-base font-bold text-stone-900 mt-4"&gt;How It Works&lt;/h3&gt;
            &lt;p className="text-sm text-stone-500 mt-1"&gt;Learn about KavachPay&lt;/p&gt;
          &lt;/button&gt;
        &lt;/section&gt;

        {/* Latest Claim Result */}
        {latestClaim &amp;&amp; (
          &lt;section className="mt-6"&gt;
            &lt;div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden"&gt;
              &lt;div className="bg-stone-900 px-6 py-4 flex items-center justify-between"&gt;
                &lt;div className="flex items-center gap-3"&gt;
                  &lt;ShieldCheck className="w-5 h-5 text-emerald-400" /&gt;
                  &lt;h3 className="font-bold text-white"&gt;Latest AI Adjudication&lt;/h3&gt;
                &lt;/div&gt;
                &lt;button onClick={() =&gt; setLatestClaim(null)} className="text-stone-400 hover:text-white transition cursor-pointer"&gt;
                  &lt;X className="w-5 h-5" /&gt;
                &lt;/button&gt;
              &lt;/div&gt;
              
              &lt;div className="p-6 grid md:grid-cols-2 gap-8"&gt;
                &lt;div className="space-y-4"&gt;
                  &lt;div&gt;
                    &lt;div className="flex items-center justify-between text-sm mb-2"&gt;
                      &lt;span className="font-semibold text-stone-500 uppercase tracking-wider"&gt;ML Confidence&lt;/span&gt;
                      &lt;span className="font-bold text-emerald-600"&gt;{Math.round((1 - latestClaim.fraudScore) * 100)}%&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden"&gt;
                      &lt;div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(1 - latestClaim.fraudScore) * 100}%` }}
                      /&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                  
                  &lt;div className="grid grid-cols-2 gap-4"&gt;
                    &lt;div className="bg-stone-50 p-4 rounded-xl text-center"&gt;
                      &lt;p className="text-xs font-semibold text-stone-400 uppercase mb-1"&gt;Work-Proof&lt;/p&gt;
                      &lt;p className="text-xl font-bold text-emerald-600"&gt;{latestClaim.workProofScore}&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div className="bg-stone-50 p-4 rounded-xl text-center"&gt;
                      &lt;p className="text-xs font-semibold text-stone-400 uppercase mb-1"&gt;Fraud Risk&lt;/p&gt;
                      &lt;p className="text-xl font-bold text-rose-500"&gt;{latestClaim.fraudScore}&lt;/p&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;

                &lt;div className="bg-stone-50 rounded-2xl p-5 space-y-3"&gt;
                  &lt;h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest"&gt;Signal Breakdown&lt;/h4&gt;
                  
                  &lt;div className="flex justify-between items-center text-sm"&gt;
                    &lt;span className="flex items-center gap-2 text-stone-600"&gt;
                      &lt;div className="w-2 h-2 rounded-full bg-emerald-500"&gt;&lt;/div&gt; IP Location
                    &lt;/span&gt;
                    &lt;span className="font-bold text-emerald-600"&gt;MATCHED&lt;/span&gt;
                  &lt;/div&gt;
                  
                  &lt;div className="flex justify-between items-center text-sm"&gt;
                    &lt;span className="flex items-center gap-2 text-stone-600"&gt;
                      &lt;div className={`w-2 h-2 rounded-full ${latestClaim.isChainValid ? 'bg-emerald-500' : 'bg-rose-500'}`}&gt;&lt;/div&gt; Hash Chain
                    &lt;/span&gt;
                    &lt;span className={`font-bold ${latestClaim.isChainValid ? 'text-emerald-600' : 'text-rose-500'}`}&gt;
                      {latestClaim.isChainValid ? 'VALID' : 'INVALID'}
                    &lt;/span&gt;
                  &lt;/div&gt;
                  
                  &lt;div className="flex justify-between items-center text-sm"&gt;
                    &lt;span className="flex items-center gap-2 text-stone-600"&gt;
                      &lt;div className={`w-2 h-2 rounded-full ${latestClaim.behavioralScore &gt; 0.6 ? 'bg-emerald-500' : 'bg-amber-500'}`}&gt;&lt;/div&gt; Behavioral
                    &lt;/span&gt;
                    &lt;span className={`font-bold ${latestClaim.behavioralScore &gt; 0.6 ? 'text-emerald-600' : 'text-amber-500'}`}&gt;
                      {latestClaim.behavioralScore &gt; 0.8 ? 'HUMAN' : latestClaim.behavioralScore &gt; 0.4 ? 'STABLE' : 'BOT'}
                    &lt;/span&gt;
                  &lt;/div&gt;

                  &lt;div className="pt-4 border-t border-stone-200 text-center"&gt;
                    &lt;p className="text-xs text-stone-400 mb-1"&gt;Final Decision&lt;/p&gt;
                    &lt;p className={`text-xl font-bold ${latestClaim.status === 'PAID' ? 'text-emerald-600' : 'text-amber-500'}`}&gt;
                      {latestClaim.status === 'PAID' ? `Rs. ${latestClaim.payoutAmount} PAID` : 'PENDING REVIEW'}
                    &lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/section&gt;
        )}
      &lt;/div&gt;

      {/* Floating Action Button */}
      &lt;div className="fixed bottom-6 right-6 z-40"&gt;
        &lt;button 
          onClick={triggerSimulation}
          disabled={isSimulating}
          className={`group flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer font-semibold ${isSimulating ? 'opacity-80' : ''}`}
        &gt;
          &lt;ShieldAlert className={`w-5 h-5 ${isSimulating ? 'animate-pulse text-amber-400' : 'text-emerald-400'}`} /&gt;
          &lt;span className="text-sm"&gt;{isSimulating ? 'Analyzing...' : 'Analyze Risk'}&lt;/span&gt;
        &lt;/button&gt;
      &lt;/div&gt;

      {/* Profile Drawer Overlay */}
      {isProfileOpen &amp;&amp; (
        &lt;div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() =&gt; setIsProfileOpen(false)}
        /&gt;
      )}

      {/* Profile Drawer */}
      &lt;div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isProfileOpen ? 'translate-x-0' : 'translate-x-full'}`}&gt;
        &lt;div className="bg-stone-900 p-8 text-center relative"&gt;
          &lt;button onClick={() =&gt; setIsProfileOpen(false)} className="absolute top-4 left-4 text-stone-400 hover:text-white transition cursor-pointer"&gt;
            &lt;X className="w-6 h-6" /&gt;
          &lt;/button&gt;
          
          &lt;div className="w-20 h-20 mx-auto bg-stone-800 rounded-full flex items-center justify-center border-2 border-emerald-500/30 mb-4"&gt;
            &lt;User className="w-10 h-10 text-stone-300" /&gt;
          &lt;/div&gt;
          &lt;h3 className="text-xl font-bold text-white"&gt;{profile.fullName}&lt;/h3&gt;
          &lt;div className="flex items-center justify-center mt-2"&gt;
            {profile.trustScore &gt;= 0.8 ? (
              &lt;div className="bg-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold text-emerald-400 border border-emerald-500/30"&gt;
                &lt;ShieldCheck className="w-3.5 h-3.5" /&gt; High Trust Score
              &lt;/div&gt;
            ) : (
              &lt;span className="text-stone-400 text-sm"&gt;New Worker Profile&lt;/span&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;div className="flex-grow p-6 space-y-3 overflow-y-auto bg-stone-50"&gt;
          {policy &amp;&amp; (
            &lt;div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between"&gt;
              &lt;div className="flex items-center gap-3"&gt;
                &lt;div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"&gt;
                  &lt;ShieldCheck className="w-5 h-5" /&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;p className="text-xs font-semibold text-emerald-600 uppercase"&gt;Active Policy&lt;/p&gt;
                  &lt;p className="text-sm font-bold text-emerald-800"&gt;{policy.planTier} Tier&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div className="text-right"&gt;
                &lt;p className="text-xs text-emerald-600"&gt;Coverage&lt;/p&gt;
                &lt;p className="text-sm font-bold text-emerald-800"&gt;Rs. {policy.coverageAmount}&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          )}

          {[
            { icon: MapPin, label: 'City', value: profile.city, color: 'blue' },
            { icon: Briefcase, label: 'Platform', value: profile.deliveryPlatform, color: 'orange' },
            { icon: Bike, label: 'Vehicle', value: profile.vehicleType, color: 'emerald' },
            { icon: Wallet, label: 'UPI ID', value: profile.upiId || 'Not provided', color: 'purple' },
            { icon: Phone, label: 'Contact', value: profile.phoneNumber || profile.email, color: 'stone' },
          ].map((item, i) =&gt; (
            &lt;div key={i} className="p-3 rounded-xl bg-white border border-stone-100 flex items-center gap-4"&gt;
              &lt;div className={`w-10 h-10 rounded-full bg-${item.color}-50 flex items-center justify-center text-${item.color}-600`}&gt;
                &lt;item.icon className="w-5 h-5" /&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;p className="text-xs font-semibold text-stone-400 uppercase"&gt;{item.label}&lt;/p&gt;
                &lt;p className="text-sm font-medium text-stone-800 capitalize"&gt;{item.value}&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          ))}
        &lt;/div&gt;

        &lt;div className="p-6 border-t border-stone-100 bg-white"&gt;
          &lt;button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-rose-600 font-semibold hover:bg-rose-50 border border-rose-100 transition cursor-pointer"
          &gt;
            &lt;LogOut className="w-5 h-5" /&gt;
            Sign Out
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Onboarding Modal */}
      {showModal &amp;&amp; (
        &lt;div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4"&gt;
          &lt;div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"&gt;
            &lt;div className="bg-gradient-to-r from-rose-500 to-orange-500 p-8 flex flex-col items-center"&gt;
              &lt;div className="bg-white/20 p-4 rounded-full mb-4"&gt;
                &lt;ShieldAlert className="w-10 h-10 text-white" /&gt;
              &lt;/div&gt;
              &lt;h3 className="text-2xl font-bold text-white text-center"&gt;Your Income is at Risk&lt;/h3&gt;
            &lt;/div&gt;
            
            &lt;div className="p-8 text-center"&gt;
              &lt;p className="text-stone-600 mb-6 leading-relaxed"&gt;
                You are currently &lt;span className="font-bold text-rose-500"&gt;unprotected&lt;/span&gt; against weather disruptions and gig work emergencies.
              &lt;/p&gt;
              
              &lt;div className="flex flex-col gap-3"&gt;
                &lt;button 
                  onClick={() =&gt; navigate('/policy')}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-stone-900 hover:bg-stone-800 transition cursor-pointer"
                &gt;
                  Get Protected Now
                &lt;/button&gt;
                &lt;button 
                  onClick={() =&gt; setShowModal(false)}
                  className="w-full px-6 py-3 rounded-xl font-medium text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                &gt;
                  Maybe Later
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}
    &lt;/main&gt;
  );
};

export default Dashboard;
