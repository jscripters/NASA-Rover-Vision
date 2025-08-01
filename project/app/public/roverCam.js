let button = document.getElementById("submit");
let images = document.getElementById("photos");
let nextButton = document.getElementById("next");
let prevButton = document.getElementById("previous");
let timelapseButton = document.getElementById("timelapse");
let photosArr = []

function submit(){
    let dayInput = document.getElementById("day").value;
    let roverInput = document.getElementById("rover").value;
    console.log(dayInput);
    console.log(roverInput);
    let url = `/getPhotos?solday=${dayInput}&rover=${roverInput}`;
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
  }, 700);
}

button.addEventListener("click",submit);
console.log(photosArr)
nextButton.addEventListener("click",getNextPhotos);
timelapseButton.addEventListener("click",timelaspe);