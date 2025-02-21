const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const socket = require('./socket');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize socket
socket.init(io);

// Middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests - move this BEFORE routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers
  });
  next();
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/attendance-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Import routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');
const attendanceRoutes = require('./routes/attendance');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/class', classRoutes);
app.use('/api/attendance', attendanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404
app.use((req, res) => {
  console.log('404 Not Found:', req.path);
  res.status(404).json({ message: 'Route not found' });
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('attendanceUpdate', async (data) => {
    console.log('Server received attendance update:', data);
    
    // Broadcast to all connected clients
    io.emit('attendanceUpdate', {
      ...data,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- /test');
  console.log('- /api/auth/*');
  console.log('- /api/class/*');
  console.log('- /api/attendance/*');
}); 