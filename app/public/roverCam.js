const userIdRaw = sessionStorage.getItem('username');
if (!userIdRaw) {
  alert('You are not logged in.');
  window.location.href = 'login.html';
}

userId = userIdRaw.trim();

const userColors = {};
const socket = io({
  auth: {
    serverOffset: 0
  },
  // enable retries
  ackTimeout: 10000,
  retries: 3,
});

let counter = 0;
let paused = false;
let pollDuration = 0;
let isPollActive = false;

const pollTimerElm = document.getElementById("poll-timer");
const secondsElm   = document.getElementById("seconds-left");

let button = document.getElementById("submit");
let images = document.getElementById("photos");
let nextButton = document.getElementById("next");
let prevButton = document.getElementById("previous");
let timelapseButton = document.getElementById("timelapse");
let pauseButton   = document.getElementById("pause-main");
let cameraSelect = document.getElementById("cameraSelect");
let cameraOptions = document.getElementById("camera");
let generalMsg = document.getElementById("errors");
let postFinding = document.getElementById("findingDesc");
let slider  = document.getElementById("speedRange");
let speed = slider.value;
let descSubmit = document.getElementById("desc-submit");

cameraSelect.hidden = true;
button.hidden=true;
//postFinding.hidden = true;

let recContainer = document.getElementById("add");
function addDayToRecTable(day) {
  let addSolDay = document.createElement("p");
  addSolDay.textContent = day;
  recContainer.appendChild(addSolDay);
}

function addCamera(camArr) {
  for (let i = 0; i < camArr.length; i++) {
    let camEntry = document.createElement("option");
    camEntry.value = camArr[i];
    camEntry.textContent = camArr[i];
    cameraOptions.appendChild(camEntry);
  }
}

function getManifest(camArr, rover) {
  let url = `/getManifest?rover=${rover}`;
  fetch(url).then((response) => response.json())
    .then((body) => {
      let manifestLen = body.length;
      //console.log(body);
      for (let i = 0; i < manifestLen; i++) {
        if (body[i].total_photos >= 300) {
          addDayToRecTable(body[i].sol);
        }
        camArr[body[i].sol]=body[i].cameras;
      }
      //console.log(camArr)
    }).catch(error => console.log(error));
}

let currentSrc = 0;
let isIntervalOn = false;
let interval;

function timelapse() {
  if(isIntervalOn == false){
    interval = setInterval(function () {
      getNextPhotos();
    }, speed);
    isIntervalOn = true;
  }
}

function stopInterval() {
  clearInterval(interval);
  isIntervalOn = false;
}

function getNextPhotos() {
  if (currentSrc < photosArr.length) {
    currentSrc += 1;
    if(photosArr[currentSrc] == undefined){
      currentSrc=0;
    }
    images.src = photosArr[currentSrc];
  }
}

function getPrevPhotos() {
  if (currentSrc > 0) {
    currentSrc -= 1;
    if(photosArr[currentSrc] == undefined){
      currentSrc=0;
    }
    images.src = photosArr[currentSrc];
  }
}

function submit(srcArr) {
  stopInterval();
  let dayInput = document.getElementById("day").value;
  let roverInput = document.getElementById("rover").value;
  let cameraInput = document.getElementById("camera").value;
  if(cameraInput == ""){
    generalMsg.textContent = "please select a camera";
  }else{
    let url = `/getPhotos?solday=${dayInput}&camera=${cameraInput}&rover=${roverInput}`;
    fetch(url).then((response) => response.json())
      .then((body) => {
        let maxLen = body.photos.length;
        //console.log(body)
        for (let i = 0; i < maxLen; i++) {
          const imageSource = body.photos[i].img_src.toString();
          srcArr.push(imageSource);
        }
        if (srcArr.length > 0) {
          generalMsg.textContent=`There are ${maxLen} photos here\nPhotos taken on ${body.photos[0].earth_date}`;
          images.src = body.photos[0].img_src.toString();
        }
        else{
          generalMsg.textContent="There are no photos from this camera, please choose another";
        }
        //postFinding.hidden= false;
      }).catch(error => console.log(error));
  }
}

function send_finding(imgArr){
  let desc = document.getElementById("desc-input").value;
  let dayInput = document.getElementById("day").value;
  let roverInput = document.getElementById("rover").value;
  let cameraInput = document.getElementById("camera").value;
  if(desc != ""){
    fetch('/findings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: userId,
            desc: desc,
            parameters:{
              day: dayInput,
              rover: roverInput,
              camera: cameraInput},
            imageSrcs: imgArr
        })
    })
    .then(response => {
      console.log(response.body)
    })
    .catch(error => {
       console.log("An error occurred. Please try again.");
    });

  }
  else{
    generalMsg.textContent = "please enter a description";
  }
}

function nextButtonClicked() {
  if (isIntervalOn) { stopInterval(); }
  getNextPhotos();
}

function prevButtonClicked() {
  if (isIntervalOn) { stopInterval(); }
  getPrevPhotos();
}

let availableCams = [];
const roverInput = document.getElementById("rover");
let roverName = document.getElementById("rovername");
roverInput.addEventListener('change', () => {
  availableCams = {};
  recContainer.textContent = "";
  roverName.textContent = roverInput.value.charAt(0).toUpperCase() + roverInput.value.slice(1) + " Recommended Sol Days";
  getManifest(availableCams, roverInput.value);
});

