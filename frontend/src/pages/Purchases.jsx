import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, CheckCircle, Search, Calendar, FileText } from 'lucide-react';
import { purchaseService, supplierService, medicineService } from '../services/api';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const [items, setItems] = useState([]);

  // Line item drafting
  const [selectedMedId, setSelectedMedId] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [qty, setQty] = useState('');
  const [freeQty, setFreeQty] = useState('0');
  const [cost, setCost] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [mrp, setMrp] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, mRes] = await Promise.all([
        purchaseService.getPurchases(),
        supplierService.getSuppliers(),
        medicineService.getMedicines({}),
      ]);
      setPurchases(pRes.data.purchases || []);
      setSuppliers(sRes.data.suppliers || []);
      setMedicines(mRes.data.medicines || []);
      if (sRes.data.suppliers?.length > 0) {
        setSupplierId(sRes.data.suppliers[0]._id);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMedSelect = (medId) => {
    setSelectedMedId(medId);
    const m = medicines.find((x) => x._id === medId);
    if (m) {
      setCost(String(m.purchasePrice || ''));
      setSellPrice(String(m.sellingPrice || ''));
      setMrp(String(m.mrp || ''));
    }
  };

  const addLineItem = () => {
    if (!selectedMedId || !batchNo.trim() || !expiry || !qty || !cost) {
      alert('Please fill Medicine, Batch No, Expiry Date, Quantity and Cost');
      return;
    }

    const med = medicines.find((x) => x._id === selectedMedId);
    const quantityNum = parseInt(qty, 10);
    const freeNum = parseInt(freeQty, 10) || 0;
    const costNum = parseFloat(cost);
    const sellNum = parseFloat(sellPrice) || costNum * 1.25;
    const mrpNum = parseFloat(mrp) || sellNum * 1.1;

    setItems([
      ...items,
      {
        medicineId: med._id,
        medicineName: med.name,
        batchNumber: batchNo.trim().toUpperCase(),
        expiryDate: expiry,
        quantity: quantityNum,
        freeQuantity: freeNum,
        purchaseCost: costNum,
        sellingPrice: sellNum,
        mrp: mrpNum,
        gstRate: med.gstRate || 12,
      },
    ]);

    // Reset line fields
    setBatchNo('');
    setExpiry('');
    setQty('');
    setFreeQty('0');
  };

  const removeLineItem = (idx) => {
    const cp = [...items];
    cp.splice(idx, 1);
    setItems(cp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Add at least one medicine item to the purchase invoice');
      return;
    }

    try {
      await purchaseService.createPurchase({
        supplierId,
        invoiceNumber,
        invoiceDate,
        paymentMethod,
        items,
      });

      setShowModal(false);
      setItems([]);
      setInvoiceNumber('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save purchase');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Supplier Inward Purchases (Goods Receipt)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Stock batch generation, purchase invoices & GST tax input reconciliation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Supplier Bill Inward</span>
        </button>
      </div>

      {/* Purchases History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700">
            Inward Invoices Record ({purchases.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-3">Supplier Invoice #</th>
                <th className="p-3">Supplier Name & GSTIN</th>
                <th className="p-3">Invoice Date</th>
                <th className="p-3 text-center">Items Inward</th>
                <th className="p-3 text-right">Taxable Amount</th>
                <th className="p-3 text-right">GST Total</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    Loading supplier purchase invoices...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No supplier purchases recorded yet. Click "New Supplier Bill Inward" above.
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr key={pur._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">
                      {pur.invoiceNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{pur.supplier?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        GST: {pur.supplier?.gstin || 'Unregistered'}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {new Date(pur.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-800">
                      {pur.items?.length || 0} batches
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      ₹{pur.subtotal?.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      ₹{(pur.cgstTotal + pur.sgstTotal)?.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      ₹{pur.grandTotal?.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {pur.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Inward Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl my-8 space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Record Supplier Purchase Bill & Generate Batches
            </h2>

            {/* Bill Details */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.gstin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-SM-2026-90"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  <option value="CREDIT">Credit 15/21 Days</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            {/* Line Item Entry Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-800 block">Add Medicine Line Item:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1">Medicine *</label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => handleMedSelect(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Medicine Formulation...</option>
                    {medicines.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.genericName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    placeholder="BAT-987"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Qty Received *</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="100"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Free Scheme Qty</label>
                  <input
                    type="number"
                    value={freeQty}
                    onChange={(e) => setFreeQty(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="45.0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Selling Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="60.0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item to Inward</span>
                </button>
              </div>
            </div>

            {/* Added Items Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Medicine</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Exp</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Selling</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-slate-400">
                        No items added yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-slate-800">{it.medicineName}</td>
                        <td className="p-2 font-mono text-blue-600">{it.batchNumber}</td>
                        <td className="p-2">{it.expiryDate}</td>
                        <td className="p-2 text-center font-bold">
                          {it.quantity} {it.freeQuantity > 0 && `(+${it.freeQuantity})`}
                        </td>
                        <td className="p-2 text-right">₹{it.purchaseCost.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{it.sellingPrice.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={items.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-md"
              >
                Save Inward & Stock Batches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
