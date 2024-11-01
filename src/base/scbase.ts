import { BrowserWindow, ipcMain, ipcRenderer, Menu } from "electron";

export abstract class SCBase {
    protected win_ : BrowserWindow ;

    protected constructor(win: BrowserWindow) {
        this.win_ = win;
    }

    public sendToRenderer(ev: string, ...args: any[]) {
        this.win_.webContents.send(ev, args) ;
    }

    public isScoutingTablet() : boolean { return true ;}
    public abstract basePage() : string ;
    public abstract sendTreeData() : void ;
    public abstract executeCommand(cmd: string) : void ;
    public abstract createMenu() : Menu | null ;
}
