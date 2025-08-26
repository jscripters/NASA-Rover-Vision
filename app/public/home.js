const userIdRaw = sessionStorage.getItem('username');
if (!userIdRaw) {
  alert('You are not logged in.');
  window.location.href = 'login.html';
}

userId = userIdRaw.trim();

const socket = io({
  auth: {
    serverOffset: 0
  },
  // enable retries
  ackTimeout: 10000,
  retries: 3,
});

let votedDay;
let srcArr =[];
let images = document.getElementById("photos");
let currentSrc=0;
let interval;

isIntervalOn = false;
function timelaspe() {
  if(isIntervalOn == false){
    interval = setInterval(function () {
      getNextPhotos();
    }, 500);
    isIntervalOn = true;
  }
}

function getNextPhotos() {
  if (currentSrc < srcArr.length) {
    images.src = srcArr[currentSrc];
    currentSrc += 1;
  } else {
    currentSrc = 0;
  }
}

console.log("srcarr:",srcArr);
function submit(photoArr) {
  let url = `/getVotedDay`;
  fetch(url).then((response) => response.json())
    .then((body) => {
      let maxLen = body.photos.length;
      console.log(body)
      for (let i = 0; i < maxLen; i++) {
        const imageSource = body.photos[i].img_src.toString();
        photoArr.push(imageSource);
      }
      timelaspe()
    }).catch(error => console.log(error));
}
submit(srcArr)