const button = document.getElementById("fileSelector");
button.addEventListener("click", async () => {
  const [keypoints, filePath] = await window.sketchSearch.uploadReference();
  console.log(keypoints);
  const image = document.getElementById("image");
  const keypoint = keypoints[0];
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
  const circle = document.createElement("div");
  circle.className = "circle";
  circle.style.top = `0px`;
  circle.style.left = `0px`;
  circle.style.width = "10px";
  circle.style.height = "10px";
  circle.style.position = "absolute";
  circle.style.border = "1px solid red";
  circle.style.borderRadius = "50%";
  image.parentElement.appendChild(circle);
});
