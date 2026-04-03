// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ShieldCheck, CloudLightning, Activity, AlertTriangle, CloudRain, Sun, Wind, Umbrella } from 'lucide-react';

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// const Policy = () => {
//   const [loading, setLoading] = useState(false);
//   const [activePolicy, setActivePolicy] = useState<any>(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchPolicy = async () => {
//       const token = localStorage.getItem('kavachpay_token');
//       if (!token) {
//         navigate('/signin');
//         return;
//       }
//       try {
//         const response = await fetch('http://localhost:5000/api/policy', {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
//         if (response.ok) {
//           const data = await response.json();
//           if (data) {
//             setActivePolicy(data);
//           }
//         }
//       } catch (err) {
//         console.error('Failed to fetch active policy', err);
//       }
//     };
//     fetchPolicy();
//   }, [navigate]);

//   const handleSelectPlan = async (planTier: string) => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('kavachpay_token');

//       // Explicit free-plan path: skip payment order + Razorpay checkout entirely.
//       if (planTier === 'BASIC') {
//         const freeRes = await fetch('http://localhost:5000/api/policy/activate-free', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         const freeData = await freeRes.json();
//         if (!freeRes.ok) {
//           alert(freeData.error || 'Failed to activate free policy');
//           return;
//         }

//         alert('Free tier activated! Your policy is active.');
//         navigate('/dashboard');
//         return;
//       }
      
//       // 1. Create order
//       const orderRes = await fetch('http://localhost:5000/api/policy/order', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ planTier })
//       });
      
//       const orderData = await orderRes.json();
      
//       if (!orderRes.ok) {
//         alert(orderData.error || 'Failed to create order');
//         setLoading(false);
//         return;
//       }

//       // Hackathon testing: free tier activates instantly
//       if (orderData?.freeActivated) {
//         alert('Free tier activated! Your policy is active.');
//         navigate('/dashboard');
//         return;
//       }

//       // Test mode: paid tiers can be activated without Razorpay network flow.
//       if (orderData?.mockActivated) {
//         alert('Test mode active: policy activated with mock payment.');
//         navigate('/dashboard');
//         return;
//       }

//       // 2. Open Razorpay CheckOut
//       const options = {
//         key: orderData.key_id, 
//         amount: orderData.order.amount, 
//         currency: orderData.order.currency,
//         name: 'KavachPay',
//         description: `${planTier} Plan Activation`,
//         order_id: orderData.order.id,
//         handler: async function (response: any) {
//           // 3. Verify Payment
//           try {
//             const verifyRes = await fetch('http://localhost:5000/api/policy/verify', {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//               },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 planTier
//               })
//             });
//             const verifyData = await verifyRes.json();
            
//             if (verifyRes.ok) {
//               alert('Payment Successful! Your Policy is Active.');
//               navigate('/dashboard');
//             } else {
//               alert('Payment Verification Failed: ' + verifyData.error);
//             }
//           } catch (err) {
//             alert('Something went wrong during verification');
//           }
//         },
//         theme: {
//           color: '#3B82F6' // Blue-500
//         }
//       };
      
//       const rzp = new window.Razorpay(options);
//       rzp.on('payment.failed', function (response: any){
//         alert(response.error.description);
//       });
//       rzp.open();

//     } catch (err) {
//       console.error(err);
//       alert('Network error while processing payment');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (activePolicy) {
//     return (
//       <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0A0A0A] via-[#111827] to-[#0A0A0A]">
//          <div className="max-w-md w-full glassmorphism p-10 rounded-3xl text-center border border-white/10 relative overflow-hidden">
//             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500"></div>
//             <ShieldCheck className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
//             <h2 className="text-3xl font-bold text-white mb-4">You're Protected!</h2>
//             <p className="text-gray-400 mb-6">Your policy is currently active.</p>
            
//             <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left">
//               <p className="text-gray-300 flex justify-between mb-3"><span className="text-gray-500">Plan Tier:</span> <span className="font-semibold text-white">{activePolicy.planTier}</span></p>
//               <p className="text-gray-300 flex justify-between mb-3"><span className="text-gray-500">Coverage:</span> <span className="font-semibold text-white">₹{activePolicy.coverageAmount}</span></p>
//               <p className="text-emerald-400 flex justify-between mb-0"><span className="text-gray-500">Status:</span> <span className="font-semibold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> ACTIVE</span></p>
//             </div>

//             <button 
//               onClick={() => navigate('/dashboard')}
//               className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition duration-300 cursor-pointer"
//             >
//               Go to Dashboard
//             </button>
//          </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#0A0A0A] py-20 px-6 font-inter relative overflow-hidden">
//       {/* Background Decor */}
//       <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//       <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

//       <div className="max-w-6xl mx-auto relative z-10">
//         <div className="text-center mb-16">
//           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
//             <ShieldCheck className="w-4 h-4" /> Pick Your Protection
//           </div>
//           <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Select Your Safety Net</h1>
//           <p className="text-xl text-gray-400 max-w-2xl mx-auto">Instant parametric coverage for weather and gig-work disruptions. Your income, secured automatically.</p>
//         </div>

//         <div className="grid md:grid-cols-3 gap-8">
//           {/* Basic Plan */}
//           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-gray-500/50 transition duration-300 flex flex-col group relative overflow-hidden backdrop-blur-xl">
//              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>
//              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
//              <div className="flex items-baseline gap-2 mb-6">
//                <span className="text-4xl font-extrabold text-white">₹0</span>
//                <span className="text-gray-400">/ week</span>
//              </div>
             
