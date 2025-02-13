//
// A scouting project
//

// #region imports
import * as fs from 'fs' ;
import * as path from 'path' ;
import * as sqlite3 from 'sqlite3' ;
import * as uuid from 'uuid' ;
import { format } from '@fast-csv/format';
import { Tablet } from './tablet';
import { BlueAlliance } from '../extnet/ba';
import { TeamTablet } from './teamtablet';
import { MatchTablet } from './matchtablet';

import { TeamDataModel } from '../model/teammodel';
import { MatchDataModel } from '../model/matchmodel';
import winston from 'winston';
import { BAEvent, BAMatch, BATeam } from '../extnet/badata';
import { StatBotics } from '../extnet/statbotics';
import { DataGenerator } from './datagen';
import { FieldAndType } from '../model/datamodel';
import { SCBase } from '../apps/scbase';
import { ScoutingData } from '../comms/resultsifc';

// #endregion

// #region interfaces used by the project

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

export interface ProjPicklistNotes
{
    teamnumber: number,
    picknotes: string
}

export interface ProjPicklistColumn {
    name: string,
    width: number
}

export interface PickList {
    name: string ;
    teams: number[] ;
    columns: ProjPicklistColumn[] ;
    notes: ProjPicklistNotes[];
}

export interface NamedGraphDataRequest {
    name: string;
    teams: number[];
    data: {
      leftteam: string[];
      leftmatch: string[];
      rightteam: string[];
      rightmatch: string[];
    };
  }

// #endregion

