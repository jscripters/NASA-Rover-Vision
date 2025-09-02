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
    }, 700);
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


function submit(photoArr) {
  let url = `/getVotedDay`;
  fetch(url).then((response) => response.json())
    .then((body) => {
      let maxLen = body.photos.length;
      //console.log(body)
      for (let i = 0; i < maxLen; i++) {
        const imageSource = body.photos[i].img_src.toString();
        photoArr.push(imageSource);
      }
      timelaspe()
    }).catch(error => console.log(error));
}

function showPosts(arr){
    let postBox = document.getElementById("postBox");
    for(let i = 0;i < arr.length;i++){
        //console.log("here:",arr[i].descriptions);
        let appendDiv = document.createElement("div");
        let description = document.createElement("p");
        let parameters = document.createElement("p");
        description.textContent = arr[i].username+": "+arr[i].descriptions;
        parameters.textContent="found on Sol day: "+ arr[i].parameters.day + ", Rover: "+ arr[i].parameters.rover+ ", Camera: "+ arr[i].parameters.camera
        
        //console.log(arr[i].imagesources)
        let srcs= arr[i].imagesources;
        let img = document.createElement("img");
        
        let nextButton = document.createElement("button");
        nextButton.textContent = "next";
        
        postBox.append(appendDiv);
        appendDiv.append(description);
        appendDiv.append(parameters);
        appendDiv.append(img);
        appendDiv.append(nextButton);
        let currentIdx = 0;
        img.src = srcs[currentIdx]
        nextButton.addEventListener("click",(e)=>{
            if(currentIdx < srcs.length){
                currentIdx+=1
                if(srcs[currentIdx] == undefined){
                    currentIdx=0;
                }
                img.src = srcs[currentIdx];
            }else{
                currentIdx=0
            }
        });
    }
    
}

function getPosts() {
  let url = `/findings`;
  fetch(url).then((response) => response.json())
    .then((body) => {
      //console.log("data retreived",body)
      showPosts(body);
    }).catch(error => console.log(error));
}

submit(srcArr)
getPosts();