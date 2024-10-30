//
// A scouting project
//
import * as fs from 'fs' ;
import * as path from 'path' ;
import { Team } from './team';
import { Match } from './match';
import { Tablets } from './tablets';
import { BlueAlliance } from '../bluealliance/ba';
import { FRCEvent } from './frcevent';
import { BrowserWindow } from 'electron';

export class ProjectInfo {
    public frcev_? : FRCEvent ;
    public teamform_? : string ;
    public matchform_? : string ;
    public tablets_? : Tablets ;
    public teams_? : Team[] ;
    public matches_? : Match[] ;
}

export class Project {
    private static event_file_name : string  = "event.json" ;

    private location_ : string ;
    private info_ : ProjectInfo ;

    constructor(dir: string) {
        this.location_ = dir ;
        this.info_ = new ProjectInfo() ;
    }

    public get info() : ProjectInfo {
        return this.info_ ;
    }

    public get location() : string {
        return this.location_ ;
    }

    public setTeamForm(form: string) {
        let teamform: string = path.join(this.location_, "teamform") + path.extname(form) ;
        fs.copyFileSync(form, teamform) ;
        this.info_.teamform_ = teamform ;
        this.writeEventFile() ;
    }

    public setMatchForm(form: string) {
        let matchform: string = path.join(this.location_, "matchform") + path.extname(form) ;
        fs.copyFileSync(form, matchform) ;        
        this.info_.matchform_ = matchform ;
        this.writeEventFile() ;        
    }

    public static async createEvent(dir: string) : Promise<Project> {
        let ret: Promise<Project> = new Promise<Project>((resolve, reject) => {
            if (!fs.existsSync(dir)) {
                //
                // Does not exist, create it
                //
                fs.mkdirSync(dir) ;
                if (!fs.existsSync(dir)) {
                    let err : Error = new Error("could not create directory '" + dir + "' for new event") ;
                    reject(err) ;
                }
            } else if (!Project.isDirectoryEmpty(dir)) {
                //
                // The directory exists, it must be empty
                //
                let err : Error = new Error("directory '" + dir + "' is not empty, cannot use a new event directory") ;
                reject(err) ;
            }

            let proj: Project = new Project(dir) ;
            let err = proj.writeEventFile() ;
            if (err) {
                reject(err) ;
            }

            resolve(proj) ;
        }) ;

        return ret ;
    }

    public static async openEvent(filepath: string) : Promise<Project> {
        let ret: Promise<Project> = new Promise<Project>((resolve, reject) => {

            let loc: string = path.dirname(filepath) ;
            let file: string = path.basename(filepath) ;

            if (file !== Project.event_file_name) {
                let err = new Error("the file selected was not an event file, name should be '" + Project.event_file_name + "'") ;
                reject(err) ;
            }

            let proj: Project = new Project(loc) ;
            let err = proj.readEventFile() ;
            if (err) {
                reject(err) ;
            }

            resolve(proj) ;
        }) ;

        return ret ;
    }

    public loadBAEvent(win: BrowserWindow, ba: BlueAlliance, frcev: FRCEvent) : Promise<void> {
        let ret: Promise<void> = new Promise<void>((resolve, reject) => {
            this.info_.frcev_ = frcev ;
            win.webContents.send('update-status-text', 'Loading teams from the event') ;
            ba.getTeams(frcev.evkey)
                .then((teams) => {
                    
                    this.info_.teams_ = teams ;
                    let msg: string = teams.length + " teams loaded\n" ;
                    msg += "Loading matches from the event" ;
                    win.webContents.send('update-status-text', msg) ;

                    ba.getMatches(frcev.evkey)
                        .then((matches) => {
                            if (matches.length > 0) {
                                this.info_.matches_ = matches ;
                            }

                            let msg: string = teams.length + " teams loaded\n" ;
                            msg += matches.length + " matches loaded\n" ;
                            msg += "Event loaded sucessfully" ;
                            win.webContents.send('update-status-text', msg) ;
                            win.webContents.send('update-status-close-button', true) ;

                        })
                        .catch((err) => {
                            this.info_.frcev_ = undefined ;
                            this.info_.teams_ = undefined ;
                            reject(err) ;
                        })
                })
                .catch((err) => {
                    this.info_.frcev_ = undefined ;
                    reject(err) ;
                }) ;
        }) ;

        return ret;
    }

    private readEventFile() : Error | undefined {
        let ret : Error | undefined = undefined ;

        let projfile = path.join(this.location_, Project.event_file_name) ;
        if (!fs.existsSync(projfile)) {
            ret = new Error("the directory '" + this.location_ + "' is not a valid event project, missing file '" + Project.event_file_name + "'") ;
        }
        else {
            const rawData = fs.readFileSync(projfile, 'utf-8');
            this.info_ = JSON.parse(rawData) as ProjectInfo ;
        }
        
        return ret ;
    }

    private writeEventFile() : Error | undefined {
        let ret: Error | undefined = undefined ;

        const jsonString = JSON.stringify(this.info_);

        // Write the string to a file
        let projfile = path.join(this.location_, Project.event_file_name) ;
        fs.writeFile(projfile, jsonString, (err) => {
            if (err) {
                fs.rmSync(projfile) ;   
                ret = err ;
            }
        });
        
        return ret;
    } 

    private static isDirectoryEmpty(path: string) : boolean {
        let ret: boolean = true ;

        try {
            const files = fs.readdirSync(path);
            ret = (files.length === 0) ;
        } catch (err) {
            ret = false ;
        }

        return ret;
    }
}
