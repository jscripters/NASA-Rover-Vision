let axios = require("axios");
let express = require("express");
let app = express();
let apiFile = require("../env.json");
let apiKey = apiFile["api_key"]; 
let baseUrl = apiFile["api_url"]; 
let port = 3000;
let hostname = "localhost";
app.use(express.static("public"));

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
app.post("/createAccount", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }
  if (users[username]) {
    return res.status(409).json({ error: "Username already exists." });
  }
  users[username] = { password };
  res.json({ message: "Account created successfully." });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  res.json({ message: "Login successful." });
});


app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

