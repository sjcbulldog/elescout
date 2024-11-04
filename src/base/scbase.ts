import { BrowserWindow, ipcMain, ipcRenderer, Menu } from "electron";
import * as path from 'path' ;
import * as fs from 'fs' ;

export abstract class SCBase {
    protected win_ : BrowserWindow ;

    protected constructor(win: BrowserWindow) {
        this.win_ = win;
    }

    public abstract basePage() : string ;
    public abstract sendNavData() : void ;
    public abstract executeCommand(cmd: string) : void ;
    public abstract createMenu() : Menu | null ;

    public isScoutingTablet() : boolean { 
        return true ;
    }

    public sendToRenderer(ev: string, ...args: any[]) {
        let argstr = '' ;
        for(let arg of args) {
            argstr += ' \'' + arg + '\'' ;
        }
        console.log('sendToRenderer: \'' + ev + '\'' + argstr) ;

        this.win_.webContents.send(ev, args) ;
    }

    protected setView(view: string) {
        this.sendToRenderer('update-main-window-view', view) ;
    }
}
