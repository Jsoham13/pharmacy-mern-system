import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  Radio,
  Navigation,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { saleService } from '../services/api';
import { useSocket } from '../context/SocketContext';

// Simulated coordinates along Miraj-Sangli road
const ROUTE_WAYPOINTS = [
  { lat: 16.8524, lng: 74.5815, name: 'Store: Shivaji Chowk, Sangli' },
  { lat: 16.8510, lng: 74.5950, name: 'Vishrambag Main Road' },
  { lat: 16.8420, lng: 74.6180, name: 'Wanless Hospital Corner' },
  { lat: 16.8280, lng: 74.6400, name: 'Miraj Mission Compound' },
];

export default function LiveDelivery() {
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const { socket, isConnected, activeDeliveryUpdate } = useSocket();

  const fetchOrders = async () => {
    try {
      const res = await saleService.getSales({ orderType: 'DELIVERY' });
      const orders = res.data.sales || [];
      setDeliveryOrders(orders);
      if (orders.length > 0 && !selectedOrder) {
        setSelectedOrder(orders[0]);
      }
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update live when socket event comes in
  useEffect(() => {
    if (activeDeliveryUpdate && selectedOrder) {
      if (activeDeliveryUpdate.saleId === selectedOrder._id) {
        setSelectedOrder((prev) => ({
          ...prev,
          deliveryLocation: activeDeliveryUpdate.location,
          deliveryStatus: activeDeliveryUpdate.deliveryStatus || prev.deliveryStatus,
        }));
      }
    }
  }, [activeDeliveryUpdate]);

  const updateStatus = async (status) => {
    if (!selectedOrder) return;
    try {
      const res = await saleService.updateDeliveryStatus(selectedOrder._id, {
        deliveryStatus: status,
      });
      setSelectedOrder(res.data.sale);
      fetchOrders();
    } catch (err) {
      alert('Failed to update delivery status: ' + err.message);
    }
  };

  // Simulate rider live movement across Sangli with Socket.IO
  const startGpsSimulation = async () => {
    if (!selectedOrder || simulating) return;
    setSimulating(true);

    for (let i = 0; i < ROUTE_WAYPOINTS.length; i++) {
      const wp = ROUTE_WAYPOINTS[i];
      try {
        const nextStatus =
          i === 0
            ? 'DISPATCHED'
            : i === ROUTE_WAYPOINTS.length - 1
            ? 'DELIVERED'
            : 'OUT_FOR_DELIVERY';

        await saleService.updateDeliveryStatus(selectedOrder._id, {
          deliveryStatus: nextStatus,
          latitude: wp.lat,
          longitude: wp.lng,
          remarks: wp.name,
        });

        // Delay to simulate rider movement
        await new Promise((r) => setTimeout(r, 2500));
      } catch (e) {
        console.error(e);
      }
    }

    setSimulating(false);
    fetchOrders();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Live Delivery Radar (Socket.IO Real-Time)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time GPS Telemetry, Home Delivery Dispatch & Rider Route Tracking
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{isConnected ? 'Socket.IO Gateway Live' : 'Disconnected'}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Queue (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold uppercase tracking-wide text-slate-700">
              Active Deliveries ({deliveryOrders.length})
            </h3>
            <button onClick={fetchOrders} className="text-blue-600 hover:underline">
              Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading delivery orders...</div>
            ) : deliveryOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No home delivery orders yet. Select "Home Delivery" during POS billing.
              </div>
            ) : (
              deliveryOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedOrder?._id === order._id ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-blue-600">{order.invoiceNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        order.deliveryStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.deliveryStatus === 'OUT_FOR_DELIVERY'
                          ? 'bg-amber-100 text-amber-700 animate-pulse'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.deliveryStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{order.customerName}</p>
                  <p className="text-slate-500 text-[11px] truncate">
                    {order.deliveryAddress || 'Sangli Local Area'}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-slate-400 text-[10px]">
                    <span>₹{order.grandTotal}</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Real-time Telemetry & Map Radar (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <>
              {/* Order Banner & Status Progress */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Order Tracking
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Invoice #{selectedOrder.invoiceNumber} • ₹{selectedOrder.grandTotal}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${selectedOrder.customerPhone || '9822012345'}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer</span>
                    </a>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  {['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((st, i) => {
                    const stepIdx = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(
                      selectedOrder.deliveryStatus
                    );
                    const isDone = i <= stepIdx;
                    return (
                      <div
                        key={st}
                        className={`p-2 rounded-lg font-bold border transition-colors ${
                          isDone
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </div>
                    );
                  })}
                </div>

                {/* Customer Address Details */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1 text-slate-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Destination Address:</span>
                  </div>
                  <p className="text-slate-800 font-medium pl-5">
                    {selectedOrder.deliveryAddress || 'Shivaji Nagar, Sangli, Maharashtra'}
                  </p>
                  <p className="text-slate-500 pl-5 text-[11px]">
                    Recipient: {selectedOrder.customerName} ({selectedOrder.customerPhone || 'N/A'})
                  </p>
                </div>

                {/* Quick Status Control Buttons for Delivery Boy */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-semibold text-slate-600">Quick Status Dispatch:</span>
                  <button
                    onClick={() => updateStatus('PREPARING')}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                  >
                    Preparing Medicines
                  </button>
                  <button
                    onClick={() => updateStatus('OUT_FOR_DELIVERY')}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-medium"
                  >
                    Out for Delivery
                  </button>
                  <button
                    onClick={() => updateStatus('DELIVERED')}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-medium"
                  >
                    Mark Delivered
                  </button>
                </div>
              </div>

              {/* Real-time Map Radar Simulation Canvas */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700">
                      Live GPS Telemetry (Sangli - Miraj Highway)
                    </h3>
                  </div>

                  <button
                    onClick={startGpsSimulation}
                    disabled={simulating}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{simulating ? 'Simulating Live Rider Movement...' : 'Simulate Live Rider GPS Run'}</span>
                  </button>
                </div>

                {/* Simulated Radar Visualizer */}
                <div className="h-64 rounded-xl bg-slate-900 p-4 relative overflow-hidden flex flex-col justify-between text-white border border-slate-800">
                  {/* Subtle Grid Radar Background */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, #3b82f6 1px, transparent 1px), radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Header in radar */}
                  <div className="relative z-10 flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-blue-400">Sangli City Medical Delivery Grid</span>
                      <p className="text-[10px] text-slate-400">
                        Latitude: {selectedOrder.deliveryLocation?.latitude || 16.8524} | Longitude:{' '}
                        {selectedOrder.deliveryLocation?.longitude || 74.5815}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                        Live WebSockets
                      </span>
                    </div>
                  </div>

                  {/* Route Nodes */}
                  <div className="relative z-10 py-6 px-4">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 -translate-y-1/2 z-0" />
                      {ROUTE_WAYPOINTS.map((wp, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center font-bold text-[10px] shadow-lg shadow-blue-500/50">
                            {idx + 1}
                          </div>
                          <span className="text-[9px] text-slate-300 mt-1 max-w-[80px] text-center font-medium">
                            {wp.name.split(',')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Active Status Footer */}
                  <div className="relative z-10 bg-slate-800/80 backdrop-blur rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span className="font-semibold text-slate-200">
                        Rider Current Location: {selectedOrder.deliveryLocation ? 'En-route on Miraj Road' : 'At Pharmacy Counter'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last ping: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select an order from the list on the left to inspect real-time radar telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
