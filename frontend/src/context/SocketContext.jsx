import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeDeliveryUpdate, setActiveDeliveryUpdate] = useState(null);

  useEffect(() => {
    // Connect to same origin in browser (proxied by Vite to :5000 in dev)
    const socketInstance = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to live pharmacy server:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from live pharmacy server');
      setIsConnected(false);
    });

    // Real-time Event: Order Created
    socketInstance.on('order:created', (data) => {
      addNotification({
        id: Date.now(),
        type: 'ORDER_CREATED',
        title: 'New Order Received',
        message: `Invoice #${data.invoiceNumber} for ${data.customerName || 'Cash'} (₹${data.grandTotal})`,
        time: new Date(),
        data,
      });
    });

    // Real-time Event: Order Status Updated
    socketInstance.on('order:updated', (data) => {
      addNotification({
        id: Date.now(),
        type: 'ORDER_UPDATED',
        title: 'Order Status Update',
        message: `Order #${data.invoiceNumber || data.saleId} status: ${data.deliveryStatus || data.paymentStatus}`,
        time: new Date(),
        data,
      });
    });

    // Real-time Event: Delivery Location Changed
    socketInstance.on('delivery:location_updated', (data) => {
      setActiveDeliveryUpdate(data);
    });

    // Real-time Event: Inventory Alert (Low stock / Out of stock)
    socketInstance.on('inventory:alert', (alert) => {
      addNotification({
        id: Date.now(),
        type: 'LOW_STOCK',
        title: '⚠️ Low Stock Alert',
        message: `${alert.medicineName} (Batch: ${alert.batchNumber}) is low! Only ${alert.availableQuantity} left.`,
        time: new Date(),
        alert,
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
  };

  const clearNotifications = () => setNotifications([]);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        activeDeliveryUpdate,
        clearNotifications,
        dismissNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
