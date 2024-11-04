import { BrowserWindow, Menu, MenuItem } from "electron";
import { SCBase } from "../base/scbase";

export class SCScout extends SCBase {
    public constructor(win: BrowserWindow) {
        super(win) ;
    }
    
    public basePage() : string  {
        return "content/scscouter/scouter.html"
    }

    public sendNavData() : any {
        this.sendToRenderer('send-tree-data', null);
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