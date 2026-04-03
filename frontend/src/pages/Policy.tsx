import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CloudLightning, AlertTriangle, CloudRain, Sun, Wind, Umbrella, ArrowLeft, Check, Zap } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Policy = () => {
  const [loading, setLoading] = useState(false);
  const [activePolicy, setActivePolicy] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolicy = async () => {
      const token = localStorage.getItem('kavachpay_token');
      if (!token) {
        navigate('/signin');
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/policy', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data) setActivePolicy(data);
        }
      } catch (err) {
        console.error('Failed to fetch active policy', err);
      }
    };
    fetchPolicy();
  }, [navigate]);

  const handleSelectPlan = async (planTier: string) => {
    setLoading(true);
    setSelectedPlan(planTier);
    try {
      const token = localStorage.getItem('kavachpay_token');

      if (planTier === 'BASIC') {
        const freeRes = await fetch('http://localhost:5000/api/policy/activate-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const freeData = await freeRes.json();
        if (!freeRes.ok) {
          alert(freeData.error || 'Failed to activate free policy');
          return;
        }
        alert('Free tier activated! Your policy is active.');
        navigate('/dashboard');
        return;
      }
      
      const orderRes = await fetch('http://localhost:5000/api/policy/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ planTier })
      });
      
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        alert(orderData.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      if (orderData?.freeActivated || orderData?.mockActivated) {
        alert('Policy activated successfully!');
        navigate('/dashboard');
        return;
      }

      const options = {
        key: orderData.key_id, 
        amount: orderData.order.amount, 
        currency: orderData.order.currency,
        name: 'KavachPay',
        description: `${planTier} Plan Activation`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('http://localhost:5000/api/policy/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planTier
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok) {
              alert('Payment Successful! Your Policy is Active.');
              navigate('/dashboard');
            } else {
              alert('Payment Verification Failed: ' + verifyData.error);
            }
          } catch (err) {
            alert('Something went wrong during verification');
          }
        },
        theme: { color: '#10B981' }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(response.error.description);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      alert('Network error while processing payment');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (activePolicy) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
          <div className="bg-stone-900 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You&apos;re Protected</h2>
            <p className="text-stone-400">Your policy is currently active</p>
          </div>
          
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-stone-100">
                <span className="text-stone-500">Plan Tier</span>
                <span className="font-bold text-stone-900">{activePolicy.planTier}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-stone-100">
                <span className="text-stone-500">Coverage</span>
                <span className="font-bold text-emerald-600">Rs. {activePolicy.coverageAmount}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-stone-500">Status</span>
                <span className="flex items-center gap-2 font-semibold text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Active
                </span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl hover:bg-stone-800 transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const plans = [
    {
      tier: 'BASIC',
      name: 'Free',
      price: '0',
      period: 'week',
      description: 'Try out the workflow end-to-end',
      coverage: '1,500',
      features: [
        { icon: CloudRain, text: 'Heavy Rainfall (>65mm)', color: 'emerald' },
        { icon: Sun, text: 'Extreme Heat (>44°C)', color: 'amber' },
      ],
      buttonText: 'Start Free',
      buttonStyle: 'bg-stone-100 text-stone-900 hover:bg-stone-200',
      popular: false,
    },
    {
      tier: 'STANDARD',
      name: 'Standard',
      price: '55',
      period: 'week',
      description: 'Balanced protection for most workers',
      coverage: '2,000',
      features: [
        { icon: CloudRain, text: 'Heavy Rainfall (>65mm)', color: 'emerald' },
        { icon: Sun, text: 'Extreme Heat (>44°C)', color: 'amber' },
        { icon: AlertTriangle, text: 'City Curfews', color: 'purple' },
        { icon: Wind, text: 'Severe AQI Warnings', color: 'stone' },
      ],
      buttonText: 'Get Standard',
      buttonStyle: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25',
      popular: true,
    },
    {
      tier: 'PREMIUM',
      name: 'Premium',
      price: '75',
      period: 'week',
      description: 'Maximum coverage for full-time riders',
      coverage: '3,000',
      features: [
        { icon: CloudRain, text: 'All Standard Coverage', color: 'emerald' },
        { icon: Umbrella, text: 'Floods Coverage', color: 'blue' },
        { icon: ShieldCheck, text: 'Road Closures', color: 'rose' },
        { icon: Zap, text: 'Priority Payouts', color: 'amber' },
      ],
      buttonText: 'Get Premium',
      buttonStyle: 'bg-stone-900 text-white hover:bg-stone-800',
      popular: false,
    },
  ];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Choose Your Plan</h1>
            <p className="text-sm text-stone-500">Select protection that fits your needs</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" /> Instant Weather Protection
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Select Your Safety Net</h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            Parametric coverage for weather and gig-work disruptions. Your income, secured automatically.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.tier}
              className={`relative bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col ${
                plan.popular 
                  ? 'border-emerald-200 shadow-xl shadow-emerald-500/10 scale-[1.02]' 
                  : 'border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-stone-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-stone-900">Rs. {plan.price}</span>
                  <span className="text-stone-500">/{plan.period}</span>
                </div>
              </div>
              
              <p className="text-sm text-stone-500 pb-6 border-b border-stone-100 mb-6">{plan.description}</p>
              
              <div className="space-y-4 flex-grow mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${feature.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-4 h-4 text-${feature.color}-600`} />
                    </div>
                    <span className="text-sm text-stone-700">{feature.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-stone-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">Coverage up to</span>
                  <span className="font-bold text-stone-900">Rs. {plan.coverage}</span>
                </div>
              </div>

              <button 
                onClick={() => handleSelectPlan(plan.tier)} 
                disabled={loading}
                className={`w-full font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-70 disabled:cursor-wait ${plan.buttonStyle}`}
              >
                {loading && selectedPlan === plan.tier ? 'Processing...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Instant UPI Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>No Paperwork</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>AI-Verified Claims</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Policy;
