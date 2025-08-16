let axios = require("axios");
let apiFile = require("../env.json");
let apiKey = apiFile["api_key"];
let baseUrl = apiFile["api_url"];
const path = require('path');
let port = 3000;
let hostname = "localhost";


let express = require("express");
const { createServer } = require("node:http");
const { startSocketConnection }  = require("./socket/socket.js");

const app = express();
const server = createServer(app);

startSocketConnection(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  console.log("Sending login.html");
  res.sendFile("public/login.html", { root: __dirname });
});

app.get("/getManifest", (req, res) => {
  let rover = req.query.rover;
  let url = `${baseUrl}manifests/${rover}?api_key=${apiKey}`;
  axios.get(url).then((response) => {
    //console.log("Received response manifest:", response.data.photo_manifest.photos);
    res.json(response.data.photo_manifest.photos);
  }).catch(error => {
    console.log(error.message);
    let errorCode = parseInt(error.code);
    res.status(errorCode).json({"error":error.message});
  });
  console.log(`Sending request to: ${url}`);
});

app.get("/getPhotos", (req, res) => {
  let rover = req.query.rover;
  let solDay = req.query.solday;
  let camera = req.query.camera || "navcam";

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

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

server.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

