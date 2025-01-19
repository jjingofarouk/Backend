app.post('/appointments/rebook', async (req, res) => {
    const { appointmentId, newDate, newTime, newReason, newType, newMethod } = req.body;
  
    try {
      const [result] = await db.execute(
        `UPDATE appointments 
         SET date = ?, time = ?, reason = ?, appointment_type = ?, communication_method = ? 
         WHERE id = ?`,
        [newDate, newTime, newReason, newType, newMethod, appointmentId]
      );
  
      if (result.affectedRows > 0) {
        res.json({ message: 'Appointment rebooked successfully' });
      } else {
        res.status(404).json({ message: 'Appointment not found' });
      }
    } catch (error) {
      console.error('Error rebooking appointment:', error);
      res.status(500).json({ message: 'Failed to rebook appointment' });
    }
  });
  