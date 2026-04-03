import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Loader2, ArrowLeft, Check } from 'lucide-react';
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
    otp: ['', '', '', '', '', ''],
    deliveryPlatform: 'Zomato',
    vehicleType: 'Two-wheeler',
    weeklyEarnings: 4000,
    upiId: '',
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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
    if (value.length > 1) return;
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData({ ...formData, otp: newOtp });

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to send OTP. Try again shortly.');
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
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Invalid or expired code.');
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

    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-200 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-3">
                <img src="/KavachPay_logo.png" alt="KavachPay" className="h-9 w-9 object-contain" />
                <span className="text-xl font-bold tracking-tight text-stone-900">KavachPay</span>
              </Link>
              <p className="hidden sm:block text-sm text-stone-500">
                Already have an account?{' '}
                <Link to="/signin" className="font-semibold text-emerald-600 hover:text-emerald-700">Log In</Link>
              </p>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            {/* Progress Tracker */}
            <div className="mb-10">
              <div className="flex justify-between items-center relative px-4">
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 z-0" />
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-500 ease-out z-0"
                  style={{ width: `${(step - 1) * 50}%` }}
                />

                {[1, 2, 3].map((s) => (
                  <div key={s} className="relative z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step > s 
                        ? 'bg-emerald-500 text-white' 
                        : step === s 
                          ? 'bg-stone-900 text-white shadow-lg' 
                          : 'bg-white border-2 border-stone-200 text-stone-400'
                    }`}>
                      {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    <span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                      step >= s ? 'text-stone-900' : 'text-stone-400'
                    }`}>
                      {s === 1 ? 'Verify' : s === 2 ? 'Details' : 'Wallet'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
              <div className="p-8">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium">
                    {success}
                  </div>
                )}

                {/* STEP 1: Personal Details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-stone-900">Identity Verification</h2>
                      <p className="text-stone-500 mt-1">Start by securing your account with email OTP.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. Kishan Roy"
                          className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-stone-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700">Phone Number</label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. +91 8511705401"
                          className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-stone-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="name@gmail.com"
                          className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 pr-32 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading || !canResend}
                          className="absolute right-1.5 top-1.5 h-9 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 disabled:bg-stone-400 transition-all flex items-center gap-2"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : 'Send Code'}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-stone-700">Enter 6-Digit Code</label>
                          {countdown > 0 && (
                            <span className="text-xs font-semibold text-amber-600 animate-pulse">
                              Expires in {countdown}s
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {formData.otp.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-${idx}`}
                              type="text"
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="h-12 w-full bg-stone-50 border-2 border-stone-200 rounded-xl text-center text-lg font-bold text-stone-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
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
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-stone-900">Work Environment</h2>
                      <p className="text-stone-500 mt-1">Select your primary delivery stats.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700">Platform</label>
                        <select
                          name="deliveryPlatform"
                          value={formData.deliveryPlatform}
                          onChange={handleInputChange}
                          className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm outline-none focus:border-emerald-500"
                        >
                          <option value="Zomato">Zomato</option>
                          <option value="Swiggy">Swiggy</option>
                          <option value="Blinkit">Blinkit</option>
                          <option value="Uber">Uber Eats</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700">City</label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm outline-none focus:border-emerald-500"
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
                      <label className="text-sm font-semibold text-stone-700">Approx Weekly Earnings (₹)</label>
                      <input
                        type="range"
                        name="weeklyEarnings"
                        min="1000"
                        max="15000"
                        step="500"
                        value={formData.weeklyEarnings}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-stone-500">₹1,000</span>
                        <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                          ₹{formData.weeklyEarnings.toLocaleString()}
                        </span>
                        <span className="text-sm text-stone-500">₹15,000</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Payment Details */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={40} />
                      </div>
                      <h2 className="text-2xl font-bold text-stone-900">Payout Destination</h2>
                      <p className="text-stone-500 mt-1">Instant claim settlements to your UPI ID.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700">UPI ID for Settlements</label>
                        <input
                          type="text"
                          name="upiId"
                          value={formData.upiId}
                          onChange={handleInputChange}
                          placeholder="yourname@paytm"
                          className="w-full h-14 bg-stone-50 border-2 border-stone-200 rounded-2xl px-5 text-lg font-medium focus:border-emerald-500 outline-none transition-all placeholder:font-normal placeholder:text-stone-400"
                        />
                      </div>

                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Automated Payout Logic</h4>
                        <p className="text-sm text-stone-500 leading-relaxed">
                          When rain falls above 5mm in your zone, a payout of 60% of daily coverage is triggered automatically to this UPI ID without any manual claims.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
                  className="h-12 px-6 rounded-xl font-semibold text-stone-600 hover:bg-white transition-all text-sm flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="flex-1 h-12 bg-stone-900 text-white rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70"
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

            <p className="mt-8 text-center text-stone-400 text-xs font-medium uppercase tracking-wide">
              Powered by KavachPay Autonomous Data Protection
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Signup;
