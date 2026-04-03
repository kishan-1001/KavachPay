import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, AlertTriangle, 
  ChevronDown, ChevronUp, ArrowLeft, Wallet, Filter, Search
} from 'lucide-react';

const API = 'http://localhost:5000';

const STATUS_CONFIG: Record&lt;string, { label: string; bgColor: string; textColor: string; borderColor: string; icon: React.ReactNode }&gt; = {
  PAID:     { label: 'Approved',     bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', icon: &lt;CheckCircle2 className="w-4 h-4" /&gt; },
  REVIEW:   { label: 'Under Review', bgColor: 'bg-amber-50',   textColor: 'text-amber-700',   borderColor: 'border-amber-200',   icon: &lt;Clock className="w-4 h-4" /&gt; },
  REJECTED: { label: 'Rejected',     bgColor: 'bg-rose-50',    textColor: 'text-rose-700',    borderColor: 'border-rose-200',    icon: &lt;XCircle className="w-4 h-4" /&gt; },
  PENDING:  { label: 'Pending',      bgColor: 'bg-stone-50',   textColor: 'text-stone-600',   borderColor: 'border-stone-200',   icon: &lt;AlertTriangle className="w-4 h-4" /&gt; },
  APPEALED: { label: 'Appealed',     bgColor: 'bg-purple-50',  textColor: 'text-purple-700',  borderColor: 'border-purple-200',  icon: &lt;ShieldAlert className="w-4 h-4" /&gt; },
};

function ScoreBar({ label, value, good = true }: { label: string; value: number; good?: boolean }) {
  const pct = Math.round(value * 100);
  const color = good
    ? pct &gt;= 70 ? 'bg-emerald-500' : pct &gt;= 40 ? 'bg-amber-400' : 'bg-rose-500'
    : pct &lt;= 30 ? 'bg-emerald-500' : pct &lt;= 60 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    &lt;div&gt;
      &lt;div className="flex justify-between text-xs mb-1.5"&gt;
        &lt;span className="text-stone-500 font-medium"&gt;{label}&lt;/span&gt;
        &lt;span className="font-bold text-stone-700"&gt;{pct}%&lt;/span&gt;
      &lt;/div&gt;
      &lt;div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden"&gt;
        &lt;div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} /&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

function SignalChip({ label, passed }: { label: string; passed: boolean }) {
  return (
    &lt;div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}&gt;
      &lt;div className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} /&gt;
      {label}
    &lt;/div&gt;
  );
}