//              <div className="mb-8 flex-grow">
//                <p className="text-sm text-gray-400 mb-6 border-b border-white/10 pb-6">Free tier for testing the workflow end-to-end.</p>
//                <ul className="space-y-4">
//                  <li className="flex items-center gap-3 text-gray-300">
//                    <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><CloudRain className="w-3 h-3 text-emerald-400" /></div>
//                    Heavy Rainfall (&gt;65mm)
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-300">
//                    <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center flex-shrink-0"><Sun className="w-3 h-3 text-amber-400" /></div>
//                    Extreme Heat (&gt;44°C)
//                  </li>
//                </ul>
//              </div>
             
//              <div className="bg-white/5 p-4 rounded-xl mb-6">
//                <p className="text-sm text-gray-400 flex justify-between">Coverage up to: <span className="font-semibold text-white">₹1,500</span></p>
//              </div>

//              <button 
//                onClick={() => handleSelectPlan('BASIC')} 
//                disabled={loading}
//                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition duration-300 cursor-pointer disabled:cursor-wait"
//              >
//                {loading ? 'Processing...' : 'Select Free'}
//              </button>
//           </div>

//           {/* Standard Plan (Recommended) */}
//           <div className="bg-gradient-to-br from-blue-900/40 to-[#0A0A0A] border border-blue-500/40 rounded-3xl p-8 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] flex flex-col relative scale-[1.02] z-10">
//              <div className="absolute top-0 right-0 py-1 px-4 bg-blue-500 text-white text-xs font-bold rounded-bl-xl rounded-tr-3xl uppercase tracking-wider">
//                Recommended
//              </div>
//              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Standard</h3>
//              <div className="flex items-baseline gap-2 mb-6">
//                <span className="text-4xl font-extrabold text-white">₹55</span>
//                <span className="text-blue-200/60">/ week</span>
//              </div>
             
//              <div className="mb-8 flex-grow">
//                <p className="text-sm text-blue-200/80 mb-6 border-b border-blue-500/20 pb-6">The sweet spot. Balanced protection against common disruptions.</p>
//                <ul className="space-y-4">
//                  <li className="flex items-center gap-3 text-gray-200">
//                    <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><CloudRain className="w-3 h-3 text-emerald-400" /></div>
//                    Heavy Rainfall (&gt;65mm)
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-200">
//                    <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Sun className="w-3 h-3 text-amber-400" /></div>
//                    Extreme Heat (&gt;44°C)
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-200">
//                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-3 h-3 text-purple-400" /></div>
//                    City Curfews
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-200">
//                    <div className="w-6 h-6 rounded bg-gray-500/20 flex items-center justify-center flex-shrink-0"><Wind className="w-3 h-3 text-gray-300" /></div>
//                    Severe AQI Warnings
//                  </li>
//                </ul>
//              </div>
             
//              <div className="bg-blue-500/10 p-4 rounded-xl mb-6">
//                <p className="text-sm text-blue-200/80 flex justify-between">Coverage up to: <span className="font-semibold text-white">₹2,000</span></p>
//              </div>

//              <button 
//                onClick={() => handleSelectPlan('STANDARD')} 
//                disabled={loading}
//                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/25 transition duration-300 cursor-pointer disabled:cursor-wait"
//              >
//                {loading ? 'Processing...' : 'Activate Standard'}
//              </button>
//           </div>

//           {/* Premium Plan */}
//           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-emerald-500/30 transition duration-300 flex flex-col group relative overflow-hidden backdrop-blur-xl">
//             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>
//              <h3 className="text-2xl font-bold text-white mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Premium</h3>
//              <div className="flex items-baseline gap-2 mb-6">
//                <span className="text-4xl font-extrabold text-white">₹75</span>
//                <span className="text-gray-400">/ week</span>
//              </div>
             
//              <div className="mb-8 flex-grow">
//                <p className="text-sm text-gray-400 mb-6 border-b border-white/10 pb-6">Maximum absolute coverage for full-time dedicated riders.</p>
//                <ul className="space-y-4">
//                  <li className="flex items-center gap-3 text-gray-300">
//                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center flex-shrink-0"><CloudRain className="w-4 h-4 text-gray-400" /></div>
//                    Rain &amp; Heat Included
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-300">
//                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-4 h-4 text-gray-400" /></div>
//                    Curfews &amp; AQI Included
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-300">
//                    <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0"><Umbrella className="w-3 h-3 text-blue-400" /></div>
//                    Floods Coverage
//                  </li>
//                  <li className="flex items-center gap-3 text-gray-300">
//                    <div className="w-6 h-6 rounded bg-rose-500/20 flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-3 h-3 text-rose-400" /></div>
//                    Road Closures
//                  </li>
//                </ul>
//              </div>
             
//              <div className="bg-white/5 p-4 rounded-xl mb-6">
//                <p className="text-sm text-gray-400 flex justify-between">Coverage up to: <span className="font-semibold text-white">₹3,000</span></p>
//              </div>

//              <button 
//                onClick={() => handleSelectPlan('PREMIUM')} 
//                disabled={loading}
//                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition duration-300 cursor-pointer disabled:cursor-wait"
//              >
//                {loading ? 'Processing...' : 'Select Premium'}
//              </button>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Policy;
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
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 sm:p-6">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
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