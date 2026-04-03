import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudRain,
  Coins,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Zap,
  BarChart3,
  Lock,
  Smartphone,
  Wind,
  AlertCircle,
  DollarSign,
  ChevronDown,
  Shield,
} from 'lucide-react';

export default function HowItWorks() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      color: 'bg-cyan-50 border-cyan-200',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
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
      color: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
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
      color: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
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

  const flowSteps = [
    {
      icon: CloudRain,
      title: 'Weather Event Occurs',
      description: 'Heavy rain, thunderstorm, cyclone, or extreme temperature detected by IMD',
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      icon: MapPin,
      title: 'Area Coverage Check',
      description: 'System verifies event impacts your registered coverage zone',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: Zap,
      title: 'Automated Verification',
      description: 'Profile verification and policy check happens instantly',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      icon: DollarSign,
      title: 'Instant Payout',
      description: 'Money transferred to your UPI account in under 20 seconds',
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-3">
              <img
                src="/KavachPay_logo.png"
                alt="KavachPay"
                className="h-9 w-9 object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-stone-900">KavachPay</span>
            </button>

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-200 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">How KavachPay Works</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 mb-6 text-balance max-w-4xl mx-auto">
            Smart insurance that pays you when weather disrupts your work
          </h1>

          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            From detection to payout in seconds. No paperwork, no delays, just automatic protection.
          </p>
        </div>
      </section>

      {/* Main Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">The Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Three simple steps from detection to payout
            </h2>
          </div>

          {/* Process Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {mainProcess.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => setActiveStep(idx)}
                  className={`text-left rounded-3xl border-2 p-8 transition-all duration-300 ${
                    isActive
                      ? `${step.color} shadow-xl`
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.iconBg}`}>
                      <Icon className={`w-7 h-7 ${step.iconColor}`} />
                    </div>
                    <span className="text-sm font-bold text-stone-400 uppercase tracking-wide">Step {idx + 1}</span>
                  </div>

                  <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
                  <p className="text-stone-600 leading-relaxed mb-6">{step.description}</p>

                  {isActive && (
                    <div className="space-y-3 pt-6 border-t border-stone-200/50">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-stone-700">{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Complete Flow Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Complete Flow</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              From weather event to payout
            </h2>
          </div>

          {/* Flow Diagram */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-stone-200 p-8 lg:p-12 shadow-sm">
            <div className="space-y-8">
              {flowSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx}>
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 pt-2">
                        <h4 className="text-lg font-bold text-stone-900 mb-1">{step.title}</h4>
                        <p className="text-stone-600">{step.description}</p>
                      </div>
                    </div>
                    {idx < flowSteps.length - 1 && (
                      <div className="flex justify-start ml-7 my-4">
                        <div className="w-0.5 h-8 bg-stone-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Technology</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Powered by Advanced Technology
            </h2>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {keyFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-stone-50 rounded-3xl p-8 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-3">{feature.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-3xl border border-emerald-200 p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Example</p>
                <h2 className="text-3xl font-bold text-stone-900 mb-6">See Your Benefit in Action</h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-4">
                    <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">Tuesday 2:00 PM</p>
                      <p className="text-sm text-stone-600">Heavy rain (5cm) detected in your area</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-4">
                    <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">Tuesday 2:00:05 PM</p>
                      <p className="text-sm text-stone-600">KavachPay verifies weather event</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">Tuesday 2:00:15 PM</p>
                      <p className="text-sm text-stone-600">Payout sent to your UPI account</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
                <p className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Payout Received</p>
                <p className="text-5xl lg:text-6xl font-bold text-emerald-600 mb-2">₹250 - ₹500</p>
                <p className="text-stone-500">Based on policy tier and disruption severity</p>

                <div className="mt-8 pt-8 border-t border-stone-100">
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-sm font-semibold">Transferred in under 20 seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faq.map((item, idx) => (
              <div key={idx} className="border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-stone-900 pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform flex-shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6">
                    <p className="text-stone-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-stone-900 rounded-[2.5rem] px-8 py-16 sm:px-12 sm:py-20 text-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
                Ready to Get <span className="text-emerald-400">Protected?</span>
              </h2>
              <p className="mt-6 text-lg text-stone-300 max-w-xl mx-auto">
                Join thousands of gig workers who get guaranteed income during disruptions.
              </p>

              <button
                onClick={() => navigate('/signup')}
                className="mt-10 group inline-flex items-center gap-2 bg-emerald-400 text-stone-900 text-lg font-semibold px-10 py-4 rounded-full hover:bg-emerald-300 transition-all"
              >
                Sign Up Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-stone-500">© 2024 KavachPay Technologies Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
