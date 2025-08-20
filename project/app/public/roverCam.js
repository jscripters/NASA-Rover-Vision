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

let speed = slider.value;

const pollTimerElm = document.getElementById("poll-timer");
const secondsElm   = document.getElementById("seconds-left");

let button = document.getElementById("submit");
let images = document.getElementById("photos");
let nextButton = document.getElementById("next");
let prevButton = document.getElementById("previous");
let timelapseButton = document.getElementById("timelapse");
let pauseButton = document.getElementById("pause-main");
let cameraOptions = document.getElementById("camera");
let errosMsg = document.getElementById("errors");
let slider = document.getElementById("speedRange");

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

function timelaspe() {
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
    images.src = photosArr[currentSrc];
    currentSrc += 1;
  } else {
    currentSrc = 0;
  }
}

function getPrevPhotos() {
  if (currentSrc > 0) {
    images.src = photosArr[currentSrc];
    currentSrc -= 1;
  } else {
    currentSrc = 0;
  }
}

function submit(srcArr) {
  stopInterval();
  let dayInput = document.getElementById("day").value;
  let roverInput = document.getElementById("rover").value;
  let cameraInput = document.getElementById("camera").value;
  let url = `/getPhotos?solday=${dayInput}&camera=${cameraInput}&rover=${roverInput}`;
  fetch(url).then((response) => response.json())
    .then((body) => {
      let maxLen = body.photos.length;
      console.log(body)
      for (let i = 0; i < maxLen; i++) {
        const imageSource = body.photos[i].img_src.toString();
        srcArr.push(imageSource);
      }
      if (srcArr.length > 0) {
        errosMsg.textContent=`There are ${maxLen} photos here`;
        images.src = body.photos[0].img_src.toString();
      }
      else{
        errosMsg.textContent="There are no photos from this camera, please choose another";
      }
    }).catch(error => console.log(error));
}

function nextButtonClicked() {
  if (isIntervalOn) { stopInterval(); }
  getNextPhotos();
}

function prevButtonClicked() {
  if (isIntervalOn) { stopInterval(); }
  getPrevPhotos();
}

let avaliableCams = [];
const roverInput = document.getElementById("rover");
let roverName = document.getElementById("rovername");
roverInput.addEventListener('change', () => {
  avaliableCams = {};
  recContainer.textContent = "";
  roverName.textContent = roverInput.value.charAt(0).toUpperCase() + roverInput.value.slice(1) + " Available Sol Days";
  getManifest(avaliableCams, roverInput.value);
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
    addCamera(avaliableCams[dayInput]);
  } else {
    console.log("Error: input day and rover");
  }
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
  errosMsg.textContent = "";
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
timelapseButton.addEventListener("click", timelaspe);

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
    return;
  }

  const voteData = {userId, dayValue, roverValue, cameraValue};

  socket.emit('userVote', voteData, (response) => {
    if (response.success) {
      voteButton.disabled = true;
      voteButton.classList.add('hidden');
    } else {
      voteButton.disabled = false;
      voteButton.classList.remove('hidden');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const voteButton = document.getElementById("vote");
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  voteButton.addEventListener('click', voteButtonClicked);

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    if (input.value) {
      const clientOffset = `${socket.id}-${counter++}`;
      const timeStamp = new Date().toISOString();
      socket.emit('chat message', userId, input.value, clientOffset, timeStamp, acknowledgementCallback);
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
    console.log("Poll is now open");
    pollDuration = allocatedTime;
    updatePollTimer(true);
  });

  socket.on('pollClosed', (allocatedTime) => {
    voteButton.disabled = true;
    voteButton.classList.add('hidden');
    console.log("Poll is now closed");
    pollDuration = allocatedTime;
    updatePollTimer(false);
  });
});

function acknowledgementCallback(ack) {
  console.log('Ack received:', ack);
  if (ack && ack.success) {
    console.log('Acknowledged: stop retrying');
  } else {
    console.error('Acknowledgment failed, will retry...');
  }
}

function updatePollTimer(isPollActive) {
  const minutes = Math.floor(pollDuration / 60);
  const seconds = Math.floor(pollDuration % 60);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (isPollActive) {
    secondsElm.textContent = formatted;
  } else {
    pollTimerElm.textContent = `Next poll in: ${formatted}`;
    secondsElm.classList.remove('hidden');
  }

  if (pollDuration > 0) {
    pollDuration--;
    setTimeout(() => updatePollTimer(isPollActive), 1000);
  } else {
    if (isPollActive) {
      pollTimerElm.textContent = "Poll Closed";
      secondsElm.classList.add('hidden');
    } else {
      pollTimerElm.textContent = "Next poll starting…";
    }
  }
}