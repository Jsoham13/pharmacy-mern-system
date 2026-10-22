import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle,
  SlidersHorizontal,
  X,
  Search,
} from 'lucide-react';
import { batchService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [adjustBatch, setAdjustBatch] = useState(null);
  const [adjustedQty, setAdjustedQty] = useState('');
  const [reason, setReason] = useState('Physical count verification');
  const [search, setSearch] = useState('');

  const location = useLocation();
  const { hasRole } = useAuth();
  const canAdjust = hasRole('OWNER_ADMIN', 'PHARMACIST');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tabParam = query.get('tab');
    if (tabParam === 'low') setActiveTab('low');
    else if (tabParam === 'expiry') setActiveTab('expiry');
    else if (tabParam === 'expired') setActiveTab('expired');
  }, [location.search]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'low') params.lowStock = 'true';
      if (activeTab === 'expiry') params.nearExpiryDays = '60';
      if (activeTab === 'expired') params.status = 'EXPIRED';

      const res = await batchService.getBatches(params);
      setBatches(res.data.batches || []);
    } catch (err) {
      console.error('Batches load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [activeTab]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await batchService.adjustStock({
        batchId: adjustBatch._id,
        adjustedQuantity: parseInt(adjustedQty, 10),
        reason,
      });
      setAdjustBatch(null);
      fetchBatches();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Stock adjustment failed');
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.batchNumber?.toLowerCase().includes(q) ||
      b.medicine?.name?.toLowerCase().includes(q) ||
      b.medicine?.genericName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Batch-Wise Stock Inventory</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time FEFO Tracking, Expiry Monitoring & Stock Audit Adjustment
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>All Active Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('low')}
          className={`pb-2.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
            activeTab === 'low'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Low Stock Alert</span>
        </button>

        <button
          onClick={() => setActiveTab('expiry')}
          className={`pb-2.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
            activeTab === 'expiry'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Near-Expiry (Next 60 Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-2.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
            activeTab === 'expired'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Expired / Blocked Stock</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by medicine or batch number..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-3">Medicine</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Available Stock</th>
                <th className="p-3">Supplier Reference</th>
                {canAdjust && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    Loading batch registry...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No batches found for current view.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isNear =
                    new Date(batch.expiryDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                  const isExp = new Date(batch.expiryDate) < new Date();

                  return (
                    <tr key={batch._id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{batch.medicine?.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {batch.medicine?.rackLocation || 'Rack A-1'} • {batch.medicine?.genericName}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-blue-700">
                        {batch.batchNumber}
                      </td>
                      <td className="p-3">
                        <div
                          className={`font-semibold ${
                            isExp ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-slate-700'
                          }`}
                        >
                          {new Date(batch.expiryDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {isExp && <span className="text-[9px] text-rose-500 font-bold">Expired</span>}
                        {!isExp && isNear && (
                          <span className="text-[9px] text-amber-500 font-bold">Expiring Soon</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        ₹{batch.purchaseCost.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        ₹{batch.sellingPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            batch.availableQuantity === 0
                              ? 'bg-slate-100 text-slate-500'
                              : batch.availableQuantity <= (batch.medicine?.reorderLevel || 10)
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {batch.availableQuantity} units
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        <div>{batch.supplier?.name || 'Local Distributor'}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {batch.purchaseInvoiceNumber || 'INV-2026'}
                        </div>
                      </td>
                      {canAdjust && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setAdjustBatch(batch);
                              setAdjustedQty(String(batch.availableQuantity));
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Adjust / Reconcile Physical Stock"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Physical Stock Adjustment / Audit
              </h3>
              <button onClick={() => setAdjustBatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="font-bold text-slate-800">{adjustBatch.medicine?.name}</p>
              <p className="text-slate-500">Batch: <span className="font-mono text-blue-600">{adjustBatch.batchNumber}</span></p>
              <p className="text-slate-500">Current System Recorded Qty: <span className="font-bold text-slate-800">{adjustBatch.availableQuantity}</span></p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verified Actual Physical Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustedQty}
                  onChange={(e) => setAdjustedQty(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit / Adjustment Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  <option value="Physical count verification">Physical Count Verification / Stock Take</option>
                  <option value="Damaged / Broken packaging">Damaged / Broken Packaging</option>
                  <option value="Expired stock scrap">Expired Stock Quarantine & Scrap</option>
                  <option value="Manufacturer batch recall">Manufacturer Batch Recall</option>
                  <option value="Entry correction">Data Entry Error Correction</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustBatch(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
