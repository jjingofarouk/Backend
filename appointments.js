const express = require('express');
const mysql = require('mysql2');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your actual MySQL username
    password: 'FARjin123.!?', // Replace with your actual MySQL password
    database: 'my_login_app', // Replace with your actual database name
});

// Middleware to verify JWT and check user role
const verifyTokenAndRole = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);
        
        req.userId = decoded.id; // Store the user ID from the token
        
        try {
            const [user] = await db.promise().query('SELECT role FROM users WHERE id = ?', [req.userId]);
            req.userRole = user[0]?.role; // Store the user role (doctor or patient)
            next();
        } catch (error) {
            console.error('Error fetching user role:', error);
            res.sendStatus(500);
        }
    });
};

// Route: GET /appointments
router.get('/appointments', verifyTokenAndRole, async (req, res) => {
    try {
        let results;
        if (req.userRole === 'patient') {
            results = await db.promise().query(
                'SELECT id, appointment_date, doctor_id FROM appointments WHERE patient_id = ? AND status = ?',
                [req.userId, 'pending']
            );
        } else if (req.userRole === 'doctor') {
            results = await db.promise().query(
                'SELECT id, appointment_date, patient_id FROM appointments WHERE doctor_id = ? AND status = ?',
                [req.userId, 'pending']
            );
        } else {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        res.status(200).json({ appointments: results[0] });
    } catch (error) {
        console.error('Fetching appointments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Book appointment route (for patients only)
router.post('/book', verifyTokenAndRole, async (req, res) => {
    if (req.userRole !== 'patient') return res.status(403).json({ message: 'Only patients can book appointments.' });

    const { doctorId, date, time, reason, appointmentType, communicationMethod, notes } = req.body;

    if (!doctorId || !date || !time) {
        return res.status(400).json({ message: 'Doctor ID, date, and time are required.' });
    }

    const appointmentDate = new Date(`${date}T${time}`);

    try {
        const [result] = await db.promise().query(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, appointment_type, communication_method, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.userId, doctorId, appointmentDate, reason, appointmentType, communicationMethod, 'pending', notes]
        );
        res.status(201).json({ message: 'Appointment booked successfully', appointmentId: result.insertId });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Rebook appointment route
router.put('/rebook/:appointmentId', verifyTokenAndRole, async (req, res) => {
    const { appointmentId } = req.params;
    const { newDate, reason, appointmentType, communicationMethod } = req.body;

    try {
        const [result] = await db.promise().query(
            'UPDATE appointments SET appointment_date = ?, reason = ?, appointment_type = ?, communication_method = ? WHERE id = ? AND patient_id = ?',
            [newDate, reason, appointmentType, communicationMethod, appointmentId, req.userRole === 'patient' ? req.userId : null]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found or not owned by the user.' });
        }

        res.status(200).json({ message: 'Appointment rebooked successfully' });
    } catch (error) {
        console.error('Rebooking error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Cancel appointment route
router.delete('/cancel/:appointmentId', verifyTokenAndRole, async (req, res) => {
    const { appointmentId } = req.params;

    // Validate appointmentId
    if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID is required.' });
    }

    try {
        const [results] = await db.promise().query(
            'DELETE FROM appointments WHERE id = ? AND (patient_id = ? OR doctor_id = ?)',
            [appointmentId, req.userId, req.userId] // Ensure only the patient or doctor can cancel the appointment
        );

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'No appointments found to cancel.' });
        }

        res.status(200).json({ message: 'Appointment canceled successfully.' });
    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Check availability route
router.get('/availability', verifyTokenAndRole, async (req, res) => {
    const { doctorId, date } = req.query;

    try {
        const [results] = await db.promise().query(
            'SELECT * FROM appointments WHERE doctor_id = ? AND DATE(appointment_date) = ?',
            [doctorId, date]
        );
        res.status(200).json({ available: results.length === 0 });
    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Export the router
module.exports = router;
