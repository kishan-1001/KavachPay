import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudRain,
  Coins,
  ShieldCheck,
  Check,
  ArrowRight,
  MapPin,
  Zap,
  BarChart3,
  Lock,
  Smartphone,
  Wind,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

export default function HowItWorks() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const mainProcess = [
    {
      title: 'Weather Event Detected',
      description: 'IMD Weather Data continuously monitors weather patterns across regions. When severe weather is detected (heavy rain, thunderstorm, cyclone, heat wave, etc.), the system triggers.',
      icon: CloudRain,
      details: [
        'Real-time IMD weather feeds',
        'Hyperlocal area coverage',
        'Multi-parameter monitoring',
        'Automated event detection',
      ],
      color: 'from-cyan-500/20 to-blue-500/10',
    },
    {
      title: 'Coverage Verification',
      description: 'Your policy details are checked against the weather event. We verify that your area is covered and the weather meets payout criteria using trusted regional intelligence.',
      icon: ShieldCheck,
      details: [
        'Policy area matching',
        'Coverage validation',
        'Regional intelligence',
        'Privacy-first verification (no GPS)',
      ],
      color: 'from-emerald-500/20 to-teal-500/10',
    },
    {
      title: 'Payout Triggered',
      description: 'Once verification is complete, payout is instantly initiated to your registered UPI account. No paperwork, no delays, just money in your account within seconds.',
      icon: Coins,
      details: [
        'Instant UPI transfer',
        '< 20 seconds to account',
        'Daily or per-event payouts',
        'Transaction notification',
      ],
      color: 'from-amber-500/20 to-orange-500/10',
    },
  ];

  const keyFeatures = [
    {
      title: 'AI-Powered Predictive Analytics',
      description: 'Our ML models predict weather disruptions before they happen, so coverage activates immediately when you need it.',
      icon: BarChart3,
    },
    {
      title: 'Zero Background GPS',
      description: 'We use trusted regional weather data instead of tracking your location. Your privacy is always protected.',
      icon: Lock,
    },
    {
      title: 'Instant Payouts',
      description: 'Verification and payout happen automatically. No claims process, no waiting. Get paid within seconds.',
      icon: Smartphone,
    },
    {
      title: 'Smart Wind Speed Tracking',
      description: 'Coverage monitors wind speeds, rainfall intensity, and temperature extremes in your delivery area.',
      icon: Wind,
    },
    {
      title: 'Behavioral Profiling',
      description: 'Our system learns your work patterns to optimize coverage timing and ensure protection when you need it most.',
      icon: AlertCircle,
    },
    {
      title: 'Fair Compensation',
      description: 'Payouts are calculated based on severity of disruption and impact on your earning capacity.',
      icon: DollarSign,
    },
  ];

  const faq = [
    {
      q: 'How often can I get paid?',
      a: 'Payouts are triggered every time weather disruption occurs in your coverage area. You can receive multiple payouts per day during severe weather events.',
    },
    {
      q: 'Do I need to activate my coverage?',
      a: 'No! Once you register with KavachPay, coverage is automatic. We monitor weather 24/7 and payout when conditions are met.',
    },
    {
      q: 'What if the payout doesn\'t arrive?',
      a: 'Payouts are sent instantly to your UPI account. If there\'s a delay, it may be due to bank processing (rare). Contact support immediately and we\'ll investigate.',
    },
    {
      q: 'Can I get coverage outside my registered zone?',
      a: 'Coverage is zone-specific based on your registered delivery area. You can update your zone anytime from your dashboard.',
    },
    {
      q: 'What types of weather trigger payouts?',
      a: 'Heavy rain (>50mm/hour), thunderstorms, cyclones, extreme heat (>45°C), extreme cold, and wind speeds >40 km/h all trigger coverage.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Logo Background */}
      <div 
        className="fixed inset-0 z-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'url(/KavachPay_logo.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '60% 60%',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-10">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold text-slate-900"
          >
            KavachPay
          </button>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl">
              How KavachPay Works
            </h1>
            <p className="text-lg text-slate-600">
              Smart insurance that pays you when weather disrupts your work
            </p>
          </div>
        </section>

        {/* Main Process Flow */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-slate-900">The Process</h2>
            <p className="text-slate-600">Three simple steps from detection to payout</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {mainProcess.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`group cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 ${
                    activeStep === idx
                      ? 'border-blue-500 bg-gradient-to-br ' + step.color + ' shadow-lg'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`rounded-lg p-3 ${
                        activeStep === idx ? 'bg-blue-100' : 'bg-slate-100'
                      }`}
                    >
                      <Icon
                        size={24}
                        className={activeStep === idx ? 'text-blue-600' : 'text-slate-600'}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-500">Step {idx + 1}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mb-4 text-slate-600">{step.description}</p>

                  {activeStep === idx && (
                    <div className="animate-in fade-in space-y-2 border-t border-slate-200 pt-4">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                          <span className="text-sm text-slate-700">{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Flow Diagram */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">The Complete Flow</h2>
          <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8">
            <div className="space-y-6">
              {/* Flow Item 1 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-cyan-100 p-3">
                  <CloudRain size={24} className="text-cyan-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Weather Event Occurs</h4>
                  <p className="text-sm text-slate-600">
                    Heavy rain, thunderstorm, cyclone, or extreme temperature detected by IMD
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight size={24} className="rotate-90 text-slate-400" />
              </div>

              {/* Flow Item 2 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-emerald-100 p-3">
                  <MapPin size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Area Coverage Check</h4>
                  <p className="text-sm text-slate-600">
                    System verifies event impacts your registered coverage zone
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight size={24} className="rotate-90 text-slate-400" />
              </div>

              {/* Flow Item 3 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-amber-100 p-3">
                  <Zap size={24} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Automated Verification</h4>
                  <p className="text-sm text-slate-600">
                    Profile verification and policy check happens instantly
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight size={24} className="rotate-90 text-slate-400" />
              </div>

              {/* Flow Item 4 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <DollarSign size={24} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Instant Payout</h4>
                  <p className="text-sm text-slate-600">
                    Money transferred to your UPI account in under 20 seconds
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Powered by Advanced Technology
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {keyFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all duration-300">
                  <div className="mb-4 rounded-lg bg-blue-100 w-fit p-3">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Claim Example */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 sm:p-12">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">Your Benefit Example</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 font-bold text-slate-900">Tuesday 2:00 PM</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Check size={20} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">5cm rain detected in your area</span>
                  </div>
                  <div className="flex gap-3">
                    <Check size={20} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">You stop work due to weather</span>
                  </div>
                  <div className="flex gap-3">
                    <Check size={20} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">KavachPay verifies event</span>
                  </div>
                  <div className="flex gap-3">
                    <Check size={20} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">Payout initiated instantly</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="mb-2 text-sm text-slate-600">Payout received in your account:</p>
                <p className="mb-4 text-4xl font-bold text-blue-600">₹250 - ₹500</p>
                <p className="text-xs text-slate-600">
                  Amount depends on policy tier and disruption severity
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faq.map((item, idx) => (
              <details key={idx} className="group rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer items-start justify-between font-semibold text-slate-900">
                  <span>{item.q}</span>
                  <span className="ml-4 flex-shrink-0 transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="mt-4 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center sm:p-12">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to Get Protected?</h2>
            <p className="mb-6 text-lg text-blue-100">
              Join thousands of gig workers who get guaranteed income during disruptions
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg transition-all hover:shadow-xl hover:bg-blue-50 cursor-pointer"
            >
              Sign Up Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-slate-50 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-600 sm:px-8">
            <p>© 2024 KavachPay. All rights reserved.</p>
          </div>
        </footer>
      </main>
      </div>
    </div>
  );
}
