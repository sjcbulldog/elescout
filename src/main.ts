import { app, BrowserWindow, ipcMain, Menu } from "electron";
import * as path from "path";
import { SCBase } from "./base/scbase";
import { SCScout } from "./scout/scscout";
import { SCCentral } from "./central/sccentral";
import { ContentManager } from "./cmgr";
import { getTreeData, executeCommand, getInfoData, getSelectEventData, loadBaEventData } from "./ipchandlers" ;

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

    Menu.setApplicationMenu(scappbase!.createMenu()) ;

    return win ;
}

app.on("ready", () => {
    ipcMain.on('get-tree-data', getTreeData);
    ipcMain.on('get-info-data', getInfoData) ;
    ipcMain.on('get-select-event-data', getSelectEventData) ;
    ipcMain.on('execute-command', (event, ...args) => { executeCommand(...args)}) ;
    ipcMain.on('load-ba-event-data', (event, ...args) => { loadBaEventData(...args)}) ;
    createWindow() ;
}) ;

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
