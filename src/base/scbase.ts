import { BrowserWindow, ipcMain, ipcRenderer, Menu } from "electron";

export abstract class SCBase {
    protected win_ : BrowserWindow ;

    protected constructor(win: BrowserWindow) {
        this.win_ = win;
    }

    public sendToRenderer(ev: string, ...args: any[]) {
        let argstr = '' ;
        for(let arg of args) {
            argstr += ' \'' + arg + '\'' ;
        }
        console.log('sendToRenderer: \'' + ev + '\'' + argstr) ;

        this.win_.webContents.send(ev, args) ;
    }

    public setView(view: string) {
        this.sendToRenderer('update-main-window-view', view) ;
    }

    public isScoutingTablet() : boolean { return true ;}
    public abstract basePage() : string ;
    public abstract sendTreeData() : void ;
    public abstract executeCommand(cmd: string) : void ;
    public abstract createMenu() : Menu | null ;
}
