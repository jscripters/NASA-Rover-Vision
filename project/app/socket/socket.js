const { Server } = require("socket.io")
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let pollActive = false;
let pollStartTime = false;
let pollDuration= false;

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
        console.error(e);
      }
    }

    if (pollActive) {
      const elapsed = Date.now() - pollStartTime;
      const remaining = Math.max(0, pollDuration - elapsed);

      if (remaining > 0) {
        socket.emit("pollOpen");
      } else {
        socket.emit("pollClosed");
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

    socket.on('userVote', async (voteData) => {
      try {
        const { userId, dayInput, roverInput, cameraInput } = voteData;

        if (!userId || !dayInput || !roverInput || !cameraInput) {
          return;
        }

        const existingVote = await db.get(
          `SELECT * FROM votes WHERE userId = ?`,
          [userId]
        );

        if (existingVote) {
          return callback({ success: false, error: 'User has already voted' });
        }

        await db.run(`INSERT INTO votes (userId, day, rover, camera) VALUES (?, ?, ?, ?)`, [userId, dayInput, roverInput, cameraInput]);
        callback({success: true})

      } catch (err) {
        return callback({ success: false, error: 'Database error' });
      }
    });

    socket.on('disconnect', () => {});
  });
}

function startVotingSession(allocatedTime) {
  pollActive = true;
  pollStartTime = Date.now();
  pollDuration = allocatedTime;

  let result = null;

  io.emit("pollOpen");

  setTimeout(async () => {
    pollActive = false;
    result = await getPollWinner();
    io.emit("pollClosed")
  });
}

module.exports = { setupSocket };