import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSendLoginOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/auth/login-send-otp', { email });
      setSuccess('Login code sent to your email!');
      setStep(2);
      setCountdown(60);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Account not found or limit reached.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login-verify', {
        email,
        otp: enteredOtp
      });
      localStorage.setItem('kavachpay_token', response.data.token);
      localStorage.setItem('kavachpay_user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Invalid or expired code.');
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
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Welcome Text */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-stone-900 mb-2">Welcome back</h1>
              <p className="text-stone-500">Sign in to access your protection dashboard.</p>
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

                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">
                      {step === 1 ? 'Sign In' : 'Verify Identity'}
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      {step === 1 
                        ? 'Enter your email to receive a login code.' 
                        : `A 6-digit code has been sent to ${email}`
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={step === 2}
                        placeholder="name@example.com"
                        className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-70"
                      />
                      {step === 2 && (
                        <button 
                          onClick={() => setStep(1)} 
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Change Email
                        </button>
                      )}
                    </div>

                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-stone-700">Enter 6-Digit Code</label>
                          {countdown > 0 && (
                            <span className="text-xs font-semibold text-amber-600 animate-pulse">
                              Expires in {countdown}s
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {otp.map((digit, idx) => (
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
                        {countdown === 0 && (
                          <div className="text-center">
                            <button 
                              onClick={handleSendLoginOtp} 
                              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              Resend Code
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={step === 1 ? handleSendLoginOtp : handleVerifyLogin}
                    disabled={loading}
                    className="w-full h-12 bg-stone-900 text-white rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <span>{step === 1 ? 'Get Login Code' : 'Secure Login'}</span>
                        {step === 1 ? <ArrowRight size={18} /> : <ShieldCheck size={18} />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-stone-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Create one for free
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Signin;
