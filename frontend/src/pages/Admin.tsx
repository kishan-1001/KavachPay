import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Users, Wallet, TrendingUp, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, MapPin, ArrowLeft, Settings, RefreshCw, Plus, Clock
} from 'lucide-react';

const Admin: React.FC = () =&gt; {
  const navigate = useNavigate();
  const [stats, setStats] = useState&lt;any&gt;(null);
  const [claims, setClaims] = useState&lt;any[]&gt;([]);
  const [treasury, setTreasury] = useState&lt;any&gt;(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [topupAmount, setTopupAmount] = useState(25000);
  const [topupNote, setTopupNote] = useState('Demo top-up');

  useEffect(() =&gt; {
    const token = localStorage.getItem('kavachpay_token');
    const userStr = localStorage.getItem('kavachpay_user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token || user?.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }

    const fetchAdminData = async () =&gt; {
      try {
        const [statsRes, claimsRes, treasuryRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/admin/claims', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/admin/treasury', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.ok &amp;&amp; claimsRes.ok &amp;&amp; treasuryRes.ok) {
          setStats(await statsRes.json());
          setClaims(await claimsRes.json());
          setTreasury(await treasuryRes.json());
        }
      } catch (err) {
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleUpdateStatus = async (id: string, status: string) =&gt; {
    const token = localStorage.getItem('kavachpay_token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/claims/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, reviewerNotes: 'Manual Admin override.' })
      });
      if (res.ok) {
        setClaims(claims.map(c =&gt; c.id === id ? { ...c, status } : c));
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const handleTopupTreasury = async () =&gt; {
    const token = localStorage.getItem('kavachpay_token');
    try {
      const res = await fetch('http://localhost:5000/api/admin/treasury/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: topupAmount, note: topupNote })
      });

      if (res.ok) {
        const [statsRes, treasuryRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/admin/treasury', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (treasuryRes.ok) setTreasury(await treasuryRes.json());
      }
    } catch (err) {
      console.error('Treasury top-up failed', err);
    }
  };

  if (loading) {
    return (
      &lt;div className="min-h-screen bg-stone-900 flex items-center justify-center"&gt;
        &lt;div className="flex flex-col items-center gap-4"&gt;
          &lt;div className="w-12 h-12 border-4 border-stone-700 border-t-emerald-500 rounded-full animate-spin"&gt;&lt;/div&gt;
          &lt;p className="text-stone-400 font-medium"&gt;Loading admin console...&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    );
  }

  const filteredClaims = claims.filter(c =&gt; activeTab === 'all' || c.status === activeTab);

  return (
    &lt;div className="min-h-screen bg-stone-950 text-stone-100"&gt;
      {/* Admin Navigation */}
      &lt;nav className="sticky top-0 z-30 bg-stone-900/80 backdrop-blur-xl border-b border-stone-800"&gt;
        &lt;div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"&gt;
          &lt;div className="flex items-center gap-4"&gt;
            &lt;button onClick={() =&gt; navigate('/dashboard')} className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white transition cursor-pointer"&gt;
              &lt;ArrowLeft className="w-5 h-5" /&gt;
            &lt;/button&gt;
            &lt;div className="flex items-center gap-3"&gt;
              &lt;div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center"&gt;
                &lt;ShieldCheck className="w-5 h-5 text-emerald-400" /&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;h1 className="text-lg font-bold"&gt;KavachPay Admin&lt;/h1&gt;
                &lt;p className="text-xs text-stone-500"&gt;System Control Panel&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;div className="flex items-center gap-3"&gt;
            &lt;div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"&gt;
              &lt;div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"&gt;&lt;/div&gt;
              &lt;span className="text-xs font-semibold text-emerald-400"&gt;System Online&lt;/span&gt;
            &lt;/div&gt;
            &lt;button className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 transition cursor-pointer"&gt;
              &lt;Settings className="w-5 h-5" /&gt;
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/nav&gt;

      &lt;main className="max-w-7xl mx-auto px-6 py-8 space-y-8"&gt;
        {/* Stats Grid */}
        &lt;section className="grid grid-cols-2 lg:grid-cols-5 gap-4"&gt;
          {[
            { icon: Users, label: 'Active Workers', value: stats?.totalUsers || 0, color: 'blue', badge: '+12%' },
            { icon: ShieldCheck, label: 'Active Policies', value: stats?.activePolicies || 0, color: 'emerald', badge: 'In Force' },
            { icon: Wallet, label: 'Claims Paid', value: `Rs. ${stats?.totalPayouts?.toLocaleString() || 0}`, color: 'amber', badge: 'INR' },
            { icon: AlertTriangle, label: 'Fraud Rate', value: `${stats?.fraudRate || 0}%`, color: 'rose', badge: 'Risk' },
            { icon: Wallet, label: 'Treasury', value: `Rs. ${stats?.treasury?.balance?.toLocaleString() || 0}`, color: 'cyan', badge: 'Balance' },
          ].map((stat, i) =&gt; (
            &lt;div key={i} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition group"&gt;
              &lt;div className="flex items-center justify-between mb-4"&gt;
                &lt;div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center group-hover:scale-110 transition`}&gt;
                  &lt;stat.icon className={`w-5 h-5 text-${stat.color}-400`} /&gt;
                &lt;/div&gt;
                &lt;span className={`text-[10px] font-bold text-${stat.color}-400 uppercase tracking-wider`}&gt;{stat.badge}&lt;/span&gt;
              &lt;/div&gt;
              &lt;p className="text-xs font-semibold text-stone-500 uppercase tracking-wider"&gt;{stat.label}&lt;/p&gt;
              &lt;p className="text-2xl font-bold mt-1"&gt;{stat.value}&lt;/p&gt;
            &lt;/div&gt;
          ))}
        &lt;/section&gt;

        {/* Treasury Controls */}
        &lt;section className="bg-stone-900 border border-stone-800 rounded-2xl p-6"&gt;
          &lt;div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between mb-6"&gt;
            &lt;div&gt;
              &lt;h3 className="text-lg font-bold text-white"&gt;Treasury Controls&lt;/h3&gt;
              &lt;p className="text-sm text-stone-500"&gt;Manage demonstration funds&lt;/p&gt;
            &lt;/div&gt;
            &lt;div className="flex flex-col sm:flex-row gap-3"&gt;
              &lt;input
                type="number"
                min={1}
                value={topupAmount}
                onChange={(e) =&gt; setTopupAmount(Number(e.target.value || 0))}
                className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-600 transition"
                placeholder="Amount"
              /&gt;
              &lt;input
                type="text"
                value={topupNote}
                onChange={(e) =&gt; setTopupNote(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-600 transition"
                placeholder="Note"
              /&gt;
              &lt;button
                onClick={handleTopupTreasury}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
              &gt;
                &lt;Plus className="w-4 h-4" /&gt;
                Top Up
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="grid sm:grid-cols-3 gap-4 mb-6"&gt;
            &lt;div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4"&gt;
              &lt;p className="text-xs font-semibold text-stone-500 uppercase mb-1"&gt;Inflow&lt;/p&gt;
              &lt;p className="text-xl font-bold text-emerald-400"&gt;Rs. {treasury?.inflow?.toLocaleString() || 0}&lt;/p&gt;
            &lt;/div&gt;
            &lt;div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4"&gt;
              &lt;p className="text-xs font-semibold text-stone-500 uppercase mb-1"&gt;Outflow&lt;/p&gt;
              &lt;p className="text-xl font-bold text-rose-400"&gt;Rs. {treasury?.outflow?.toLocaleString() || 0}&lt;/p&gt;
            &lt;/div&gt;
            &lt;div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4"&gt;
              &lt;p className="text-xs font-semibold text-stone-500 uppercase mb-1"&gt;Transactions&lt;/p&gt;
              &lt;p className="text-xl font-bold text-cyan-400"&gt;{treasury?.transactionsCount || 0}&lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          {/* Transaction Log */}
          &lt;div className="overflow-x-auto rounded-xl border border-stone-800"&gt;
            &lt;table className="w-full text-left"&gt;
              &lt;thead&gt;
                &lt;tr className="bg-stone-800/50 border-b border-stone-800"&gt;
                  &lt;th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase"&gt;Time&lt;/th&gt;
                  &lt;th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase"&gt;Type&lt;/th&gt;
                  &lt;th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase"&gt;Direction&lt;/th&gt;
                  &lt;th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase"&gt;Amount&lt;/th&gt;
                  &lt;th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase"&gt;Balance&lt;/th&gt;
                &lt;/tr&gt;
              &lt;/thead&gt;
              &lt;tbody className="divide-y divide-stone-800"&gt;
                {(treasury?.transactions || []).slice(0, 6).map((tx: any) =&gt; (
                  &lt;tr key={tx.id} className="hover:bg-stone-800/30 transition"&gt;
                    &lt;td className="px-4 py-3 text-sm text-stone-400"&gt;{new Date(tx.createdAt).toLocaleString()}&lt;/td&gt;
                    &lt;td className="px-4 py-3 text-sm font-semibold text-stone-200 uppercase"&gt;{tx.type}&lt;/td&gt;
                    &lt;td className={`px-4 py-3 text-sm font-semibold uppercase ${tx.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}&gt;{tx.direction}&lt;/td&gt;
                    &lt;td className="px-4 py-3 text-sm text-stone-300"&gt;Rs. {tx.amount}&lt;/td&gt;
                    &lt;td className="px-4 py-3 text-sm text-cyan-400 font-semibold"&gt;Rs. {tx.balanceAfter}&lt;/td&gt;
                  &lt;/tr&gt;
                ))}
                {(treasury?.transactions || []).length === 0 &amp;&amp; (
                  &lt;tr&gt;
                    &lt;td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-500"&gt;No treasury transactions yet.&lt;/td&gt;
                  &lt;/tr&gt;
                )}
              &lt;/tbody&gt;
            &lt;/table&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Analytics Grid */}
        &lt;div className="grid lg:grid-cols-3 gap-6"&gt;
          {/* Chart Placeholder */}
          &lt;div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-6"&gt;
            &lt;div className="flex justify-between items-center mb-8"&gt;
              &lt;div className="flex items-center gap-2"&gt;
                &lt;TrendingUp className="w-5 h-5 text-emerald-400" /&gt;
                &lt;h3 className="font-bold text-white"&gt;Revenue vs Payouts&lt;/h3&gt;
              &lt;/div&gt;
              &lt;select className="bg-stone-800 border border-stone-700 rounded-lg text-sm px-3 py-1.5 font-medium outline-none cursor-pointer"&gt;
                &lt;option&gt;Last 30 Days&lt;/option&gt;
                &lt;option&gt;Year to Date&lt;/option&gt;
              &lt;/select&gt;
            &lt;/div&gt;

            {/* Simple Bar Chart */}
            &lt;div className="flex items-end justify-between gap-3 h-48 px-2"&gt;
              {[40, 65, 30, 85, 45, 90, 60, 55, 75, 40, 80, 50].map((h, i) =&gt; (
                &lt;div key={i} className="flex flex-col items-center gap-2 w-full"&gt;
                  &lt;div className="flex flex-row items-end gap-1 w-full h-full"&gt;
                    &lt;div className="bg-emerald-500/20 hover:bg-emerald-500/40 w-full rounded-t-md transition" style={{ height: `${h}%` }}&gt;&lt;/div&gt;
                    &lt;div className="bg-stone-700/50 hover:bg-stone-600/50 w-1/2 rounded-t-md transition" style={{ height: `${h * 0.4}%` }}&gt;&lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              ))}
            &lt;/div&gt;
            &lt;div className="mt-4 pt-4 border-t border-stone-800 flex justify-between text-xs font-medium text-stone-500"&gt;
              &lt;span&gt;Week 1&lt;/span&gt;
              &lt;span&gt;Week 2&lt;/span&gt;
              &lt;span&gt;Week 3&lt;/span&gt;
              &lt;span&gt;Week 4&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          {/* High Risk Alerts */}
          &lt;div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col"&gt;
            &lt;div className="flex items-center gap-2 mb-6"&gt;
              &lt;AlertTriangle className="w-5 h-5 text-rose-400" /&gt;
              &lt;h3 className="font-bold text-white"&gt;High Risk Alerts&lt;/h3&gt;
            &lt;/div&gt;
            &lt;div className="space-y-3 flex-grow overflow-y-auto max-h-[300px]"&gt;
              {claims.filter(c =&gt; c.fraudScore &gt; 0.5).length === 0 ? (
                &lt;div className="text-center py-10"&gt;
                  &lt;ShieldCheck className="w-10 h-10 text-stone-700 mx-auto mb-2" /&gt;
                  &lt;p className="text-stone-500 text-sm"&gt;No high-risk alerts&lt;/p&gt;
                &lt;/div&gt;
              ) : (
                claims.filter(c =&gt; c.fraudScore &gt; 0.5).map((c, i) =&gt; (
                  &lt;div key={i} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between group hover:bg-rose-500/10 transition"&gt;
                    &lt;div className="flex items-center gap-3"&gt;
                      &lt;div className="w-2 h-2 rounded-full bg-rose-500"&gt;&lt;/div&gt;
                      &lt;div&gt;
                        &lt;p className="text-sm font-semibold text-white"&gt;{c.user.fullName}&lt;/p&gt;
                        &lt;p className="text-xs text-stone-500"&gt;{c.user.city} | Score: {c.fraudScore}&lt;/p&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;
                    &lt;ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-rose-400 transition" /&gt;
                  &lt;/div&gt;
                ))
              )}
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Claims Table */}
        &lt;section className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden"&gt;
          &lt;div className="p-6 border-b border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"&gt;
            &lt;h3 className="text-lg font-bold text-white"&gt;Global Claim Ledger&lt;/h3&gt;
            &lt;div className="flex gap-2 bg-stone-800 p-1 rounded-xl"&gt;
              {[
                { key: 'all', label: 'All' },
                { key: 'REVIEW', label: 'Pending' },
                { key: 'PAID', label: 'Processed' },
              ].map(tab =&gt; (
                &lt;button 
                  key={tab.key}
                  onClick={() =&gt; setActiveTab(tab.key)}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer ${
                    activeTab === tab.key 
                      ? 'bg-stone-700 text-white' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                &gt;
                  {tab.label}
                &lt;/button&gt;
              ))}
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="overflow-x-auto"&gt;
            &lt;table className="w-full text-left"&gt;
              &lt;thead&gt;
                &lt;tr className="bg-stone-800/50 border-b border-stone-800"&gt;
                  &lt;th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase"&gt;Worker&lt;/th&gt;
                  &lt;th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase"&gt;Location&lt;/th&gt;
                  &lt;th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase"&gt;Plan&lt;/th&gt;
                  &lt;th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase"&gt;Scores&lt;/th&gt;
                  &lt;th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase text-center"&gt;Status&lt;/th&gt;
                  &lt;th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase text-right"&gt;Actions&lt;/th&gt;
                &lt;/tr&gt;
              &lt;/thead&gt;
              &lt;tbody className="divide-y divide-stone-800"&gt;
                {filteredClaims.map((claim) =&gt; (
                  &lt;tr key={claim.id} className="hover:bg-stone-800/30 transition"&gt;
                    &lt;td className="px-6 py-5 whitespace-nowrap"&gt;
                      &lt;div className="flex items-center gap-3"&gt;
                        &lt;div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-stone-300 font-bold text-sm"&gt;
                          {claim.user.fullName.charAt(0)}
                        &lt;/div&gt;
                        &lt;div&gt;
                          &lt;p className="text-sm font-semibold text-white"&gt;{claim.user.fullName}&lt;/p&gt;
                          &lt;p className="text-xs text-stone-500 font-mono"&gt;#{claim.id.split('-')[0].toUpperCase()}&lt;/p&gt;
                        &lt;/div&gt;
                      &lt;/div&gt;
                    &lt;/td&gt;
                    &lt;td className="px-6 py-5 whitespace-nowrap"&gt;
                      &lt;div className="flex items-center gap-2 text-stone-400 text-sm"&gt;
                        &lt;MapPin className="w-4 h-4" /&gt;
                        {claim.user.city}
                      &lt;/div&gt;
                    &lt;/td&gt;
                    &lt;td className="px-6 py-5 whitespace-nowrap"&gt;
                      &lt;span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        claim.policy.planTier === 'PREMIUM' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                        claim.policy.planTier === 'STANDARD' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                        'border-stone-600/20 bg-stone-700/20 text-stone-400'
                      }`}&gt;
                        {claim.policy.planTier}
                      &lt;/span&gt;
                    &lt;/td&gt;
                    &lt;td className="px-6 py-5 whitespace-nowrap"&gt;
                      &lt;div className="flex items-center gap-4"&gt;
                        &lt;div&gt;
                          &lt;span className="text-xs text-stone-500 block"&gt;Fraud&lt;/span&gt;
                          &lt;span className={`text-sm font-bold ${claim.fraudScore &gt; 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}&gt;{claim.fraudScore}&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div&gt;
                          &lt;span className="text-xs text-stone-500 block"&gt;Proof&lt;/span&gt;
                          &lt;span className={`text-sm font-bold ${claim.workProofScore &lt; 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}&gt;{claim.workProofScore}&lt;/span&gt;
                        &lt;/div&gt;
                      &lt;/div&gt;
                    &lt;/td&gt;
                    &lt;td className="px-6 py-5 whitespace-nowrap text-center"&gt;
                      &lt;div className="inline-flex items-center gap-2"&gt;
                        &lt;div className={`w-2 h-2 rounded-full ${
                          claim.status === 'PAID' ? 'bg-emerald-500' :
                          claim.status === 'REJECTED' ? 'bg-rose-500' :
                          'bg-amber-500 animate-pulse'
                        }`}&gt;&lt;/div&gt;
                        &lt;span className={`text-xs font-semibold ${
                          claim.status === 'PAID' ? 'text-emerald-400' :
                          claim.status === 'REJECTED' ? 'text-rose-400' :
                          'text-amber-400'
                        }`}&gt;
                          {claim.status === 'PAID' ? 'Processed' : claim.status === 'REJECTED' ? 'Blocked' : 'Review'}
                        &lt;/span&gt;
                      &lt;/div&gt;
                    &lt;/td&gt;
                    &lt;td className="px-6 py-5 whitespace-nowrap text-right"&gt;
                      {claim.status === 'REVIEW' ? (
                        &lt;div className="flex justify-end gap-2"&gt;
                          &lt;button 
                            onClick={() =&gt; handleUpdateStatus(claim.id, 'REJECTED')}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-stone-500 hover:text-rose-400 transition cursor-pointer"
                            title="Reject"
                          &gt;
                            &lt;XCircle className="w-5 h-5" /&gt;
                          &lt;/button&gt;
                          &lt;button 
                            onClick={() =&gt; handleUpdateStatus(claim.id, 'PAID')}
                            className="p-2 rounded-lg hover:bg-emerald-500/10 text-stone-500 hover:text-emerald-400 transition cursor-pointer"
                            title="Approve"
                          &gt;
                            &lt;CheckCircle className="w-5 h-5" /&gt;
                          &lt;/button&gt;
                        &lt;/div&gt;
                      ) : (
                        &lt;span className="text-stone-600"&gt;-&lt;/span&gt;
                      )}
                    &lt;/td&gt;
                  &lt;/tr&gt;
                ))}
                {filteredClaims.length === 0 &amp;&amp; (
                  &lt;tr&gt;
                    &lt;td colSpan={6} className="px-6 py-16 text-center text-stone-500"&gt;
                      No claims found matching this filter.
                    &lt;/td&gt;
                  &lt;/tr&gt;
                )}
              &lt;/tbody&gt;
            &lt;/table&gt;
          &lt;/div&gt;
        &lt;/section&gt;
      &lt;/main&gt;

      {/* Footer */}
      &lt;footer className="border-t border-stone-900 bg-stone-950 px-6 py-4"&gt;
        &lt;div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-stone-600"&gt;
          &lt;span&gt;System Status: Online&lt;/span&gt;
          &lt;span&gt;Connected to IMD Infrastructure&lt;/span&gt;
          &lt;span&gt;{new Date().toLocaleString()}&lt;/span&gt;
        &lt;/div&gt;
      &lt;/footer&gt;
    &lt;/div&gt;
  );
};

export default Admin;
