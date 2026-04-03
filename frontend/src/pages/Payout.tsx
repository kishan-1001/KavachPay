import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CheckCircle2, TrendingUp, BadgeIndianRupee, ClipboardList } from 'lucide-react';

const API = 'http://localhost:5000';

function PayoutCard({ payout }: { payout: any }) {
  const date = new Date(payout.createdAt);
  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
      {/* Icon */}
      <div className="w-12 h-12 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">
          {payout.triggerEvent.replace(/_/g, ' ')}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {payout.policy && (
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 font-semibold">
              {payout.policy.planTier}
            </span>
          )}
          <span className="text-xs text-slate-400">
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {payout.razorpayPayoutId && (
            <span className="text-xs font-mono text-slate-400 truncate max-w-[140px]" title={payout.razorpayPayoutId}>
              Ref: {payout.razorpayPayoutId}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-left sm:text-right flex-shrink-0 w-full sm:w-auto">
        <p className="text-xl font-black text-emerald-600">₹{payout.payoutAmount}</p>
        <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wide">Paid</p>
      </div>
    </div>
  );
}

export default function Payout() {
  const navigate = useNavigate();
  const [data, setData] = useState<{ payouts: any[]; totalPaid: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) { navigate('/signin'); return; }

    fetch(`${API}/api/claim/payouts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#eef2f6] text-slate-900 p-4 sm:p-6 lg:p-10">
      {/* Background blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-emerald-300 opacity-15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-blue-400 opacity-15 blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900">Payout History</h1>
            <p className="text-sm text-slate-500">All income protection payouts received.</p>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium">Loading payouts...</div>
        ) : !data || data.count === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No payouts yet.</p>
            <p className="text-slate-400 text-sm mt-1">Approved claims will appear here once processed.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
                <ClipboardList className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-blue-700">{data.count}</p>
                <p className="text-xs text-slate-400 font-semibold">Total Payouts</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg text-white text-center relative overflow-hidden sm:col-span-2">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,white,transparent)]" />
                <BadgeIndianRupee className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-3xl font-black">₹{data.totalPaid}</p>
                <p className="text-xs font-semibold opacity-80 mt-0.5">Total Income Protected</p>
              </div>
            </div>

            {/* Payout timeline */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3">
                <TrendingUp className="w-4 h-4" />
                <span>Payout Timeline</span>
              </div>
              <div className="space-y-3">
                {data.payouts.map((p: any) => <PayoutCard key={p.id} payout={p} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
