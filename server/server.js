const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');

const app = express();

// CORS configuration must be one of the first middleware
require('dotenv').config({ override: true });
console.log('>>>>> CLIENT_URL on server start:', process.env.CLIENT_URL);
const allowedOrigins = [
  'https://quluub.nikahnavigator.com',
  'http://localhost:8080',
  'http://localhost:5173', // Vite default
  'http://localhost:3000', // CRA default
  process.env.RENDER_EXTERNAL_URL || 'https://figma-photo-website-launch.onrender.com',
  process.env.RENDER_EXTERNAL_URL?.replace('http://', 'wss://') || 'wss://figma-photo-website-launch.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // For production, allow any origin from quluub.nikahnavigator.com
    if (process.env.NODE_ENV === 'production' && origin?.includes('quluub.nikahnavigator.com')) {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-access-token'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle CORS pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Connect Database
connectDB();

// Init Middleware
// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Request Logger] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/counselors', require('./routes/counselors'));
app.use('/api/requests', require('./routes/requests'));
const stripeRoutes = require('./routes/stripe');
const paystackRoutes = require('./routes/paystack');
app.use('/api/stripe', stripeRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/zoom', require('./routes/zoom'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/whereby', require('./routes/whereby'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/complaints', require('./routes/complaints'));


const server = http.createServer(app);

// Use Render's PORT environment variable
const PORT = process.env.PORT || 3002;

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-access-token'],
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    upgradeTimeout: 10000
  },
  allowEIO3: true, // For backward compatibility,
  path: '/socket.io',
  serveClient: true,
  allowRequest: (req, callback) => {
    // Allow all requests in production
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, allowedOrigins.includes(req.headers.origin));
    }
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server listening on ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});


io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user || decoded;
      return next();
    } catch (err) {
      // Pass a more descriptive error to the client
      return next(new Error(`Authentication error: ${err.message}`));
    }
  } else {
    // Pass a more descriptive error to the client
    return next(new Error('Authentication error: Token not provided'));
  }
});

let users = {}; // { userId: socketId }

// Middleware to attach io and userSocketMap to req
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = users;
  next();
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

io.on('connection', (socket) => {
  // The user is authenticated by the io.use middleware, and socket.user is available.
  const userId = socket.user.id;

  if (!userId) {
    console.error('Connection rejected: User ID not found in socket context.');
    return socket.disconnect();
  }

  users[userId] = socket.id;
  socket.userId = userId; // Attach userId for efficient lookup on disconnect
  console.log(`User ${userId} connected and mapped to socket ${socket.id}`);

  socket.on('send-message', (message) => {
    // The message is already saved to the DB via the POST /api/messages route.
    // This event is just to relay the message to the recipient in real-time.
    const recipientId = message.receiver._id || message.receiver;
    const recipientSocketId = users[recipientId];

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', message);
    } else {
      // Optional: Handle case where user is not online
      console.log(`Recipient ${recipientId} is not connected.`);
    }
  });

  // Video Call Signaling Events
  socket.on('start-video-call', ({ to, roomUrl, callerName }) => {
    const recipientSocketId = users[to];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incoming-video-call', { roomUrl, callerName });
    }
  });

  socket.on('video-call-hang-up', ({ to }) => {
    const recipientSocketId = users[to];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('video-call-ended');
    }
  });

  // Real-time session updates for the dashboard
  socket.on('session-booked', (newSession) => {
    // Assuming the session object contains the user ID
    const userSocketId = users[newSession.user];
    if (userSocketId) {
      io.to(userSocketId).emit('session-booked', newSession);
    }
  });

  socket.on('session-updated', (updatedSession) => {
    // Assuming the session object contains the user ID
    const userSocketId = users[updatedSession.user];
    if (userSocketId) {
      io.to(userSocketId).emit('session-updated', updatedSession);
    }
  });

  socket.on('disconnect', () => {
    // Use the stored userId for efficient cleanup
    if (socket.userId && users[socket.userId] === socket.id) {
      console.log(`User ${socket.userId} disconnected and unmapped from socket ${socket.id}`);
      delete users[socket.userId];
    } else {
      console.log(`Socket ${socket.id} disconnected without a user mapping.`);
    }
  });
});


