//
// A scouting project
//
import * as fs from 'fs' ;
import * as path from 'path' ;
import { Team } from './team';
import { Match, MatchResult } from './match';
import { Tablet } from './tablet';
import { BlueAlliance } from '../bluealliance/ba';
import { FRCEvent } from './frcevent';
import { BrowserWindow } from 'electron';
import { MatchData } from './matchdata';
import { TeamData } from './teamdata';
import { SCBase } from '../base/scbase';
import { TeamTablet } from './teamtablet';
import { MatchTablet } from './matchtablet';
import * as sqlite3 from 'sqlite3' ;

export class ProjectInfo {
    public frcev_? : FRCEvent ;
    public name_? : string ;
    public teamform_? : string ;
    public matchform_? : string ;
    public tablets_? : Tablet[] ;
    public teams_? : Team[] ;
    public matches_? : Match[] ;
    public results_? : MatchResult[] ;
    public matchdata_? : MatchData ;
    public teamdata_? : TeamData ;
    public teamassignments_?: TeamTablet[] ;
    public matchassignements_?: MatchTablet[] ;
    public locked_ : boolean ;
    public teamdb_?: sqlite3.Database ;
    public matchdb_?: sqlite3.Database ;

    constructor() {
        this.locked_ = false ;
    }

    public get name() : string | undefined {
        return this.frcev_ ? this.frcev_.desc : this.name_ ; 
    }
}

export class Project {
    private static event_file_name : string  = "event.json" ;
    private static team_db_file_name: string = "teamdb" ;
    private static match_db_file_name: string = "matchdb" ;
    private static tabletTeam: string = "team" ;
    private static tabletMatch: string = "match" ;

    private location_ : string ;
    private info_ : ProjectInfo ;

    constructor(dir: string) {
        this.location_ = dir ;
        this.info_ = new ProjectInfo() ;

        let teamdbfile = path.join(this.location_, Project.team_db_file_name) ;
        let matchdbfile = path.join(this.location) ;
    }

    public get hasTeamData() : boolean {
        return this.info_.teamdata_ != undefined ;
    }

    public get hasMatchData() : boolean {
        return this.info_.matchdata_ != undefined ;
    }

    public get info() : ProjectInfo {
        return this.info_ ;
    }

    public get location() : string {
        return this.location_ ;
    }

