import { Server } from 'socket.io';

let io = null;

export const initSocket = (server, clientOrigin) => {
  io = new Server(server, {
    cors: {
      origin: clientOrigin || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific order live tracking
    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`[Socket.IO] ${socket.id} joined order_${orderId}`);
    });

    socket.on('leave_order_room', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    // Delivery tracking live coordinate updates from partner app/client
    socket.on('delivery:push_location', (data) => {
      if (data && data.orderId) {
        emitDeliveryLocationUpdate(data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

// Real-time broadcast helpers
export const emitOrderCreated = (order) => {
  if (io) {
    io.emit('order:created', order);
  }
};

export const emitOrderStatusUpdate = (statusData) => {
  if (io) {
    if (statusData && statusData.saleId) {
      io.to(`order_${statusData.saleId}`).emit('order:status_updated', statusData);
    }
    io.emit('order:updated', statusData);
  }
};

export const emitDeliveryLocationUpdate = (data) => {
  if (io) {
    if (data && data.saleId) {
      io.to(`order_${data.saleId}`).emit('delivery:location_updated', data);
    }
    io.emit('delivery:location_updated', data);
  }
};

export const emitInventoryAlert = (alertData) => {
  if (io) {
    io.emit('inventory:alert', alertData);
  }
};
