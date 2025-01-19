// Required dependencies
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // assuming you have a MySQL connection pool setup
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;

  // Validate input
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  // Validate role
  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Allowed roles are patient or doctor.' });
  }

  try {
    // Check if the user already exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password and insert the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      email,
      hashedPassword,
      role,
    ]);

    // Generate JWT token
    const token = jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token, role });
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

module.exports = router;
