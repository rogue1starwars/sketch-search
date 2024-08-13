const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { predict } = require("./lib/onnx.js");

try {
  require("electron-reloader")(module);
} catch (_) {}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
};

const handleUpload = async () => {
  const result = await dialog
    .showOpenDialog({
      properties: ["openFile", "multiSelections"],
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
  const keypoints_list = [];
  for (let i = 0; i < result.filePaths.length; i++) {
    const keypoints = await predict(result.filePaths[i]);
    keypoints_list.push(keypoints);
  }
  import("electron-store").then((module) => {
    const Store = module.default || module;
    const store = new Store();
    const storedKeyPoints = store.get("keypoints");
    const newKeypoints = {};
    for (let i = 0; i < result.filePaths.length; i++) {
      newKeypoints[result.filePaths[i]] = keypoints_list[i];
    }
    store.set({
      keypoints: {
        ...storedKeyPoints,
        ...newKeypoints,
      },
    });
    console.log(store.get("keypoints"));
  });
  return [keypoints, result.filePaths[0]];
};

app.whenReady().then(() => {
  ipcMain.handle("uploadReference", handleUpload);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
