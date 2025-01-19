const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authentication');
const db = require('../db');  // Assuming you have a db.js file to handle database connection

// Example route to save vital signs
router.post('/vitals', authenticateJWT, async (req, res) => {
  const { temperature, heartRate, bloodPressure, spO2, respiratoryRate, weight, bloodGlucose, notes } = req.body;
  const user_id = req.user.id; // Get the user_id from JWT token (authenticated user)

  try {
    // Insert the vital signs into the database
    const result = await db.query('INSERT INTO vital_signs SET ?', {
      user_id,          // Associate vital signs with the logged-in user
      temperature,
      heartRate,
      bloodPressure,
      spO2,
      respiratoryRate,
      weight,
      bloodGlucose,
      notes,
      timestamp: new Date(),
    });

    res.status(200).json({ 
      message: 'Vital signs saved successfully',
      vitalSign: {     // Optionally return the saved vital signs
        user_id,
        temperature,
        heartRate,
        bloodPressure,
        spO2,
        respiratoryRate,
        weight,
        bloodGlucose,
        notes,
        timestamp: new Date(),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save vital signs' });
  }
});

module.exports = router;
