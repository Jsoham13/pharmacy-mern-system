import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  Receipt,
  Download,
  Mail,
  Share2,
  CheckCircle,
  CreditCard,
  QrCode,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';
import { medicineService, batchService, saleService } from '../services/api';

export default function POSBilling() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [orderType, setOrderType] = useState('IN_STORE');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Search medicines debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await medicineService.getMedicines({ search: searchQuery });
        setSearchResults(res.data.medicines || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add medicine to cart (automatically selects earliest expiry batch with stock)
  const addToCart = async (medicine) => {
    setErrorMsg('');
    try {
      const res = await batchService.getBatchesByMedicine(medicine._id);
      const batches = res.data.batches || [];

      if (batches.length === 0) {
        setErrorMsg(`No active stock batches available for ${medicine.name}.`);
        return;
      }

      // Pick earliest expiry batch (first in FEFO list)
      const selectedBatch = batches[0];

      // Check if already in cart
      const existingIndex = cart.findIndex((it) => it.batchId === selectedBatch._id);
      if (existingIndex >= 0) {
        const updated = [...cart];
        if (updated[existingIndex].quantity + 1 > selectedBatch.availableQuantity) {
          setErrorMsg(`Cannot add more. Available stock limit is ${selectedBatch.availableQuantity}.`);
          return;
        }
        updated[existingIndex].quantity += 1;
        setCart(updated);
      } else {
        setCart([
          ...cart,
          {
            medicineId: medicine._id,
            medicineName: medicine.name,
            genericName: medicine.genericName,
            brand: medicine.brand,
            isScheduleH: medicine.isScheduleH,
            batchId: selectedBatch._id,
            batchNumber: selectedBatch.batchNumber,
            expiryDate: selectedBatch.expiryDate,
            availableQuantity: selectedBatch.availableQuantity,
            unitPrice: selectedBatch.sellingPrice || medicine.sellingPrice,
            mrp: selectedBatch.mrp || medicine.mrp,
            gstRate: medicine.gstRate || 12,
            discountPercent: 0,
            quantity: 1,
          },
        ]);
      }
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setErrorMsg('Failed to fetch medicine batches: ' + err.message);
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty > item.availableQuantity) {
      setErrorMsg(`Available stock for batch ${item.batchNumber} is only ${item.availableQuantity}.`);
      return;
    } else {
      item.quantity = newQty;
    }
    setCart(updated);
  };

  const updateDiscount = (index, percent) => {
    const updated = [...cart];
    updated[index].discountPercent = Math.max(0, Math.min(100, parseFloat(percent) || 0));
    setCart(updated);
  };

  const removeItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculations
  const hasScheduleH = cart.some((it) => it.isScheduleH);

  let subtotal = 0;
  let discountTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;

  cart.forEach((item) => {
    const base = item.quantity * item.unitPrice;
    const disc = (base * (item.discountPercent || 0)) / 100;
    const taxable = base - disc;
    const taxHalf = (taxable * (item.gstRate / 2)) / 100;

    subtotal += base;
    discountTotal += disc;
    cgstTotal += taxHalf;
    sgstTotal += taxHalf;
  });

  const calculatedTotal = subtotal - discountTotal + cgstTotal + sgstTotal;
  const grandTotal = Math.round(calculatedTotal);
  const roundOff = +(grandTotal - calculatedTotal).toFixed(2);

  // Handle Checkout / Invoice Generation
  const handleCheckout = async () => {
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Add at least one medicine.');
      return;
    }

    if (hasScheduleH && (!doctorName.trim() || !doctorRegNo.trim())) {
      setErrorMsg('Schedule H medicines present! Doctor Name and Medical Council Reg. No. are mandatory.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName: customerName || 'Cash Customer',
        customerPhone,
        customerEmail,
        doctorName,
        doctorRegNo,
        orderType,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
        paymentMethod,
        items: cart.map((it) => ({
          batchId: it.batchId,
          batchNumber: it.batchNumber,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          gstRate: it.gstRate,
        })),
      };

      const res = await saleService.createSale(payload);
      setCompletedSale(res.data.sale);
      setCart([]);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForNextBill = () => {
    setCompletedSale(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDoctorName('');
    setDoctorRegNo('');
    setDeliveryAddress('');
    setOrderType('IN_STORE');
    setPaymentMethod('CASH');
    setErrorMsg('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span>POS Retail Counter Billing</span>
          </h1>
          <p className="text-xs text-slate-500">
            Fast GST Tax Invoicing with FEFO Batch Tracking & Schedule H Compliance
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium border border-blue-200">
            Mode: Indian Standard GST (MH 27)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Medicine Search & Cart (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Medicine Search Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Search Medicine / Barcode / Generic
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type brand (Dolo, Augmentin), generic (Paracetamol), or scan barcode..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Live Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((med) => (
                  <div
                    key={med._id}
                    onClick={() => addToCart(med)}
                    className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{med.name}</span>
                        {med.isScheduleH && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                            Schedule H
                          </span>
                        )}
                        {med.isColdChain && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold text-[10px]">
                            Cold Chain (2-8°C)
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {med.genericName} • {med.manufacturer} • {med.rackLocation || 'Rack A-1'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{med.activePrice || med.sellingPrice}</div>
                      <div className="text-[11px] text-slate-500">
                        Stock: <span className="font-semibold text-emerald-600">{med.totalStock || 0}</span> units
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700">
                  Bill Items ({cart.length})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                Cart is currently empty. Search and add medicines above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Batch & Exp</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Disc%</th>
                      <th className="p-3 text-right">GST%</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item, idx) => (
                      <tr key={item.batchId} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.medicineName}</div>
                          <div className="text-[10px] text-slate-400">{item.genericName}</div>
                          {item.isScheduleH && (
                            <span className="text-[9px] text-rose-600 font-bold">Rx Required</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                            {item.batchNumber}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center space-x-1.5 border border-slate-200 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(idx, -1)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(idx, 1)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={item.discountPercent || ''}
                            onChange={(e) => updateDiscount(idx, e.target.value)}
                            placeholder="0"
                            className="w-12 text-right p-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 text-right text-slate-500 font-mono">
                          {item.gstRate}%
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          ₹
                          {(
                            (item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100)) *
                            (1 + item.gstRate / 100)
                          ).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Schedule H Compliance Banner */}
          {hasScheduleH && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>FDA Maharashtra Schedule H / Rx Verification Required</span>
              </div>
              <p className="text-[11px] text-rose-700">
                This bill contains prescription drugs. Under the Drugs & Cosmetics Act, registered doctor details are legally required.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-rose-900 mb-1">
                    Prescribing Doctor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. S. R. Kulkarni, M.D."
                    className="w-full p-2 bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-rose-900 mb-1">
                    Doctor Medical Council Reg. No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    placeholder="MMC / MCI Reg: 2004/05/1234"
                    className="w-full p-2 bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer Details, Calculations & Checkout (1 col) */}
        <div className="space-y-4">
          {/* Customer & Order Details Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700 pb-2 border-b border-slate-100">
              Customer & Order Channel
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Cash Customer"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile No.</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="98220 12345"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (for PDF)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cust@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Order Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('IN_STORE')}
                  className={`p-2 rounded-lg border text-center font-medium ${
                    orderType === 'IN_STORE'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  🏪 In-Store POS
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`p-2 rounded-lg border text-center font-medium ${
                    orderType === 'DELIVERY'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  🛵 Home Delivery
                </button>
              </div>
            </div>

            {orderType === 'DELIVERY' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Address (Sangli/Miraj)
                </label>
                <textarea
                  rows="2"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Apartment, Street, Landmark, Sangli"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700 pb-2 border-b border-slate-100">
              Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2.5 rounded-lg border text-center font-medium flex items-center justify-center space-x-1.5 ${
                  paymentMethod === 'CASH'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-2.5 rounded-lg border text-center font-medium flex items-center justify-center space-x-1.5 ${
                  paymentMethod === 'UPI'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2.5 rounded-lg border text-center font-medium flex items-center justify-center space-x-1.5 ${
                  paymentMethod === 'CARD'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card (POS)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('RAZORPAY_ONLINE')}
                className={`p-2.5 rounded-lg border text-center font-medium flex items-center justify-center space-x-1.5 ${
                  paymentMethod === 'RAZORPAY_ONLINE'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span>⚡ Razorpay</span>
              </button>
            </div>
          </div>

          {/* Bill Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700 pb-2 border-b border-slate-100">
              Tax & Price Summary
            </h3>

            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-emerald-600">
              <span>Total Discount:</span>
              <span>- ₹{discountTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>CGST (Maharashtra):</span>
              <span>₹{cgstTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>SGST (Maharashtra):</span>
              <span>₹{sgstTotal.toFixed(2)}</span>
            </div>

            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 font-mono">
                <span>Round Off:</span>
                <span>₹{roundOff.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-900">Grand Total:</span>
              <span className="font-black text-xl text-blue-600">₹{grandTotal}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Processing Bill...' : `Complete Bill (₹${grandTotal})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bill Completed Success Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Tax Invoice Generated!</h2>
              <p className="text-xs text-slate-500">
                Invoice Number: <span className="font-mono font-bold text-blue-600">{completedSale.invoiceNumber}</span>
              </p>
              <p className="text-xl font-black text-slate-900 mt-2">₹{completedSale.grandTotal}</p>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* PDF Download */}
              <a
                href={saleService.getInvoiceDownloadUrl(completedSale._id)}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl flex flex-col items-center justify-center text-center font-semibold transition-colors"
              >
                <Download className="w-5 h-5 mb-1 text-blue-600" />
                <span>Download PDF</span>
              </a>

              {/* Email Invoice */}
              <button
                onClick={async () => {
                  try {
                    await saleService.emailInvoice(completedSale._id, {
                      recipientEmail: completedSale.customerEmail || customerEmail,
                    });
                    alert('Digital invoice email dispatched!');
                  } catch (e) {
                    alert('Email sending failed: ' + e.message);
                  }
                }}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex flex-col items-center justify-center text-center font-semibold transition-colors"
              >
                <Mail className="w-5 h-5 mb-1 text-indigo-600" />
                <span>Email Bill</span>
              </button>

              {/* WhatsApp Share */}
              <a
                href={`https://wa.me/${completedSale.customerPhone ? '91' + completedSale.customerPhone : ''}?text=${encodeURIComponent(
                  `Namaskar! Thank you for purchasing from Shree Ganesh Medical, Sangli. Your Tax Invoice #${completedSale.invoiceNumber} for ₹${completedSale.grandTotal} is ready.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl flex flex-col items-center justify-center text-center font-semibold transition-colors"
              >
                <Share2 className="w-5 h-5 mb-1 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              onClick={resetForNextBill}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
            >
              Start Next Counter Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
