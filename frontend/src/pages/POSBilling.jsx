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
  Sparkles,
  User,
  Phone,
  Radio,
  Pill,
} from 'lucide-react';
import { medicineService, batchService, saleService } from '../services/api';

// Fast OTC Top Sellers for Sangli Pharmacy
const OTC_FAST_SELLERS = [
  { name: 'Dolo 650 Tablet', label: 'Dolo 650', category: 'Analgesics / Antipyretics', color: 'from-blue-600 to-indigo-600' },
  { name: 'Pan 40 Tablet', label: 'Pan 40', category: 'Gastrointestinal', color: 'from-amber-500 to-orange-600' },
  { name: 'Augmentin 625 Duo Tablet', label: 'Augmentin 625', category: 'Antibiotics', color: 'from-rose-600 to-red-700', isRx: true },
  { name: 'Azee 500 Tablet', label: 'Azee 500', category: 'Antibiotics', color: 'from-purple-600 to-indigo-700', isRx: true },
  { name: 'Cetzine 10 Tablet', label: 'Cetzine 10', category: 'Antihistamines', color: 'from-teal-600 to-emerald-600' },
  { name: 'Ascoril D Plus Syrup 100ml', label: 'Ascoril D Syrup', category: 'Respiratory / Cough', color: 'from-sky-600 to-blue-700' },
  { name: 'Becadexamin Softgel Capsules', label: 'Becadexamin', category: 'Nutritional / Vitamins', color: 'from-yellow-500 to-amber-600' },
  { name: 'Lantus Solostar Insulin Pen', label: 'Lantus Insulin', category: 'Anti-Diabetic (Insulin)', color: 'from-cyan-600 to-blue-600', isCold: true },
];

// Quick Category Filters
const CATEGORY_PILLS = [
  { id: 'ALL', label: '⚡ All Medicines' },
  { id: 'Analgesics / Antipyretics', label: '🤒 Fever & Pain' },
  { id: 'Antibiotics', label: '🛡️ Antibiotics (Rx)' },
  { id: 'Gastrointestinal', label: '🔥 Acidity & Digestion' },
  { id: 'Anti-Diabetic', label: '🍬 Diabetes & Insulin' },
  { id: 'Cardiovascular', label: '🫀 BP & Heart' },
  { id: 'Respiratory / Cough', label: '🧪 Cough & Cold' },
];

// Frequent Neighborhood Doctors in Sangli/Miraj for 1-tap Schedule H prescription compliance
const LOCAL_DOCTORS = [
  { name: 'Dr. S. R. Kulkarni, M.D.', regNo: 'MMC / Reg. 2004/05/1124' },
  { name: 'Dr. Anand Patil, M.S. (Ortho)', regNo: 'MMC / Reg. 2011/08/4521' },
  { name: 'Dr. Sunita Deshmukh, DNB (Pedia)', regNo: 'MMC / Reg. 2015/02/7890' },
];

