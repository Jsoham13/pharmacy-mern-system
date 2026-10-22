import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4 border border-blue-400/30">
            <Pill className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Shree Ganesh Medical
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Store Management & Retail Pharmacy System
          </p>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FDA Maharashtra DL: 20B/21B Compliant</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In to Counter</h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter credentials to access pharmacy billing and stock controls.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ganeshpharmacy.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2.5 text-center">
              Quick One-Click Demo Logins:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@ganeshpharmacy.com', 'admin123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-blue-700">👑 Owner / Admin</div>
                <div className="text-[10px] text-slate-500">admin@ganeshpharmacy.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('pharmacist@ganeshpharmacy.com', 'pharm123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-emerald-700">🩺 Pharmacist</div>
                <div className="text-[10px] text-slate-500">pharmacist@...</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cashier@ganeshpharmacy.com', 'cash123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-slate-700">🛒 Cashier Staff</div>
                <div className="text-[10px] text-slate-500">cashier@...</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('delivery@ganeshpharmacy.com', 'deliv123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-amber-700">🛵 Delivery Partner</div>
                <div className="text-[10px] text-slate-500">delivery@...</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Shivaji Chowk, Miraj - Sangli Road, Sangli, MH • Pharmacy MERN Stack System
        </p>
      </div>
    </div>
  );
}