    public lockEvent() : void {
        if (this.info_.matches_ && this.info_.teams_ && this.info_.teamform_ && this.info_.matchform_ && this.areTabletsValid()) {
            if (this.generateTabletSchedule()) {
                this.info_.locked_ = true ;
                this.writeEventFile() ;
            }
            else {
                this.info_.teamassignments_ = undefined ;
                this.info_.matchassignements_ = undefined ;
            }
        }
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

    private xferTeamDataToDB() {
        if (this.info_.teams_) {
            for(let team of this.info_.teams_!) {
                let sql = 'create table teams (' ;
            }
        }
    }

    private xferMatchResultsToDB() {

    }

    public loadMatchData(base: SCBase, ba: BlueAlliance, frcev: FRCEvent) : Promise<void> {
        let ret: Promise<void> = new Promise<void>((resolve, reject) => {
            ba.getMatches(frcev.evkey)
            .then((matches) => {
                if (matches.length > 0) {
                    this.info_.matches_ = matches ;
                    resolve() ;
                }
            })
            .catch((err) => {
                this.info_.frcev_ = undefined ;
                this.info_.teams_ = undefined ;
                reject(err) ;
            })
        }) ;
        
        return ret;
    }

    public areTabletsValid() : boolean {
        let matchcnt = 0 ;
        let teamcnt = 0 ;

        if (this.info.tablets_) {
            for(let tablet of this.info.tablets_) {
                if (tablet && tablet.purpose && tablet.purpose === Project.tabletTeam) {
                    teamcnt++ ;
                }

                if (tablet && tablet.purpose && tablet.purpose === Project.tabletMatch) {
                    matchcnt++ ;
                }
            }

        }

        return teamcnt >= 1 && matchcnt >= 6 ;
    }

    public setTeamData(data: any[]) {
        this.info_.teams_ = [] ;
        for(let d of data) {
            let team = new Team("", d.number_, "", d.nickname_, "", "", "", "", "", "", "", 0, 0) ;
            this.info_.teams_.push(team) ;
        }
        this.writeEventFile() ;
    }

    public setMatchData(data: any[]) {
        this.info.matches_ = []; 
        for(let d of data) {
            let match = new Match("", d.type_, 1, d.number_) ;
            match.red_alliance_ = { teams_ : d.red_ , surragate_teams_ : [], dq_teams_ : [] } ;
            match.blue_alliance_ = { teams_ : d.blue_ , surragate_teams_ : [], dq_teams_ : [] } ;
            this.info.matches_.push(match) ;
        }
        this.writeEventFile() ;
    }

    public setTabletData(data:any[]) {
        this.info.tablets_ = [] ;
        for(let tab of data) {
            let t = new Tablet(tab.name) ;
            if (tab.purpose) {
                t.purpose = tab.purpose ;
            }

            this.info.tablets_.push(t) ;
        }

        this.writeEventFile() ;
    }

    public loadBAEvent(base: SCBase, ba: BlueAlliance, frcev: FRCEvent) : Promise<void> {
        let ret: Promise<void> = new Promise<void>((resolve, reject) => {
            this.info_.frcev_ = frcev ;
            base.sendToRenderer('set-status-text', 'Loading teams from the event') ;
            ba.getTeams(frcev.evkey)
                .then((teams) => {
                    if (teams.length > 0) {
                        this.xferTeamDataToDB() ;
                        this.info_.teams_ = teams ;
                        let msg: string = teams.length + " teams loaded\n" ;
                        msg += "Loading matches from the event" ;
                        base.sendToRenderer('set-status-text', msg) ;
                        this.loadMatchData(base, ba, frcev)
                            .then(() => {
                                this.xferMatchResultsToDB() ;
                                let msg: string = teams.length + " teams loaded\n" ;
                                msg += this.info.matches_!.length + " matches loaded\n" ;
                                let err = this.writeEventFile() ;
                                if (err) {
                                    msg += "Error saving the event file - " + err.message + '\n' ;
                                }
                                else {
                                    msg += "Event file saved\n" ;
                                }
                                msg += "Event loaded sucessfully\n" ;
                                base.sendToRenderer('set-status-text', msg) ;
                                base.sendToRenderer('set-status-close-button-visible', true) ;
                                resolve() ;
                            })
                            .catch((err) => {
                                reject(err) ;
                            }) ;
                    }
                    else {
                        this.info_.frcev_ = undefined ;
                        base.sendToRenderer('set-status-text', "Event has no teams assigned yet, cannot load event from Blue Alliance") ;
                        base.sendToRenderer('set-status-close-button-visible', true) ;
                    }
                })
                .catch((err) => {
                    this.info_.frcev_ = undefined ;
                    reject(err) ;
                }) ;
        }) ;

        return ret;
    }

    public hasTeamScoutingResults(number: number) : boolean {
        return true;
    }

    public hasMatchScoutingResult(type: string, set: number, match: number, team: number) : boolean {
        let ret:boolean = false ;

        return ret ;
    }
    
    public getMatchScoutingTablet(type: string, set: number, match: number, team: number) : string {
        let ret: string = "" ;
        if (this.info.matchassignements_) {
            for(let t of this.info.matchassignements_) {
                if (t.type === type && t.set === set && t.matchnumber === match && t.teamnumber === team) {
                    ret = t.tablet ;
                    break ;
                }
            }
        }
        return ret ;
    }

    public findTeamByNumber(number: number) : Team | undefined {
        let ret: Team | undefined ;

        if (this.info_.teams_) {
            for(let t of this.info_.teams_) {
                if (t.number_ === number) {
                    ret = t ;
                    break ;
                }
            }   
        }

        return ret ;
    }

    private getTabletsForPurpose(purpose: string) : Tablet[] {
        let ret: Tablet[] = [] ;

        if (this.info_.tablets_) {
            for(let t of this.info_.tablets_) {
                if (t.purpose && t.purpose === purpose) {
                    ret.push(t) ;
                }
            }
        }
        return ret ;
    }

    private generateTabletSchedule() : boolean {
        let teamtab: Tablet[] = this.getTabletsForPurpose(Project.tabletTeam) ;
        let matchtab: Tablet[] = this.getTabletsForPurpose(Project.tabletMatch) ;

        if (teamtab.length < 1 || !this.info_.teams_ || matchtab.length < 6 || !this.info_.matches_) {
            return false;
        }

        let index = 0 ;
        this.info_.teamassignments_ = [] ;
        for(let t of this.info_.teams_) {
            let assignment = new TeamTablet(t.number_, teamtab[index].name) ;
            this.info_.teamassignments_.push(assignment);
            index++ ;
            if (index >= teamtab.length) {
                index = 0 ;
            }
        }

        let ma:MatchTablet ;
        index = 0 ;
        this.info_.matchassignements_ = [] ;

        for(let m of this.info_.matches_) {
            //
            // This should never happen.
            //
            if (!m.red_alliance_ || !m.blue_alliance_) {
                return false ;
            }

            ma = new MatchTablet(m.comp_level_, m.match_number_, m.set_number_, m.red_alliance_.teams_[0], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level_, m.match_number_, m.set_number_, m.red_alliance_.teams_[1], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }       
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level_, m.match_number_, m.set_number_, m.red_alliance_.teams_[2], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level_, m.match_number_, m.set_number_, m.blue_alliance_.teams_[0], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level_, m.match_number_, m.set_number_, m.blue_alliance_.teams_[1], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }            
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level_, m.match_number_, m.set_number_, m.blue_alliance_.teams_[2], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;
        }

        return true ;
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
