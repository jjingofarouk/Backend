const express = require('express');
const router = express.Router();
const db = require('../db');

// Route to get available doctors
router.get('/available', async (req, res) => {
  try {
    // Fetch only relevant fields for doctors marked as available
    const [doctors] = await db.query('SELECT id, name, specialty FROM doctors WHERE available = TRUE');

    // Handle case where no doctors are available
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'No doctors are currently available for consultation.' });
    }

    // Return the available doctors
    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching available doctors:', err);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
});

module.exports = router;
