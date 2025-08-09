let button = document.getElementById("submit");
let images = document.getElementById("photos");
let nextButton = document.getElementById("next");
let prevButton = document.getElementById("previous");
let timelapseButton = document.getElementById("timelapse");
let pauseButton = document.getElementById("pause");
let cameraOptions = document.getElementById("camera");

let recContainer = document.getElementById("add");
function addDayToRecTable(day){
    let addSolDay = document.createElement("p");
    addSolDay.textContent = day
    recContainer.appendChild(addSolDay)
}

function addCamera(camArr){
    for(let i=0;i< camArr.length;i++){
        let camEntry = document.createElement("option");
        camEntry.value = camArr[i]
        camEntry.textContent = camArr[i]
        cameraOptions.appendChild(camEntry)
    }

}

function getManifest(camArr,rover){
    let url = `/getManifest?rover=${rover}`;
    fetch(url).then((response) => {
        return response.json();
    })
    .then((body) => {
        //console.log("body:",body);
        let manifestLen = body.length
        for(let i = 0; i< manifestLen;i++){
            if(body[i].total_photos >= 300){
                addDayToRecTable(body[i].sol)
            }
            camArr.push(body[i].cameras)
        }
    }).catch(error=> {
        console.log(error);
    }
    );
}

let currentSrc = 0;
let isIntervalOn = false;
let interval;

function timelaspe(){
    interval = setInterval(function () {
    getNextPhotos()
  }, 600);
  isIntervalOn = true
}

function stopInterval(){
    clearInterval(interval)
    isIntervalOn = false;
}



function getNextPhotos(){
    if(currentSrc < photosArr.length){
        images.src =photosArr[currentSrc];
        currentSrc+=1;
    }
    else{
        currentSrc= 0;
    }
}

function getPrevPhotos(){
    if(currentSrc > 0){
        images.src =photosArr[currentSrc];
        currentSrc-=1;
    }
    else{
        currentSrc= 0;
    }
}

function submit(srcArr){
    stopInterval();
    let dayInput = document.getElementById("day").value;
    let roverInput = document.getElementById("rover").value;
    let cameraInput = document.getElementById("camera").value;
    //console.log(dayInput);
    //console.log(roverInput);
    //console.log(cameraInput);
    let url = `/getPhotos?solday=${dayInput}&camera=${cameraInput}&rover=${roverInput}`;
    fetch(url).then((response) => {
        return response.json();
    })
    .then((body) => {
        let maxLen = body.photos.length;

        for(let i = 0; i< maxLen;i++){
            imageSource = body.photos[i].img_src.toString()
            srcArr.push(imageSource)
        }
        
        if(srcArr.length > 0){
            images.src = body.photos[0].img_src.toString()
        }

    }).catch(error=> {
        console.log(error);
    }
    );
}

function nextButtonClicked(){
    if(isIntervalOn){
        stopInterval()
    }
    getNextPhotos()
}

function prevButtonClicked(){
    if(isIntervalOn){
        stopInterval()
    }
    getPrevPhotos()
    
}

let avaliableCams=[];
const roverInput =document.getElementById("rover");
let roverName =document.getElementById("rovername");
roverInput.addEventListener('change', (event) => {
    recContainer.textContent="";
    roverName.textContent = roverInput.value;
    getManifest(avaliableCams,roverInput.value)
});

let getCams=document.getElementById("getCams");

getCams.addEventListener("click",(event)=> {
    cameraOptions.textContent="";
    let defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Please choose camera"
    cameraOptions.appendChild(defaultOption);
    let dayInput = document.getElementById("day").value;
    if(dayInput !="" && roverInput.value!=""){
        console.log("cameras aval:",avaliableCams[dayInput])
        addCamera(avaliableCams[dayInput]);
    }
    else{
        console.log("Error: input day and rover")
    }
})

let photosArr = [];
let firstClick = true;
function submitClick(){
    if(!firstClick){
        photosArr=[]
        currentSrc=0;
    }
    submit(photosArr)
    firstClick=false
}

button.addEventListener("click",submitClick);
nextButton.addEventListener("click",nextButtonClicked);
prevButton.addEventListener("click",prevButtonClicked);
pauseButton.addEventListener("click",stopInterval);
timelapseButton.addEventListener("click",timelaspe);