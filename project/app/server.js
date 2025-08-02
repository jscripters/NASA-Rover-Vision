let axios = require("axios");
let express = require("express");
let app = express();
let apiFile = require("../env.json");
let apiKey = apiFile["api_key"]; 
let baseUrl = apiFile["api_url"]; 
let port = 3000;
let hostname = "localhost";
let base_api_Url = "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?";
app.use(express.static("public"));

app.get("/", (req, res) => {
  console.log("Sending login.html");
  res.sendFile("public/login.html", { root: __dirname });
});

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
    console.log(error.message);
    let errorCode = parseInt(error.code);
    res.status(errorCode).json({"error":error.message});
  });
  console.log(`Sending request to: ${url}`);
});


// Endpoint to fetch data from NASA API based on query parameters
app.get("/api", async (req, res) => {
    const sol = req.query.sol || 100; // Default to sol 100 if not provided
    const page = req.query.page; // Default to page 1 if not
    const camera = req.query.camera || "navcam"; // Default to camera NAVCAM if not provided
    const url = `${base_api_Url}sol=${sol}&page=${page}&camera=${camera}&api_key=${apiKey}`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching data from NASA API:", error);
        res.status(500).send("Error fetching data from NASA API");
    }
})

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

