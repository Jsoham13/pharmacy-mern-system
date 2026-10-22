import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { reportService, saleService } from '../services/api';

export default function Reports() {
  const [dashboardData, setDashboardData] = useState(null);
  const [topMeds, setTopMeds] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [dashRes, topRes, salesRes] = await Promise.all([
          reportService.getDashboard(),
          reportService.getTopMedicines(),
          saleService.getSales({}),
        ]);
        setDashboardData(dashRes.data);
        setTopMeds(topRes.data.topMedicines || []);
        setSales(salesRes.data.sales || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  // Compute GST Tax summary (12% and 5%)
  let totalCGST = 0;
  let totalSGST = 0;
  let totalSalesAmt = 0;
  let totalScheduleHBills = 0;

  sales.forEach((s) => {
    totalSalesAmt += s.grandTotal;
    totalCGST += s.cgstTotal || 0;
    totalSGST += s.sgstTotal || 0;
    if (s.hasScheduleH) totalScheduleHBills += 1;
  });

  const exportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Customer', 'Doctor (Rx)', 'Taxable Subtotal', 'CGST', 'SGST', 'Grand Total', 'Payment Mode'];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      new Date(s.createdAt).toLocaleDateString('en-IN'),
      `"${s.customerName}"`,
      s.hasScheduleH ? `"${s.doctorName} (Reg: ${s.doctorRegNo})"` : 'N/A',
      s.subtotal.toFixed(2),
      s.cgstTotal.toFixed(2),
      s.sgstTotal.toFixed(2),
      s.grandTotal.toFixed(2),
      s.paymentMethod,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_GST_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Financial & Statutory Regulatory Reports</span>
          </h1>
          <p className="text-xs text-slate-500">
            Maharashtra GST Filing Data, Schedule H Prescription Log & Profit Analytics
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export GST Register (CSV)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-semibold block">Total Revenue Recorded</span>
          <p className="text-xl font-black text-slate-900 mt-1">₹{totalSalesAmt.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {sales.length} counter bills</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-semibold block">Central GST (CGST - 6%)</span>
          <p className="text-xl font-black text-blue-600 mt-1">₹{totalCGST.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Liability to Central Govt</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-semibold block">State GST (SGST - 6% MH)</span>
          <p className="text-xl font-black text-blue-600 mt-1">₹{totalSGST.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Maharashtra Commercial Tax</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-semibold block">Schedule H Rx Dispensed</span>
          <p className="text-xl font-black text-rose-600 mt-1">{totalScheduleHBills}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">With doctor council reg. no.</p>
        </div>
      </div>

      {/* Top Selling Medicines Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-slate-800">Top 10 Dispensed Medicines</h3>
          <p className="text-xs text-slate-400">Ranked by total quantity dispensed across sales</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMeds}>
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val, name) => [val, name === 'totalUnitsSold' ? 'Units' : '₹']}
                contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="totalUnitsSold" name="Units Sold" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Schedule H Regulatory Register */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-xs uppercase tracking-wide text-rose-900">
              Schedule H Mandatory Rx Dispensation Register (Maharashtra FDA)
            </h3>
          </div>
          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
            Inspection Ready
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Dispensed On</th>
                <th className="p-3">Patient / Customer</th>
                <th className="p-3">Prescribing Doctor</th>
                <th className="p-3">Doctor Reg. Number</th>
                <th className="p-3 text-right">Invoice Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales
                .filter((s) => s.hasScheduleH)
                .map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{sale.invoiceNumber}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(sale.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{sale.customerName}</td>
                    <td className="p-3 font-bold text-rose-700">Dr. {sale.doctorName}</td>
                    <td className="p-3 font-mono text-slate-600">{sale.doctorRegNo}</td>
                    <td className="p-3 text-right font-black text-slate-900">₹{sale.grandTotal}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
