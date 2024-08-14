const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { predict } = require("./lib/onnx.js");
const { findNeighbors, createNeighborGraph } = require("./lib/neighbor.js");

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
    const storedKeypoints = store.get("keypoints");

    const newKeypoints = { ...storedKeypoints };
    const promises = result.filePaths.map((filePath) => {
      if (filePath in storedKeypoints) return Promise.resolve();
      return predict(filePath).then((keypoints) => {
        newKeypoints[filePath] = keypoints;
        return;
      });
    });

    Promise.all(promises).then(() => {
      store.set({
        keypoints: {
          ...storedKeypoints,
          ...newKeypoints,
        },
      });
    });
  });
  return;
};

const handleSearch = async () => {
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
  return import("electron-store")
    .then((module) => {
      const Store = module.default || module;
      const store = new Store();
      const storedKeypoints = store.get("keypoints");
      return findNeighbors(keypoints, storedKeypoints);
    })
    .then((sortedPaths) => {
      return [result.filePaths[0], keypoints, sortedPaths];
    });
};

app.whenReady().then(() => {
  ipcMain.handle("uploadReference", handleUpload);
  ipcMain.handle("search", handleSearch);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
