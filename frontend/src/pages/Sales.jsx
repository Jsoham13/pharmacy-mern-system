import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Download,
  Mail,
  RotateCcw,
  Eye,
  X,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { saleService } from '../services/api';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (paymentFilter) params.paymentMethod = paymentFilter;

      const res = await saleService.getSales(params);
      setSales(res.data.sales || []);
    } catch (err) {
      console.error('Fetch sales error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSales();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Tax Invoices & Sales Ledger</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dispensed Prescription Records, GST Compliance & Reprint History
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer name, or phone number..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="RAZORPAY_ONLINE">Razorpay Online</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Rx / Schedule H</th>
                <th className="p-3">Channel</th>
                <th className="p-3 text-right">Taxable</th>
                <th className="p-3 text-right">GST Total</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Payment</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-3 text-slate-600">
                      {new Date(sale.createdAt).toLocaleDateString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {sale.hasScheduleH ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          Dr. {sale.doctorName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">OTC / General</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {sale.orderType === 'DELIVERY' ? '🛵 Delivery' : '🏪 In-Store'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      ₹{sale.subtotal.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      ₹{(sale.cgstTotal + sale.sgstTotal).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      ₹{sale.grandTotal}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={saleService.getInvoiceDownloadUrl(sale._id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Download GST PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail View Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tax Invoice: {selectedSale.invoiceNumber}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Billed on {new Date(selectedSale.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Doctor Summary */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Customer
                </span>
                <p className="font-bold text-slate-800">{selectedSale.customerName}</p>
                <p className="text-slate-500">{selectedSale.customerPhone || 'Walk-in'}</p>
                {selectedSale.customerEmail && (
                  <p className="text-slate-500">{selectedSale.customerEmail}</p>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Doctor & Prescription
                </span>
                {selectedSale.hasScheduleH ? (
                  <>
                    <p className="font-bold text-rose-700">Dr. {selectedSale.doctorName}</p>
                    <p className="text-slate-500">Reg: {selectedSale.doctorRegNo}</p>
                  </>
                ) : (
                  <p className="text-slate-500">Non-prescription / Over-the-counter</p>
                )}
              </div>
            </div>

            {/* Line items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Medicine</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">GST%</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-slate-800">{it.medicineName}</td>
                      <td className="p-2 font-mono text-blue-600">{it.batchNumber}</td>
                      <td className="p-2 text-center font-bold">{it.quantity}</td>
                      <td className="p-2 text-right">₹{it.unitPrice.toFixed(2)}</td>
                      <td className="p-2 text-right">{it.gstRate}%</td>
                      <td className="p-2 text-right font-bold">₹{it.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-baseline p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div>
                <span className="text-slate-600">Payment: </span>
                <span className="font-bold text-slate-900">{selectedSale.paymentMethod}</span>
                <span className="ml-2 text-emerald-700 font-bold">({selectedSale.paymentStatus})</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                <span className="font-black text-lg text-blue-700">₹{selectedSale.grandTotal}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-2">
              <a
                href={saleService.getInvoiceDownloadUrl(selectedSale._id)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Tax Invoice (PDF)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
