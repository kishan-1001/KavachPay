import React from 'react';
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
  },
  {
    title: 'Instant UPI Payout',
    subtitle: 'Money in your account in seconds',
    icon: Coins,
  },
  {
    title: 'No GPS Required',
    subtitle: 'We value your privacy and battery',
    icon: ShieldCheck,
  },
];

const quickTrustLoop = [...quickTrust, ...quickTrust];

const steps = [
  {
    id: '1',
    title: 'Register',
    text: 'Sign up in 2 minutes with your phone number and gig platform ID. No credit check needed.',
    visual: 'bg-cyan-300/55',
  },
  {
    id: '2',
    title: 'Work',
    text: 'Go about your day. We monitor weather, heat levels, and traffic curfews in your city 24/7.',
    visual: 'bg-blue-900 text-white',
  },
  {
    id: '3',
    title: 'Get Paid',
    text: 'If conditions prevent work, KavachPay triggers a payout automatically to your linked UPI ID.',
    visual: 'bg-emerald-300/75',
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();

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
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:rounded-xl sm:px-5 sm:py-2.5"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-lg bg-blue-900 px-3 py-2 font-semibold text-white shadow-md shadow-blue-900/35 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg sm:rounded-xl sm:px-5 sm:py-2.5"
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
                className="w-full rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-white shadow-md transition-colors duration-200 active:scale-95 hover:bg-blue-800 hover:shadow-lg sm:w-auto"
              >
                Get Protected
              </button>
              <button
                type="button"
                className="w-full rounded-lg border-2 border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition-all duration-200 active:scale-95 hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
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

        @keyframes trust-loop {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-7 md:py-10 lg:px-10">
        <div className="overflow-hidden rounded-[1.6rem]">
          <div className="flex w-max min-w-full gap-4 animate-[trust-loop_24s_linear_infinite] sm:gap-5">
            {quickTrustLoop.map(({ title, subtitle, icon: Icon }, idx) => {
              const styleIdx = idx % quickTrust.length;

              return (
                <article
                  key={`${title}-${idx}`}
                  className="relative w-[82vw] max-w-[330px] shrink-0 rounded-[1.6rem] border-2 border-amber-200 bg-amber-50/75 p-5 text-center shadow-[0_18px_35px_rgba(15,23,42,0.1)] sm:w-[300px] sm:p-7 md:w-[360px] md:p-8"
                >
                  <div
                    className="absolute left-0 top-0 h-1.5 w-full rounded-t-[1.45rem] bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-300"
                  />

                  <div className="relative z-10 flex flex-col items-center">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-900 sm:h-12 sm:w-12"
                    >
                      <Icon size={18} />
                    </span>
                    <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900 sm:mt-4 sm:text-xl">{title}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7 md:text-base">{subtitle}</p>

                  </div>

                  <div
                    className="relative z-10 mt-5 inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800"
                  >
                    Active Safeguard
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 md:px-7 md:pb-14 md:pt-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Insurance that works as
            <span className="text-blue-900"> hard as you.</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">Three clear steps. One reliable safety net.</p>
        </div>

        <div className="relative mt-10 grid gap-5 md:grid-cols-3">
          <span className="pointer-events-none absolute left-[33.333%] top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 text-black md:inline-flex">
            <MoveRight size={28} strokeWidth={2.5} />
          </span>
          <span className="pointer-events-none absolute left-[66.666%] top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 text-black md:inline-flex">
            <MoveRight size={28} strokeWidth={2.5} />
          </span>
          {steps.map((step) => {
            const tone =
              step.id === '1'
                ? 'border-sky-200 bg-sky-50/60'
                : step.id === '2'
                  ? 'border-indigo-200 bg-indigo-50/60'
                  : 'border-emerald-200 bg-emerald-50/60';

            return (
              <article
                key={step.id}
                className={`relative overflow-hidden rounded-[1.7rem] border-2 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] ${tone}`}
              >
                <div className="pointer-events-none absolute inset-0 opacity-80">
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/45 blur-xl" />
                  <div className="absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-white/35 blur-lg" />
                  <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0)_52%)]" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-base font-bold text-white">
                    {step.id}
                  </span>
                  <span className="rounded-r-full border-l-2 border-slate-400 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Step {step.id}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-700">{step.text}</p>

                <div className="mt-7 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-inner">
                  {step.id === '1' ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">Registration Snapshot</p>
                      <div className="mt-3 overflow-hidden rounded-xl border border-sky-100 bg-sky-50">
                        <img
                          src="/register.png"
                          alt="Register process"
                          className="h-20 w-full object-cover sm:h-24"
                        />
                      </div>
                    </div>
                  ) : null}

                  {step.id === '2' ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700">Work Snapshot</p>
                      <div className="mt-3 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50">
                        <img
                          src="/work.png"
                          alt="Work process"
                          className="h-20 w-full object-cover sm:h-24"
                        />
                      </div>
                    </div>
                  ) : null}

                  {step.id === '3' ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Payout Snapshot</p>
                      <div className="mt-3 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50">
                        <img
                          src="/getpaid.png"
                          alt="Get paid process"
                          className="h-20 w-full object-cover sm:h-24"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-7 md:pb-16 lg:px-10">
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
