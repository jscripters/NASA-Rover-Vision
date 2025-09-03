let votedDay;
let srcArr = [];
const images = document.getElementById("photos");
let currentSrc = 0;
let interval;
let isIntervalOn = false;

function timelaspe() {
  if (!isIntervalOn && srcArr.length) {
    interval = setInterval(getNextPhotos, 700);
    isIntervalOn = true;
  }
}
function getNextPhotos() {
  if (!srcArr.length) return;
  currentSrc = (currentSrc + 1) % srcArr.length;
  images.src = srcArr[currentSrc];
}

function submit(photoArr) {
  fetch(`/getVotedDay`)
    .then((r) => r.json())
    .then((body) => {
      const list = body?.photos || [];
      for (let i = 0; i < list.length; i++) {
        const imageSource = String(list[i].img_src || "");
        if (imageSource) photoArr.push(imageSource);
      }
      if (photoArr.length) images.src = photoArr[0];
      timelaspe();
    })
    .catch(console.error);
}

function showPosts(arr) {
  const postBox = document.getElementById("postBox");
  postBox.setAttribute("aria-busy", "true");

  for (let i = 0; i < arr.length; i++) {
    const post = document.createElement("div");
    post.className = "post";

    const description = document.createElement("p");
    description.textContent = `${arr[i].username}: ${arr[i].descriptions}`;
    description.className = "clamp-2";

    const parameters = document.createElement("p");
    parameters.className = "meta";
    parameters.textContent =
      `found on Sol day: ${arr[i].parameters.day}, ` +
      `Rover: ${arr[i].parameters.rover}, ` +
      `Camera: ${arr[i].parameters.camera}`;

    const img = document.createElement("img");
    img.alt = "rover photo";

    const hr = document.createElement("div");
    hr.className = "hr";

    const nextButton = document.createElement("button");
    nextButton.textContent = "next";
    nextButton.className = "btn";

    post.append(description, parameters, img, hr, nextButton);
    postBox.append(post);

    const srcs = Array.isArray(arr[i].imagesources) ? arr[i].imagesources : [];
    let currentIdx = 0;
    if (srcs.length) img.src = srcs[0];

    nextButton.addEventListener("click", () => {
      if (!srcs.length) return;
      currentIdx = (currentIdx + 1) % srcs.length;
      img.src = srcs[currentIdx];
    });
  }

  postBox.setAttribute("aria-busy", "false");
}

function getPosts() {
  fetch(`/findings`)
    .then((r) => r.json())
    .then((body) => showPosts(body || []))
    .catch(console.error);
}

submit(srcArr);
getPosts();
