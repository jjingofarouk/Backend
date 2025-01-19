app.post('/messages', async (req, res) => {
    const { chatId, senderId, message, attachmentUrl } = req.body;
  
    try {
      const [result] = await db.query(
        'INSERT INTO messages (chat_id, sender_id, message, attachment_url) VALUES (?, ?, ?, ?)',
        [chatId, senderId, message, attachmentUrl]
      );
  
      const newMessage = {
        id: result.insertId,
        chat_id: chatId,
        sender_id: senderId,
        message,
        attachment_url: attachmentUrl,
        created_at: new Date(),
      };
  
      res.status(201).json(newMessage);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error sending message' });
    }
  });
  app.get('/messages/:chatId', async (req, res) => {
    const { chatId } = req.params;
  
    try {
      const [messages] = await db.query(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        [chatId]
      );
  
      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching messages' });
    }
  });
  