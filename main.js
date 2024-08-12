import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "url";
import path from "path";
import ort from "onnxruntime-node";
import sharp from "sharp";
import Store from "electron-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIDENCE_THRESHOLD = 0.9;
const IOU_THRESHOLD = 0.7;
const WIDTH = 640;
const HEIGHT = 640;

try {
  require("electron-reloader")(module);
} catch (_) {}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  win.loadFile("index.html");
};

app.whenReady().then(() => {
  ipcMain.handle("open-file-dialog", async () => {
    const result = await dialog
      .showOpenDialog({
        properties: ["openFile"],
        title: "Select an image file",
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg"],
          },
        ],
      })
      .catch(console.error);

    if (result.canceled) return;

    const keypoints = await predict(result.filePaths[0]);

    return [keypoints, result.filePaths[0]];
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// onnx();
async function predict(path = "./image.png") {
  try {
    const session = await ort.InferenceSession.create("./model.onnx");
    const [input_tensor, img_width, img_height] =
      await get_image_tensor_from_path(path);
    const feeds = {};
    feeds[session.inputNames[0]] = input_tensor;
    const output = await session.run(feeds);
    input_tensor.dispose();
    const final_keypoints = await post_process(output, img_width, img_height);
    return final_keypoints;
  } catch (e) {
    console.error(e);
  }
}

function transpose(array, dims) {
  const transposed = [];
  for (let i = 0; i < dims[2]; i++) {
    const row = [];
    for (let j = 0; j < array.length; j += dims[2]) {
      row.push(array[j + i]);
    }
    transposed.push(row);
  }
  return transposed;
}
async function post_process(output, img_width, img_height) {
  const dims = output["output0"].dims;
  const output_array = await output["output0"].getData();
  const output_transposed = transpose(output_array, dims);

  const rows = output_transposed.length;

  const boxes = [];
  const scores = [];
  const keypoints = [];

  const x_scale = img_width / WIDTH;
  const y_scale = img_height / HEIGHT;

  for (let i = 0; i < rows; i++) {
    if (output_transposed[i][4] > CONFIDENCE_THRESHOLD) {
      const [x, y, w, h] = output_transposed[i].slice(0, 4);

      const left = parseInt((x - w / 2) * x_scale);
      const top = parseInt((y - h / 2) * y_scale);
      const right = parseInt((x + w / 2) * x_scale);
      const bottom = parseInt((y + h / 2) * y_scale);

      boxes.push([left, top, right, bottom]);

      const score = output_transposed[i][4];
      scores.push(score);

      const keypoint = output_transposed[i].slice(5);
      for (let j = 0; j < keypoint.length; j += 2) {
        keypoint[j] = parseInt(keypoint[j] * x_scale);
        keypoint[j + 1] = parseInt(keypoint[j + 1] * y_scale);
      }
      keypoints.push(keypoint);
    }
  }
  output["output0"].dispose();

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
  return final_keypoints;
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
async function get_image_tensor_from_path(path, dims = [1, 3, 640, 640]) {
  const [pixels, width, height] = await load_image_from_path(path);
  const input_tensor = image_data_to_tensor(pixels, dims);
  return [input_tensor, width, height];
}

async function load_image_from_path(path) {
  const image = sharp(path);
  const md = await image.metadata();
  const [img_width, img_height] = [md.width, md.height];
  const pixels = await image
    .removeAlpha()
    .resize({ width: WIDTH, height: HEIGHT, fit: "fill" })
    .raw()
    .toBuffer();
  return [pixels, img_width, img_height];
}

function image_data_to_tensor(pixels, dims) {
  const [red_array, green_array, blue_array] = [[], [], []];

  for (let i = 0; i < pixels.length; i += 3) {
    red_array.push(pixels[i] / 255.0);
    green_array.push(pixels[i + 1] / 255.0);
    blue_array.push(pixels[i + 2] / 255.0);
  }

  const transposed_data = [...red_array, ...green_array, ...blue_array];

  const input_tensor = new ort.Tensor("float32", transposed_data, dims);
  return input_tensor;
}
