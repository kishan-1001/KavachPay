import React from 'react';

const Landing: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  }}>
    <img
      src="/KavachPay_logo.png"
      alt="KavachPay Logo"
      style={{ width: '200px', objectFit: 'contain' }}
    />
    <h1 style={{ fontFamily: 'sans-serif', fontSize: '2rem', color: '#111', margin: 0 }}>
      Welcome
    </h1>
  </div>
);

export default Landing;
