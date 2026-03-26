import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Signup: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#eef2f6] text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-blue-900">
            KavachPay
          </Link>
          <p className="text-xs text-slate-600 sm:text-sm">
            Already have an account? <span className="font-semibold text-blue-900">Log In</span>
          </p>
        </div>

        <div className="mx-auto mt-7 max-w-xl sm:mt-8">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-4 h-[2px] bg-slate-300" />
            <div className="relative z-10 flex w-full items-center justify-between">
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">1</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">Personal</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700">2</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Work</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700">3</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Payment</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-7 max-w-xl rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
              <ShieldCheck size={16} />
            </span>
            <div>
              <p className="text-xl font-bold text-slate-900">Personal Details</p>
              <p className="text-xs text-slate-500">Tell us who you are</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Full Name
              <input
                type="text"
                placeholder="John Doe"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              City
              <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 outline-none focus:border-blue-300">
                <option>Mumbai</option>
                <option>Delhi</option>
                <option>Bengaluru</option>
                <option>Chennai</option>
              </select>
            </label>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-700">Phone Number</label>
            <div className="mt-2 flex gap-2">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
              />
              <button
                type="button"
                className="shrink-0 rounded-xl bg-blue-900 px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
              >
                Send OTP
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-700">Verify OTP</label>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:gap-3">
              <input className="h-11 rounded-xl border border-slate-200 bg-slate-100 text-center text-sm outline-none focus:border-blue-300" maxLength={1} />
              <input className="h-11 rounded-xl border border-slate-200 bg-slate-100 text-center text-sm outline-none focus:border-blue-300" maxLength={1} />
              <input className="h-11 rounded-xl border border-slate-200 bg-slate-100 text-center text-sm outline-none focus:border-blue-300" maxLength={1} />
              <input className="h-11 rounded-xl border border-slate-200 bg-slate-100 text-center text-sm outline-none focus:border-blue-300" maxLength={1} />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Resend in 00:45</p>
          </div>
        </section>

        <div className="mx-auto mt-6 max-w-xl">
          <button
            type="button"
            className="w-full rounded-2xl bg-blue-900 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(30,64,175,0.35)] transition hover:bg-blue-800"
          >
            Continue Workflow
          </button>
          <p className="mt-3 text-center text-xs font-medium text-slate-600">Save for later</p>
        </div>

        <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Data Encrypted</p>
            <p className="mt-1 text-xs text-slate-500">AES-256 banking security standards.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Priority Support</p>
            <p className="mt-1 text-xs text-slate-500">24/7 help for registered partners.</p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <p>© 2024 KAVACHPAY TECHNOLOGIES</p>
          <div className="flex items-center gap-4">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Help</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Signup;