export default function POSBilling() {
  const [allMedicines, setAllMedicines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);

  // Customer & Doctor
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [orderType, setOrderType] = useState('IN_STORE');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showScreenQR, setShowScreenQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial medicine catalog for quick tiles
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await medicineService.getMedicines({});
        setAllMedicines(res.data.medicines || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCatalog();
  }, []);

  // Filter medicines by search or category
  useEffect(() => {
    if (!searchQuery.trim() && selectedCategory === 'ALL') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const params = {};
        if (searchQuery.trim()) params.search = searchQuery;
        if (selectedCategory !== 'ALL') params.category = selectedCategory;

        const res = await medicineService.getMedicines(params);
        setSearchResults(res.data.medicines || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Add medicine to cart (FEFO logic)
  const addToCart = async (medicine) => {
    setErrorMsg('');
    try {
      const res = await batchService.getBatchesByMedicine(medicine._id);
      const batches = res.data.batches || [];

      if (batches.length === 0) {
        setErrorMsg(`Out of stock: No active batches found for ${medicine.name}.`);
        return;
      }

      const selectedBatch = batches[0]; // Earliest expiry batch (FEFO)

      const existingIndex = cart.findIndex((it) => it.batchId === selectedBatch._id);
      if (existingIndex >= 0) {
        const updated = [...cart];
        if (updated[existingIndex].quantity + 1 > selectedBatch.availableQuantity) {
          setErrorMsg(`Stock limit reached for batch ${selectedBatch.batchNumber} (Max: ${selectedBatch.availableQuantity}).`);
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
            isColdChain: medicine.isColdChain,
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
      setErrorMsg('Failed to select batch: ' + err.message);
    }
  };

  // Add by fast OTC tile
  const handleOtcTileClick = (otcItem) => {
    const found = allMedicines.find(
      (m) => m.name.toLowerCase().includes(otcItem.label.toLowerCase()) || m.name.toLowerCase() === otcItem.name.toLowerCase()
    );
    if (found) {
      addToCart(found);
    } else {
      setErrorMsg(`Medicine ${otcItem.name} not found in catalog.`);
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty > item.availableQuantity) {
      setErrorMsg(`Batch ${item.batchNumber} only has ${item.availableQuantity} units in stock.`);
      return;
    } else {
      item.quantity = newQty;
    }
    setCart(updated);
  };

  const addPackMultiplier = (index, multiplier) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + multiplier;
    if (newQty > item.availableQuantity) {
      setErrorMsg(`Cannot add ${multiplier}. Available stock is ${item.availableQuantity}.`);
      return;
    }
    item.quantity = newQty;
    setCart(updated);
  };

  const setDiscountChip = (index, percent) => {
    const updated = [...cart];
    updated[index].discountPercent = percent;
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

  // Complete Checkout
  const handleCheckout = async () => {
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Cannot checkout empty bill. Add medicines first.');
      return;
    }

    if (hasScheduleH && (!doctorName.trim() || !doctorRegNo.trim())) {
      setErrorMsg('Prescription Alert: Schedule H drugs require Doctor Name & Council Reg. No.');
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
    setShowScreenQR(false);
    setErrorMsg('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              POS
            </span>
            <span>Retail Counter Checkout</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Fast touch billing • Automatic FEFO batching • Maharashtra Form 20B/21B GST Invoicing
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Soundbox Machine Ready</span>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Split: Catalog & Quick-Tiles (Left 65%) + Modern Bill Ticket (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Fast Catalog, Quick Tiles & Category Filter (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick OTC Top Seller Tiles */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Tap Popular Fast Sellers:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Click to instantly add to bill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OTC_FAST_SELLERS.map((tile) => (
                <button
                  key={tile.name}
                  type="button"
                  onClick={() => handleOtcTileClick(tile)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left bg-gradient-to-br hover:from-blue-50/50 hover:to-white group relative overflow-hidden"
                >
                  <div className="font-black text-xs text-slate-800 group-hover:text-blue-600 truncate">
                    {tile.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{tile.category.split('/')[0]}</div>
                  {tile.isRx && (
                    <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                      Rx (Sched H)
                    </span>
                  )}
                  {tile.isCold && (
                    <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-700">
                      2-8°C
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Big Search Bar & Category Filter Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type brand name (Dolo, Pan, Azee), generic salt, or scan barcode..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>

            {/* Category Quick-Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {CATEGORY_PILLS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search / Category Results Grid */}
            {searchResults.length > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-3 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((med) => (
                  <div
                    key={med._id}
                    onClick={() => addToCart(med)}
                    className="p-3 hover:bg-blue-50/70 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">{med.name}</span>
                        {med.isScheduleH && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                            Schedule H
                          </span>
                        )}
                        {med.isColdChain && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold text-[9px]">
                            Cold Chain
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {med.genericName} • {med.manufacturer} • {med.rackLocation || 'Rack A-1'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">
                        ₹{med.activePrice || med.sellingPrice}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-bold">
                        {med.totalStock || 0} in stock
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule H Regulatory Section (Displays prominently when prescription medicine is in cart) */}
          {hasScheduleH && (
            <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-2xl space-y-3 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-900 font-black">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span className="text-sm">Prescription Mandate: Schedule H Drug in Bill</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-extrabold text-[10px]">
                  Maharashtra FDA Form 20B
                </span>
              </div>

              {/* Local Doctor Quick-Chips */}
              <div>
                <span className="font-bold text-rose-900 text-[11px] block mb-1.5">
                  1-Tap Neighborhood Doctors (Auto-Fills Council Reg. No.):
                </span>
                <div className="flex flex-wrap gap-2">
                  {LOCAL_DOCTORS.map((doc) => (
                    <button
                      key={doc.name}
                      type="button"
                      onClick={() => {
                        setDoctorName(doc.name);
                        setDoctorRegNo(doc.regNo);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 hover:border-rose-600 font-bold text-rose-900 hover:bg-rose-100/50 transition-colors shadow-sm text-[11px]"
                    >
                      🩺 {doc.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-rose-900 mb-1">Prescribing Doctor *</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. S. R. Kulkarni, M.D."
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-rose-900 mb-1">Medical Council Reg. No. *</label>
                  <input
                    type="text"
                    required
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    placeholder="MMC / Reg: 2004/05/1124"
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Modern Bill Ticket (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden flex flex-col">
            {/* Ticket Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm tracking-wide">ACTIVE BILL TICKET</h3>
              </div>
              <span className="text-xs bg-slate-800 text-blue-300 px-2.5 py-1 rounded-full font-bold">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="p-4 max-h-[380px] overflow-y-auto divide-y divide-slate-100 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Cart is empty</p>
                  <p className="text-[11px]">Click any top tile or search medicines to add.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.batchId} className="pt-2 first:pt-0 space-y-2 text-xs">
                    {/* Item title & remove */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-black text-slate-900 text-sm leading-tight block">
                          {item.medicineName}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Batch: <span className="font-bold text-blue-600">{item.batchNumber}</span> • Exp:{' '}
                          {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Qty Steppers & Line Total */}
                    <div className="flex items-center justify-between">
                      {/* Big Tactile Quantity Steppers */}
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Strip Multiplier Chips */}
                      <div className="hidden sm:flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => addPackMultiplier(idx, 5)}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 font-bold text-[10px]"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => addPackMultiplier(idx, 10)}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 font-bold text-[10px]"
                        >
                          +1 Strip (10)
                        </button>
                      </div>

                      {/* Line Amount */}
                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 block">
                          ₹
                          {(
                            item.quantity *
                            item.unitPrice *
                            (1 - (item.discountPercent || 0) / 100) *
                            (1 + item.gstRate / 100)
                          ).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">@ ₹{item.unitPrice}/unit</span>
                      </div>
                    </div>

                    {/* Quick Discount Chips */}
                    <div className="flex items-center space-x-1 text-[10px]">
                      <span className="text-slate-400 font-semibold">Disc:</span>
                      {[0, 5, 10, 15].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiscountChip(idx, d)}
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            item.discountPercent === d
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details Strip */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Cash"
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Mobile Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="98220 12345"
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            {/* Payment Method Selector (Big Tactile Buttons) */}
            <div className="p-4 bg-slate-100/60 border-t border-slate-200 space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider block">
                Select Payment Mode:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-black">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>💵 CASH</span>
                </button>

                {/* Counter Soundbox / Machine UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/30'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>📱 UPI MACHINE</span>
                </button>
              </div>

              {/* UPI Options when UPI is active */}
              {paymentMethod === 'UPI' && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span>Paytm / PhonePe Soundbox Counter</span>
                    <button
                      type="button"
                      onClick={() => setShowScreenQR(!showScreenQR)}
                      className="text-[11px] text-blue-600 underline font-extrabold"
                    >
                      {showScreenQR ? 'Hide Screen QR' : '⚡ Show Screen Dynamic QR'}
                    </button>
                  </div>

                  {showScreenQR && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200 text-center space-y-2">
                      <div className="w-32 h-32 mx-auto bg-slate-900 p-2 rounded-xl flex items-center justify-center text-white">
                        <QrCode className="w-24 h-24 text-white" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        UPI: shreeganeshmedical@sbi • ₹{grandTotal}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Grand Total Summary Box */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal + GST:</span>
                  <span>₹{(subtotal + cgstTotal + sgstTotal).toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>- ₹{discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-extrabold text-slate-700 text-sm">Grand Total:</span>
                  <span className="text-2xl font-black text-blue-600 tracking-tight">₹{grandTotal}</span>
                </div>
              </div>

              {/* Giant Complete Bill Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 tracking-wide uppercase"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{loading ? 'Processing Bill...' : `COLLECT ₹${grandTotal} & PRINT`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Completed Success Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Tax Invoice Dispensed!</h2>
              <p className="text-xs text-slate-500">
                Invoice No: <span className="font-mono font-bold text-blue-600">{completedSale.invoiceNumber}</span>
              </p>
              <p className="text-3xl font-black text-slate-900 mt-2">₹{completedSale.grandTotal}</p>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* PDF Download */}
              <a
                href={saleService.getInvoiceDownloadUrl(completedSale._id)}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl flex flex-col items-center justify-center text-center font-bold transition-colors"
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
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl flex flex-col items-center justify-center text-center font-bold transition-colors"
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
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl flex flex-col items-center justify-center text-center font-bold transition-colors"
              >
                <Share2 className="w-5 h-5 mb-1 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              onClick={resetForNextBill}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-md transition-colors"
            >
              Start Next Counter Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
