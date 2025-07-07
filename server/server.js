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
  'https://figma-photo-website-launch.onrender.com',
  'https://figma-photo-website-launch.onrender.com/socket.io'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-access-token'],
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  },
  allowEIO3: true, // For backward compatibility
  path: '/socket.io',
  serveClient: true
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

const port = process.env.PORT || 3002;

// Connect Database
connectDB();

// Init Middleware
// app.use(cors()); // Moved to the top of the file to handle pre-flight requests
app.use(express.json({ extended: false }));

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

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/whereby', require('./routes/whereby'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/counselors', require('./routes/counselors'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bank', require('./routes/bank'));

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

  socket.on('send-message', async (data) => {
    console.log('[send-message] Received data:', data);
    try {
      const senderId = socket.userId;
      const { receiver, content } = data;

      if (!receiver || !content) {
        console.log('[send-message] Missing receiver or content.');
        return socket.emit('message-error', { message: 'Missing receiver or content.' });
      }

      console.log(`[send-message] Creating message from sender: ${senderId} to receiver: ${receiver}`);
      let message = new Message({ sender: senderId, receiver, content });
      
      console.log('[send-message] Attempting to save message to database...');
      await message.save();
      console.log('[send-message] Message saved successfully. Document:', message);

      // Populate sender and receiver details for the client
      message = await message.populate('sender', 'name');
      message = await message.populate('receiver', 'name');
      console.log('[send-message] Message populated with user names.');

      // Send the message to the recipient if they are online
      const recipientSocketId = users[receiver];
      if (recipientSocketId) {
        console.log(`[send-message] Recipient ${receiver} is online. Sending message to socket ${recipientSocketId}`);
        io.to(recipientSocketId).emit('receive-message', message);
      }

      // Also send the message back to the sender to confirm it was sent and saved
      console.log('[send-message] Sending confirmation message back to sender.');
      socket.emit('receive-message', message);

    } catch (error) {
      console.error('[send-message] Error saving or sending message:', error);
      socket.emit('message-error', { message: error.message || 'Failed to process message.' });
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

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
