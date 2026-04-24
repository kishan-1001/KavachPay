
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  CloudRain,
  Coins,
  Globe,
  Menu,
  Moon,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

const features = [
  {
    icon: CloudRain,
    title: 'Weather Intelligence',
    description: 'Real-time IMD data validates disruptions automatically. No manual claims needed.',
    metric: 'Every 5 min',
    metricLabel: 'Data refresh',
  },
  {
    icon: Zap,
    title: 'Instant UPI Payout',
    description: 'Once verified, money hits your account in seconds. Zero paperwork, zero delays.',
    metric: '<20 sec',
    metricLabel: 'Transfer time',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    description: 'No GPS tracking required. We use regional intelligence, not your location.',
    metric: 'Always On',
    metricLabel: 'Privacy mode',
  },
];

const steps = [
  {
    number: '01',
    title: 'Register',
    description: 'Sign up in 2 minutes with your phone number and gig platform ID. No credit check.',
    icon: Smartphone,
  },
  {
    number: '02',
    title: 'Work',
    description: 'Go about your day. We monitor weather, heat, and city conditions 24/7.',
    icon: Activity,
  },
  {
    number: '03',
    title: 'Get Paid',
    description: 'If conditions stop you from working, payout triggers automatically to your UPI.',
    icon: Coins,
  },
];

const testimonials = [
  {
    quote: "Finally, someone understands that rain means no income for us. KavachPay changed everything.",
    author: 'Rajesh Kumar',
    role: 'Delivery Partner, Mumbai',
    rating: 5,
  },
  {
    quote: "I got my payout within seconds when the storm hit. No forms, no calls. Just money in my account.",
    author: 'Priya Sharma',
    role: 'Driver Partner, Bangalore',
    rating: 5,
  },
  {
    quote: "The best part? I don't have to prove anything. They already know when I can't work.",
    author: 'Mohammed Ali',
    role: 'Delivery Executive, Delhi',
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: 'Basic',
    price: '35',
    period: 'week',
    coverage: '1,500',
    features: ['Heavy Rain Protection', 'Extreme Heat Coverage', 'Instant UPI Payouts'],
    color: 'emerald',
    cta: 'Get Basic',
  },
  {
    name: 'Standard',
    price: '55',
    period: 'week',
    coverage: '2,000',
    features: ['Everything in Basic', 'Official City Curfews', 'Air Quality (AQI) Alerts', 'Priority Support'],
    recommended: true,
    color: 'emerald',
    cta: 'Get Protected',
  },
  {
    name: 'Premium',
    price: '75',
    period: 'week',
    coverage: '3,000',
    features: ['Everything in Standard', 'Flood & Storm Surge', 'Road Closures/Restricted Zones', 'Earnings Protection Plus'],
    color: 'emerald',
    cta: 'Go Premium',
  },
];

const faqs = [
  {
    question: 'When do I receive payout after a disruption?',
    answer: 'Payout is initiated instantly after verification and usually reaches your UPI account within seconds.',
  },
  {
    question: 'Do I need GPS always on for coverage?',
    answer: 'No. KavachPay uses trusted regional intelligence and disruption signals, so live GPS tracking is not required.',
  },
  {
    question: 'Which workers can enroll?',
    answer: 'Delivery partners, driver-partners, and most app-based gig workers in supported cities can enroll.',
  },
  {
    question: 'What disruptions are covered?',
    answer: 'Heavy rain, storms, extreme heat, floods, and official city curfews/restrictions that prevent work.',
  },
];

