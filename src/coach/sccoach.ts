import { BrowserWindow, Menu, MenuItem } from "electron";
import { SCBase } from "../base/scbase";

export class SCCoach extends SCBase {
    public constructor(win: BrowserWindow) {
        super(win, 'coach') ;
    }
    
    public basePage() : string  {
        return "content/scscouter/sccoach.html"
    }

    public sendNavData() : any {
        this.sendToRenderer('send-tree-data', null);
    }   

    public windowCreated(): void {
    }

    public executeCommand(cmd: string) : void {   
    }

    public createMenu() : Menu | null {
        let ret: Menu | null = new Menu() ;

        let filemenu: MenuItem = new MenuItem( {
            type: "submenu",
            label: "File",
            role: "fileMenu"
        }) ;

        ret.append(filemenu) ;

        return ret;
    }    
}