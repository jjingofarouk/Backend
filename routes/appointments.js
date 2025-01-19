const express = require('express');
const router = express.Router();

// Route to book an appointment
router.post('/', async (req, res) => {
  const { patientId, doctorId, date, time, reason } = req.body;
  const db = req.app.get('db'); // Access the database connection from the app

  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, date, time, reason) VALUES (?, ?, ?, ?, ?)',
      [patientId, doctorId, date, time, reason]
    );
    res.status(201).json({ message: 'Appointment booked successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to book appointment.' });
  }
});

module.exports = router;
