import winston from "winston";
import { MatchDataModel } from "../model/matchmodel";
import { TeamDataModel } from "../model/teammodel";
import * as path from 'path' ;
import { Manager } from "./manager";
import { FormulaManager } from "./formulamgr";
import { OneScoutResult, ScoutingData } from "../comms/resultsifc";
import { BAMatch, BAOprData, BARankingData, BATeam } from "../extnet/badata";
import { ColumnDesc } from "../model/datamodel";
import { MatchSet } from "./datasetmgr";
import { DataValue } from "../model/datavalue";
import { IPCProjColumnsConfig } from "../../shared/ipcinterfaces";


export class DataInfo {
    public matchdb_col_config_? : IPCProjColumnsConfig ;       // List of hidden columns in match data
    public teamdb_col_config_? : IPCProjColumnsConfig ;        // List of hidden columns in team data
    public scouted_team_: number[] = [] ;               // The list of teams that have scouting data
    public scouted_match_: string[] = [] ;              // The list of matches that have scouring data
    public team_db_cols_ : ColumnDesc[] = [] ;            // The list of fields from the team form currently in the database
    public match_db_cols_ : ColumnDesc[] = [] ;           // The list of fields from the match form currently in the database
    public match_results_ : OneScoutResult[] = [] ;           // The list of match results that have been processed
    public team_results_ : OneScoutResult[] = [] ;            // The list of team results that have been processed
} ;

export class DataManager extends Manager {
    private static matchLevels : string[] = ['qm', 'sf', 'f'] ;

    private teamdb_ : TeamDataModel ;
    private matchdb_ : MatchDataModel ;
    private formula_mgr_ : FormulaManager ;
    private info_ : DataInfo ;

