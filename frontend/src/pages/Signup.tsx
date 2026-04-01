import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // OTP Countdown logic
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    city: 'Mumbai',
    email: '',
    phoneNumber: '',
    otp: ['', '', '', '', '', ''], // Changed to 6 digits
    deliveryPlatform: 'Zomato',
    vehicleType: 'Two-wheeler',
    weeklyEarnings: 4000,
    upiId: '',
  });

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only 1 digit per box
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData({ ...formData, otp: newOtp });

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // If backspace is pressed and current box is empty, go to previous box
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', {
        email: formData.email
      });
      setSuccess('Verification code sent to your email!');
      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    setError('');
    setSuccess('');

    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phoneNumber) {
        setError('Please fill in your name, email, and phone number.');
        return;
      }

      const enteredOtp = formData.otp.join('');
      if (enteredOtp.length < 6) {
        setError('Please enter the 6-digit verification code.');
        return;
      }

      setLoading(true);
      try {
        await axios.post('http://localhost:5000/api/auth/verify-otp', {
          email: formData.email,
          otp: enteredOtp
        });
        setStep(2);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired code.');
      } finally {
        setLoading(false);
      }

    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      submitRegistration();
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        deliveryPlatform: formData.deliveryPlatform,
        vehicleType: formData.vehicleType,
        weeklyEarnings: Number(formData.weeklyEarnings),
        upiId: formData.upiId,
      });

      localStorage.setItem('kavachpay_token', response.data.token);
      localStorage.setItem('kavachpay_user', JSON.stringify(response.data.user));
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-inter">
      <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black italic tracking-tighter text-blue-900 group">
            <img src="/KavachPay_logo.png" alt="Logo" className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110" />
            <span>KAVACH<span className="text-blue-600">PAY</span></span>
          </Link>
          <div className="hidden sm:block text-sm text-slate-500">
            Already have an account? <Link to="/signin" className="font-semibold text-blue-900 cursor-pointer hover:underline">Log In</Link>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-10">
          <div className="flex justify-between items-center relative px-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-500 ease-out z-0"
              style={{ width: `${(step - 1) * 50}%` }}
            ></div>

            {[1, 2, 3].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-blue-900' : 'text-slate-400'}`}>
                  {s === 1 ? 'Verify' : s === 2 ? 'Details' : 'Wallet'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in zoom-in duration-300">
                {success}
              </div>
            )}

            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Identity Verification</h2>
                  <p className="text-slate-500 mt-1">Start by securing your account with email OTP.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Kishan Roy"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 8511705401"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                  <div className="relative group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@gmail.com"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-32 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || !canResend}
                      className="absolute right-1.5 top-1.5 h-9 px-4 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : 'Send Code'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Enter 6-Digit Code</label>
                      {countdown > 0 && <span className="text-[10px] font-bold text-rose-500 animate-pulse uppercase tracking-widest">Expires in {countdown}s</span>}
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
                      {formData.otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="h-10 sm:h-14 w-full bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-lg sm:text-xl font-bold text-blue-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                          maxLength={1}
                          inputMode="numeric"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Work Details */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Work Environment</h2>
                  <p className="text-slate-500 mt-1">Select your primary delivery stats.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Platform</label>
                    <select
                      name="deliveryPlatform"
                      value={formData.deliveryPlatform}
                      onChange={handleInputChange}
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Zomato">Zomato</option>
                      <option value="Swiggy">Swiggy</option>
                      <option value="Blinkit">Blinkit</option>
                      <option value="Uber">Uber Eats</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">City</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Approx Weekly Earnings (₹)</label>
                  <input
                    type="range"
                    name="weeklyEarnings"
                    min="1000"
                    max="15000"
                    step="500"
                    value={formData.weeklyEarnings}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between font-bold text-blue-900 mt-2">
                    <span>₹1,000</span>
                    <span className="bg-blue-100 px-3 py-1 rounded-full text-sm">₹{formData.weeklyEarnings.toLocaleString()}</span>
                    <span>₹15,000</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Details */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Payout Destination</h2>
                  <p className="text-slate-500 mt-1">Instant claim settlements to your UPI ID.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">UPI ID for Settlements</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="phone@paytm"
                      className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 text-lg font-semibold focus:border-blue-500 outline-none transition-all placeholder:font-normal"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Automated Payout Logic</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">When rain falls above 5mm in your zone, a payout of 60% of daily coverage is triggered automatically to this UPI ID without any manual claims.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
              className="h-12 px-8 rounded-xl font-bold text-slate-600 hover:bg-white transition-all text-sm cursor-pointer"
              disabled={loading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-900 hover:shadow-xl transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <span>{step === 3 ? 'Complete Setup' : 'Continue'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Powered by KavachPay Autonomous Data Protection
        </p>
      </div>
    </main>
  );
};

export default Signup;
