import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Navigation,
  LogOut,
  Radio,
  Clock,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { saleService, settingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function RiderPortal() {
  const { user, logout } = useAuth();
  const { socket, isConnected, activeDeliveryUpdate } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState({ phone: '+91 98220 12345', storeName: 'Shree Ganesh Medical' });
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'delivered'
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await saleService.getSales({ orderType: 'DELIVERY' });
      setOrders(res.data.sales || []);
    } catch (err) {
      console.error('Failed to load rider orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.data.settings) {
        setStoreInfo(res.data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStoreInfo();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    if (activeDeliveryUpdate) {
      fetchOrders();
    }
  }, [activeDeliveryUpdate]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await saleService.updateDeliveryStatus(orderId, { deliveryStatus: newStatus });
      await fetchOrders();
    } catch (err) {
      alert('Error updating delivery status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculations for Rider Summary
  const pendingOrders = orders.filter((o) => o.deliveryStatus !== 'DELIVERED' && o.deliveryStatus !== 'CANCELLED');
  const deliveredOrders = orders.filter((o) => o.deliveryStatus === 'DELIVERED');

  // Cash in hand to handover to store (Cash orders that have been marked DELIVERED)
  const cashCollectedToday = deliveredOrders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative">
      {/* Top Mobile App Header */}
      <header className="bg-slate-800/90 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-slate-700/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              🛵
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                {user?.name || 'Rider Partner'}
              </h1>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>On Duty • Sangli Shift</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Call Store Pharmacist Button */}
            <a
              href={`tel:${storeInfo.phone || '9822012345'}`}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-600"
              title="Call Main Shop"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Shop</span>
            </a>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cash Handover Summary Card */}
        <div className="mt-3 p-3 bg-gradient-to-r from-emerald-950/70 to-slate-800 border border-emerald-600/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
              Cash in Hand (Store Handover)
            </span>
            <p className="text-xl font-black text-white">₹{cashCollectedToday.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-300 font-medium block">
              Completed: <span className="font-bold text-emerald-400">{deliveredOrders.length}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Pending: <span className="font-bold text-amber-400">{pendingOrders.length}</span>
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 rounded-lg text-center transition-all ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Trips ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`py-2 rounded-lg text-center transition-all ${
              activeTab === 'delivered'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({deliveredOrders.length})
          </button>
        </div>
      </header>

      {/* Main Delivery Feed */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs font-medium">
            Fetching delivery tasks from store...
          </div>
        ) : (activeTab === 'active' ? pendingOrders : deliveredOrders).length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {activeTab === 'active' ? 'No active deliveries right now!' : 'No completed deliveries yet.'}
            </p>
            <p className="text-xs text-slate-500">
              {activeTab === 'active'
                ? 'New orders placed from POS counter will appear here in real time.'
                : 'Delivered orders will be archived here for your end-of-day cash settlement.'}
            </p>
          </div>
        ) : (
          (activeTab === 'active' ? pendingOrders : deliveredOrders).map((order) => {
            const isCash = order.paymentMethod === 'CASH';
            const isOut = order.deliveryStatus === 'OUT_FOR_DELIVERY';

            // Google Maps turn-by-turn navigation link
            const mapsAddress = encodeURIComponent(
              `${order.deliveryAddress || 'Sangli'}, Maharashtra, India`
            );
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsAddress}`;

            // Pre-formatted WhatsApp message
            const customerMsg = encodeURIComponent(
              `Namaskar ${order.customerName}! Your medicine order #${order.invoiceNumber} from Shree Ganesh Medical is on the way. ${
                isCash ? `Please keep ₹${order.grandTotal} cash ready.` : `Order is already prepaid online.`
              }`
            );
            const waUrl = `https://wa.me/${order.customerPhone ? '91' + order.customerPhone : ''}?text=${customerMsg}`;

            return (
              <div
                key={order._id}
                className={`bg-slate-800 rounded-2xl p-4 border transition-all ${
                  isOut
                    ? 'border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-slate-700/80'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
                  <span className="font-mono font-bold text-blue-400">#{order.invoiceNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      order.deliveryStatus === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : isOut
                        ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {order.deliveryStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Big Money Collection Indicator (Crucial for Rider) */}
                <div
                  className={`my-3 p-3 rounded-xl flex items-center justify-between font-black text-sm ${
                    isCash
                      ? 'bg-amber-500/15 border border-amber-500/50 text-amber-300'
                      : 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-4 h-4" />
                    <span>{isCash ? 'COLLECT CASH ON DELIVERY' : 'PREPAID ONLINE'}</span>
                  </div>
                  <span className="text-lg">₹{order.grandTotal}</span>
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-base text-white">{order.customerName}</p>
                  <div className="flex items-start space-x-1.5 text-slate-300 text-xs">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      {order.deliveryAddress || 'Customer Address (Sangli Local Delivery)'}
                    </p>
                  </div>
                </div>

                {/* Medicine Items List */}
                <div className="my-3 py-2 px-3 bg-slate-900/60 rounded-xl text-[11px] text-slate-400 border border-slate-700/40">
                  <span className="font-semibold text-slate-300 block mb-1">Medicines Package:</span>
                  <ul className="space-y-0.5">
                    {order.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="truncate pr-2">{it.medicineName}</span>
                        <span className="font-bold text-slate-200 shrink-0">x{it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Four Big 1-Thumb Action Buttons */}
                <div className="grid grid-cols-3 gap-2 my-3">
                  {/* Call Customer */}
                  <a
                    href={`tel:${order.customerPhone || '9822012345'}`}
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-xl flex flex-col items-center justify-center text-center font-bold text-xs transition-colors shadow-sm"
                  >
                    <Phone className="w-4 h-4 mb-1 text-emerald-400" />
                    <span>Call</span>
                  </a>

                  {/* WhatsApp Customer */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-xl flex flex-col items-center justify-center text-center font-bold text-xs transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 mb-1 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Google Maps Route */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-xl flex flex-col items-center justify-center text-center font-bold text-xs transition-colors shadow-sm"
                  >
                    <Navigation className="w-4 h-4 mb-1 text-blue-400" />
                    <span>Maps Route</span>
                  </a>
                </div>

                {/* Big Status Action Buttons */}
                {order.deliveryStatus !== 'DELIVERED' && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    {order.deliveryStatus !== 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => updateStatus(order._id, 'OUT_FOR_DELIVERY')}
                        disabled={updatingId === order._id}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wide shadow-md transition-colors flex items-center justify-center space-x-2"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Start Trip (Out for Delivery)</span>
                      </button>
                    )}

                    <button
                      onClick={() => updateStatus(order._id, 'DELIVERED')}
                      disabled={updatingId === order._id}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wide shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isCash ? `Collected ₹${order.grandTotal} & Mark Delivered` : 'Confirm Delivered'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Footer Navigation bar */}
      <footer className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
        Shree Ganesh Medical • Sangli Rider Dispatch Terminal
      </footer>
    </div>
  );
}
