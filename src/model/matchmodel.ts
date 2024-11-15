import * as sqlite3 from 'sqlite3' ;
import { DataModel, DataRecord, ValueType } from "./datamodel";
import winston from 'winston';
import { BAMatch } from '../bluealliance/badata';

export class MatchDataModel extends DataModel {
    static readonly MatchTableName: string = 'matches' ;
    static readonly BlueAlliancePrefix: string = 'ba_' ;

    public constructor(dbname: string, logger: winston.Logger) {
        super(dbname, logger) ;
    }

    public getColumns() : Promise<string[]> {
        return this.getColumnNames(MatchDataModel.MatchTableName, (a, b) => { return this.compareCols(a, b) ;}) ;
    }

    private static fixedcols = ['comp_level', 'match_number', 'set_number'] ;
    private compareCols(a: string, b: string) : number {
        let ra = MatchDataModel.fixedcols.indexOf(a) ;
        let rb = MatchDataModel.fixedcols.indexOf(b) ;

        if (ra !== -1 && rb !== -1) {
            if (ra < rb) {
                return -1 ;
            }
            else if (ra > rb) {
                return 1;
            }
            return 0 ;
        }

        if (ra !== -1 && rb === -1) {
            return -1 ;
        }

        if (rb !== -1 && ra === -1) {
            return 1 ;
        }

        if (!a.startsWith(MatchDataModel.BlueAlliancePrefix) && b.startsWith(MatchDataModel.BlueAlliancePrefix)) {
            return -1 ;
        }

        if (a.startsWith(MatchDataModel.BlueAlliancePrefix) && !b.startsWith('_ba')) {
            return 1 ;
        }

        return a.localeCompare(b) ;
    }

    public init() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            super.init()
            .then(() => {
                this.createTableIfNecessary(MatchDataModel.MatchTableName)
                    .then(()=> {
                        resolve() ;
                    })
                    .catch((err) => {
                        reject(err) ;
                    }) ;
            })
            .catch((err) => {
                reject(err) ;
            })
        }) ;

        return ret;
    }

    protected createTableQuery() : string {
        let ret = 'create table ' + MatchDataModel.MatchTableName + ' (' ;
        ret += 'key TEXT NOT NULL' ;
        ret += ', comp_level TEXT NOT NULL' ;
        ret += ', set_number REAL NOT NULL' ;
        ret += ', match_number REAL NOT NULL'
        ret += ', team_key TEXT NOT NULL' ;
        ret += ');' ;
        return ret ;
    }

    private isValidDataType(value: any) {
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ;
    }

    private moveToRecord(obj: any, dr: DataRecord) {
        for(let key of Object.keys(obj)) {
            if (this.isValidDataType(obj[key])) {
                dr.addfield('ba_' + key, obj[key]) ;
            }
        }
    }

    private getScoreBreakdown(score: any, dr: DataRecord, alliance: string) {
        this.moveToRecord(score, dr) ;
        if (alliance === 'red' && score.red) {
            this.moveToRecord(score.red, dr) ;
        }
        else if (alliance === 'blue' && score.blue) {
            this.moveToRecord(score.blue, dr) ;
        }
    }

    private convertToRecord(obj: BAMatch, tkey: string, alliance: string) : DataRecord {
        let dr = new DataRecord() ;

        dr.addfield('key', obj.key) ;
        dr.addfield('team_key', tkey) ;
        dr.addfield('comp_level', obj.comp_level);
        dr.addfield('set_number', obj.set_number) ;
        dr.addfield('match_number', obj.match_number) ;
        dr.addfield('r1', obj.alliances.red.team_keys[0]) ;
        dr.addfield('r2', obj.alliances.red.team_keys[1]) ;
        dr.addfield('r3', obj.alliances.red.team_keys[2]) ;
        dr.addfield('b1', obj.alliances.blue.team_keys[0]) ;
        dr.addfield('b2', obj.alliances.blue.team_keys[1]) ;
        dr.addfield('b3', obj.alliances.blue.team_keys[2]) ;

        if (obj.alliances.red.score) {
            dr.addfield('ba_redscore', obj.alliances.red.score) ;
        }

        if (obj.alliances.blue.score) {
            dr.addfield('ba_bluescore', obj.alliances.blue.score) ;
        }

        if (obj.winning_alliance) {
            dr.addfield('ba_winning_alliance', obj.winning_alliance) ;
        }

        if (obj.score_breakdown) {
            this.getScoreBreakdown(obj.score_breakdown, dr, alliance) ;
        }

        return dr ;
    }

    public processBAData(data: BAMatch[]) : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            let dr: DataRecord ;
            let records: DataRecord[] = [] ;

            for(let one of data) {
                //
                // Each match turns into 6 records in the database, one for each team
                // of each of the alliances.
                //

                dr = this.convertToRecord(one, one.alliances.red.team_keys[0], 'red') ;
                records.push(dr) ;

                dr = this.convertToRecord(one, one.alliances.red.team_keys[1], 'red') ;
                records.push(dr) ;

                dr = this.convertToRecord(one, one.alliances.red.team_keys[2], 'red') ;
                records.push(dr) ;

                dr = this.convertToRecord(one, one.alliances.blue.team_keys[0], 'blue') ;
                records.push(dr) ;

                dr = this.convertToRecord(one, one.alliances.blue.team_keys[1], 'blue') ;
                records.push(dr) ;

                dr = this.convertToRecord(one, one.alliances.blue.team_keys[2], 'blue') ;
                records.push(dr) ;
            }

            try {
                await this.addColsAndData(MatchDataModel.MatchTableName, ['comp_level', 'set_number', 'match_number', 'team_key'], records) ;
                resolve() ;
            }
            catch(err) {
                reject(err) ;
            }
        }) ;

        return ret; 
    }


    // sm-qm-1-1-8 is sm- TYPE - SETNO - MATCHNO
    private parseMatchString(str: string) : any | undefined {
        let ret ;

        const regex = /^sm-([a-z]+)-([0-9]+)-([0-9]+)-([0-9])$/;
        let match = regex.exec(str) ;
        if (match) {
            ret = {
                type: 'qm',
                setno: +match[2],
                match: +match[3],
                team: +match[4]
            } ;
        }

        return ret ;
    }

    public processScoutingResults(results: any) : Promise<string[]> {
        let ret = new Promise<string[]>((resolve, reject) => {
            let i = 0 ;
            let records: DataRecord[] = [] ;
            let status: string[] = [] ;

            while (i < results.length) {
                let which = results[i++] ;
                let data = results[i++] ;
                status.push(which) ;
                let keys = this.parseMatchString(which) ;
            }

            resolve(status) ;
        }) ;

        return ret ;
    }
}