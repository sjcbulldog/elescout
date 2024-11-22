import {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  Menu,
  nativeImage,
} from "electron";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as winston from "winston";
import * as crypto from "crypto";
import settings from "electron-settings";

export enum XeroAppType {
  None,
  Central,
  Scouter,
  Coach,
}

export interface XeroVersion {
  major: number;
  minor: number;
  patch: number;
}

export abstract class SCBase {
  private static readonly appdirName = ".xeroscout";

  protected typestr_: string;
  protected win_: BrowserWindow;
  protected appdir_: string;
  public logger_: winston.Logger;

  protected constructor(win: BrowserWindow, type: string) {
    this.typestr_ = type;
    this.win_ = win;
    this.appdir_ = path.join(os.homedir(), SCBase.appdirName);

    if (!fs.existsSync(this.appdir_)) {
      fs.mkdirSync(this.appdir_);
    }

    let logdir = path.join(this.appdir_, "logs");
    if (!fs.existsSync(logdir)) {
      fs.mkdirSync(logdir);
    }

    let logfileName;

    if (this.isDevelop) {
      logfileName = "xeroscout-" + this.typestr_;
    } else {
      logfileName = this.createUniqueFilename(
        logdir,
        "xeroscout-" + this.typestr_
      );
    }
    logfileName += ".txt";

    if (fs.existsSync(logfileName)) {
      fs.rmSync(logfileName);
    }

    this.logger_ = winston.createLogger({
      level: this.isDevelop ? "silly" : "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss" }),
        winston.format.printf(
          (info) =>
            `${JSON.stringify({
              timestamp: info.timestamp,
              level: info.level,
              message: info.message,
              args: info.args,
            })}`
        )
      ),
      transports: [new winston.transports.File({ filename: logfileName })],
    });

    this.logger_.info({
      message: "XeroScout program started",
      args: {
        electronVersion: this.getVersion("electron"),
        application: this.getVersion("application"),
        nodejs: this.getVersion("nodejs"),
      },
    });
  }

  public abstract basePage(): string;
  public abstract sendNavData(): void;
  public abstract executeCommand(cmd: string): void;
  public abstract createMenu(): Menu | null;
  public abstract windowCreated(): void;
  public abstract canQuit(): boolean;

  // process.vesions.node
  // process.version

  public getVersion(type: string): XeroVersion {
    let str = "0.0.0";
    let ret = {
      major: -1,
      minor: -1,
      patch: -1,
    };

    if (type === "electron") {
      str = process.version.substring(1);
    } else if (type === "node") {
      str = process.versions.node as string;
    } else if (type === "application") {
      str = app.getVersion();
    }

    if (str) {
      let comps = str.split(".");
      if (comps.length === 3) {
        ret.major = +comps[0];
        ret.minor = +comps[1];
        ret.patch = +comps[2];
      }
    }

    return ret;
  }

  public setSetting(name: string, value: any) {
    settings.setSync(name, value);
  }

  public getSetting(name: string): any {
    return settings.getSync(name);
  }

  public hasSetting(name: string): boolean {
    return settings.hasSync(name);
  }

  public unsetSettings(name: string) {
    settings.unset(name);
  }

  public get isDevelop(): boolean {
    //
    // So, if the path to the executable contains both cygwin64 and my home directory, then
    // we are developing the application.  This puts the program in development mode which
    // primarily puts the log files in the home directory of the source instead of buried down
    // in the users home directory
    //
    return (
      process.argv[0].indexOf("cygwin64") != -1 &&
      process.argv[0].indexOf("butch") != -1
    );
  }

  public get applicationType(): XeroAppType {
    return XeroAppType.None;
  }

  public sendToRenderer(ev: string, ...args: any) {
    this.logger_.silly({
      message: "main -> renderer",
      args: {
        event: ev,
        evargs: args,
      },
    });

    this.win_.webContents.send(ev, args);
  }

  protected setView(view: string, ...args: any[]) {
    args.unshift(view) ;
    this.sendToRenderer("update-main-window-view", ...args);
  }

  private createUniqueFilename(
    directory: string,
    prefix: string = "file"
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
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

  private mapMatchType(mtype: string): number {
    let ret: number = -1;

    if (mtype === "f") {
      ret = 3;
    } else if (mtype === "sf") {
      ret = 2;
    } else {
      ret = 1;
    }

    return ret;
  }

  protected sortCompFun(a: any, b: any): number {
    let ret: number = 0;

    let atype = this.mapMatchType(a.comp_level);
    let btype = this.mapMatchType(b.comp_level);

    if (atype < btype) {
      ret = -1;
    } else if (atype > btype) {
      ret = 1;
    } else {
      if (a.match_number < b.match_number) {
        ret = -1;
      } else if (a.match_number > b.match_number) {
        ret = 1;
      } else {
        if (a.set_number < b.set_number) {
          ret = -1;
        } else if (a.set_number > b.set_number) {
          ret = 1;
        } else {
          ret = 0;
        }
      }
    }
    return ret;
  }
}
