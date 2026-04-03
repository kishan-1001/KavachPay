import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, AlertTriangle, 
  ChevronDown, ChevronUp, ArrowLeft, Wallet
} from 'lucide-react';

const API = 'http://localhost:5000';

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string; icon: React.ReactNode }> = {
  PAID:     { label: 'Approved',     bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', icon: <CheckCircle2 className="w-4 h-4" /> },
  REVIEW:   { label: 'Under Review', bgColor: 'bg-amber-50',   textColor: 'text-amber-700',   borderColor: 'border-amber-200',   icon: <Clock className="w-4 h-4" /> },
  REJECTED: { label: 'Rejected',     bgColor: 'bg-rose-50',    textColor: 'text-rose-700',    borderColor: 'border-rose-200',    icon: <XCircle className="w-4 h-4" /> },
  PENDING:  { label: 'Pending',      bgColor: 'bg-stone-50',   textColor: 'text-stone-600',   borderColor: 'border-stone-200',   icon: <AlertTriangle className="w-4 h-4" /> },
  APPEALED: { label: 'Appealed',     bgColor: 'bg-purple-50',  textColor: 'text-purple-700',  borderColor: 'border-purple-200',  icon: <ShieldAlert className="w-4 h-4" /> },
};

function ScoreBar({ label, value, good = true }: { label: string; value: number; good?: boolean }) {
  const pct = Math.round(value * 100);
  const color = good
    ? pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-500'
    : pct <= 30 ? 'bg-emerald-500' : pct <= 60 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-stone-500 font-medium">{label}</span>
        <span className="font-bold text-stone-700">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SignalChip({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {label}
    </div>
  );
}

function ClaimCard({ claim }: { claim: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;
  const date = new Date(claim.createdAt);

  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${status.bgColor} ${status.textColor} ${status.borderColor}`}>
              {status.icon} {status.label}
            </span>
            {claim.policy && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-semibold">
                {claim.policy.planTier}
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-stone-800 truncate">{claim.triggerEvent.replace(/_/g, ' ')}</p>
          <p className="text-sm text-stone-400 mt-1">
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          {claim.status === 'PAID' && claim.payoutAmount > 0 ? (
            <p className="text-2xl font-bold text-emerald-600">Rs. {claim.payoutAmount}</p>
          ) : (
            <p className="text-lg font-semibold text-stone-300">--</p>
          )}
          <p className="text-xs text-stone-400">payout</p>
        </div>
      </div>

      {/* Quick Scores Row */}
      <div className="px-5 pb-4 flex gap-2 flex-wrap">
        <SignalChip label="Hash Chain" passed={claim.isChainValid} />
        <SignalChip label="Behavioral" passed={(claim.behavioralScore ?? 1) >= 0.6} />
        <SignalChip label="Work Proof" passed={(claim.workProofScore ?? 0) >= 0.6} />
        <SignalChip label="Fraud Clean" passed={(claim.fraudScore ?? 1) <= 0.45} />
      </div>

      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-semibold text-stone-600 bg-stone-50 hover:bg-stone-100 border-t border-stone-100 transition cursor-pointer"
      >
        <span>Signal Breakdown & Evidence</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="p-5 border-t border-stone-100 space-y-5 bg-stone-50/50">
          {/* Score Bars */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Trust Signals</p>
              <ScoreBar label="Behavioral Score" value={claim.behavioralScore ?? 1} good={true} />
              <ScoreBar label="Work-Proof Score" value={claim.workProofScore ?? 0} good={true} />
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Risk Signals</p>
              <ScoreBar label="Fraud Risk Score" value={claim.fraudScore ?? 0} good={false} />
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-stone-500 font-medium">Hash Chain Integrity</span>
                  <span className={`font-bold ${claim.isChainValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {claim.isChainValid ? 'VALID' : 'BROKEN'}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${claim.isChainValid ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-1/4'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Adjudication Notes */}
          {claim.reviewerNotes && (
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Adjudication Log</p>
              <p className="text-sm text-stone-600 leading-relaxed font-mono break-words">{claim.reviewerNotes}</p>
            </div>
          )}

          {/* Razorpay Payout ID */}
          {claim.razorpayPayoutId && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Payout Ref:</span>
              <span className="font-mono text-stone-700 font-semibold">{claim.razorpayPayoutId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Claims() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, paid: 0, review: 0, totalPayout: 0 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) { navigate('/signin'); return; }

    fetch(`${API}/api/claim/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: any[]) => {
        setClaims(data);
        setStats({
          total: data.length,
          paid: data.filter(c => c.status === 'PAID').length,
          review: data.filter(c => c.status === 'REVIEW').length,
          totalPayout: data.reduce((s, c) => s + (c.payoutAmount || 0), 0),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const filteredClaims = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Claim History</h1>
            <p className="text-sm text-stone-500">Every claim, every signal - fully transparent</p>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Claims', value: stats.total, color: 'text-stone-900' },
            { label: 'Approved', value: stats.paid, color: 'text-emerald-600' },
            { label: 'Under Review', value: stats.review, color: 'text-amber-600' },
            { label: 'Total Paid Out', value: `Rs. ${stats.totalPayout}`, color: 'text-emerald-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-stone-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All Claims' },
            { key: 'PAID', label: 'Approved' },
            { key: 'REVIEW', label: 'Under Review' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Claims List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-stone-500 font-medium">Loading claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100 shadow-sm">
            <ShieldCheck className="w-14 h-14 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-600 font-semibold text-lg">No claims found</p>
            <p className="text-stone-400 text-sm mt-2 max-w-sm mx-auto">
              {filter === 'all' 
                ? 'Use the "Analyze Risk" button on your Dashboard to trigger your first claim.'
                : `No claims with "${filter}" status.`}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map(claim => <ClaimCard key={claim.id} claim={claim} />)}
          </div>
        )}
      </div>
    </main>
  );
}
