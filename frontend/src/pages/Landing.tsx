import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Check,
  CloudRain,
  Coins,
  MoveRight,
  ShieldCheck,
  Star,
} from 'lucide-react';

const disruptionFeed = [
  'LIVE DISRUPTION INDEX',
  'Mumbai: Heavy Rain (Active)',
  'Delhi: Heat Alert (Normal)',
  'Bengaluru: Thunderstorm (Active)',
  'Pune: Clear',
  'Chennai: Cyclone Watch',
];

const disruptionLoop = [...disruptionFeed, ...disruptionFeed];

const quickTrust = [
  {
    title: 'Powered by IMD',
    subtitle: 'Hyper-local weather verification',
    icon: CloudRain,
    description: 'Official weather intelligence verifies every disruption event before a payout is triggered.',
    metricLabel: 'Data freshness',
    metricValue: 'Every 5 min',
    accent: 'from-cyan-500/20 via-sky-500/10 to-transparent',
  },
  {
    title: 'Instant UPI Payout',
    subtitle: 'Money in your account in seconds',
    icon: Coins,
    description: 'Once disruption is confirmed, payout is initiated directly to your linked UPI without paperwork.',
    metricLabel: 'Typical transfer',
    metricValue: '< 20 sec',
    accent: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  },
  {
    title: 'No GPS Required',
    subtitle: 'We value your privacy and battery',
    icon: ShieldCheck,
    description: 'Coverage logic uses trusted regional intelligence, not live background location tracking.',
    metricLabel: 'Privacy mode',
    metricValue: 'Always On',
    accent: 'from-amber-500/20 via-orange-400/10 to-transparent',
  },
];

