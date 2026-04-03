import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CheckCircle2, TrendingUp, IndianRupee, ClipboardList, ArrowUpRight, Calendar } from 'lucide-react';

const API = 'http://localhost:5000';

function PayoutCard({ payout }: { payout: any }) {
  const date = new Date(payout.createdAt);
  return (
    &lt;div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"&gt;
      &lt;div className="flex items-center gap-4"&gt;
        {/* Icon */}
        &lt;div className="w-12 h-12 flex-shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center"&gt;
          &lt;CheckCircle2 className="w-6 h-6 text-emerald-600" /&gt;
        &lt;/div&gt;

        {/* Details */}
        &lt;div className="flex-1 min-w-0"&gt;
          &lt;p className="text-base font-semibold text-stone-800 truncate"&gt;
            {payout.triggerEvent.replace(/_/g, ' ')}
          &lt;/p&gt;
          &lt;div className="flex items-center gap-3 mt-1.5 flex-wrap"&gt;
            {payout.policy &amp;&amp; (
              &lt;span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full font-semibold"&gt;
                {payout.policy.planTier}
              &lt;/span&gt;
            )}
            &lt;span className="flex items-center gap-1.5 text-xs text-stone-400"&gt;
              &lt;Calendar className="w-3.5 h-3.5" /&gt;
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            &lt;/span&gt;
          &lt;/div&gt;
          {payout.razorpayPayoutId &amp;&amp; (
            &lt;p className="text-xs font-mono text-stone-400 mt-2 truncate" title={payout.razorpayPayoutId}&gt;
              Ref: {payout.razorpayPayoutId}
            &lt;/p&gt;
          )}
        &lt;/div&gt;

        {/* Amount */}
        &lt;div className="text-right flex-shrink-0"&gt;
          &lt;p className="text-2xl font-bold text-emerald-600"&gt;Rs. {payout.payoutAmount}&lt;/p&gt;
          &lt;p className="text-xs text-emerald-500 font-semibold uppercase tracking-wide mt-1"&gt;Paid&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

export default function Payout() {
  const navigate = useNavigate();
  const [data, setData] = useState&lt;{ payouts: any[]; totalPaid: number; count: number } | null&gt;(null);
  const [loading, setLoading] = useState(true);

  useEffect(() =&gt; {
    const token = localStorage.getItem('kavachpay_token');
    if (!token) { navigate('/signin'); return; }

    fetch(`${API}/api/claim/payouts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r =&gt; r.json())
      .then(setData)
      .catch(console.error)
      .finally(() =&gt; setLoading(false));
  }, [navigate]);

  return (
    &lt;main className="min-h-screen bg-stone-50 text-stone-900"&gt;
      {/* Navigation */}
      &lt;nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100"&gt;
        &lt;div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4"&gt;
          &lt;button
            onClick={() =&gt; navigate('/dashboard')}
            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
          &gt;
            &lt;ArrowLeft className="w-5 h-5" /&gt;
          &lt;/button&gt;
          &lt;div&gt;
            &lt;h1 className="text-xl font-bold text-stone-900"&gt;Payout History&lt;/h1&gt;
            &lt;p className="text-sm text-stone-500"&gt;All income protection payouts received&lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/nav&gt;

      &lt;div className="max-w-3xl mx-auto px-6 py-8"&gt;
        {loading ? (
          &lt;div className="flex flex-col items-center justify-center py-20"&gt;
            &lt;div className="w-10 h-10 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin mb-4"&gt;&lt;/div&gt;
            &lt;p className="text-stone-500 font-medium"&gt;Loading payouts...&lt;/p&gt;
          &lt;/div&gt;
        ) : !data || data.count === 0 ? (
          &lt;div className="text-center py-20 bg-white rounded-2xl border border-stone-100 shadow-sm"&gt;
            &lt;Wallet className="w-14 h-14 text-stone-200 mx-auto mb-4" /&gt;
            &lt;p className="text-stone-600 font-semibold text-lg"&gt;No payouts yet&lt;/p&gt;
            &lt;p className="text-stone-400 text-sm mt-2 max-w-sm mx-auto"&gt;
              Approved claims will appear here once processed.
            &lt;/p&gt;
            &lt;button
              onClick={() =&gt; navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition cursor-pointer"
            &gt;
              Go to Dashboard
            &lt;/button&gt;
          &lt;/div&gt;
        ) : (
          &lt;&gt;
            {/* Summary Cards */}
            &lt;div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"&gt;
              &lt;div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm"&gt;
                &lt;div className="flex items-center gap-3 mb-3"&gt;
                  &lt;div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center"&gt;
                    &lt;ClipboardList className="w-5 h-5 text-stone-600" /&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;p className="text-3xl font-bold text-stone-900"&gt;{data.count}&lt;/p&gt;
                &lt;p className="text-sm text-stone-500 font-medium mt-1"&gt;Total Payouts&lt;/p&gt;
              &lt;/div&gt;

              &lt;div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg"&gt;
                &lt;div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"&gt;&lt;/div&gt;
                &lt;div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"&gt;&lt;/div&gt;
                &lt;div className="relative z-10"&gt;
                  &lt;div className="flex items-center gap-3 mb-3"&gt;
                    &lt;div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"&gt;
                      &lt;IndianRupee className="w-5 h-5" /&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                  &lt;p className="text-3xl font-bold"&gt;Rs. {data.totalPaid}&lt;/p&gt;
                  &lt;p className="text-sm text-emerald-100 font-medium mt-1"&gt;Total Income Protected&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Payout Timeline */}
            &lt;div className="mb-4"&gt;
              &lt;div className="flex items-center gap-2 text-sm font-bold text-stone-500 mb-4"&gt;
                &lt;TrendingUp className="w-4 h-4" /&gt;
                &lt;span&gt;Payout Timeline&lt;/span&gt;
              &lt;/div&gt;
              &lt;div className="space-y-3"&gt;
                {data.payouts.map((p: any) =&gt; &lt;PayoutCard key={p.id} payout={p} /&gt;)}
              &lt;/div&gt;
            &lt;/div&gt;

            {/* View Claims Link */}
            &lt;button
              onClick={() =&gt; navigate('/claims')}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-600 font-semibold hover:bg-stone-50 transition cursor-pointer"
            &gt;
              View All Claims
              &lt;ArrowUpRight className="w-4 h-4" /&gt;
            &lt;/button&gt;
          &lt;/&gt;
        )}
      &lt;/div&gt;
    &lt;/main&gt;
  );
}
