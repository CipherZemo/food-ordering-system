const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connect=require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();
connect();
const app=express();

// Create HTTP server
const server = http.createServer(app);
// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CUSTOMER_FRONTEND_URL,
      process.env.KITCHEN_DASHBOARD_URL,
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Kitchen dashboard connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Kitchen dashboard disconnected:', socket.id);
  });
});


app.set('io', io);
app.use(cors());
app.use('/api/webhooks', require('./routes/webhookRoutes'));
// Webhook route MUST be before express.json() since Stripe needs raw body for signature verification
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/', apiLimiter);
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/kitchen', require('./routes/kitchenRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates`);
});
