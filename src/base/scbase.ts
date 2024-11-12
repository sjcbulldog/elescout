import { BrowserWindow, ipcMain, ipcRenderer, Menu } from "electron";
import * as path from 'path' ;
import * as os from 'os' ;
import * as fs from 'fs' ;
import * as winston from 'winston' ;
import * as crypto from 'crypto' ;

export abstract class SCBase {
    private static readonly appdirName = '.xeroscout' ;
    private static readonly isDevelop = true ;

    protected typestr_ : string ;
    protected win_ : BrowserWindow ;
    protected appdir_ : string ;
    protected logger_ : winston.Logger ;

    protected constructor(win: BrowserWindow, type: string) {
        this.typestr_ = type ;
        this.win_ = win;
        this.appdir_ = path.join(os.homedir(), SCBase.appdirName) ;

        if (!fs.existsSync(this.appdir_)) {
            fs.mkdirSync(this.appdir_) ;
        }

        let logdir = path.join(this.appdir_, "logs") ;
        if (!fs.existsSync(logdir)) {
            fs.mkdirSync(logdir) ;
        }

        let logfileName ;
        
        if (SCBase.isDevelop) {
            logfileName = 'xeroscout-' + this.typestr_ ;
        }
        else {
            logfileName = this.createUniqueFilename(logdir, 'xeroscout-' + this.typestr_) ;
        }
        logfileName += ".txt" ;

        if (fs.existsSync(logfileName)) {
            fs.rmSync(logfileName) ;
        }

        this.logger_ = winston.createLogger({
            level: 'silly',
            format: winston.format.json(),
            transports: [    
                new winston.transports.File({filename: logfileName})
            ]
        }) ;

        this.logger_.info('XeroScout program started') ;
    }

    public abstract basePage() : string ;
    public abstract sendNavData() : void ;
    public abstract executeCommand(cmd: string) : void ;
    public abstract createMenu() : Menu | null ;
    public abstract windowCreated() : void ;

    public isScoutingTablet() : boolean { 
        return true ;
    }

    public sendToRenderer(ev: string, ...args: any[]) {
        this.logger_.silly('sendToRenderer', ev, args);
        this.win_.webContents.send(ev, args) ;
    }

    protected setView(view: string) {
        this.sendToRenderer('update-main-window-view', view) ;
    }
    
    private createUniqueFilename(directory: string, prefix: string = 'file') : string{
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const filename = `${prefix}-${timestamp}-${randomString}.txt`; 
        const fullPath = path.join(directory, filename);
      
        // Check if the file already exists
        if (fs.existsSync(fullPath)) {
          // If it does, try again recursively
          return this.createUniqueFilename(directory, prefix);
        } else {
          return fullPath;
        }
      }
}
