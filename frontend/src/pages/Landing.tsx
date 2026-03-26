import React from 'react';
import {
  Activity,
  Check,
  Circle,
  CloudRain,
  Coins,
  Gauge,
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

const plans = [
  {
    name: 'Basic',
    price: 149,
    perks: ['Rain Protection', 'UPI Payouts', 'Heat-wave Protection'],
    featured: false,
    cta: 'Select Basic',
  },
  {
    name: 'Standard',
    price: 299,
    perks: ['All Rain Protection', 'Heat-wave Protection', '24/7 Support'],
    featured: true,
    cta: 'Select Standard',
  },
  {
    name: 'Premium',
    price: 499,
    perks: ['Full Disruptions Cover', 'Curfew & Protest Cover', 'Family Health Add-on'],
    featured: false,
    cta: 'Select Premium',
  },
];

const Landing: React.FC = () => {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100 bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-7 lg:px-10">
          <div className="group flex items-center gap-3">
            <img
              src="/KavachPay_logo.png"
              alt="KavachPay"
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-base font-bold tracking-tight text-blue-900">KavachPay</span>
          </div>

          <nav className="hidden items-center gap-2 text-xs md:flex">
            <a
              href="#"
              className="rounded-full bg-blue-900 px-3 py-1.5 font-semibold text-white shadow-sm shadow-blue-900/30 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="rounded-full px-3 py-1.5 font-medium text-slate-600 transition-all duration-300 hover:bg-white hover:text-slate-900 hover:shadow-sm"
            >
              Policy
            </a>
            <a
              href="#"
              className="rounded-full px-3 py-1.5 font-medium text-slate-600 transition-all duration-300 hover:bg-white hover:text-slate-900 hover:shadow-sm"
            >
              Claims
            </a>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              className="rounded-full px-4 py-2 font-medium text-slate-500 transition-colors duration-300 hover:bg-white hover:text-slate-800"
            >
              Logout
            </button>
            <button
              type="button"
              className="rounded-xl bg-blue-900 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-900/35 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 md:px-7 lg:px-10">

        <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="pt-6">
            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.05] tracking-tight">
              Protecting India&apos;s
              <span className="block text-blue-900">Gig Income,</span>
              Automatically.
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              The first smart insurance for delivery partners and gig workers. We pay you when the weather or city
              stops you from working.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-blue-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/30"
              >
                Get Protected
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                How it works
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-300 shadow-xl">
              <img src="/gigworker.png" alt="Delivery partner" className="h-[520px] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-6xl overflow-hidden px-4 py-3 md:px-7 lg:px-10">
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

      <style>{`
        @keyframes ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-7 md:grid-cols-3 md:px-7 lg:px-10">
        {quickTrust.map(({ title, subtitle, icon: Icon }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-900">
                <Icon size={14} />
              </span>
              <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <p className="mt-2 pl-11 text-xs text-slate-500">{subtitle}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-5 md:px-7 lg:px-10">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Insurance that works as
            <span className="text-blue-900"> hard as you.</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">Three simple steps to financial peace of mind.</p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const isPrimary = step.id === '2';
            return (
              <article
                key={step.id}
                className={`rounded-[1.7rem] border p-6 ${
                  isPrimary
                    ? 'border-blue-900 bg-blue-900 text-white shadow-xl shadow-blue-900/25'
                    : 'border-slate-200 bg-slate-200/70'
                }`}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold ${
                    isPrimary ? 'bg-white/15 text-white' : 'bg-blue-900 text-white'
                  }`}
                >
                  {step.id}
                </span>
                <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                <p className={`mt-4 text-sm leading-6 ${isPrimary ? 'text-blue-100' : 'text-slate-600'}`}>{step.text}</p>

                <div className={`mt-7 rounded-xl p-4 ${isPrimary ? 'bg-white/12' : step.visual}`}>
                  {step.id === '2' ? (
                    <div className="flex h-20 items-center justify-center">
                      <Gauge size={36} className="text-blue-200" />
                    </div>
                  ) : null}
                  {step.id === '1' ? (
                    <div className="flex h-20 items-center justify-center rounded-lg bg-cyan-700/35 text-xs text-cyan-900">
                      Registration Snapshot
                    </div>
                  ) : null}
                  {step.id === '3' ? (
                    <div className="rounded-xl bg-emerald-200 p-4 text-slate-800">
                      <p className="text-xs">Payout Sent</p>
                      <p className="mt-1 text-3xl font-bold">+₹1,200.00</p>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-7 lg:px-10">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tight">Flexible protection for every worker.</h2>
          <p className="mt-2 text-sm text-slate-500">Starting at less than the price of a cutting chai daily.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative rounded-3xl border bg-white p-6 ${
                plan.featured ? 'border-blue-900 shadow-lg shadow-blue-900/20' : 'border-slate-200'
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-900 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Most Popular
                </span>
              ) : null}

              <p className="text-sm text-slate-500">{plan.name}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black">₹{plan.price}</span>
                <span className="mb-1 text-sm text-slate-400">/month</span>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                {plan.perks.map((perk, idx) => (
                  <li key={perk} className="flex items-center gap-2">
                    {idx < 2 ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Circle size={10} className="text-slate-400" />
                    )}
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-7 w-full rounded-lg border px-4 py-3 text-sm font-semibold ${
                  plan.featured
                    ? 'border-blue-900 bg-blue-900 text-white shadow-md shadow-blue-900/25'
                    : 'border-blue-900 bg-white text-blue-900'
                }`}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-7 lg:px-10">
        <div className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-8 py-16 text-center text-white shadow-2xl">
          <h2 className="mx-auto max-w-2xl text-5xl font-extrabold leading-tight tracking-tight">
            Don&apos;t let the weather decide your
            <span className="text-emerald-300"> payout.</span>
          </h2>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-8 py-3 text-sm font-bold text-slate-900"
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
        <div className="grid gap-8 border-t border-slate-300 pt-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
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
