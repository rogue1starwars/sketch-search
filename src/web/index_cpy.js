const button = document.getElementById("fileSelector");
button.addEventListener("click", async () => {
  await window.sketchSearch.uploadReference();
  console.log("Uploaded");
});

const searchButton = document.getElementById("search");
searchButton.addEventListener("click", async () => {
  const [filePath, keypoints, neighbors] = await window.sketchSearch.search();
  const keypoint = keypoints[0];
  const image = document.getElementById("image");
  image.src = `file://${filePath}`;

  for (let i = 0; i < keypoint.length; i += 2) {
    const circle = document.createElement("div");
    circle.className = "circle";
    circle.style.top = `${keypoint[i + 1]}px`;
    circle.style.left = `${keypoint[i]}px`;
    circle.style.width = "10px";
    circle.style.height = "10px";
    circle.style.position = "absolute";
    circle.style.border = "1px solid red";
    circle.style.borderRadius = "50%";
    image.parentElement.appendChild(circle);
  }
  console.log(neighbors);
  for (const person of neighbors) {
    const h2 = document.createElement("h2");
    h2.innerText = "Person";
    for (const neighbor of person) {
      const image = document.createElement("img");
      image.src = `file://${neighbor}`;
      document.body.appendChild(image);
    }
  }
});
