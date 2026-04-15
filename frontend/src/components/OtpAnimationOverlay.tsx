import React from 'react';

interface OtpAnimationOverlayProps {
  isVisible: boolean;
}

const OtpAnimationOverlay: React.FC<OtpAnimationOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  // Generate 20 particles with random directions and delays
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: (Math.random() - 0.5) * 300,
    delay: Math.random() * 2,
    size: Math.random() * 8 + 4,
    color: ['#3b82f6', '#2563eb', '#60a5fa', '#1e40af'][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Background Particles Burst */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-particle"
              style={{
                '--tw-translate-x': `${p.x}px`,
                '--tw-translate-y': `${p.y}px`,
                backgroundColor: p.color,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: p.id % 2 === 0 ? '50%' : '20%',
                animationDelay: `${p.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Central Logo - No Box */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            {/* Soft glow behind logo */}
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-110 animate-pulse"></div>
            <img 
              src="/KavachPay_logo.png" 
              alt="KavachPay" 
              className="w-32 h-32 object-contain animate-razorpay-jiggle drop-shadow-2xl relative z-20"
            />
          </div>
          
          <div className="mt-12 text-center relative z-20">
            <h2 className="text-2xl font-black text-blue-900 tracking-tighter italic">
              VERIFYING<span className="text-blue-600">...</span>
            </h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 animate-pulse">
              Authenticating Secure Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpAnimationOverlay;
