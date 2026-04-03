import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CheckCircle2, TrendingUp, IndianRupee, ClipboardList, ArrowUpRight, Calendar } from 'lucide-react';

const API = 'http://localhost:5000';

function PayoutCard({ payout }: { payout: any }) {
  const date = new Date(payout.createdAt);
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-stone-800 truncate">
            {payout.triggerEvent.replace(/_/g, ' ')}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {payout.policy && (
              <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full font-semibold">
                {payout.policy.planTier}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <Calendar className="w-3.5 h-3.5" />
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          {payout.razorpayPayoutId && (
            <p className="text-xs font-mono text-stone-400 mt-2 truncate" title={payout.razorpayPayoutId}>
              Ref: {payout.razorpayPayoutId}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-emerald-600">Rs. {payout.payoutAmount}</p>
          <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wide mt-1">Paid</p>
        </div>
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
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Payout History</h1>
            <p className="text-sm text-stone-500">All income protection payouts received</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-stone-500 font-medium">Loading payouts...</p>
          </div>
        ) : !data || data.count === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100 shadow-sm">
            <Wallet className="w-14 h-14 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-600 font-semibold text-lg">No payouts yet</p>
            <p className="text-stone-400 text-sm mt-2 max-w-sm mx-auto">
              Approved claims will appear here once processed.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-stone-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-stone-900">{data.count}</p>
                <p className="text-sm text-stone-500 font-medium mt-1">Total Payouts</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">Rs. {data.totalPaid}</p>
                  <p className="text-sm text-emerald-100 font-medium mt-1">Total Income Protected</p>
                </div>
              </div>
            </div>

            {/* Payout Timeline */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-500 mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>Payout Timeline</span>
              </div>
              <div className="space-y-3">
                {data.payouts.map((p: any) => <PayoutCard key={p.id} payout={p} />)}
              </div>
            </div>

            {/* View Claims Link */}
            <button
              onClick={() => navigate('/claims')}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-600 font-semibold hover:bg-stone-50 transition cursor-pointer"
            >
              View All Claims
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </main>
  );
}