const disruptionFeed = [
  'LIVE DISRUPTION INDEX',
  'Mumbai: Heavy Rain (Active)',
  'Delhi: Heat Alert (Normal)',
  'Bengaluru: Thunderstorm (Active)',
  'Chennai: Cyclone Watch',
  'Hyderabad: Moderate Rain',
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      {/* Announcement Bar */}
      <div className="bg-stone-900 text-white py-2.5 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm flex-wrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-stone-300">Now live in Mumbai, Delhi, Bengaluru, Chennai & Hyderabad</span>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/KavachPay_logo.png"
                alt="KavachPay"
                className="h-9 w-9 object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">KavachPay</span>
            </div>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate('/howitworks')} className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer">
                How it Works
              </button>
              <a href="#features" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                FAQ
              </a>
            </div>

            {/* Right side (Desktop: Auth, Mobile: Theme + Hamburger) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/signin')}
                  className="text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-3 sm:px-4 py-2 cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-stone-900 dark:bg-[#ffffff] text-white dark:text-[#000000] text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full hover:bg-stone-800 dark:hover:bg-[#f0f0f0] transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  Get Started
                </button>
              </div>
              <button
                className="md:hidden p-2 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-4 animate-in slide-in-from-top-2">
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/howitworks'); }} className="text-left text-base font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1">
                How it Works
              </button>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1">
                Features
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1">
                Pricing
              </a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1">
                FAQ
              </a>
              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/signin'); }}
                  className="w-full text-center text-sm font-semibold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/signup'); }}
                  className="w-full text-center bg-stone-900 dark:bg-[#ffffff] text-white dark:text-[#000000] text-sm font-semibold rounded-full py-2.5 hover:bg-stone-800 dark:hover:bg-[#f0f0f0] transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-24 lg:pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-200 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-balance">
                <span className="text-stone-900">Protecting India&apos;s</span>
                <br />
                <span className="relative">
                  <span className="relative z-10 text-stone-900">Gig Income,</span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-emerald-200/60 -z-0" />
                </span>
                <br />
                <span className="text-stone-900">Automatically.</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                The first AI-powered smart insurance for delivery partners and gig workers. 
                We pay you when weather or city conditions stop you from working.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="group inline-flex items-center justify-center gap-2 bg-stone-900 dark:bg-[#ffffff] text-white dark:text-[#000000] text-base font-semibold px-8 py-4 rounded-full hover:bg-stone-800 dark:hover:bg-[#f0f0f0] transition-all hover:shadow-xl active:scale-[0.98] cursor-pointer"
                >
                  Get Protected Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/howitworks')}
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base font-semibold px-8 py-4 rounded-full border-2 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all cursor-pointer"
                >
                  See How it Works
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 flex flex-wrap items-center gap-6 pt-8 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Instant UPI Payouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">No Credit Check</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">No GPS Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Visual */}
            <div className="relative">
              {/* Main Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/gigworker.png"
                  alt="Gig worker protected by KavachPay"
                  className="w-full h-[320px] sm:h-[420px] lg:h-[560px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                
                {/* Floating Card - Payout */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Payout Triggered</p>
                      <p className="text-xl font-bold text-stone-900 dark:text-stone-100">₹850 sent via UPI</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500 dark:text-stone-400">Just now</p>
                      <p className="text-sm font-medium text-emerald-600">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Disruption Ticker */}
      <section className="bg-stone-900 py-4 overflow-hidden">
        <div className="relative">
          <div className="flex min-w-max animate-marquee whitespace-nowrap will-change-transform">
            {[...disruptionFeed, ...disruptionFeed].map((item, idx) => (
              <div key={idx} className="flex flex-shrink-0 items-center gap-3 mx-10 pr-2">
                {idx % disruptionFeed.length === 0 ? (
                  <Activity className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                )}
                <span className={`text-sm font-medium leading-none ${idx % disruptionFeed.length === 0 ? 'text-emerald-400' : 'text-white dark:text-[#ffffff]'}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Protection Engine</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight text-balance">
              Built for real disruptions, not assumptions.
            </h2>
            <p className="mt-5 text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Transparent verification before every payout. Your protection stays reliable with real data.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Feature Selector */}
            <div className="space-y-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                const isActive = idx === activeFeature;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    onMouseEnter={() => setActiveFeature(idx)}
                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-white dark:bg-stone-800 shadow-xl border-2 border-emerald-200 dark:border-emerald-700' 
                        : 'bg-white/50 dark:bg-stone-900/50 border-2 border-transparent hover:bg-white dark:hover:bg-stone-800 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-600'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{feature.title}</h3>
                        <p className="mt-1 text-stone-600 dark:text-stone-400 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feature Detail Card */}
            <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 lg:p-10 text-white lg:sticky lg:top-24">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Verification Module</p>
              </div>
              
              <div className="w-14 h-14 bg-white/10 dark:bg-[#ffffff15] rounded-2xl flex items-center justify-center mb-6">
                {React.createElement(features[activeFeature].icon, { className: 'w-7 h-7 text-emerald-400' })}
              </div>

              <h3 className="text-2xl lg:text-3xl font-bold mb-3 dark:text-[#ffffff]">{features[activeFeature].title}</h3>
              <p className="text-stone-300 text-lg leading-relaxed mb-8">{features[activeFeature].description}</p>

              <div className="pt-6 border-t border-white/20">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{features[activeFeature].metricLabel}</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">{features[activeFeature].metric}</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide">Live Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">How KavachPay Works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight text-balance">
              From signup to payout, designed for speed.
            </h2>
            <p className="mt-5 text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              A simple 3-step flow: easy onboarding, invisible monitoring, instant payouts.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  {/* Connector Line */}
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-emerald-300 to-stone-200" />
                  )}
                  
                  <div className="relative bg-stone-50 dark:bg-stone-800 rounded-3xl p-6 sm:p-8 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-5xl font-bold text-stone-200 dark:text-stone-700">{step.number}</span>
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Icon className="w-7 h-7 text-emerald-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">{step.title}</h3>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative">
        <div className="relative h-[360px] sm:h-[460px] lg:h-[600px] overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/gigworkeratrain.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/70 to-transparent" />
          
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white dark:text-[#ffffff]">KavachPay Protection</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white dark:text-[#ffffff] leading-tight mb-6">
                  Storm outside.<br />
                  <span className="text-emerald-400">Stable income inside.</span>
                </h2>

                <ul className="space-y-4">
                  {[
                    'Stuck in heavy rain? Auto detection starts your claim.',
                    'Flooded routes covered for daily gig workers.',
                    'Verified disruption triggers instant UPI payout.',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/90 dark:text-[#ffffff] text-lg">{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/signup')}
                  className="mt-8 group inline-flex items-center gap-2 bg-white text-stone-900 text-base font-semibold px-8 py-4 rounded-full hover:bg-stone-100 transition-all cursor-pointer"
                >
                  Start Your Protection
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Pricing Plans</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-6">
              Simple, affordable protection for every worker
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Choose the plan that fits your work schedule and coverage needs. 
              No hidden fees, no long-term contracts.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx}
                className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300 ${
                  plan.recommended 
                    ? 'bg-white dark:bg-stone-800 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)] border-2 border-emerald-500 md:scale-105 z-10' 
                    : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-xl'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-lg">
                    Best Value
                  </div>
                )}
                
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{plan.name}</h3>
                    {plan.recommended && (
                      <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100">
                        <TrendingUp className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-stone-900 dark:text-stone-100">₹{plan.price}</span>
                    <span className="text-stone-500 dark:text-stone-400 font-medium">/{plan.period}</span>
                  </div>
                </div>

                <div className="mb-10 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Max Protection</p>
                  <p className="text-3xl font-bold text-emerald-700">₹{plan.coverage}</p>
                  <p className="text-xs text-emerald-600/70 mt-1">Automatic payout per event</p>
                </div>

                <ul className="flex-1 space-y-5 mb-12">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-emerald-500 rounded-full p-0.5 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-base text-stone-600 dark:text-stone-400 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] cursor-pointer ${
                    plan.recommended
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 hover:-translate-y-1'
                      : 'bg-stone-900 text-white hover:bg-stone-800 hover:shadow-lg'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700">
              <Zap className="w-4 h-4 text-amber-500" />
              <p className="text-stone-600 dark:text-stone-400 text-sm font-medium">
                All plans include IMD verification and under 20-second UPI payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-28 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight text-balance">
              Trusted by thousands of gig workers.
            </h2>
          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white dark:bg-stone-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow">
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                
                <blockquote className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                
                <div className="pt-6 border-t border-stone-100 dark:border-stone-700">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{testimonial.author}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-white dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Common questions
            </h2>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span className="text-lg font-semibold text-stone-900 dark:text-stone-100 pr-4">{faq.question}</span>
                  <ChevronRight className={`w-5 h-5 text-stone-400 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6">
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-stone-900 rounded-[2.5rem] px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 text-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white dark:text-[#ffffff] leading-tight max-w-3xl mx-auto text-balance">
                Don&apos;t let weather decide your{' '}
                <span className="text-emerald-400">payout.</span>
              </h2>
              <p className="mt-6 text-lg text-stone-300 max-w-xl mx-auto">
                Join 15,000+ gig workers who never worry about losing income to bad weather.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="group inline-flex items-center justify-center gap-2 bg-emerald-400 text-stone-900 text-lg font-semibold px-10 py-4 rounded-full hover:bg-emerald-300 transition-all cursor-pointer"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <p className="mt-8 text-sm font-medium text-stone-400 uppercase tracking-wide">
                Trusted across 5 Indian cities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/KavachPay_logo.png"
                  alt="KavachPay"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-lg font-bold text-stone-900 dark:text-stone-100">KavachPay</span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                India&apos;s leading income protection platform for the gig economy.
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">How it Works</a></li>
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Claims API</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-stone-500 dark:text-stone-500">© 2024 KavachPay Technologies Pvt Ltd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Terms</a>
              <a href="#" className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Marquee Animation Style */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