let getCams = document.getElementById("getCams");
getCams.addEventListener("click", () => {
  cameraOptions.textContent = "";
  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Please choose camera";
  cameraOptions.appendChild(defaultOption);
  let dayInput = document.getElementById("day").value;
  if (dayInput !== "" && roverInput.value !== "") {
    addCamera(availableCams[dayInput]);
  } else {
    console.log("Error: input day and rover");
  }
  cameraSelect.hidden = false;
  button.hidden = false;
});

function nextButtonClicked() {
  if (isIntervalOn) { stopInterval(); }
  getNextPhotos();
}

function prevButtonClicked() {
  if (isIntervalOn) { stopInterval(); }
  getPrevPhotos();
}

let photosArr = [];
let firstClick = true;
function submitClick() {
  generalMsg.textContent = "";
  if (!firstClick) {
    photosArr = [];
    currentSrc = 0;
  }
  submit(photosArr);
  firstClick = false;
}

button.addEventListener("click", submitClick);
nextButton.addEventListener("click", nextButtonClicked);
prevButton.addEventListener("click", prevButtonClicked);
pauseButton.addEventListener("click", stopInterval);
timelapseButton.addEventListener("click", timelapse);
slider.addEventListener('input', function() {
  speed = parseInt(this.value);
  //console.log("speed",speed)
  if(isIntervalOn){
    stopInterval()
    timelapse()
  }

});
descSubmit.addEventListener("click", (e)=>{
  e.preventDefault();
  send_finding(photosArr);
  const descInput = document.getElementById("desc-input");
  if(descInput.value){
    descInput.value = '';
  }
})

function hashStringToInt(str) {
  const p = 31;
  const m = 1e9 + 9;
  let hash_value = 0;
  let p_pow = 1;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    hash_value = (hash_value + (c.charCodeAt(0) - 'a'.charCodeAt(0) + 1) * p_pow) % m;
    p_pow = (p_pow * p) % m;
  }

  return hash_value;
}

function getUserColor(username) {
  if (!userColors[username]) {
    const hash = hashStringToInt(username);
    const hue = hash % 360;
    userColors[username] = `hsl(${hue}, 70%, 70%)`;
  }
  return userColors[username];
}

function voteButtonClicked() {
  const voteButton = document.getElementById("vote");

  const userId      = sessionStorage.getItem('username');
  const dayValue    = document.getElementById("day").value;
  const roverValue  = document.getElementById("rover").value;
  const cameraValue = document.getElementById("camera").value;

  if (!dayValue || !roverValue || !cameraValue) {
    alert("Incomplete vote received, ignoring");
    return;
  }

  const voteData = {userId, dayValue, roverValue, cameraValue};

  socket.timeout(10000).emit(
  'userVote',
  voteData,
  (err, response) => {
    if (err) {
      console.warn("Ack timeout or error:", err);
      return;
    }

    if (response && response.success) {
      voteButton.disabled = true;
      voteButton.classList.add('hidden');
    } else {
      console.log("Server response:", response);
      voteButton.disabled = false;
      voteButton.classList.remove('hidden');
    }
  }
);

}

document.addEventListener('DOMContentLoaded', function() {
  const voteButton = document.getElementById("vote");
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  voteButton.addEventListener('click', voteButtonClicked);
  updatePollTimer();

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    if (input.value) {
      const clientOffset = `${socket.id}-${counter++}`;
      const timeStamp = new Date().toISOString();
      socket.timeout(10000).emit(
        'chat message',
        userId,
        input.value,
        clientOffset,
        timeStamp,
        (err, response) => {
          if (err) {
            // TODO: implement retry or alert user
            //console.log('Ack not received within 10 seconds');
          } else {
            //console.log('Ack received:', response);
          }
        }
      );
      input.value = '';
    }
  });

  socket.on('chat message', (user, msg, serverOffset) => {
    const chatLine = document.createElement('div');
    chatLine.classList.add('chat-line');

    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.textContent = `${user}:`;
    usernameSpan.style.color = getUserColor(user);

    const messageSpan = document.createElement('span');
    messageSpan.classList.add('text');
    messageSpan.textContent = ` ${msg}`;

    chatLine.appendChild(usernameSpan);
    chatLine.appendChild(messageSpan);
    document.getElementById('chat-messages').appendChild(chatLine);

    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    socket.auth.serverOffset = serverOffset;
  });

  socket.on('pollOpen', (allocatedTime) => {
    voteButton.disabled = false;
    voteButton.classList.remove('hidden');
    //console.log("Poll is now open");
    pollDuration = allocatedTime;
    isPollActive = true;
  });

  socket.on('pollClosed', (allocatedTime) => {
    voteButton.disabled = true;
    voteButton.classList.add('hidden');
    //console.log("Poll is now closed");
    pollDuration = allocatedTime;
    isPollActive = false;
  });
});

function updatePollTimer() {
  const minutes = Math.floor(pollDuration / 60);
  const seconds = Math.floor(pollDuration % 60);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  document.getElementById("poll-label").textContent =
    isPollActive ? "Time left in poll: " : "Next poll in: ";

  document.getElementById("seconds-left").textContent = formatted;

  if (pollDuration > 0) {
    pollDuration--;
  }

  setTimeout(() => updatePollTimer(), 1000);
}