let button = document.getElementById("submit");
let images = document.getElementById("photos");
let nextButton = document.getElementById("next");
let prevButton = document.getElementById("previous");
let timelapseButton = document.getElementById("timelapse");
let photosArr = []

let recContainer = document.getElementById("add");
function setRecTable(array){
    for(let i = 0;i < array.length;i++){
        let addSolDay = document.createElement("p");
        addSolDay.textContent = array[i]
        console.log(array[i])
        recContainer.appendChild(addSolDay)
    }
}


function getManifest(recArr,rover){
    let url = `/getManifest?rover=${rover}`;
    fetch(url).then((response) => {
        return response.json();
    })
    .then((body) => {
        //console.log("body:",body.length);
        let manifestLen = body.length
        for(let i = 0; i< manifestLen;i++){
            if(body[i].total_photos >= 300){
                recArr.push(body[i].sol)
            }
        }
        console.log(recArr)
        setRecTable(recArr)
    }).catch(error=> {
        console.log(error);
    }
    );
}


function submit(){
    let dayInput = document.getElementById("day").value;
    let roverInput = document.getElementById("rover").value;
    let cameraInput = document.getElementById("camera").value;
    console.log(dayInput);
    console.log(roverInput);
    console.log(cameraInput);
    let url = `/getPhotos?solday=${dayInput}&camera=${cameraInput}&rover=${roverInput}`;
    fetch(url).then((response) => {
        return response.json();
    })
    .then((body) => {
        //console.log("body:",body);
        let maxLen = body.photos.length;

        for(let i = 0; i< maxLen;i++){
            imageSource = body.photos[i].img_src.toString()
            photosArr.push(imageSource)
        }
        
        if(photosArr.length > 0){
            images.src = body.photos[0].img_src.toString()
        }

    }).catch(error=> {
        console.log(error);
    }
    );
}

let i = 0
function getNextPhotos(){
    //console.log(i)
    if(i < photosArr.length){
        images.src =photosArr[i];
        i+=1;
    }
    else{
        i = 0;
    }
}

function timelaspe(){
    setInterval(function () {
    getNextPhotos()
  }, 600);
}

const roverInput =document.getElementById("rover");
let roverName =document.getElementById("rovername");
roverInput.addEventListener('change', (event) => {
    let reccomendations = []
    recContainer.textContent="";
    console.log(roverInput.value);
    roverName.textContent = roverInput.value;
    getManifest(reccomendations,roverInput.value)}
);


button.addEventListener("click",submit);
console.log(photosArr)
nextButton.addEventListener("click",getNextPhotos);
timelapseButton.addEventListener("click",timelaspe);