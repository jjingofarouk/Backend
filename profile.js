const express = require('express');
const router = express.Router();

// Middleware to check if the user is authenticated (optional)
const authenticate = (req, res, next) => {
    // Your authentication logic here
    next();
};

// Profile update route
const profileRoutes = (db) => {
    router.put('/update-profile', authenticate, async (req, res) => {
        const { userId, name, email, phone } = req.body;

        try {
            // Update user in the database
            const [result] = await db.promise().query('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, userId]);
            
            if (result.affectedRows > 0) {
                return res.status(200).json({ message: 'Profile updated successfully.' });
            } else {
                return res.status(404).json({ message: 'User not found.' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error updating profile.' });
        }
    });

    return router;
};

module.exports = profileRoutes;
