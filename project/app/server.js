let axios = require("axios");
let express = require("express");
let app = express();
let apiFile = require("../env.json");
let { Pool } = require("pg");
let pool = new Pool(apiFile.db);
let apiKey = apiFile["api_key"]; 
let baseUrl = apiFile["api_url"]; 
let port = 3000;
let hostname = "localhost";
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Sending login.html");
  res.sendFile("public/login.html", { root: __dirname });
});

app.get("/getPhotos", (req, res) => {
  let rover = req.query.rover;
  let solDay = req.query.solday;
  const camera = req.query.camera || "navcam";
  
  //console.log(rover,solDay,apiKey)
  let url = `${baseUrl}rovers/${rover}/photos?sol=${solDay}&camera=${camera}&api_key=${apiKey}`;
  axios.get(url).then((response) => {
    //console.log("Received response:", response.data);
    res.json(response.data);
  }).catch(error => {
    console.log(error.message);
    let errorCode = parseInt(error.code);
    res.status(errorCode).json({"error":error.message});
  });
  console.log(`Sending request to: ${url}`);
});


let users = {}; //TODO: Replace with a proper database 
app.post("/createAccount", async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }

  try {
    let result = await pool.query(
      "INSERT INTO users (username, passwords) VALUES ($1, $2) RETURNING id",
      [username, password]
    );
    res.json({ message: "Account created successfully." });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: "Username already exists." });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }
  
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND passwords = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials." });
    } else {
      res.json({ message: "Login successful." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

