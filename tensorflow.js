// Tensorflow.js
//

async function imageToTensor(path) {
  const image = fs.readFileSync(path);
  const tensor = tf.node.decodeImage(image, 3);
  const array = await tensor.array();
  return tensor;
}

async function predictKeypointsFromTensor(tensor) {
  const model = await tf.loadGraphModel("file://./best_web_model/model.json");
  const prediction = model.predict(tensor);
  return prediction;
}

async function post_process(tensor, width, height) {
  const outputs = tensor.squeeze().transpose([1, 0]);
  const rows = outputs.shape[0];

  const boxes = [];
  const scores = [];
  const keypoints = [];

  const x_scale = width / IMG_SIZE;
  const y_scale = height / IMG_SIZE;

  const outputArray = await outputs.array();
  for (let i = 0; i < rows; i++) {
    if (outputArray[i][4] > CONFIDENCE_THRESHOLD) {
      const [x, y, w, h] = outputArray[i].slice(0, 4);

      const left = parseInt((x - w / 2) * x_scale);
      const top = parseInt((y - h / 2) * y_scale);
      const right = parseInt((x + w / 2) * x_scale);
      const bottom = parseInt((y + h / 2) * y_scale);

      boxes.push([left, top, right, bottom]);

      const score = outputArray[i][4];
      scores.push(score);

      const keypoint = outputArray[i].slice(5);
      for (let j = 0; j < keypoint.length; j += 2) {
        keypoint[j] = parseInt(keypoint[j] * x_scale);
        keypoint[j + 1] = parseInt(keypoint[j + 1] * y_scale);
      }
      keypoints.push(keypoint);
    }
  }

  const indicies = [];
  for (let i = 0; i < boxes.length; i++) {
    let discard = false;
    for (let j = 0; j < boxes.length; j++) {
      if (IOU(boxes[i], boxes[j]) > IOU_THRESHOLD) {
        if (scores[i] < scores[j]) {
          discard = true;
        }
      }
    }
    if (!discard) {
      indicies.push(i);
    }
  }

  const final_keypoints = [];
  const final_boxes = [];
  for (let i = 0; i < indicies.length; i++) {
    final_keypoints.push(keypoints[indicies[i]]);
    final_boxes.push(boxes[indicies[i]]);
  }
  return final_boxes;
}

function IOU(box1, box2) {
  const [x1, y1, x2, y2] = box1;
  const [x3, y3, x4, y4] = box2;

  const x_overlap = Math.max(0, Math.min(x2, x4) - Math.max(x1, x3));
  const y_overlap = Math.max(0, Math.min(y2, y4) - Math.max(y1, y3));
  const intersection = x_overlap * y_overlap;

  const area1 = (x2 - x1) * (y2 - y1);
  const area2 = (x4 - x3) * (y4 - y3);
  const union = area1 + area2 - intersection;

  return intersection / union;
}

async function predict(path = "./image.png") {
  const tensor = imageToTensor(path);
  const width = tensor.shape[1];
  const height = tensor.shape[0];

  const resized_tensor = tf.image.resizeBilinear(tensor, [640, 640]);
  const prediction = await predictKeypointsFromTensor(
    resized_tensor.expandDims(0),
  );
  const boxes = await post_process(prediction, width, height);
  return boxes;
}
