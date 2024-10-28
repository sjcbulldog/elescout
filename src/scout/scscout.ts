import { BrowserWindow } from "electron";
import { SCBase } from "../base/scbase";

export class SCScout extends SCBase {
    public constructor(win: BrowserWindow) {
        super(win) ;
    }
    
    public basePage() : string  {
        return "content/scscouter/scouter.html"
    }

    public sendTreeData() : any {
        return null ;
    }    

    public executeCommand(cmd: string) : void {   
    }
}