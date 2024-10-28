import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { SCBase } from "./base/scbase";
import { SCScout } from "./scout/scscout";
import { SCCentral } from "./central/sccentral";
import { ContentManager } from "./cmgr";
import { getTreeData, executeCommand, getInfoData } from "./ipchandlers" ;

let cmgr: ContentManager = new ContentManager() ;
export let scappbase : SCBase | undefined = undefined ;

function createWindow() : BrowserWindow {
    const args = process.argv;
  
    const win = new BrowserWindow({
      webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
      }
    });
    win.maximize() ;

    if (process.argv.length > 2) {
        if (process.argv[2] === "scout") {
            scappbase = new SCScout(win) ;
        }
        else {
            scappbase = new SCCentral(win) ;
        }
    }
    
    if (!scappbase) {
        app.exit(1) ;
    }     
  
    win
      .loadFile(cmgr.getStaticPage(scappbase!.basePage()))
      .then(() => {
      })
      .catch((e) => console.error(e));

    return win ;
}

app.on("ready", () => {
    ipcMain.on('get-tree-data', getTreeData);
    ipcMain.on('get-info-data', getInfoData) ;
    ipcMain.on('execute-command', (event, ...args) => { executeCommand(...args)}) ;
    createWindow() ;
}) ;

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});