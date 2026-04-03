import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Users, Wallet, TrendingUp, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, MapPin, ArrowLeft, Settings, RefreshCw, Plus, Clock
} from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [treasury, setTreasury] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [topupAmount, setTopupAmount] = useState(25000);
  const [topupNote, setTopupNote] = useState('Demo top-up');

  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    const userStr = localStorage.getItem('kavachpay_user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token || user?.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [statsRes, claimsRes, treasuryRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/admin/claims', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/admin/treasury', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.ok && claimsRes.ok && treasuryRes.ok) {
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

  const handleUpdateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('kavachpay_token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/claims/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, reviewerNotes: 'Manual Admin override.' })
      });
      if (res.ok) {
        setClaims(claims.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const handleTopupTreasury = async () => {
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
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-700 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-stone-400 font-medium">Loading admin console...</p>
        </div>
      </div>
    );
  }

  const filteredClaims = claims.filter(c => activeTab === 'all' || c.status === activeTab);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Admin Navigation */}
      <nav className="sticky top-0 z-30 bg-stone-900/80 backdrop-blur-xl border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white transition cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold">KavachPay Admin</h1>
                <p className="text-xs text-stone-500">System Control Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-400">System Online</span>
            </div>
            <button className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 transition cursor-pointer">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">+12%</span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Workers</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">In Force</span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Policies</p>
            <p className="text-2xl font-bold mt-1">{stats?.activePolicies || 0}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition">
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">INR</span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Claims Paid</p>
            <p className="text-2xl font-bold mt-1">Rs. {stats?.totalPayouts?.toLocaleString() || 0}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Risk</span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Fraud Rate</p>
            <p className="text-2xl font-bold mt-1">{stats?.fraudRate || 0}%</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition">
                <Wallet className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Balance</span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Treasury</p>
            <p className="text-2xl font-bold mt-1">Rs. {stats?.treasury?.balance?.toLocaleString() || 0}</p>
          </div>
        </section>

        {/* Treasury Controls */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Treasury Controls</h3>
              <p className="text-sm text-stone-500">Manage demonstration funds</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                min={1}
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number(e.target.value || 0))}
                className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-600 transition"
                placeholder="Amount"
              />
              <input
                type="text"
                value={topupNote}
                onChange={(e) => setTopupNote(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-600 transition"
                placeholder="Note"
              />
              <button
                onClick={handleTopupTreasury}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Top Up
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Inflow</p>
              <p className="text-xl font-bold text-emerald-400">Rs. {treasury?.inflow?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Outflow</p>
              <p className="text-xl font-bold text-rose-400">Rs. {treasury?.outflow?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Transactions</p>
              <p className="text-xl font-bold text-cyan-400">{treasury?.transactionsCount || 0}</p>
            </div>
          </div>

          {/* Transaction Log */}
          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-800/50 border-b border-stone-800">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Direction</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {(treasury?.transactions || []).slice(0, 6).map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-stone-800/30 transition">
                    <td className="px-4 py-3 text-sm text-stone-400">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-stone-200 uppercase">{tx.type}</td>
                    <td className={`px-4 py-3 text-sm font-semibold uppercase ${tx.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.direction}</td>
                    <td className="px-4 py-3 text-sm text-stone-300">Rs. {tx.amount}</td>
                    <td className="px-4 py-3 text-sm text-cyan-400 font-semibold">Rs. {tx.balanceAfter}</td>
                  </tr>
                ))}
                {(treasury?.transactions || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-500">No treasury transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Analytics Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Placeholder */}
          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">Revenue vs Payouts</h3>
              </div>
              <select className="bg-stone-800 border border-stone-700 rounded-lg text-sm px-3 py-1.5 font-medium outline-none cursor-pointer">
                <option>Last 30 Days</option>
                <option>Year to Date</option>
              </select>
            </div>

            {/* Simple Bar Chart */}
            <div className="flex items-end justify-between gap-3 h-48 px-2">
              {[40, 65, 30, 85, 45, 90, 60, 55, 75, 40, 80, 50].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="flex flex-row items-end gap-1 w-full h-full">
                    <div className="bg-emerald-500/20 hover:bg-emerald-500/40 w-full rounded-t-md transition" style={{ height: `${h}%` }}></div>
                    <div className="bg-stone-700/50 hover:bg-stone-600/50 w-1/2 rounded-t-md transition" style={{ height: `${h * 0.4}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex justify-between text-xs font-medium text-stone-500">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>

          {/* High Risk Alerts */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-white">High Risk Alerts</h3>
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px]">
              {claims.filter(c => c.fraudScore > 0.5).length === 0 ? (
                <div className="text-center py-10">
                  <ShieldCheck className="w-10 h-10 text-stone-700 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No high-risk alerts</p>
                </div>
              ) : (
                claims.filter(c => c.fraudScore > 0.5).map((c, i) => (
                  <div key={i} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between group hover:bg-rose-500/10 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.user.fullName}</p>
                        <p className="text-xs text-stone-500">{c.user.city} | Score: {c.fraudScore}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-rose-400 transition" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-white">Global Claim Ledger</h3>
            <div className="flex gap-2 bg-stone-800 p-1 rounded-xl">
              {[
                { key: 'all', label: 'All' },
                { key: 'REVIEW', label: 'Pending' },
                { key: 'PAID', label: 'Processed' },
              ].map(tab => (
                <button 
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer ${
                    activeTab === tab.key 
                      ? 'bg-stone-700 text-white' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-800/50 border-b border-stone-800">
                  <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase">Worker</th>
                  <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase">Plan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase">Scores</th>
                  <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-stone-800/30 transition">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-stone-300 font-bold text-sm">
                          {claim.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{claim.user.fullName}</p>
                          <p className="text-xs text-stone-500 font-mono">#{claim.id.split('-')[0].toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-stone-400 text-sm">
                        <MapPin className="w-4 h-4" />
                        {claim.user.city}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
                        {claim.policy?.planTier || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] uppercase text-stone-500 font-semibold">Trust</p>
                          <p className="text-sm font-bold text-emerald-400">{(claim.trustScore * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-stone-500 font-semibold">Risk</p>
                          <p className={`text-sm font-bold ${claim.fraudScore > 0.5 ? 'text-rose-400' : 'text-stone-400'}`}>
                            {(claim.fraudScore * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                        claim.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                        claim.status === 'REVIEW' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {claim.status === 'PAID' && <CheckCircle className="w-3.5 h-3.5" />}
                        {claim.status === 'REVIEW' && <Clock className="w-3.5 h-3.5" />}
                        {claim.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      {claim.status === 'REVIEW' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(claim.id, 'PAID')}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(claim.id, 'REJECTED')}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                      No claims found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Admin;
