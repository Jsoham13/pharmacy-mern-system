import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Attach Socket.IO
    initSocket(server);

    // 4. Start listening
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Pharmacy MERN Backend Server running on port ${PORT}`);
      console.log(`📡 Socket.IO Realtime Gateway active`);
      console.log(`🏥 Medical Shop: Shree Ganesh Medical, Sangli, MH`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
};

startServer();
