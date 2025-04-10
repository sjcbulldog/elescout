import winston from "winston";
import { MatchDataModel } from "../model/matchmodel";
import { TeamDataModel } from "../model/teammodel";
import * as path from 'path' ;
import { Manager } from "./manager";
import { FormulaManager } from "./formulamgr";
import { parseExpression, ParseResult } from '@babel/parser';
import evaluate, { registerFunction } from 'ts-expression-evaluator'
import { Expression } from "ts-expression-evaluator/build/main/lib/t";
import { ScoutingData } from "../comms/resultsifc";
import { BAMatch, BAOprData, BARankingData, BATeam } from "../extnet/badata";
import { FieldAndType } from "../model/datamodel";

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

export class DataInfo {
    public matchdb_col_config_? : ProjColConfig ;       // List of hidden columns in match data
    public teamdb_col_config_? : ProjColConfig ;        // List of hidden columns in team data
    public scouted_team_: number[] = [] ;               // The list of teams that have scouting data
    public scouted_match_: string[] = [] ;              // The list of matches that have scouring data
    public team_db_fields_ : string[] = [] ;            // The list of fields from the team form currently in the database
    public match_db_fields_ : string[] = [] ;           // The list of fields from the match form currently in the database
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

    public createFormColumns(teamfields: FieldAndType[], matchfields: FieldAndType[]) : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            this.info_.team_db_fields_ = [] ;
            this.info_.match_db_fields_ = [] ;

            for(let field of teamfields) {
                this.info_.team_db_fields_.push(field.name) ;
            }

            for(let field of matchfields) {
                this.info_.match_db_fields_.push(field.name) ;
            }

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
    public getData(field: string, team: number) : Promise<number | string | Error> {
        let ret = new Promise<number | string | Error>(async (resolve, reject) => {
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
                let v = await this.getMatchData(field, team) ;
                found = true ;
                resolve(v) ;
                return ;
            }

            if (this.formula_mgr_.hasFormula(field)) {
                let v = await this.evalFormula(field, team) ;
                found = true ;
                resolve(v) ;
                return ;
            }

            if (!found) {
                resolve(new Error('Field ' + field + ' is not a valid team, match, or formula field')) ;
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
                    let status = await this.matchdb_.processScoutingResults(obj) ;
                    for(let st of status) {
                        if (!this.info_.scouted_match_.includes(st)) {
                            this.info_.scouted_match_.push(st) ;
                        }
                    }
                }
                else {
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
    
    public async removeFormColumns() : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            this.teamdb_.removeColumns(TeamDataModel.TeamTableName, this.info_.team_db_fields_)
                .then(async () => {
                    this.matchdb_.removeColumns(MatchDataModel.MatchTableName, this.info_.match_db_fields_)
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
    
    public setMatchColConfig(data: ProjColConfig) {
        this.info_.matchdb_col_config_ = data ;
        this.write() ;
    }  

    public getMatchColConfig() : ProjColConfig | undefined {
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
    public setTeamColConfig(data: ProjColConfig) {
        this.info_.teamdb_col_config_ = data ;
        this.write() ;
    }

    public getTeamColConfig() : ProjColConfig | undefined {
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

    public exportToCSV(filename: string, table: string) : Promise<void> {
        let ret : Promise<void> ;
        if (table === TeamDataModel.TeamTableName) {
            ret = this.teamdb_.exportToCSV(filename, table);
        } else {
            ret = this.matchdb_.exportToCSV(filename, table);
        }

        return ret ;
    }

    private getMatchData(field: string, team: number, mcount? : number) : Promise<any> {
        let ret = new Promise<any>(async (resolve, reject) => {
            let fields = field + ', comp_level, set_number, match_number' ;
            let teamkey = 'frc' + team ;
            let query = 'select ' + fields + ' from ' + MatchDataModel.MatchTableName + ' where team_key = "' + teamkey + '" ;' ;
            this.matchdb_.all(query)
                .then((data: any[]) => {
                    if (data.length !== 0) {
                        let sortData = this.sortData(field, data, mcount) ;
                        let dt = this.getDataType(field, sortData) ;
                        if (dt === 'string') {
                            resolve(this.processStringData(sortData, field)) ;
                        }
                        else if (dt === 'number') {
                            resolve(this.processNumberData(sortData, field)) ;
                        }
                        else if (dt === 'null') {
                            resolve('No Data') ;
                        }
                    }
                    else {
                        resolve("No Data") ;
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
            this.teamdb_.all(query)
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
    
    private evalFormula(name: string, team: number) : Promise<number  | string > {
        let ret = new Promise<number | string>(async (resolve, reject) => {
            let formula = this.formula_mgr_.findFormula(name) ;
            let result = NaN ;
            if (formula) {
                let obj : any = {} ;
                let expr = parseExpression(formula) ;
                let deps = this.searchForDependencies(expr) ; 
                for(let dep of deps) {
                    try {
                        let v = await this.getData(dep, team) ;
                        obj[dep] = v ;
                    }
                    catch(err) {
                        resolve('formula error') ;
                    }
                }
                result = evaluate(formula, obj) ;
                resolve(result) ;
            }
            else {
                resolve(NaN) ;
            }
        }) ;
        return ret ;
    }

    private sortData(field: string, data: any[], mcount?: number) : any[] {
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

        if (mcount && mcount < data.length) {
            let newdata : any[] = [] ;

            //
            // Now, find the last N values, but skip past null data at the end
            //
            let last = data.length - 1 ;
            while (last >= 0 && data[last][field] === null) {
                last-- ;
            }

            if (last < mcount) {
                //
                // No good data, grab the last mcount values
                //
                for(let i = 0 ; i < mcount ; i++) {
                    newdata.push(null) ;
                }
            }
            else {
                //
                // We want from last - mcount to last
                //
                for(let i = last - mcount + 1; i <= last; i++) {
                    newdata.push(data[i]) ;
                }
            }

            data = newdata ;
        }

        let ret : any[] = [] ;
        for(let d of data) {
            let one : any = {} ;
            one[field] = d[field] ;
            ret.push(one) ;
        }

        return ret;
    }


    private getDataType(field: string, data: any[]) : string {
        let ret: string = typeof (data[0][field]) ;

        for(let d of data) {
            if (d[field] === null) {
                continue ;
            }
            if (typeof d[field] !== ret) {
                return 'string' ;
            }
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
                ret += '/' ;
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


    private searchForDependenciesRecurse(expr: Expression, deps: string[]) {
        switch(expr.type) {
            case 'Identifier':
                if (!deps.includes(expr.name)) {
                    deps.push(expr.name) ;
                }
                break ;
            case 'BinaryExpression':
                this.searchForDependenciesRecurse(expr.left as Expression, deps) ;
                this.searchForDependenciesRecurse(expr.right, deps) ;
                break ;
            case 'NumericLiteral':
            case 'StringLiteral':
            case 'BooleanLiteral':
            case 'ArrayExpression':
            case 'NullLiteral':
            case 'LogicalExpression':
                break ;

            case 'UnaryExpression':
                this.searchForDependenciesRecurse((expr as any).argument as Expression, deps) ;
                break ;
        }
    }

    private searchForDependencies(expr: Expression) : string[] {
        let ret: string[] = [] ;
        this.searchForDependenciesRecurse(expr, ret) ;
        return ret;
    }    
}