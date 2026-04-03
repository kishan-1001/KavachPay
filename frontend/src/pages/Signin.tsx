import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OtpAnimationOverlay from '../components/OtpAnimationOverlay';

const Signin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isVerifyingAnimating, setIsVerifyingAnimating] = useState(false);

  useEffect(() => {
    let timer: any;
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Account not found or limit reached.');
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
      
      setIsVerifyingAnimating(true);
      setTimeout(() => {
        setIsVerifyingAnimating(false);
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-inter flex items-start sm:items-center justify-center p-4 py-6 sm:py-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black italic tracking-tighter text-blue-900 group">
            <img src="/KavachPay_logo.png" alt="Logo" className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110" />
            <span>KAVACH<span className="text-blue-600">PAY</span></span>
          </Link>
          <p className="text-slate-500 mt-2 font-medium">Welcome back to secure protection.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in zoom-in">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in zoom-in">
                {success}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{step === 1 ? 'Sign In' : 'Verify Identity'}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {step === 1 ? 'Enter your email to receive a login code.' : `A 6-digit code has been sent to ${email}`}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={step === 2 && loading}
                    placeholder="name@example.com"
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                  />
                  {step === 2 && (
                    <button 
                      onClick={() => setStep(1)} 
                      className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tight cursor-pointer"
                    >
                      Change Email
                    </button>
                  )}
                </div>

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Enter 6-Digit Code</label>
                      {countdown > 0 && <span className="text-[10px] font-bold text-rose-500 animate-pulse uppercase tracking-widest">Expires in {countdown}s</span>}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2">
                      {otp.map((digit, idx) => (
                        <input 
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="h-10 sm:h-12 w-full bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-base sm:text-lg font-bold text-blue-900 focus:border-blue-600 outline-none transition-all cursor-pointer" 
                          maxLength={1} 
                          inputMode="numeric"
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      {countdown === 0 && (
                        <button onClick={handleSendLoginOtp} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer uppercase tracking-wider">
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={step === 1 ? handleSendLoginOtp : handleVerifyLogin}
                disabled={loading}
                className="w-full h-12 bg-blue-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 cursor-pointer"
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

        <p className="mt-8 text-center text-slate-500 text-sm">
          Don't have an account? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create one for free</Link>
        </p>
      </div>
      <OtpAnimationOverlay isVisible={isVerifyingAnimating} />
    </main>
  );
};

export default Signin;
