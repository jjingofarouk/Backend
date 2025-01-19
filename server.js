const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');

// Import routes
const vitalsRoutes = require('./routes/vitals');
const appointmentsRoutes = require('./routes/appointments');
const doctorsRoutes = require('./routes/doctors');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow any origin for development; restrict this in production!
  },
});

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// MySQL Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

app.set('db', pool);

// Utility to get local IP for logging
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let address of iface) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost';
}

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user; // Attach user info to request
    next();
  });
};

app.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body; // Removed phoneNumber

  // Validate input fields
  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password and save the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [insertResult] = await pool.query(
      'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)', // Removed phone_number
      [email, hashedPassword, fullName]
    );

    // Generate JWT token
    const token = jwt.sign({ id: insertResult.insertId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User created successfully', token });
  } catch (err) {
    console.error('Error in /signup:', err.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
});



// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error in /login:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Use Routes
app.use('/vitals', authenticateToken, vitalsRoutes);
app.use('/api/appointments', authenticateToken, appointmentsRoutes);
app.use('/api/doctors', authenticateToken, doctorsRoutes);

// Socket.IO Event Handlers
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email}`);

  socket.on('joinChat', ({ chatId }) => {
    socket.join(chatId);
    console.log(`User joined chat ${chatId}`);
  });

  socket.on('sendMessage', (message) => {
    io.to(message.chat_id).emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start the server
const localIp = getLocalIp();
server.listen(port, () => {
  console.log(`Server running at http://${localIp}:${port}`);
});