    constructor(logger: winston.Logger, writer: () => void, dir: string, info: DataInfo, formula_mgr: FormulaManager) {
        super(logger, writer) ;

        this.info_ = info ;
        this.formula_mgr_ = formula_mgr ;

        let filename: string ;

        filename = path.join(dir, 'team.db') ;
        this.teamdb_ = new TeamDataModel(filename, info.team_db_cols_, logger) ;
        this.teamdb_.on('column-added', this.teamColumnAdded.bind(this)) ;
        this.teamdb_.on('column-removed', this.teamColumnRemoved.bind(this)) ;

        filename = path.join(dir, 'match.db') ;
        this.matchdb_ = new MatchDataModel(filename, info.match_db_cols_, logger) ;
        this.matchdb_.on('column-added', this.matchColumnAdded.bind(this));
        this.matchdb_.on('column-removed', this.matchColumnRemoved.bind(this));

        if (!this.info_.match_results_) {
            this.info_.match_results_ = [] ;
        }

        if (!this.info_.team_results_) {
            this.info_.team_results_ = [] ;
        }
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

    public close() : boolean {
        let ret: boolean = true ;

        if (this.teamdb_) {
            if (!this.teamdb_.close()) {
                ret = false ;
            }
        }

        if (this.matchdb_) {
            if (!this.matchdb_.close()) {
                ret = false ;
            }
        }
        return ret ;
    }

    public removeDatabases() {
        this.teamdb_.remove() ;
        this.matchdb_.remove() ;
    }

    public createFormColumns(teamfields: ColumnDesc[], matchfields: ColumnDesc[]) : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            try {
                await this.teamdb_.addNecessaryCols(TeamDataModel.TeamTableName, teamfields) ;
            }
            catch(err) {
                reject(err) ;
            }

            try {
                await this.matchdb_.addNecessaryCols(MatchDataModel.MatchTableName, matchfields) ;
            }
            catch(err) {
                reject(err) ;
            }

            resolve() ;
        }) ;

        return ret ;
    }

    //
    // For a given field, either team or match, and a given team, get the
    // value of the field.  For team fields, it is the data stored for that
    // field.  For match fields, the data is processes over all matches to get
    // an average.
    //   
    public getData(m: MatchSet, field: string, team: number) : Promise<DataValue> {
        let ret = new Promise<DataValue>(async (resolve, reject) => {
            let found = false ;

            let tcols = await this.teamdb_.getColumnNames(TeamDataModel.TeamTableName) ;
            if (tcols.includes(field)) {
                let v = await this.getTeamData(field, team) ;
                found = true ;
                resolve(v) ;
                return ;
            }

            let mcols = await this.matchdb_.getColumnNames(MatchDataModel.MatchTableName) ;
            if (mcols.includes(field)) {
                let v = await this.getMatchData(m, field, team) ;
                found = true ;
                resolve(v) ;
                return ;
            }

            if (this.formula_mgr_.hasFormula(field)) {
                let v = await this.evalFormula(m, field, team) ;
                found = true ;
                resolve(v) ;
                return ;
            }

            if (!found) {
                let v = DataValue.fromError(new Error('Field ' + field + ' is not a valid team, match, or formula field')) ;
                resolve(v) ;
                return ;
            }
        }) ;
        return ret;
    }

    public async processResults(obj: ScoutingData) {
        if (!this.info_) {
            this.logger_.error('project is not initialized, cannot process results') ;
        }
        else {
            if (obj.purpose) {
                if (obj.purpose === 'match') {
                    this.info_.match_results_ = [] ;
                    for(let res of obj.results) {
                        if (res.item) {
                            this.info_.match_results_.push(res) ;
                        }
                    }

                    let status = await this.matchdb_.processScoutingResults(obj) ;
                    for(let st of status) {
                        if (!this.info_.scouted_match_.includes(st)) {
                            this.info_.scouted_match_.push(st) ;
                        }
                    }
                }
                else {
                    this.info_.team_results_ = [] ;
                    for(let res of obj.results) {
                        if (res.item) {
                            this.info_.team_results_.push(res) ;
                        }
                    }

                    let teams = await this.teamdb_.processScoutingResults(obj) ;
                    for (let st of teams) {
                        if (!this.info_.scouted_team_.includes(st)) {
                            this.info_.scouted_team_.push(st) ;
                        }
                    }
                }
            }
            this.write() ;
        }
    }     
    
    public async removeFormColumns(teamcols: ColumnDesc[], matchcols: ColumnDesc[]) : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            this.teamdb_.removeColumns(TeamDataModel.TeamTableName, teamcols.map((one) => one.name), this.info_.team_db_cols_)
                .then(async () => {
                    this.matchdb_.removeColumns(MatchDataModel.MatchTableName, matchcols.map((one) => one.name), this.info_.match_db_cols_)
                        .then(() => {
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
        return ret ;
    }

    // #region match related methods
    
    public setMatchColConfig(data: IPCProjColumnsConfig) {
        this.info_.matchdb_col_config_ = data ;
        this.write() ;
    }  

    public getMatchColConfig() : IPCProjColumnsConfig | undefined {
        return this.info_.matchdb_col_config_ ;
    }

    public async processMatchBAData(matches: BAMatch[], results: boolean) : Promise<void> {   
        return this.matchdb_.processBAData(matches, results) ;
    }

    public hasMatchScoutingResult(type: string, set: number, match: number, team: string) : string {
        let str: string = 'sm-' + type + '-' + set + '-' + match + '-' + team ;
        return this.info_.scouted_match_.includes(str) ? 'Y' : 'N' ;
    }    

    public getMatchColumns() : Promise<string[]> {
        return this.matchdb_.getColumnNames(MatchDataModel.MatchTableName) ;
    }

    public getAllMatchData() : Promise<any[]> {
        return this.matchdb_.getAllData(MatchDataModel.MatchTableName) ;
    }

    // #endregion


    // #region team related methods
    public setTeamColConfig(data: IPCProjColumnsConfig) {
        this.info_.teamdb_col_config_ = data ;
        this.write() ;
    }

    public getTeamColConfig() : IPCProjColumnsConfig | undefined {
        return this.info_.teamdb_col_config_ ;
    }
    
    public async processTeamBAData(teams: BATeam[]) : Promise<void> {
        return this.teamdb_.processBAData(teams) ;
    }

    public hasTeamScoutingResults(team: number) : boolean {
        return this.info_.scouted_team_.includes(team) ;
    }    

    public getTeamColumns() : Promise<string[]> {
        return this.teamdb_.getColumnNames(TeamDataModel.TeamTableName) ;
    }

    public getAllTeamData() : Promise<any[]> {
        return this.teamdb_.getAllData(TeamDataModel.TeamTableName) ;
    }

    // #endregion


    // #region external site data methods
    public async processStatboticsEventData(data: any) {
        return this.teamdb_.processStatboticsEventData(data) ;
    }

    public async processStatboticsYearToDateData(data: any) {
        return this.teamdb_.processStatboticsYearToDateData(data) ;
    }


    public async processOPRData(data: BAOprData) : Promise<void> {
        return this.teamdb_.processOPR(data) ;
    }

    public async processRankings(data: BARankingData[]) : Promise<void> {
        return this.teamdb_.processRankings(data) ;
    }
    
    // #endregion

    // region misc methods

    public exportToCSV(filename: string, table: string) : Promise<void> {
        let ret : Promise<void> ;
        if (table === TeamDataModel.TeamTableName) {
            ret = this.teamdb_.exportToCSV(filename, table);
        } else {
            ret = this.matchdb_.exportToCSV(filename, table);
        }

        return ret ;
    }

    public getMatchResult(match: string) : OneScoutResult | undefined {
        for(let res of this.info_.match_results_) {
            if (res.item === match) {
                return res ;
            }
        }
        return undefined ;
    }

    public getTeamResult(team: string) : OneScoutResult | undefined {
        for(let res of this.info_.team_results_) {
            if (res.item === team) {
                return res ;
            }
        }
        return undefined ;
    }

    // #endregion

    private getMatchData(m: MatchSet, field: string, team: number) : Promise<DataValue> {
        let ret = new Promise<any>(async (resolve, reject) => {
            let fields = field + ', comp_level, set_number, match_number' ;
            let teamkey = 'frc' + team ;
            let query = 'select ' + fields + ' from ' + MatchDataModel.MatchTableName + ' where team_key = "' + teamkey + '" ;' ;
            this.matchdb_.all(query)
                .then((data: any[]) => {
                    if (data.length !== 0) {
                        let sorted = this.sortData(data) ;
                        let filtered = this.filterMatchData(m, sorted) ;

                        let value : DataValue[] = [] ;
                        for(let row of filtered) {
                            if (row.has(field)) {
                                value.push(row.value(field)) ;
                            }
                        }
                        resolve (DataValue.fromArray(value)) ;
                    }
                    else {
                        resolve(new Error('no data found for field ' + field)) ;
                    }
                })
                .catch((err) => {
                    resolve(DataValue.fromError(err)) ;
                }) ;
        }) ;

        return ret ;
    }	

    private getTeamData(field: string, team: number) : Promise<DataValue> {
        let ret = new Promise<DataValue>(async (resolve, reject) => {
            let query = 'select ' + field + ' from ' + TeamDataModel.TeamTableName + ' where team_number = ' + team + ' ;' ;
            this.teamdb_.all(query)
                .then((data) => {
                    let rec = data[0] as any ;
                    let v = rec.value(field) ;
                    resolve(v) ;
                })
                .catch((err) => {
                    resolve(DataValue.fromError(err)) ;
                }) ;
        }) ;

        return ret ;
    }    
    
    private teamColumnAdded(coldesc: ColumnDesc) {
        this.logger_.silly('added new column \'' + coldesc.name + '\' to team database') ;

        if (!this.info_.teamdb_col_config_) {
            this.info_.teamdb_col_config_ = {
                frozenColumnCount: 0,
                columns:[]
            };
        }
        
        let colcfg = {
            name: coldesc.name,
            width: -1,
            hidden: false
        } ;
        this.info_.teamdb_col_config_?.columns.push(colcfg) ;
        this.info_.team_db_cols_.push(coldesc) ;
    }

    private teamColumnRemoved(coldesc: ColumnDesc) {
        this.logger_.silly('removed column \'' + coldesc.name + '\' from the team database') ;
        let i = this.info_.teamdb_col_config_?.columns.findIndex((one) => one.name === coldesc.name) ;
        if (i !== undefined && i >= 0) {
            this.info_.teamdb_col_config_?.columns.splice(i, 1) ;
        }

        i = this.info_.team_db_cols_.findIndex((one) => one.name === coldesc.name) ;
        if (i !== undefined && i >= 0) {
            this.info_.team_db_cols_.splice(i, 1) ;
        }
    }    

    private matchColumnAdded(coldesc: ColumnDesc) {
        this.logger_.silly('added new ColumnDesc \'' + coldesc.name + '\' to match database') ;

        if (!this.info_.matchdb_col_config_) {
            this.info_.matchdb_col_config_ = {
                frozenColumnCount: 0,
                columns:[]
            };
        }

        let colcfg = {
            name: coldesc.name,
            width: -1,
            hidden: false
        } ;
        this.info_.matchdb_col_config_?.columns.push(colcfg) ;
        this.info_.match_db_cols_.push(coldesc) ;
    }    

    private matchColumnRemoved(coldesc: ColumnDesc) {
        this.logger_.silly('removed column \'' + coldesc.name + '\' from the match database') ;

        let i = this.info_.matchdb_col_config_?.columns.findIndex((one) => one.name === coldesc.name) ;
        if (i !== undefined && i >= 0) {
            this.info_.matchdb_col_config_?.columns.splice(i, 1) ;
        }

        i = this.info_.match_db_cols_.findIndex((one) => one.name === coldesc.name) ;
        if (i !== undefined && i >= 0) {
            this.info_.match_db_cols_.splice(i, 1) ;
        }
    }
    
    private evalFormula(m: MatchSet, name: string, team: number) : Promise<DataValue> {
        let ret = new Promise<DataValue>(async (resolve, reject) => {
            let formula = this.formula_mgr_.findFormula(name) ;
            if (!formula) {
                resolve(DataValue.fromError(new Error('formula ' + name + ' not found'))) ;
                return ;
            }
            else if (formula.hasError()) {
                resolve(DataValue.fromError(formula.getError()!)) ;
            }
            else {
                let vars: string[] = formula.variables() ;
                let varvalues: Map<string, DataValue> = new Map() ;
                for(let varname of vars) {
                    let v = await this.getData(m, varname, team) ;
                    if (v.isError()) {
                        resolve(v) ;
                        return ;
                    }
                    varvalues.set(varname, v) ;
                }

                let result = formula.evaluate(varvalues) ;
                resolve(result) ;
            }
        }) ;
    
        return ret ;
    }

    private filterMatchData(m: MatchSet, data: any[]) : any[] {
        let start = 0 ;
        let end = data.length - 1 ;
        let newdata : any[] = [] ;

        if (m.kind == 'first') {
            // 
            // We want the first N entries
            //
            start = 0 ;
            if (m.last - 1 < end) {
                end = m.last - 1 ;
            }
        }
        else if (m.kind == 'last') {
            //
            // We want the last N entries
            //
            end = data.length - 1 ;
            start = data.length - m.first ;
            if (start < 0) {
                start = 0 ;
            }
        }
        else if (m.kind == 'all') {
            start = 0 ;
            end = data.length - 1 ;
        }
        else if (m.kind == 'range') {
            //
            // We want the entries between the two values
            //
            start = m.first ;
            end = m.last ;
            if (start < 0) {
                start = 0 ;
            }
            if (end > data.length - 1) {
                end = data.length - 1 ;
            }
        }

        for(let i = start ; i <= end ; i++) {
            newdata.push(data[i]) ;
        }

        return newdata ;
    }

    private sortData(data: any[]) : any[] {
        data = data.sort((a, b) => {
            let am = DataManager.matchLevels.indexOf(a.comp_level) ;
            let bm = DataManager.matchLevels.indexOf(b.comp_level) ;
            if (am < bm) {
                return -1 ;
            }
            else if (am > bm) {
                return 1 ;
            }
            else {
                if (a.set_number < b.set_number) {
                    return -1 ;
                }
                else if (a.set_number > b.set_number) {
                    return 1 ;
                }
                else {
                    if (a.match_number < b.match_number) {
                        return -1 ;
                    }
                    else if (a.match_number > b.match_number) {
                        return 1 ;
                    }
                    else {
                        return 0 ;
                    }
                }
            }
        }) ;
        
        return data ;
    }

    private getDataType(field: string, data: any[]) : string {
        let ret: string = typeof (data[0][field]) ;
        let allnull = true ;

        for(let d of data) {
            if (d[field] === null) {
                continue ;
            }
            allnull = false ;
            if (typeof d[field] !== ret) {
                return 'string' ;
            }
        }

        if (allnull) {
            ret = 'null' ;
        }

        return ret;
    }

    private processStringData(data: any[], field: string) : string {
        let vmap = new Map() ;
        for(let v of data) {
            if (v[field] !== null) {
                let val = v[field] ;
                if (!vmap.has(val)) {
                    vmap.set(val, 0) ;
                }

                let current = vmap.get(val) ;
                vmap.set(val, current + 1) ;
            }
        }

        let total = 0 ;
        for(let v of vmap.values()) {
            total += v ;
        }

        let ret = '' ;
        for(let v of vmap.keys()) {
            let pcnt = Math.round(vmap.get(v) / total * 10000) / 100 ;
            if (ret.length > 0) {
                ret += '\n' ;
            }
            ret += v + ' ' + pcnt + '%' ;
        }

        return ret ;
    }

    private processNumberData(data: any[], field: string) : number {
        let total = 0.0 ;
        let count = 0 ;
        for(let v of data) {
            if (v[field] !== null){
                total += v[field] ;
                count++ ;
            }
        }

        if (count === 0) {
            return NaN ;
        }

        return total / count ;
    }
}
