const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify doctor role
const verifyDoctor = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Unauthorized' });

    if (decoded.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.userId = decoded.id;
    next();
  });
};

// Get doctor's availability
router.get('/availability', verifyDoctor, async (req, res) => {
  try {
    const query = 'SELECT isAvailable FROM doctors WHERE user_id = ?';
    const [result] = await req.db.query(query, [req.userId]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('Availability fetched:', result[0].isAvailable);
    res.json({ isAvailable: result[0].isAvailable });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error fetching availability', error: error.message });
  }
});

// Toggle doctor's availability
router.post('/availability/toggle', verifyDoctor, async (req, res) => {
  try {
    const query = 'UPDATE doctors SET isAvailable = NOT isAvailable WHERE user_id = ?';
    const [result] = await req.db.query(query, [req.userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('Availability toggled for user:', req.userId);
    res.status(200).json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ message: 'Error toggling availability', error: error.message });
  }
});

// Get all available doctors (for patients)
router.get('/available-doctors', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, d.specialty 
      FROM users u 
      JOIN doctors d ON u.id = d.user_id 
      WHERE d.isAvailable = 1`;
    const [doctors] = await req.db.query(query);

    console.log('Available doctors fetched:', doctors);
    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ message: 'Error fetching available doctors', error: error.message });
  }
});

// Create an appointment
router.post('/appointments', async (req, res) => {
  const { doctorId, patientId, appointmentTime } = req.body;

  try {
    const query = `
      INSERT INTO appointments (doctor_id, patient_id, appointment_time)
      VALUES (?, ?, ?)`;
    
    const [result] = await req.db.query(query, [doctorId, patientId, appointmentTime]);
    
    res.status(201).json({ message: 'Appointment created successfully', appointmentId: result.insertId });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
});

// Get all appointments for a doctor
router.get('/appointments', verifyDoctor, async (req, res) => {
  try {
    const query = `
      SELECT a.id, u.name AS patient_name, a.appointment_time, a.status 
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.id 
      JOIN users u ON p.user_id = u.id 
      WHERE a.doctor_id = ?`;
    
    const [appointments] = await req.db.query(query, [req.userId]);

    console.log('Appointments fetched for doctor:', req.userId);
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

module.exports = router;
