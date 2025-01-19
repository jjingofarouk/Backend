app.post('/chats', async (req, res) => {
    const { patientId, doctorId } = req.body;
  
    try {
      // Check if chat exists
      const [existingChat] = await db.query(
        'SELECT * FROM chats WHERE patient_id = ? AND doctor_id = ?',
        [patientId, doctorId]
      );
  
      if (existingChat) {
        return res.status(200).json(existingChat);
      }
  
      // Create new chat
      const [result] = await db.query(
        'INSERT INTO chats (patient_id, doctor_id) VALUES (?, ?)',
        [patientId, doctorId]
      );
  
      const newChat = {
        id: result.insertId,
        patient_id: patientId,
        doctor_id: doctorId,
      };
  
      res.status(201).json(newChat);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error creating chat' });
    }
  });
  