import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Receipt,
  Pill,
  AlertTriangle,
  Clock,
  Ban,
  ArrowUpRight,
  TrendingUp,
  ShoppingCart,
  Boxes,
  Truck,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportService } from '../services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await reportService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading real-time shop analytics...
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pharmacy Operational Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time live telemetry, counter sales, batch inventory & statutory compliance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS Counter</span>
          </button>
          <button
            onClick={() => navigate('/purchases')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Goods Inward</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">₹{m.todaySales?.toLocaleString('en-IN') || 0}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Gross counter bill receipts today</p>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Gross Profit</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-emerald-600">₹{m.todayProfit?.toLocaleString('en-IN') || 0}</h3>
            <span className="text-[11px] font-medium text-slate-500">
              {m.todaySales > 0 ? `${Math.round((m.todayProfit / m.todaySales) * 100)}% Margin` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sales revenue minus medicine purchase cost</p>
        </div>

        {/* Invoices Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bills Dispensed Today</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{m.todayInvoicesCount || 0}</h3>
            <span className="text-[11px] text-slate-500">Invoices generated</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total completed POS checkout sessions</p>
        </div>

        {/* Medicine Catalogue Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Medicines</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{m.totalMedicines || 0}</h3>
            <span className="text-[11px] text-slate-500">In catalogue</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Brands, Generics & Injectables</p>
        </div>
      </div>

      {/* Alert Warning Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Low Stock Warning */}
        <div
          onClick={() => navigate('/inventory?tab=low')}
          className="cursor-pointer bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center justify-between hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {m.lowStockCount || 0} Low Stock Batches
              </h4>
              <p className="text-xs text-amber-700">Stock at or below reorder threshold</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-600" />
        </div>

        {/* Near Expiry Warning */}
        <div
          onClick={() => navigate('/inventory?tab=expiry')}
          className="cursor-pointer bg-orange-50/80 border border-orange-200 p-4 rounded-xl flex items-center justify-between hover:bg-orange-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-orange-900">
                {m.nearExpiryCount || 0} Near-Expiry Batches
              </h4>
              <p className="text-xs text-orange-700">Expiring in the next 60 days</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-orange-600" />
        </div>

        {/* Expired Stock Warning */}
        <div
          onClick={() => navigate('/inventory?tab=expired')}
          className="cursor-pointer bg-rose-50/80 border border-rose-200 p-4 rounded-xl flex items-center justify-between hover:bg-rose-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                {m.expiredStockCount || 0} Expired / Blocked
              </h4>
              <p className="text-xs text-rose-700">Quarantined from sale dispense</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-rose-600" />
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales vs Profit Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">7-Day Sales & Profit Trends</h3>
              <p className="text-xs text-slate-400">Recharts daily revenue vs gross margin comparison</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.trend || []}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Split Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-1">Payment Method Split</h3>
          <p className="text-xs text-slate-400 mb-4">Cash, UPI, Card & Online distribution</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentBreakdown || []}
                  dataKey="amount"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.paymentBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {(data?.paymentBreakdown || []).map((item, idx) => (
              <div key={item._id} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 truncate">{item._id}:</span>
                <span className="font-semibold text-slate-900">₹{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices & Low Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Recent Customer Bills</h3>
            <button onClick={() => navigate('/sales')} className="text-xs text-blue-600 hover:underline">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Invoice #</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentSales || []).map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-medium text-blue-600">{sale.invoiceNumber}</td>
                    <td className="p-2 text-slate-700">{sale.customerName}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-2 text-right font-bold text-slate-900">₹{sale.grandTotal}</td>
                    <td className="p-2 text-right">
                      <a
                        href={`/api/sales/${sale._id}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Fast Reorder List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Low Stock Reorder List</h3>
            <button onClick={() => navigate('/inventory')} className="text-xs text-blue-600 hover:underline">
              Manage Batches
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Medicine</th>
                  <th className="p-2 text-center">Available</th>
                  <th className="p-2 text-center">Reorder Lvl</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.lowStockList || []).map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="p-2 font-medium text-slate-800">{item.medicineName}</td>
                    <td className="p-2 text-center font-bold text-rose-600">{item.totalAvailable}</td>
                    <td className="p-2 text-center text-slate-500">{item.reorderLevel}</td>
                    <td className="p-2 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
                        Reorder Needed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
