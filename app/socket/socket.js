const { Server } = require("socket.io")
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let pollActive = false;
let pollStartTime;
let pollDuration;
let nextPollStartTime;
let io;
let db;
let pollWinner

function getResult(){
  return pollWinner;
}

function setResult(value){
  pollWinner=value;
}
async function setupSocket(server) {
  io = new Server(server, { connectionStateRecovery: {} });

  db = await open({
    filename: 'app.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        client_offset TEXT UNIQUE,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      day TEXT,
      rover TEXT,
      camera TEXT,
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
          socket.emit('chat message', row.userId, row.content, row.id);
        });

      } catch (e) {
        console.error(e);
      }
    }

    if (pollActive) {
      const remaining = getTimeLeftInPoll();
      if (remaining > 0)
        socket.emit("pollOpen", remaining / 1000);
      else
        socket.emit("pollClosed", getTimeUntilNextPoll());
    } else {
      socket.emit("pollClosed", getTimeUntilNextPoll());
    }

    socket.on('chat message', async (userId, msg, client_offset, timeStamp, ack) => {
    if (!userId || !msg || !client_offset || !timeStamp) {
      console.warn('Missing one or more parameters:', { userId, msg, client_offset, timeStamp });
      if (typeof ack === 'function') {
        ack({ success: false, error: 'Invalid parameters received' });
      }
      return;
    }

    try {
      const result = await db.run(
        'INSERT INTO messages (userId, content, client_offset, timestamp) VALUES (?, ?, ?, ?)',
        userId, msg, client_offset, timeStamp
      );
      io.emit('chat message', userId, msg, result.lastID);

      if (typeof ack === 'function') {
        ack({ success: true });
      }
    } catch (e) {
      if (e.errno === 19) { // UNIQUE constraint failed
        console.log('Duplicate message. Sending failure ack');
        if (typeof ack === 'function') {
          ack({ success: false, error: 'Duplicate message' });
        }
      } else {
        console.error('DB error:', e);
        if (typeof ack === 'function') {
          ack({ success: false, error: 'Server error' });
        }
      }
    }
  });


    socket.on('userVote', async (voteData, ack) => {
      if (typeof ack !== 'function') {
        ack = () => {};
      }

      try {
        const { userId, dayValue, roverValue, cameraValue } = voteData;

        if (!userId || !dayValue || !roverValue || !cameraValue) {
          console.warn("Incomplete vote received, ignoring:", voteData);
          return ack({ success: false, error: 'Missing vote parameters' });
        }

        const userVoteRecord = await db.get(
          `SELECT * FROM votes WHERE userId = ?`,
          [userId]
        );

        if (userVoteRecord) {
          return ack({ success: false, error: 'User has already voted' });
        }

        await db.run(
          `INSERT INTO votes (userId, day, rover, camera) VALUES (?, ?, ?, ?)`,
          [userId, dayValue, roverValue, cameraValue]
        );

        return ack({ success: true });

      } catch (err) {
        console.error('Vote DB error:', err);
        return ack({ success: false, error: 'Database error' });
      }
    });

      socket.on('disconnect', () => {});
    });

  return io;
}

async function startVotingSession(allocatedTime) {
  pollActive = true;
  pollStartTime = Date.now();
  pollDuration = allocatedTime;

  let result = null;

  await db.run(`DELETE FROM votes`);
  io.emit("pollOpen", allocatedTime / 1000);

  await new Promise(resolve => setTimeout(resolve, allocatedTime));

  pollActive = false;
  result = await getPollWinner('votes', 'rover', 'day', 'camera');

  nextPollStartTime = Date.now() + 10 * 60 * 1000;
  io.emit("pollClosed", getTimeUntilNextPoll());
  setResult(result)

  return result;
}

async function getPollWinner(tableName, columnName , day, cameraName) {
  const cols = await db.all(`PRAGMA table_info(${tableName});`);
  const colNames = cols.map(c => c.name);

  if (!colNames.includes(columnName)) {
    throw new Error(`Column ${columnName} does not exist in ${tableName}`);
  }


  const row = await db.get(
    `SELECT ${columnName}, ${day}, ${cameraName} , COUNT(*) as count
     FROM ${tableName}
     GROUP BY ${columnName}
     ORDER BY count DESC
     LIMIT 1`
  );
  return row;
}

async function startVotingCycle() {
  while (true) {
    await startVotingSession(1 * 60 * 10000);
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
  }
}

async function startSocketConnection(server) {
  await setupSocket(server);
  startVotingCycle();
}

function broadcastPollState() {
  if (pollActive) {
    io.emit("pollOpen", getTimeLeftInPoll);
  } else {
    io.emit("pollClosed", getTimeUntilNextPoll);
  }
}

function getTimeUntilNextPoll() {
  if (pollActive) return null;
  const remaining = nextPollStartTime - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

function getTimeLeftInPoll() {
  if (!pollActive) return null;
  const elapsed = Date.now() - pollStartTime;
  const remaining = Math.max(0, pollDuration * 1000 - elapsed);
  return Math.floor(remaining / 1000);
}

module.exports = { startSocketConnection,getResult,setResult };