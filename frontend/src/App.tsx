import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Dashboard from './pages/Dashboard';
import Policy from './pages/Policy';
import Admin from './pages/Admin';
import Claims from './pages/Claims';
import Payout from './pages/Payout';
import HowItWorks from './pages/HowItWorks';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/payout" element={<Payout />} />
          <Route path="/howitworks" element={<HowItWorks />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
