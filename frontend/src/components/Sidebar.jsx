import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Boxes,
  Truck,
  Receipt,
  MapPin,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, hasRole } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS Billing', icon: ShoppingCart },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/inventory', label: 'Batch Inventory', icon: Boxes },
    { to: '/purchases', label: 'Purchases (Inward)', icon: Truck, roles: ['OWNER_ADMIN', 'PHARMACIST'] },
    { to: '/sales', label: 'Sales History', icon: Receipt },
    { to: '/delivery', label: 'Live Delivery Radar', icon: MapPin },
    { to: '/rider-preview', label: 'Rider App (Mobile UI)', icon: Truck },
    { to: '/reports', label: 'Analytics & GST', icon: BarChart3, roles: ['OWNER_ADMIN', 'PHARMACIST'] },
    { to: '/settings', label: 'Store Settings', icon: Settings, roles: ['OWNER_ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
          SG
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide">Shree Ganesh Medical</h1>
          <p className="text-[11px] text-slate-400">Sangli, Maharashtra</p>
        </div>
      </div>

      {/* Drug License Compliance Badge */}
      <div className="mx-3 my-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FDA MH Compliant</span>
        </div>
        <p className="text-[11px] text-slate-400">DL: MH-SAN-20B-11428</p>
        <p className="text-[11px] text-slate-400">GST: 27AABCU9603R1ZM</p>
      </div>

      {/* Nav Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((item) => {
          if (item.roles && !hasRole(...item.roles)) {
            return null;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Staff'}</p>
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-medium border border-blue-800">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
