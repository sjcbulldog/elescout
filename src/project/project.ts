//
// A scouting project
//
import * as fs from 'fs' ;
import * as path from 'path' ;
import { Tablet } from './tablet';
import { BlueAlliance } from '../extnet/ba';
import { SCBase } from '../apps/scbase';
import { TeamTablet } from './teamtablet';
import { MatchTablet } from './matchtablet';
import * as sqlite3 from 'sqlite3' ;
import * as uuid from 'uuid' ;
import { SCCentral } from '../apps/sccentral';
import { TeamDataModel } from '../model/teammodel';
import { MatchDataModel } from '../model/matchmodel';
import winston from 'winston';
import { BAEvent, BAMatch, BATeam } from '../extnet/badata';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';
import { OPRCalculator } from '../math/OPRCalculator';
import { StatBotics } from '../extnet/statbotics';

export interface ProjectOneColCfg {
    name: string,
    width: number,
    hidden: boolean,
}

export interface ProjColConfig
{
    columns: ProjectOneColCfg[],
    frozenColumnCount: number,
} ;

export class ProjectInfo {
    public frcev_? : BAEvent ;                          // Information defining the blue alliance event, null for non-BA events
    public uuid_? : string ;                            // The UUID for this event, will be sent to tablets via sync
    public name_? : string ;                            // The name of this event if a non-BA event (i.e. frcev_ === null)
    public teamform_? : string ;                        // The path to the form for team scouting
    public matchform_? : string ;                       // The path to the form for match scouting
    public tablets_? : Tablet[] ;                       // The set of tablets to be used for scouting
    public teams_? : BATeam[] ;                         // The set of teams at the event
    public matches_? : BAMatch[] ;                      // The set of matches for the event
    public teamassignments_?: TeamTablet[] ;            // The tablets assignments to teams for team scouting
    public matchassignements_?: MatchTablet[] ;         // The tablets assignments to matches for match scouting
    public locked_ : boolean ;                          // If true, the event is locked and ready for scouting
    public teamdb_?: sqlite3.Database ;                 // The database containing team information
    public matchdb_?: sqlite3.Database ;                // The database containing match information
    public scouted_team_: number[] = [] ;               // The list of teams that have scouting data
    public scouted_match_: string[] = [] ;              // The list of matches that have scouring data
    public matchdb_col_config_? : ProjColConfig ; // List of hidden columns in match data
    public teamdb_col_config_? : ProjColConfig ;  // List of hidden columns in team data

    constructor() {
        this.locked_ = false ;
    }

    public getName() : string | undefined {
        let ret: string | undefined = undefined ;

        if (this.frcev_ !== undefined) {
            ret = this.frcev_.name ;
        }
        else {
            ret = this.name_ ;
        }

        return ret ;
    }
}

export class Project {
    private static readonly event_file_name : string  = "event.json" ;
    private static readonly team_db_file_name: string = "teamdb" ;
    private static readonly match_db_file_name: string = "matchdb" ;
    private static readonly tabletTeam: string = "team" ;
    private static readonly tabletMatch: string = "match" ;

    private location_ : string ;
    private info_ : ProjectInfo ;
    private teamdb_ : TeamDataModel ;
    private matchdb_ : MatchDataModel ;
    private logger_ : winston.Logger ;
    private year_ : number ;

    constructor(logger: winston.Logger, dir: string, year: number) {
        this.location_ = dir ;
        this.info_ = new ProjectInfo() ;
        this.logger_ = logger ;
        this.year_ = year ;

        let filename: string ;

        filename = path.join(dir, 'team.db') ;
        this.teamdb_ = new TeamDataModel(filename, logger) ;

        filename = path.join(dir, 'match.db') ;
        this.matchdb_ = new MatchDataModel(filename, logger) ;
    }

