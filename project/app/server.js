let axios = require("axios");
let apiFile = require("../env.json");
let apiKey = apiFile["api_key"];
let baseUrl = apiFile["api_url"];
const path = require('path');
let port = 3000;
let hostname = "localhost";


let express = require("express");
const { createServer } = require("node:http");
const { setupSocket } = require("./socket/socket.js");

const app = express();
const server = createServer(app);
setupSocket(server);

app.use(express.static("public"));

app.get("/getPhotos", (req, res) => {
  let rover = req.query.rover;
  let solDay = req.query.solday;
  let camera = "navcam"
  //console.log(rover,solDay,apiKey)
  let url = `${baseUrl}rovers/${rover}/photos?sol=${solDay}&camera=${camera}&api_key=${apiKey}`;
  axios.get(url).then((response) => {
    //console.log("Received response:", response.data);
    res.json(response.data);
  }).catch(error => {
    console.log(error.response.data);
    let errorCode = parseInt(error.response.data.cod);
    res.status(errorCode).json({"error":error.response.data.message});
  });
  console.log(`Sending request to: ${url}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