function ClaimCard({ claim }: { claim: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;
  const date = new Date(claim.createdAt);

  return (
    &lt;div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"&gt;
      {/* Header */}
      &lt;div className="p-5 flex items-start justify-between gap-4"&gt;
        &lt;div className="flex-1 min-w-0"&gt;
          &lt;div className="flex items-center gap-2 flex-wrap mb-3"&gt;
            &lt;span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${status.bgColor} ${status.textColor} ${status.borderColor}`}&gt;
              {status.icon} {status.label}
            &lt;/span&gt;
            {claim.policy &amp;&amp; (
              &lt;span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-semibold"&gt;
                {claim.policy.planTier}
              &lt;/span&gt;
            )}
          &lt;/div&gt;
          &lt;p className="text-base font-semibold text-stone-800 truncate"&gt;{claim.triggerEvent.replace(/_/g, ' ')}&lt;/p&gt;
          &lt;p className="text-sm text-stone-400 mt-1"&gt;
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          &lt;/p&gt;
        &lt;/div&gt;
        &lt;div className="text-right flex-shrink-0"&gt;
          {claim.status === 'PAID' &amp;&amp; claim.payoutAmount &gt; 0 ? (
            &lt;p className="text-2xl font-bold text-emerald-600"&gt;Rs. {claim.payoutAmount}&lt;/p&gt;
          ) : (
            &lt;p className="text-lg font-semibold text-stone-300"&gt;--&lt;/p&gt;
          )}
          &lt;p className="text-xs text-stone-400"&gt;payout&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Quick Scores Row */}
      &lt;div className="px-5 pb-4 flex gap-2 flex-wrap"&gt;
        &lt;SignalChip label="Hash Chain" passed={claim.isChainValid} /&gt;
        &lt;SignalChip label="Behavioral" passed={(claim.behavioralScore ?? 1) &gt;= 0.6} /&gt;
        &lt;SignalChip label="Work Proof" passed={(claim.workProofScore ?? 0) &gt;= 0.6} /&gt;
        &lt;SignalChip label="Fraud Clean" passed={(claim.fraudScore ?? 1) &lt;= 0.45} /&gt;
      &lt;/div&gt;

      {/* Expand Toggle */}
      &lt;button
        onClick={() =&gt; setExpanded(v =&gt; !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-semibold text-stone-600 bg-stone-50 hover:bg-stone-100 border-t border-stone-100 transition cursor-pointer"
      &gt;
        &lt;span&gt;Signal Breakdown &amp; Evidence&lt;/span&gt;
        {expanded ? &lt;ChevronUp className="w-4 h-4" /&gt; : &lt;ChevronDown className="w-4 h-4" /&gt;}
      &lt;/button&gt;

      {/* Expanded Detail Panel */}
      {expanded &amp;&amp; (
        &lt;div className="p-5 border-t border-stone-100 space-y-5 bg-stone-50/50"&gt;
          {/* Score Bars */}
          &lt;div className="grid sm:grid-cols-2 gap-6"&gt;
            &lt;div className="space-y-4"&gt;
              &lt;p className="text-xs font-bold text-stone-400 uppercase tracking-wider"&gt;Trust Signals&lt;/p&gt;
              &lt;ScoreBar label="Behavioral Score" value={claim.behavioralScore ?? 1} good={true} /&gt;
              &lt;ScoreBar label="Work-Proof Score" value={claim.workProofScore ?? 0} good={true} /&gt;
            &lt;/div&gt;
            &lt;div className="space-y-4"&gt;
              &lt;p className="text-xs font-bold text-stone-400 uppercase tracking-wider"&gt;Risk Signals&lt;/p&gt;
              &lt;ScoreBar label="Fraud Risk Score" value={claim.fraudScore ?? 0} good={false} /&gt;
              &lt;div&gt;
                &lt;div className="flex justify-between text-xs mb-1.5"&gt;
                  &lt;span className="text-stone-500 font-medium"&gt;Hash Chain Integrity&lt;/span&gt;
                  &lt;span className={`font-bold ${claim.isChainValid ? 'text-emerald-600' : 'text-rose-600'}`}&gt;
                    {claim.isChainValid ? 'VALID' : 'BROKEN'}
                  &lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden"&gt;
                  &lt;div className={`h-full rounded-full ${claim.isChainValid ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-1/4'}`} /&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          {/* Adjudication Notes */}
          {claim.reviewerNotes &amp;&amp; (
            &lt;div className="bg-white border border-stone-100 rounded-xl p-4"&gt;
              &lt;p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2"&gt;Adjudication Log&lt;/p&gt;
              &lt;p className="text-sm text-stone-600 leading-relaxed font-mono break-words"&gt;{claim.reviewerNotes}&lt;/p&gt;
            &lt;/div&gt;
          )}

          {/* Razorpay Payout ID */}
          {claim.razorpayPayoutId &amp;&amp; (
            &lt;div className="flex items-center gap-2 text-sm text-stone-500"&gt;
              &lt;Wallet className="w-4 h-4 text-emerald-500" /&gt;
              &lt;span&gt;Payout Ref:&lt;/span&gt;
              &lt;span className="font-mono text-stone-700 font-semibold"&gt;{claim.razorpayPayoutId}&lt;/span&gt;
            &lt;/div&gt;
          )}
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  );
}

export default function Claims() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState&lt;any[]&gt;([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, paid: 0, review: 0, totalPayout: 0 });
  const [filter, setFilter] = useState('all');

  useEffect(() =&gt; {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) { navigate('/signin'); return; }

    fetch(`${API}/api/claim/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r =&gt; r.json())
      .then((data: any[]) =&gt; {
        setClaims(data);
        setStats({
          total: data.length,
          paid: data.filter(c =&gt; c.status === 'PAID').length,
          review: data.filter(c =&gt; c.status === 'REVIEW').length,
          totalPayout: data.reduce((s, c) =&gt; s + (c.payoutAmount || 0), 0),
        });
      })
      .catch(console.error)
      .finally(() =&gt; setLoading(false));
  }, [navigate]);

  const filteredClaims = filter === 'all' ? claims : claims.filter(c =&gt; c.status === filter);

  return (
    &lt;main className="min-h-screen bg-stone-50 text-stone-900"&gt;
      {/* Navigation */}
      &lt;nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100"&gt;
        &lt;div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4"&gt;
          &lt;button
            onClick={() =&gt; navigate('/dashboard')}
            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
          &gt;
            &lt;ArrowLeft className="w-5 h-5" /&gt;
          &lt;/button&gt;
          &lt;div&gt;
            &lt;h1 className="text-xl font-bold text-stone-900"&gt;Claim History&lt;/h1&gt;
            &lt;p className="text-sm text-stone-500"&gt;Every claim, every signal - fully transparent&lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/nav&gt;

      &lt;div className="max-w-4xl mx-auto px-6 py-8"&gt;
        {/* Stats Bar */}
        &lt;div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"&gt;
          {[
            { label: 'Total Claims', value: stats.total, color: 'text-stone-900' },
            { label: 'Approved', value: stats.paid, color: 'text-emerald-600' },
            { label: 'Under Review', value: stats.review, color: 'text-amber-600' },
            { label: 'Total Paid Out', value: `Rs. ${stats.totalPayout}`, color: 'text-emerald-700' },
          ].map(s =&gt; (
            &lt;div key={s.label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"&gt;
              &lt;p className={`text-2xl font-bold ${s.color}`}&gt;{s.value}&lt;/p&gt;
              &lt;p className="text-sm text-stone-400 font-medium mt-1"&gt;{s.label}&lt;/p&gt;
            &lt;/div&gt;
          ))}
        &lt;/div&gt;

        {/* Filter Tabs */}
        &lt;div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"&gt;
          {[
            { key: 'all', label: 'All Claims' },
            { key: 'PAID', label: 'Approved' },
            { key: 'REVIEW', label: 'Under Review' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map(tab =&gt; (
            &lt;button
              key={tab.key}
              onClick={() =&gt; setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            &gt;
              {tab.label}
            &lt;/button&gt;
          ))}
        &lt;/div&gt;

        {/* Claims List */}
        {loading ? (
          &lt;div className="flex flex-col items-center justify-center py-20"&gt;
            &lt;div className="w-10 h-10 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin mb-4"&gt;&lt;/div&gt;
            &lt;p className="text-stone-500 font-medium"&gt;Loading claims...&lt;/p&gt;
          &lt;/div&gt;
        ) : filteredClaims.length === 0 ? (
          &lt;div className="text-center py-20 bg-white rounded-2xl border border-stone-100 shadow-sm"&gt;
            &lt;ShieldCheck className="w-14 h-14 text-stone-200 mx-auto mb-4" /&gt;
            &lt;p className="text-stone-600 font-semibold text-lg"&gt;No claims found&lt;/p&gt;
            &lt;p className="text-stone-400 text-sm mt-2 max-w-sm mx-auto"&gt;
              {filter === 'all' 
                ? 'Use the "Analyze Risk" button on your Dashboard to trigger your first claim.'
                : `No claims with "${filter}" status.`}
            &lt;/p&gt;
            &lt;button
              onClick={() =&gt; navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition cursor-pointer"
            &gt;
              Go to Dashboard
            &lt;/button&gt;
          &lt;/div&gt;
        ) : (
          &lt;div className="space-y-4"&gt;
            {filteredClaims.map(claim =&gt; &lt;ClaimCard key={claim.id} claim={claim} /&gt;)}
          &lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/main&gt;
  );
}