// #region information stored in project file
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
    public matchdb_col_config_? : ProjColConfig ;       // List of hidden columns in match data
    public teamdb_col_config_? : ProjColConfig ;        // List of hidden columns in team data
    public zebra_tag_data_?: any ;                      // Zebra tag data
    public team_graph_data_: NamedGraphDataRequest[] ;  // Stored graphs defined by the user
    public picklist_ : PickList[] = [] ;                // Pick list, a list of team number
    public last_picklist_? : string ;                   // The last picklist used
    public single_team_match_: string[] = [] ;          // The match fields for the single team summary
    public single_team_team_: string[] = [] ;           // The team feields for the single team summary
    public sync_data_ : ScoutingData[] = [] ;           // The scouting results from sync operation, we hold on to this to 
                                                        // send it backs

    constructor() {
        this.locked_ = false ;
        this.team_graph_data_ = [] ;
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

// #endregion

export class Project {
    private static readonly keepLotsOfBackups = true ;
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
        this.teamdb_.on('column-added', this.teamColumnAdded.bind(this)) ;

        filename = path.join(dir, 'match.db') ;
        this.matchdb_ = new MatchDataModel(filename, logger) ;
        this.matchdb_.on('column-added', this.matchColumnAdded.bind(this));
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

    //
    // For a given field, either team or match, and a given team, get the
    // value of the field.  For team fields, it is the data stored for that
    // field.  For match fields, the data is processes over all matches to get
    // an average.
    //   
	public getData(field: string, team: number) : Promise<number> {
		let ret = new Promise<number>(async (resolve, reject) => {
			let tcols = await this.teamDB.getColumnNames(TeamDataModel.TeamTableName) ;
			if (tcols.includes(field)) {
				let v = await this.getTeamData(field, team) ;
				resolve(v) ;
			}

			let mcols = await this.matchDB.getColumnNames(MatchDataModel.MatchTableName) ;
			if (mcols.includes(field)) {
				let v = await this.getMatchData(field, team) ;
				resolve(v) ;
			}
		}) ;
		return ret;
	}

    public findMatchByKey(key: string) : BAMatch | undefined {
        let ret: BAMatch | undefined ;

        if (this.info_.matches_) {
            for(let one of this.info_.matches_) {
                if (one.key === key) {
                    ret = one ;
                    break ;
                }
            }
        }

        return ret;
    }

    public isTabletTeam(tablet: string) {
        for(let assign of this.info_.teamassignments_!) {
            if (assign.tablet === tablet) {
                return true ;
            }
        }

        return false ;
    }

    public async processResults(obj: ScoutingData) {
        if (obj.purpose) {
            if (obj.purpose === 'match') {
                let status = await this.matchDB.processScoutingResults(obj) ;
                for(let st of status) {
                    if (!this.info_.scouted_match_.includes(st)) {
                        this.info_.scouted_match_.push(st) ;
                    }
                }
            }
            else {
                let teams = await this.teamDB.processScoutingResults(obj) ;
                for (let st of teams) {
                    if (!this.info_.scouted_team_.includes(st)) {
                        this.info_.scouted_team_.push(st) ;
                    }
                }
            }
        }
        this.writeEventFile() ;
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

    private getTableForTeam(team: string) {
        
    }

    public generateRandomData() {
        if (this.info_.teamform_ && this.info_.teams_) {
            let teams = this.info_!.teams_!.map((v)=> { return 'st-' + v.team_number}) ;

            let gendata: DataGenerator = new DataGenerator(this.info_.teamform_);
            let results = gendata.generateData(teams) ;
            if (results) {
                let obj = {
                    purpose: "team",
                    results: results,
                    tablet: '',
                } ;
                this.processResults(obj) ;
            }
        }

        if (this.info_.matchform_ && this.info_.matches_) {
            let matches:string[] = [] ;
            for(let match of this.info_.matches_) {
                for(let i = 0 ; i < 3 ; i++) {
                    let blue = 'sm-'+ match.comp_level + '-' + match.set_number + '-' + 
                              match.match_number + '-' + match.alliances.blue.team_keys[i] ;
                    matches.push(blue) ;
                    let red = 'sm-'+match.comp_level + '-' + match.set_number + '-' + 
                              match.match_number + '-' + match.alliances.red.team_keys[i] ;
                    matches.push(red) ;
                }
            }

            let gendata: DataGenerator = new DataGenerator(this.info_.matchform_);
            let results = gendata.generateData(matches) ;
            if (results) {
                let obj = {
                    purpose: "match",
                    results: results,
                    tablet: '',
                } ;
                this.processResults(obj) ;
            }
        }
    }

    public async lockEvent() : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            if (this.info_.matches_ && this.info_.teams_ && this.info_.teamform_ && this.info_.matchform_ && this.areTabletsValid()) {
                try {
                    await this.teamDB.processBAData(this.info_.teams_) ;
                    await this.matchDB.processBAData(this.info_.matches_, false) ;
                }
                catch(err) {
                    this.teamDB.remove() ;
                    this.matchDB.remove() ;
                    reject(err) ;
                }

                if (this.generateTabletSchedule()) {
                    this.populateDBWithForms()
                        .then(()=> {
                            this.info_.locked_ = true ;
                            this.info_.uuid_ = uuid.v4() ;
                            this.writeEventFile() ;
                            resolve() ;
                        })
                        .catch((err) => {
                            this.teamDB.remove() ;
                            this.matchDB.remove() ;
                            this.info_.teamassignments_ = undefined ;
                            this.info_.matchassignements_ = undefined ;                            
                            reject(err) ;
                        }) ;
                }
                else {
                    this.info_.teamassignments_ = undefined ;
                    this.info_.matchassignements_ = undefined ;
                    reject(new Error('could not generate tablet schedule for scouting')) ;
                }
            }
            else {
                reject(new Error('event is not ready to be locked, missing matches, teams, forms, or table assignments')) ;
            }
        }) ;

        return ret;
    }

    private xlateType(type: string) {
        let ret = 'text' ;

        switch(type) {
            case 'boolean':
                ret = 'INTEGER';
                break;

            case 'text':
            case 'choice':
                ret = 'TEXT' ;
                break ;

            case 'updown':
                ret = 'REAL';
                break; 

            default:
                ret = 'TEXT' ;
                break ;
        }

        return ret ;
    }

    private xlate(fields: FieldAndType[]) {
        let ret: FieldAndType[] = [] ;

        for(let one of fields) {
            let obj = {
                name: one.name,
                type: this.xlateType(one.type),
            };
            ret.push(obj) ;
        }

        return ret;
    }

    private populateDBWithForms() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            if (!this.info.teamform_) {
                reject(new Error('Internal Error - team form is not set while locking event')) ;
            }

            if (!this.info.matchform_) {
                reject(new Error('Internal Error - match form is not set while locking event')) ;
            }

            let tcols = this.getFormItemNames(this.info.teamform_!) ;
            if (tcols instanceof Error) {
                reject(tcols) ;
            }

            let mcols = this.getFormItemNames(this.info.matchform_!) ;
            if (mcols instanceof Error) {
                reject(mcols) ;
            }

            this.teamDB.createColumns(TeamDataModel.TeamTableName, this.xlate(tcols as FieldAndType[]))
                .then(() => {
                    this.matchDB.createColumns(MatchDataModel.MatchTableName, this.xlate(mcols as FieldAndType[]))
                    .then(() => {
                        resolve() ;
                    }) ;
                })
            .catch((err) => {
                reject(err) ;
            })
        }) ;

        return ret;
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
            logger.info('Creating event in directory \'' + dir + '\'') ;

            if (!fs.existsSync(dir)) {
                logger.info('    directory does not exist, creating directory \'' + dir + '\'') ;
                //
                // Does not exist, create it
                //
                fs.mkdirSync(dir) ;
                if (!fs.existsSync(dir)) {
                    let err : Error = new Error("could not create directory '" + dir + "' for new event") ;
                    logger.error('    directory does not exist, create directory failed', err) ;
                    reject(err) ;
                }
            } else if (!Project.isDirectoryEmpty(dir)) {
                //
                // The directory exists, it must be empty
                //
                let err : Error = new Error("directory '" + dir + "' is not empty, cannot use a new event directory") ;
                logger.error('    directory is not empty, location \'' + dir + '\'') ;
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

            logger.info('Open event, location \'' + filepath + '\'') ;

            let loc: string = path.dirname(filepath) ;
            let file: string = path.basename(filepath) ;

            if (file !== Project.event_file_name) {
                let err = new Error("the file selected was not an event file, name should be '" + Project.event_file_name + "'") ;
                logger.error(err) ;
                reject(err) ;
                return ;
            }

            if (!fs.existsSync(filepath)) {
                let err = new Error('the file selected \'' + filepath + '\'does not exist') ;
                logger.error(err) ;
                reject(err) ;
                return ;
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
                if (t.comp_level === type && t.set_number === set && t.match_number === match && t.teamkey === teamkey) {
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

    public findTabletForMatch(type:string, set_number: number, match_number: number, team: string) : string {
        let ret: string = '????';

        if (this.info_.matchassignements_) {
            for(let t of this.info_.matchassignements_) {
                if (t.comp_level === type && t.set_number === set_number && t.match_number === match_number && t.teamkey === team) {
                    ret = t.tablet ;
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
            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, 'red', m.alliances.red.team_keys[0], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, 'red', m.alliances.red.team_keys[1], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }       
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, 'red', m.alliances.red.team_keys[2], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, 'blue', m.alliances.blue.team_keys[0], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, 'blue', m.alliances.blue.team_keys[1], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }            
            this.info_.matchassignements_.push(ma) ;

            ma = new MatchTablet(m.comp_level, m.match_number, m.set_number, 'blue', m.alliances.blue.team_keys[2], matchtab[index].name) ;
            index++ ;
            if (index >= matchtab.length) {
                index = 0 ;
            }
            this.info_.matchassignements_.push(ma) ;
        }

        return true ;
    }

    public deletePicklist(name: string) {
        let which = -1 ;
        for(let i = 0 ; i < this.info_.picklist_.length; i++) {
            if(this.info_.picklist_[i].name === name) {
                which = i ;
                break ;
            }
        }

        if (which !== -1) {
            if (which === 0 && this.info_.picklist_.length === 1) {
                this.info_.picklist_ = [] ;
            }
            else {
                this.info_.picklist_.splice(which, 1) ;
            }
            this.writeEventFile() ;
        }
    }

    public addPicklist(name: string) {
        let tnum: number[] = [] ;
        for(let t of this.info.teams_!) {
            tnum.push(t.team_number) ;
        }

        let picklist = {
            name: name,
            teams: tnum,
            columns: [],
            notes: []
        }
        this.info_.picklist_.push(picklist) ;
        this.writeEventFile();
    }

    public findPicklistByName(name: string) : PickList | undefined {
        for(let picklist of this.info_.picklist_) {
            if (picklist.name === name)
                return picklist ;
        }

        return undefined ;
    }

    public setPicklistCols(name: string, cols: ProjPicklistColumn[]) {
        let picklist = this.findPicklistByName(name) ;
        if (picklist) {
            picklist.columns = cols ;
        }
        this.writeEventFile() ;
    }

    public setPicklistNotes(name: string, notes: ProjPicklistNotes[]) {
        let picklist = this.findPicklistByName(name) ;
        if (picklist) {
            picklist.notes = notes ;
        }
        this.writeEventFile() ;
    }

    public setPicklistData(name: string, teams: number[]) {
        let picklist = this.findPicklistByName(name) ;
        if (picklist) {
            picklist.teams = teams ;
        }
        this.writeEventFile() ;
    }

    public setSingleTeamFields(team: string[], match: string[]) {
        this.info_.single_team_match_ = match ;
        this.info_.single_team_team_ = team ;
        this.writeEventFile() ;
    }

    private readEventFile() : Error | undefined {
        let ret : Error | undefined = undefined ;

        let projfile = path.join(this.location_, Project.event_file_name) ;
        this.logger_.info('Reading project file \'' + projfile + '\'') ;

        if (!fs.existsSync(projfile)) {
            ret = new Error("the directory '" + this.location_ + "' is not a valid event project, missing file '" + Project.event_file_name + "'") ;
        }
        else {
            const rawData = fs.readFileSync(projfile, 'utf-8');
            this.info_ = JSON.parse(rawData) as ProjectInfo ;
            if (!this.info_.picklist_) {
                //
                // The previous version did not include the picklist.  Rather than make a user re-create their project,
                // we just add an empty picklist if it was not in the file read.
                //
                this.info_.picklist_ = [] ;
            }
        }
        
        return ret ;
    }

    private serial_ : number = 0 ;

    private writeEventFile() : Error | undefined {
        let ret: Error | undefined = undefined ;
        let errst = false ;

        let projfile = path.join(this.location_, Project.event_file_name) ;        
        this.logger_.info('Writing project file [' + this.serial_++ + '] ' + projfile) ;

        if (fs.existsSync(projfile) && Project.keepLotsOfBackups) {
            this.logger_.debug('Performing backup file sequence ....');
            let i = 10 ;
            let fullname = path.join(this.location_, 'event-' + i + '.json') ;
            if (fs.existsSync(fullname)) {
                this.logger_.debug('    removing file \'' + fullname + '\'') ;
                try {
                    fs.rmSync(fullname) ;
                }
                catch(err) {
                    this.logger_.error('    error removing file \'' + fullname + '\'', err) ;
                    errst = true ;
                }
            }
            i-- ;

            if (!errst) {
                while (i > 0) {
                    fullname = path.join(this.location_, 'event-' + i + '.json') ;
                    let newname = path.join(this.location_, 'event-' + ( i + 1) + '.json') ;
                    if (fs.existsSync(fullname)) {
                        try {
                            this.logger_.debug('    renaming file \'' + fullname + '\' -> \'' + newname + '\'') ;
                            fs.renameSync(fullname, newname) ;
                        }
                        catch(err) {
                            this.logger_.error('    error renaming file \'' + fullname + '\' -> \'' + newname + '\'') ;
                        }
                    }
                    i-- ;
                }

                try {
                    fullname = path.join(this.location_, 'event-1.json') ;
                    this.logger_.debug('    renaming file \'' + projfile + '\' -> \'' + fullname + '\'') ;
                    fs.renameSync(projfile, fullname) ;
                }
                catch(err) {
                    this.logger_.error('    error renaming file \'' + projfile + '\' -> \'' + fullname + '\'') ;
                }
            }
            else {
                this.logger_.warning('could not execute rolling backup strategy due to an error')
            }
        }

        const jsonString = JSON.stringify(this.info_, null, 2);
        try {
            this.logger_.debug('    writing project data to file \'' + projfile + '\'') ;
            fs.writeFileSync(projfile, jsonString) ;
        }
        catch(err) {
            ret = err as Error ;
        }
        
        this.logger_.info('    Finished project file [' + (this.serial_- 1) + '] ' + projfile) ;
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

    public deleteStoredGraph(name: string) {
        let index = -1 ;

        let i = 0 ;
        for(let gr of this.info_.team_graph_data_) {
            if (gr.name === name) {
                index = i ;
                break ;
            }

            i++ ;
        }

        if (index !== -1) {
            this.info_.team_graph_data_.splice(index, 1) ;
        }

        this.writeEventFile() ;
    }

    private doesMatchContainTeam(match: BAMatch, team: number) {
        for(let i = 0 ; i < 3 ; i++) {
            let num: number ;

            num = SCBase.keyToTeamNumber(match.alliances.red.team_keys[i]) ;
            if (num === team) {
                return true ;
            }

            num = SCBase.keyToTeamNumber(match.alliances.blue.team_keys[i]) ;
            if (num === team) {
                return true ;
            }
        }

        return false;
    }

    public getMatchResults(teamnumber: number) {
        let ret: BAMatch[] = [] ;

        if (this.info_.matches_) {
            for(let m of this.info_.matches_) {
                if (this.doesMatchContainTeam(m, teamnumber)) {
                    ret.push(m) ;
                }
            }
        }

        return ret ;
    }

    public findGraphByName(name: string) : NamedGraphDataRequest | undefined {
        for(let gr of this.info.team_graph_data_) {
            if (gr.name === name) {
                return gr ;
            }
        }

        return undefined ;
    }

    public storeGraph(desc: NamedGraphDataRequest) {
        let index = -1 ;

        if (desc.name.length > 0) {
            let i = 0 ;
            for(let gr of this.info_.team_graph_data_) {
                if (gr.name === desc.name) {
                    index = i ;
                    break ;
                }

                i++ ;
            }

            if (index !== -1) {
                this.info_.team_graph_data_[index] = desc ;
            }
            else {
                this.info_.team_graph_data_.push(desc) ;
            }
            this.writeEventFile() ;
        }
    }

	public getFormItemNames(filename: string) : FieldAndType[] | Error {
		let ret: FieldAndType[] = [] ;

		try {
			let jsonstr = fs.readFileSync(filename).toString();
			let jsonobj = JSON.parse(jsonstr);
			for(let section of jsonobj.sections) {
				for(let item of section.items) {
                    let obj = {
                        name: item.tag,
                        type: item.type
                    } ;
					ret.push(obj) ;
				}
			}
		}
		catch(err) {
			return err as Error ;
		}

		return ret ;
	}

	private getDataType(field: string, data: any[]) : string {
		let ret: string = typeof (data[0][field]) ;
        let isnull = true ;

        for(let d of data) {
            if (d[field] !== null) {
                isnull = false ;
                break ;
            }
        }

        if (isnull) {
            ret = 'null' ;
        }
        else {
            for(let d of data) {
                if (typeof d[field] !== ret) {
                    return 'string' ;
                }
            }
        }

		return ret;
	}

    private getMatchData(field: string, team: number) : Promise<any> {
		let ret = new Promise<any>(async (resolve, reject) => {
			let teamkey = 'frc' + team ;
			let query = 'select ' + field + ' from ' + MatchDataModel.MatchTableName + ' where team_key = "' + teamkey + '" ;' ;
			this.matchDB.all(query)
				.then((data: any[]) => {
					if (data.length !== 0) {
						let dt = this.getDataType(field, data) ;
						if (dt === 'string') {
							let vmap = new Map() ;
							for(let v of data) {
								let val = v[field] ;
								if (!vmap.has(val)) {
									vmap.set(val, 0) ;
								}

								let current = vmap.get(val) ;
								vmap.set(val, current + 1) ;
							}

							let total = 0 ;
							for(let v of vmap.values()) {
								total += v ;
							}

							let ret = '' ;
							for(let v of vmap.keys()) {
								let pcnt = Math.round(vmap.get(v) / total * 10000) / 100 ;
								if (ret.length > 0) {
									ret += '/' ;
								}
								ret += v + ' ' + pcnt + '%' ;
							}

							resolve(ret);
						}
						else if (dt === 'number') {
							let total = 0.0 ;
							for(let v of data) {
								total += v[field] ;
							}
							resolve(total / data.length) ;
						}
                        else if (dt === 'null') {
                            resolve('No Data') ;
                        }
					}
					else {
						resolve(null) ;
					}
				})
				.catch((err) => {
					resolve(NaN);
				}) ;
		}) ;

		return ret ;
	}	

	private getTeamData(field: string, team: number) : Promise<number> {
		let ret = new Promise<number>(async (resolve, reject) => {
			let query = 'select ' + field + ' from ' + TeamDataModel.TeamTableName + ' where team_number = ' + team + ' ;' ;
			this.teamDB.all(query)
				.then((data) => {
					let rec = data[0] as any ;
					let v = rec[field] ;
					resolve(v) ;
				})
				.catch((err) => {
					resolve(NaN);
				}) ;
		}) ;

		return ret ;
	}

    
    private teamColumnAdded(colname: string) {
        this.logger_.silly('added new column \'' + colname + '\' to team database') ;

        if (!this.info_.teamdb_col_config_) {
            this.info_.teamdb_col_config_ = {
                frozenColumnCount: 0,
                columns:[]
            };
        }
        
        let colcfg = {
            name: colname,
            width: -1,
            hidden: false
        } ;
        this.info_.teamdb_col_config_?.columns.push(colcfg) ;
    }

    private matchColumnAdded(colname: string) {
        this.logger_.silly('added new column \'' + colname + '\' to match database') ;

        if (!this.info_.matchdb_col_config_) {
            this.info_.matchdb_col_config_ = {
                frozenColumnCount: 0,
                columns:[]
            };
        }

        let colcfg = {
            name: colname,
            width: -1,
            hidden: false
        } ;
        this.info_.matchdb_col_config_?.columns.push(colcfg) ;
    }

    // #region picklist methods

    public async exportPicklist(name: string, filename: string) : Promise<void> {
        interface MyObject {
			[key: string]: any; // Allows any property with a string key
		}

        let ret = new Promise<void>(async (resolve, reject) => {
            let picklist = this.findPicklistByName(name) ;
            if (picklist) {
                let cols = ['rank', 'teamnumber', 'nickname', 'picknotes'] ;
                for(let coldesc of picklist.columns) {
                    cols.push(coldesc.name) ;
                }
                
                const csvStream = format({ headers: cols, }) ; 
                const outputStream = fs.createWriteStream(filename);
                csvStream.pipe(outputStream).on('end', () => { 
                    csvStream.end() ;
                }) ;

                let rank = 1 ;
                for(let team of picklist.teams) {
                    let teamobj = this.findTeamByNumber(team) ;
                    let record : MyObject = {
                        'rank' : rank++,
                        'teamnumber' : team,
                        'nickname' : teamobj?.nickname,
                        'notes' : this.getNotesFromPicklist(picklist, team),
                    };

                    for(let col of picklist.columns) {
                        if (col.name !== 'rank' && col.name != 'picknotes' && col.name != 'nickname' && col.name != 'teamnumber') {
                            let data = await this.getData(col.name, team) ;
                            record[col.name] = data ;
                        }
                    }
                    csvStream.write(record) ;
                }
                csvStream.end();
                resolve() ;
            }
        }) ;
        return ret;
    }

    public setLastPicklistUsed(name: string) {
        if (!this.info_.last_picklist_ || this.info_.last_picklist_ !== name) {
            this.info_.last_picklist_ = name ;
            this.writeEventFile() ;
        }
    }


    private getNotesFromPicklist(picklist: PickList, team: number) : string {
        for(let notes of picklist.notes) {
            if (notes.teamnumber === team) {
                return notes.picknotes ;
            }
        }

        return '' ;
    }    
    //#endregion

    //#region loading data from external sources

    public async loadMatchData(key: string, ba: BlueAlliance, results: boolean, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            try {
                let type = results ? 'match results' : 'match schedule' ;
                if (callback) {
                    callback('Requesting ' + type + ' from \'The Blue Alliance\' ... ') ;
                }
                let matches = await ba.getMatches(key);
                if (callback) {
                    callback('received ' + matches.length + ' matches<br>') ;
                }

                if (matches.length === 0) {
                    if (callback) {
                        callback('No matches received, try again later<br>') ;
                    }
                }
                else {
                    this.info_.matches_ = matches ;
                    if (results) {
                        if (callback) {
                            callback('Inserting ' + type + ' into XeroScout2 database ... ');
                        }
                        await this.matchDB.processBAData(matches, results) ;
                        if (callback) {
                            callback('inserted ' + matches.length + ' matches<br>') ;
                        }
                    }
                }
                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret ;
    }

    public loadOprDprData(key: string, ba: BlueAlliance, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            try {
                if (callback) {
                    callback('Requesting OPR/DPR/CCWMS data from \'The Blue Alliance\' ... ') ;
                }
                let opr = await ba.getOPR(key) ;

                if (Object.keys(opr.oprs).length === 0) {
                    if (callback) {
                        callback('No data received, try again later<br>') ;
                    }
                }
                else {
                    if (callback) {
                        callback('Received OPR, DPR, and CCWMS data.<br>') ;
                        callback('Inserting data into XeroScout2 database ... ');
                    }
                    await this.teamDB.processOPR(opr) ;
                    if (callback) {
                        callback('Inserted OPR/DPR/CCWMS data into database.<br>') ;
                    }
                }
                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret ;
    }

    private countNull(data: any[]) : number {
        let ret = 0 ;

        for(let v of data) {
            if (v === null) {
                ret++ ;
            }
        }

        return ret ;
    }

    private fixupZebraTagData(zebra: any[]) {
        for(let match of zebra) {
            if (match) {
                let m = this.findMatchByKey(match.key) ;
                if (m) {
                    let reddel = [] ;
                    let bluedel = [] ;
                    for(let i = 0 ; i < 3 ; i++) {
                        let nullcount = this.countNull(match.alliances.blue[i].xs) ;
                        if (nullcount > 0) {
                            bluedel.push(i) ;
                        }

                        nullcount = this.countNull(match.alliances.red[i].xs) ;
                        if (nullcount > 0) {
                            reddel.push(i) ;
                        }
                    }

                    for(let i = bluedel.length - 1 ; i >= 0 ; i--) {
                        match.alliances.blue.splice(bluedel[i], 1) ;
                    }
                    for(let i = reddel.length - 1 ; i >= 0 ; i--) {
                        match.alliances.red.splice(reddel[i], 1) ;
                    }

                    match.comp_level = m.comp_level ;
                    match.match_number = m.match_number ;
                    match.set_number = m.set_number ;
                }
            }
        }

        return zebra ;
    }

    public loadZebraTagData(ba: BlueAlliance, callback?: (result: string) => void) : Promise<[number, number]> {
        let ret: Promise<[number,number]> = new Promise<[number,number]>(async (resolve, reject) => {
            try {
                let matches = this.info_!.matches_!.map((v)=> { return v.key}) ;
                let zebra = await ba.getZebraTagData(matches) ;
                this.info_.zebra_tag_data_ = this.fixupZebraTagData(zebra) ; ;
                this.writeEventFile() ;

                let count = 0 ;
                for(let data of zebra) {
                    if (data !== null) {
                        count++ ;
                    }
                }
                resolve([count, zebra.length - count]);
            }
            catch(err) {
                reject(err) ;
            }
        });

        return ret;
    }

    public loadRankingData(key: string, ba: BlueAlliance, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            try {
                if (callback) {
                    callback('Requesting ranking data from \'The Blue Alliance\' ... ') ;
                }
                let rankings = await ba.getRankings(key) ;

                if (rankings.rankings.length === 0) {
                    if (callback) {
                        callback('No rankings data received, try again later<br>') ;
                    }
                }
                else {
                    if (callback) {
                        callback('received ranking data.<br>') ;
                        callback('Inserting data into XeroScout2 database ... ');
                    }
                    await this.teamDB.processRankings(rankings.rankings) ;
                    if (callback) {
                        callback('inserted ranking data into database.<br>') ;
                    }
                }
                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret ;
    }

    public loadStatboticsEventData(key: string, sb: StatBotics, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            try {
                let teams = this.info_!.teams_!.map((v)=> { return v.team_number}) ;

                if (callback) {
                    callback('Requesting EPA data for the event from \'Statbotics\' ... ') ;
                }
                let stats = await sb.getStatsEvent(key, teams) ;

                if (callback) {
                    callback('received stats data.<br>') ;
                    callback('Inserting data into team database ... ')
                }
                this.teamDB.processStatsEvent(stats) ;
                
                if (callback) {
                    callback('data inserted.<br>') ;
                }

                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret ;
    }
    
    public loadStatboticsYearData(sb: StatBotics, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            try {
                let teams = this.info_!.teams_!.map((v)=> { return v.team_number}) ;

                if (callback) {
                    callback('Requesting EPA data for the year from \'Statbotics\' ... ') ;
                }
                let stats = await sb.getStatsYear(teams) ;

                if (callback) {
                    callback('received stats data.<br>') ;
                    callback('Inserting data into team database ... ')
                }
                await this.teamDB.processStatsYear(stats) ;
                
                if (callback) {
                    callback('data inserted.<br>') ;
                }

                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret ;
    }

    private loadTeams(key: string, ba: BlueAlliance, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            try {
                if (callback) {
                    callback('Requesting teams from \'The Blue Alliance\' ... ') ;
                }
                let teams = await ba.getTeams(key) ;

                if (callback) {
                    callback('received ' + teams.length + ' teams.<br>') ;
                }

                if (teams.length === 0) {
                    if (callback) {
                        callback('No teams data received, try again later<br>') ;
                    }
                }
                else {
                    this.info_.teams_ = teams ;
                }
                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret ;        
    }

    public loadBAEvent(ba: BlueAlliance, sb: StatBotics, frcev: BAEvent, callback?: (result: string) => void) : Promise<void> {
        let ret: Promise<void> = new Promise<void>(async (resolve, reject) => {
            this.info_.frcev_ = frcev ;
            try {
                await this.loadTeams(frcev.key, ba, callback) ;
                if (this.info_.teams_) {
                    await this.loadMatchData(frcev.key, ba, false, callback) ;
                }
                this.writeEventFile() ;
                if (callback) {
                    callback('Event data file saved.<br>');
                    callback('Event loaded sucessfully.<br>');
                }

                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret;
    }

    public loadExternalData(ba: BlueAlliance, sb: StatBotics, frcev: BAEvent, callback?: (result: string) => void) : Promise<number> {
        let ret: Promise<number> = new Promise<number>(async (resolve, reject) => {
            try {
                await this.loadMatchData(frcev.key, ba, true, callback) ;
                await this.loadOprDprData(frcev.key, ba, callback) ;
                await this.loadRankingData(frcev.key, ba, callback) ;
                await this.loadStatboticsEventData(frcev.key, sb, callback) ;
                await this.loadStatboticsYearData(sb, callback) ;
                resolve(0) ;
            } 
            catch(err) {
                reject(err) ;
            }
        }) ;
        
        return ret;
    }

    //#endregion
}
