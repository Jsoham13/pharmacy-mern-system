import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Radio,
  LogOut,
  Plus,
  ShoppingCart,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected, notifications, dismissNotification, clearNotifications } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Title & Status */}
      <div className="flex items-center space-x-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Medical Shop OS
          </span>
          <h2 className="text-base font-bold text-slate-800">
            Shree Ganesh Medical & General Stores
          </h2>
        </div>

        {/* Real-time Socket.IO Status */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={isConnected ? 'Live WebSocket Connected' : 'Reconnecting to Server'}
        >
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse text-emerald-600' : 'text-rose-500'}`} />
          <span>{isConnected ? 'Live Sync Active' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick New Bill Button */}
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>New Counter Bill (POS)</span>
        </button>

        {/* Live Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Live Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-xs text-slate-800">
                    Live Alerts ({notifications.length})
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No new alerts or orders right now.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-slate-50 flex items-start space-x-2 text-xs relative"
                    >
                      {item.type === 'ORDER_CREATED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 pr-4">
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{item.message}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.time).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        onClick={() => dismissNotification(item.id)}
                        className="text-slate-400 hover:text-slate-600 absolute top-2 right-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge */}
        <div className="hidden md:flex flex-col items-end border-l border-slate-200 pl-3">
          <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
          <span className="text-[10px] text-slate-500 font-mono">{user?.role}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