const steps = [
  {
    id: '1',
    title: 'Register',
    text: 'Sign up in 2 minutes with your phone number and gig platform ID. No credit check needed.',
    snapshotLabel: 'Identity Sync',
    stage: 'Onboarding',
    eta: '2 min setup',
    tone: 'from-sky-100 via-cyan-100 to-white',
    borderTone: 'border-sky-200',
    pillTone: 'bg-sky-900 text-white',
  },
  {
    id: '2',
    title: 'Work',
    text: 'Go about your day. We monitor weather, heat levels, and traffic curfews in your city 24/7.',
    snapshotLabel: 'Live Monitoring Feed',
    stage: 'Active Monitoring',
    eta: '24/7 coverage',
    tone: 'from-indigo-100 via-blue-100 to-white',
    borderTone: 'border-indigo-200',
    pillTone: 'bg-indigo-900 text-white',
  },
  {
    id: '3',
    title: 'Get Paid',
    text: 'If conditions prevent work, KavachPay triggers a payout automatically to your linked UPI ID.',
    snapshotLabel: 'Payout Pipeline',
    stage: 'Claim Settlement',
    eta: 'Instant UPI',
    tone: 'from-emerald-100 via-teal-100 to-white',
    borderTone: 'border-emerald-200',
    pillTone: 'bg-emerald-800 text-white',
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [activeTrust, setActiveTrust] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveTrust((prev) => (prev + 1) % quickTrust.length);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeTrustItem = quickTrust[activeTrust];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100 bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-3 md:px-7 lg:px-10">
          <div className="group flex items-center gap-3">
            <img
              src="/KavachPay_logo.png"
              alt="KavachPay"
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-base font-bold tracking-tight text-blue-900">KavachPay</span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:rounded-xl sm:px-5 sm:py-2.5"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="cursor-pointer rounded-lg bg-blue-900 px-3 py-2 font-semibold text-white shadow-md shadow-blue-900/35 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg sm:rounded-xl sm:px-5 sm:py-2.5"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-20 md:px-7 md:pb-12 md:pt-20 lg:px-10">

        <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Main Heading - Classic Typography */}
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] text-slate-900 sm:text-4xl">
                Protecting India&apos;s
              </h1>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] sm:text-4xl">
                <span className="flex w-full items-center">
                  <span className="inline-flex w-full items-center rounded-r-full bg-blue-100 px-4 py-1 font-serif text-3xl font-bold leading-none tracking-[0.01em] text-blue-950 sm:px-5 sm:text-4xl md:px-7 md:py-1.5 md:text-5xl lg:w-[calc(100%+2rem)] lg:mr-[-2rem] lg:px-10 lg:py-2 lg:text-6xl">
                    Gig Income,
                  </span>
                </span>
              </h2>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] text-slate-900 sm:text-4xl">
                Automatically.
              </h2>
            </div>

            {/* Description - Refined */}
            <div className="space-y-3 max-w-lg">
              <p className="text-base md:text-lg text-slate-700 leading-relaxed font-light">
                The first AI-powered smart insurance for delivery partners and gig workers.
              </p>
              <p className="text-base md:text-lg text-slate-700 leading-relaxed font-light">
                We pay you when the weather or city stops you from working.
              </p>
            </div>

            {/* CTA Buttons - Classic */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-white shadow-md transition-colors duration-200 active:scale-95 hover:bg-blue-800 hover:shadow-lg sm:w-auto cursor-pointer"
              >
                Get Protected
              </button>
              <button
                type="button"
                onClick={() => navigate('/howitworks')}
                className="w-full rounded-lg border-2 border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition-all duration-200 active:scale-95 hover:border-slate-400 hover:bg-slate-50 sm:w-auto cursor-pointer"
              >
                How it Works
              </button>
            </div>

            {/* Trust Features - Minimal */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-200">
              <div className="flex items-start gap-3">
                <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium text-sm">Instant UPI Payouts</span>
              </div>
              <div className="flex items-start gap-3">
                <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium text-sm">No Credit Check</span>
              </div>
            </div>
          </div>

          {/* Right Image - Classic */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-lg">
              <img
                src="/gigworker.png"
                alt="Delivery partner"
                className="h-[360px] w-full object-cover sm:h-[440px] lg:h-[520px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white py-4">
        <div className="mx-auto w-full max-w-6xl overflow-hidden px-4 md:px-7 lg:px-10">
          <div className="flex w-max min-w-full animate-[ticker_24s_linear_infinite] items-center gap-6 text-xs font-semibold uppercase tracking-[0.1em]">
            {disruptionLoop.map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                {idx % disruptionFeed.length === 0 ? (
                  <Activity size={12} className="text-emerald-400" />
                ) : (
                  <span className="text-slate-600">•</span>
                )}
                <span className={idx % disruptionFeed.length === 0 ? 'text-slate-200' : 'text-white'}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden">
        <div className="relative h-[420px] w-full md:h-[500px] lg:h-[600px]">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/gigworkeratrain.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          <div className="absolute inset-y-0 left-0 flex items-center px-3 md:px-8 lg:px-12">
            <div className="w-full max-w-[520px] text-white">
              <p className="overlay-in inline-flex items-center rounded-r-full bg-blue-100 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-950 shadow-[0_8px_24px_rgba(2,6,23,0.35)] sm:px-5 sm:py-2 sm:text-xs md:px-6 md:py-2.5 md:text-sm">
                KavachPay Protection
              </p>
              <h3 className="overlay-in-delay-1 mt-2 text-base font-bold leading-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.75)] sm:mt-3 sm:text-lg md:text-2xl">Storm outside. Stable income inside.</h3>

              <ul className="mt-3 space-y-2 text-[11px] text-slate-100 sm:mt-4 sm:space-y-2.5 sm:text-xs md:text-sm">
                <li className="overlay-in-delay-2 point-strap">Stuck in heavy storm rain? Auto detection starts your claim.</li>
                <li className="overlay-in-delay-3 point-strap">Flooded route and city slowdown coverage for daily gig workers.</li>
                <li className="overlay-in-delay-4 point-strap">Verified disruption triggers instant UPI payout with zero paperwork.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes overlay-slide-in {
          from {
            opacity: 0;
            transform: translateX(-26px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .overlay-in {
          opacity: 0;
          animation: overlay-slide-in 0.6s ease-out 0.08s forwards;
        }

        .overlay-in-delay-1 {
          opacity: 0;
          animation: overlay-slide-in 0.65s ease-out 0.22s forwards;
        }

        .overlay-in-delay-2 {
          opacity: 0;
          animation: overlay-slide-in 0.65s ease-out 0.36s forwards;
        }

        .overlay-in-delay-3 {
          opacity: 0;
          animation: overlay-slide-in 0.65s ease-out 0.5s forwards;
        }

        .overlay-in-delay-4 {
          opacity: 0;
          animation: overlay-slide-in 0.65s ease-out 0.64s forwards;
        }

        @keyframes strap-sweep {
          0% {
            background-position: 180% 0;
          }
          100% {
            background-position: -140% 0;
          }
        }

        .point-strap {
          position: relative;
          border-left: 3px solid rgba(125, 211, 252, 0.95);
          border-radius: 0 999px 999px 0;
          padding: 0.45rem 0.85rem;
          color: #f8fafc;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65);
          background-image:
            linear-gradient(90deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.24) 60%, rgba(125, 211, 252, 0.24) 100%),
            linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.22) 48%, rgba(255, 255, 255, 0) 65%);
          background-size: 100% 100%, 220% 100%;
          background-repeat: no-repeat;
          animation: strap-sweep 3.8s ease-in-out infinite;
        }

        @keyframes flow-line {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes float-soft {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .float-soft {
          animation: float-soft 4.8s ease-in-out infinite;
        }

        @keyframes orbit-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rise-bar {
          0%,
          100% {
            transform: scaleY(0.35);
          }
          50% {
            transform: scaleY(1);
          }
        }

        @keyframes travel-dot {
          0% {
            left: 10%;
            opacity: 0.2;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            left: 82%;
            opacity: 0.2;
          }
        }

      `}</style>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-7 md:py-12 lg:px-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_0%_20%,rgba(186,230,253,0.5),rgba(255,255,255,0)_40%),radial-gradient(circle_at_100%_80%,rgba(153,246,228,0.35),rgba(255,255,255,0)_42%)] px-4 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">Protection Engine</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Built for real disruptions, not assumptions.</h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Transparent checks before every payout. Select a module to see how your protection stays reliable.
              </p>

              <div className="mt-7 space-y-4">
                {quickTrust.map(({ title, subtitle, icon: Icon }, idx) => {
                  const isActive = idx === activeTrust;

                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setActiveTrust(idx)}
                      onMouseEnter={() => setActiveTrust(idx)}
                      className="group w-full text-left"
                    >
                      <div className="flex items-start gap-4">
                        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 sm:h-11 sm:w-11 ${isActive
                          ? 'bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)]'
                          : 'bg-white/80 text-slate-700 group-hover:bg-white'}`}>
                          <Icon size={18} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-end justify-between gap-4">
                            <p className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{title}</p>
                            <span className={`h-px flex-1 transition-all duration-300 ${isActive ? 'bg-slate-900' : 'bg-slate-300 group-hover:bg-slate-500'}`} />
                          </div>
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm">{subtitle}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950 px-5 py-6 text-white sm:px-7 sm:py-8">
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${activeTrustItem.accent}`} />
              <div className="pointer-events-none absolute -right-8 top-6 h-36 w-36 rounded-full bg-white/10 blur-2xl float-soft" />

              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-xs">Verification Module</p>
                <span className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                  <activeTrustItem.icon size={19} />
                </span>

                <h4 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{activeTrustItem.title}</h4>
                <p className="mt-2 text-sm text-slate-100/90 sm:text-base">{activeTrustItem.subtitle}</p>
                <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">{activeTrustItem.description}</p>

                <div className="mt-6 flex items-end justify-between gap-3 border-t border-white/20 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-[11px]">{activeTrustItem.metricLabel}</p>
                    <p className="mt-1 text-xl font-bold tracking-tight text-emerald-300 sm:text-2xl">{activeTrustItem.metricValue}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-100 sm:text-[11px]">
                    Live Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 md:px-7 md:pb-14 md:pt-6 lg:px-10">
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">How KavachPay Works</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From signup to payout,
            <span className="text-blue-900"> designed for speed and trust.</span>
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            A guided 3-stage protection flow that keeps onboarding simple, monitoring invisible, and payout instant.
          </p>
        </div>

        <div className="relative mt-8">
          <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-[2px] bg-[linear-gradient(90deg,rgba(14,116,144,0.25)_0%,rgba(30,64,175,0.7)_50%,rgba(5,150,105,0.25)_100%)] bg-[length:200%_100%] animate-[flow-line_6s_linear_infinite] md:block" />

          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, idx) => (
              <article key={step.id} className="relative md:pt-10">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.25)]">
                    {step.id}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{step.stage}</p>
                    <p className="text-sm font-semibold text-slate-900">{step.eta}</p>
                  </div>
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{step.text}</p>

                <div className="relative mt-5 overflow-hidden rounded-[1.35rem]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.tone} opacity-90`} />
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/60 blur-2xl float-soft" />
                  <div className="relative p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">{step.snapshotLabel}</p>
                    <div className="mt-2 h-28 overflow-hidden rounded-[1rem] bg-white/75 p-3">
                      {step.id === '1' ? (
                        <div className="relative h-full rounded-xl bg-sky-50/80 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">Quick Setup Flow</p>

                          <div className="relative mt-3 h-[62px]">
                            <span className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-sky-200" />

                            <span className="absolute left-2 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-sky-300 bg-white" />
                            <span className="absolute left-1/2 top-1/2 inline-flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sky-300 bg-white" />
                            <span className="absolute right-2 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-sky-700 bg-sky-700" />

                            <span className="absolute left-[10%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-sky-700 [animation:travel-dot_1.9s_ease-in-out_infinite]" />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.09em] text-sky-700">
                            <span>Phone</span>
                            <span>ID</span>
                            <span>Ready</span>
                          </div>
                        </div>
                      ) : null}

                      {step.id === '2' ? (
                        <div className="relative h-full rounded-xl bg-indigo-50/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Risk Signal</p>
                          <div className="mt-2 flex h-[68px] items-end gap-1">
                            {[0.45, 0.7, 0.55, 0.95, 0.65, 0.85, 0.5, 0.75].map((scale, barIdx) => (
                              <span
                                key={`bar-${barIdx}`}
                                className="w-full origin-bottom rounded-t bg-indigo-500/75"
                                style={{
                                  height: `${Math.round(60 * scale)}px`,
                                  animation: `rise-bar ${1.6 + barIdx * 0.1}s ease-in-out ${barIdx * 0.08}s infinite`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {step.id === '3' ? (
                        <div className="relative h-full rounded-xl bg-emerald-50/90 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Settlement Rail</p>
                          <div className="relative mt-4 h-8 rounded-full bg-white/90 px-3">
                            <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-600 [animation:travel-dot_2.1s_ease-in-out_infinite]" />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Claim OK</span>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-700">UPI Sent</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 ? (
                  <span className="mt-6 inline-flex text-slate-400 md:hidden">
                    <MoveRight size={18} />
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-7 md:pb-16 lg:px-10">
        <div className="relative mb-7 overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white px-5 py-8 shadow-[0_18px_42px_rgba(15,23,42,0.08)] sm:px-7 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(186,230,253,0.35),rgba(255,255,255,0)_45%),radial-gradient(circle_at_92%_76%,rgba(167,243,208,0.3),rgba(255,255,255,0)_42%)]" />

          <div className="relative z-10 grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">Operational Confidence</p>
              <h3 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Designed like an operations center,
                <span className="text-blue-900"> not a generic insurance page.</span>
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                Every claim path follows a professional workflow: disruption validation, policy checks, and secure payout dispatch.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Data Validation Layer</p>
                    <p className="text-sm text-slate-600">Regional weather and disruption signals are verified before any trigger.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Policy Decision Layer</p>
                    <p className="text-sm text-slate-600">Eligibility and safeguards are checked with minimal user effort.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Payout Dispatch Layer</p>
                    <p className="text-sm text-slate-600">Approved claims are routed instantly to your connected UPI account.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-xs">Claim Response Timeline</p>

              <div className="mt-5 space-y-4">
                <div className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  <span className="absolute left-[0.28rem] top-4 h-8 w-px bg-slate-700" />
                  <p className="text-sm font-semibold text-white">Disruption Confirmed</p>
                  <p className="text-xs text-slate-300">Weather and city risk feed flags an eligible event.</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span className="absolute left-[0.28rem] top-4 h-8 w-px bg-slate-700" />
                  <p className="text-sm font-semibold text-white">Coverage Matched</p>
                  <p className="text-xs text-slate-300">Policy conditions are validated automatically in the background.</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <p className="text-sm font-semibold text-white">UPI Payout Sent</p>
                  <p className="text-xs text-slate-300">Claim settles instantly with no paperwork queue.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-7 rounded-[1.9rem] border border-slate-200 bg-white px-5 py-7 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:px-7 sm:py-9">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">Quick Answers</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Common questions from gig workers</h3>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-600 sm:text-base">
              Everything you need to know before getting protected with KavachPay.
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <details className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 open:bg-white sm:px-5 sm:py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 sm:text-base">When do I receive payout after disruption is verified?</summary>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Payout is initiated instantly after verification and usually reaches your UPI account in seconds.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 open:bg-white sm:px-5 sm:py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 sm:text-base">Do I need to keep GPS always on for coverage?</summary>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                No. KavachPay uses trusted regional intelligence and disruption signals, so live GPS tracking is not required.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 open:bg-white sm:px-5 sm:py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 sm:text-base">Which workers can enroll in this protection?</summary>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Delivery partners, driver-partners, and most app-based gig workers in supported cities can enroll.
              </p>
            </details>
          </div>
        </div>

        <div className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-12 text-center text-white shadow-2xl sm:px-8 sm:py-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Don&apos;t let the weather decide your
            <span className="text-emerald-300"> payout.</span>
          </h2>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-slate-900 sm:px-8"
          >
            Join 15,000+ Workers
            <MoveRight size={14} />
          </button>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Trusted across 24 Indian cities
          </p>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 md:px-7 lg:px-10">
        <div className="grid gap-8 border-t border-slate-300 pt-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-bold text-blue-900">KavachPay</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              India&apos;s leading income protection platform for the gig economy. Empowering workers through weather and
              disruption insurance.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              <li>About Us</li>
              <li>Careers</li>
              <li>Blog</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              <li>How it works</li>
              <li>Pricing</li>
              <li>Claims API</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Support</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              <li>Help Center</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 md:flex-row md:items-center">
          <p>© 2024 KavachPay Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-3 text-slate-600">
            <Star size={14} />
            <span>•</span>
            <MoveRight size={14} />
          </div>
        </div>
      </footer>

    </main>
  );
};

export default Landing;