    public init() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            this.teamdb_.init()
                .then(() => {
                    this.matchdb_.init()
                        .then(()=> {
                            resolve() ;
                        })
                        .catch((err) => {
                            reject(err) ;
                        })
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;

        return ret;
    }

    public closeEvent() {
        this.writeEventFile() ;
        this.info_ = new ProjectInfo() ;
    }

    public setMatchColConfig(data: any) {
        this.info.matchdb_col_config_ = data ;
        this.writeEventFile() ;
    }

    public setTeamColConfig(data: any) {
        this.info.teamdb_col_config_ = data ;
        this.writeEventFile() ;
    }

    public async processResults(obj: any) {
        if (obj.purpose) {
            if (obj.purpose === 'match') {
                let status = await this.matchDB.processScoutingResults(obj.results) ;
                for(let st of status) {
                    if (!this.info_.scouted_match_.includes(st)) {
                        this.info_.scouted_match_.push(st) ;
                    }
                }
            }
            else {
                let teams = await this.teamDB.processScoutingResults(obj.results) ;
                for (let st of teams) {
                    if (!this.info_.scouted_team_.includes(st)) {
                        this.info_.scouted_team_.push(st) ;
                    }
                }
            }
        }
    }

    public get teamDB() : TeamDataModel {
        return this.teamdb_ ;
    }

    public get matchDB() : MatchDataModel {
        return this.matchdb_ ;
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
                this.info_.uuid_ = uuid.v4() ;
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

    public static async createEvent(logger: winston.Logger, dir: string, year: number) : Promise<Project> {
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

            let proj: Project = new Project(logger, dir, year) ;
            let err = proj.writeEventFile() ;
            if (err) {
                reject(err) ;
            }

            proj.init()
                .then(() => {
                    resolve(proj) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;

        return ret ;
    }

    public static async openEvent(logger: winston.Logger, filepath: string, year: number) : Promise<Project> {
        let ret: Promise<Project> = new Promise<Project>((resolve, reject) => {

            let loc: string = path.dirname(filepath) ;
            let file: string = path.basename(filepath) ;

            if (file !== Project.event_file_name) {
                let err = new Error("the file selected was not an event file, name should be '" + Project.event_file_name + "'") ;
                reject(err) ;
            }

            let proj: Project = new Project(logger, loc, year) ;
            let err = proj.readEventFile() ;
            if (err) {
                reject(err) ;
            }
            proj.init()
                .then(() => {
                    resolve(proj) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;

        return ret ;
    }

    public loadMatchData(base: SCBase, ba: BlueAlliance, sb: StatBotics, frcev: BAEvent, callback?: (result: string) => void) : Promise<number> {
        let ret: Promise<number> = new Promise<number>(async (resolve, reject) => {
            try {
                let matches = await ba.getMatches(frcev.key);
                if (callback) {
                    callback('received ' + matches.length + ' matches<br><br>') ;
                }
                if (matches.length > 0) {
                    this.info_.matches_ = matches ;
                    if (callback) {
                        callback('Inserting match data into database ... ');
                    }
                    await this.matchDB.processBAData(matches) ;
                    if (callback) {
                        callback('inserted ' + matches.length + ' matches<br><br>') ;
                        callback('Requesting ranking data from the Blue Alliance ...');
                    }
                    let rankings = await this.loadRanking(ba);
                    if (callback) {
                        callback(' received ' + rankings.rankings.length + ' records<br><br>') ;
                    }

                    if (rankings.rankings && rankings.rankings.length > 0) {
                        if (callback) {
                            callback('Inserting rankings data into the database ... ') ;
                        }
                        await this.teamDB.processRankings(rankings.rankings) ;

                        if (callback) {
                            callback(' inserted ' + rankings.rankings.length + ' records<br><br>') ;
                        }
                    }

                    if (callback) {
                        callback('Requesting statistics data from statbotics ...')
                    }

                    let stats = await this.loadStatbotics(sb) ;

                    if (callback) {
                        callback(' received ' + stats.length + ' records of data.<br><br>')
                    }

                    if (stats && stats.length > 0) {
                        if (callback) {
                            callback('Inserting statistics data into the database ... ') ;
                        }
                        await this.teamDB.processStats(stats) ;
                        if (callback) {
                            callback(' inserted ' + stats.length + ' records<br><br>') ;
                        }
                    }
                }
                resolve(matches.length) ;
            } 
            catch(err) {
                this.info_.frcev_ = undefined ;
                this.info_.teams_ = undefined ;
                reject(err) ;
            }
        }) ;
        
        return ret;
    }

    public loadStatbotics(sb: StatBotics) : Promise<any[]> {
        let ret = new Promise<any[]>(async (resolve, reject) => {
            if (this.info_.teams_) {
                let teams = this.info_.teams_.map((v)=> { return v.team_number}) ;
                try {
                    let stats = await sb.getStats(teams) ;
                    resolve(stats) ;
                }
                catch(err) {
                    reject(err) ;
                }
            }
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

    public setEventName(name: string) {
        this.info_.name_ = name ;
        this.writeEventFile() ;
    }

    public setTeamData(data: any[]) {
        this.info_.teams_ = [] ;
        for(let d of data) {
            let team : BATeam = {
                key: d.team_number,
                team_number: d.team_number,
                nickname: d.nickname,
                name: d.nickname,
                school_name: '',
                city: '',
                state_prov: '',
                country: '',
                address: '',
                postal_code: '',
                gmaps_place_id: '',
                gmaps_url: '',
                lat: 0,
                lng: 0,
                location_name: '',
                website: '',
                rookie_year: 0
            }
            this.info_.teams_.push(team) ;
        }
        this.writeEventFile() ;
        this.teamDB.processBAData(this.info_.teams_!) ;
    }

    //
    // This is called from the renderer for events that are not created using
    // Blue Alliance.  The data from the UI side of the application is sent to this
    // method to initialize the the match list.
    //
    public async setMatchData(data: any[]) {
        this.info.matches_ = []; 
        for(let d of data) {
            let match: BAMatch = {
                key: d.comp_level + '-' + d.set_number + '-' + d.match_number,
                comp_level: d.comp_level,
                set_number: d.set_number,
                match_number: d.match_number,
                alliances: {
                  red: {
                    score: 0,
                    team_keys: [d.red[0], d.red[1], d.red[2]],
                    surrogate_team_keys: [],
                    dq_team_keys: []
                  },
                  blue: {
                    score: 0,
                    team_keys: [ d.blue[0], d.blue[1], d.blue[2]],
                    surrogate_team_keys: [],
                    dq_team_keys: []
                  }
                },
                winning_alliance: '',
                event_key: '',
                time: 0,
                actual_time: 0,
                predicted_time: 0,
                post_result_time: 0,
                score_breakdown: {
                  blue: undefined,
                  red: undefined,
                },
                videos: []
            } ;
            this.info.matches_.push(match) ;
        }
        this.writeEventFile() ;
        await this.matchDB.processBAData(this.info.matches_) ;
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

    public loadBAEvent(base: SCCentral, ba: BlueAlliance, sb: StatBotics, frcev: BAEvent) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            this.info_.frcev_ = frcev ;
            base.sendToRenderer('set-status-text', 'Loading teams from the event') ;
            try {
                let teams = await ba.getTeams(frcev.key) ;
                if (teams.length > 0) {
                    await this.teamDB.processBAData(teams) ;
                    this.info_.teams_ = teams ;
                    let msg: string = teams.length + " teams loaded\n" ;
                    msg += "Loading matches from the event" ;
                    base.sendToRenderer('set-status-text', msg) ;
                    await this.loadMatchData(base, ba, sb, frcev)
                    msg = teams.length + " teams loaded\n" ;
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
                }
                else {
                    this.info_.frcev_ = undefined ;
                    base.sendToRenderer('set-status-text', "Event has no teams assigned yet, cannot load event from Blue Alliance") ;
                    base.sendToRenderer('set-status-close-button-visible', true) ;
                }
                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret;
    }

    public hasTeamScoutingResults(team: number) : boolean {
        return this.info_.scouted_team_.includes(team) ;
    }

    public hasMatchScoutingResult(type: string, set: number, match: number, team: string) : string {
        let str: string = 'sm-' + type + '-' + set + '-' + match + '-' + team ;
        return this.info_.scouted_match_.includes(str) ? 'Y' : 'N' ;
    }
    
    public getMatchScoutingTablet(type: string, set: number, match: number, teamkey: string) : string {
        let ret: string = "" ;
        if (this.info.matchassignements_) {
            for(let t of this.info.matchassignements_) {
                if (t.type === type && t.setno === set && t.matchno === match && t.teamkey === teamkey) {
                    ret = t.tablet ;
                    break ;
                }
            }
        }
        return ret ;
    }

    public findTeamByNumber(number: number) : BATeam | undefined {
        let ret: BATeam | undefined ;

        if (this.info_.teams_) {
            for(let t of this.info_.teams_) {
                if (t.team_number === number) {
                    ret = t ;
                    break ;
                }
            }   
        }

        return ret ;
    }

    public findTabletForMatch(type:string, setno: number, matchno: number, team: string) : string {
        let ret: string = '????';

        if (this.info_.matchassignements_) {
            for(let t of this.info_.matchassignements_) {
                if (t.type === type && t.setno === setno && t.matchno === matchno && t.teamkey === team) {
                    ret = t.tablet ;
                    break ;
                }
            }
        }

        return ret ;
    }

    private loadRanking(ba: BlueAlliance) : Promise<any> {
        let ret = new Promise<any>((resolve, reject) => {
            ba.getRankings(this.info_.frcev_?.key!)
                .then((obj) => {
                    resolve(obj) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;
        return ret;
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
            let assignment = new TeamTablet(t.team_number, teamtab[index].name) ;
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
            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, m.alliances.red.team_keys[0], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, m.alliances.red.team_keys[1], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }       
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, m.alliances.red.team_keys[2], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, m.alliances.blue.team_keys[0], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, m.alliances.blue.team_keys[1], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }            
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, m.alliances.blue.team_keys[2], matchtab[index].name) ;
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
