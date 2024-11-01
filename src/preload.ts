import { contextBridge, ipcRenderer,  } from "electron";

// Create a type that should contain all the data we need to expose in the
// renderer process using `contextBridge`.

export type scoutingAPI = {
  // Declare a `readFile` function that will return a promise. This promise
  // will contain the data of the file read from the main process.
  getCentralTreeContents: () => Promise<Object>
}

// Expose our functions in the `api` namespace of the renderer `Window`.
//
// If I want to call `readFile` from the renderer process, I can do it by
// calling the function `window.api.readFile()`.
contextBridge.exposeInMainWorld( "scoutingAPI", {
  send: (channel: string, data: any) => {
      let validChannels = [
        "get-tree-data", 
        "get-info-data",
        "get-select-event-data",
        "load-ba-event-data",
        "execute-command"
      ];
      if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
      }
  },
  receive: (channel: string, func:any) => {
      let validChannels = [
        "update-tree", 
        "update-main",
        "update-info",
        "select-event",
        "update-status-text",
        "update-status-html",
        "update-status-title",
        "update-status-visible",
        "update-status-view-close-button"
      ];
      if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
  }
}) ;
