const { Server } = require("socket.io")
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function setupSocket(server) {

  const io = new Server(server, {
    connectionStateRecovery: {}
  });
  // open the database file
  const db = await open({
      filename: 'chat.db',
      driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        client_offset TEXT UNIQUE,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  io.on('connection', async (socket) => {
    console.log(`${socket.id} connected`);

    if (!socket.recovered) {
      try {
        const timeCutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
        const recentMessages = await db.all(
          'SELECT * FROM messages WHERE timestamp >= ? AND id > ? ORDER BY timestamp ASC',
          [timeCutoff.toISOString(), socket.handshake.auth.serverOffset || 0]
        );

        recentMessages.forEach(row => {
          socket.emit('chat message', row.username, row.content, row.id);
        });

      } catch (e) {
        // something went wrong
        console.error(e);
      }
    }

    socket.on('chat message', async (username, msg, client_offset, timeStamp, callback) => {
      let result;
      try {
        result = await db.run('INSERT INTO messages (username, content, client_offset, timestamp) VALUES (?, ?, ?, ?)', username, msg, client_offset, timeStamp);
      } catch (e) {
        if (e.errno === 19) {
          callback({ success: false, error: err.message });
        } else {
          console.error(e);
          callback({ success: false, error: 'An error occurred' });
        }
        return;
      }
      io.emit('chat message', username, msg, result.lastID);
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      console.log(`${socket.id}: disconnected`);
    });
  });
}

module.exports = { setupSocket };