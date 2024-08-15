const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sketchSearch", {
  uploadReference: () => ipcRenderer.invoke("uploadReference"),
  search: () => ipcRenderer.invoke("search"),
});
