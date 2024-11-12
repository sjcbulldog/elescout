import * as sqlite3 from 'sqlite3' ;
import { DataModel, DataRecord, ValueType } from "./datamodel";
import { Match } from '../project/match';
import { MatchData } from '../project/matchdata';

export class MatchDataModel extends DataModel {
    static readonly MatchTableName: string = 'matches' ;
    static readonly BlueAlliancePrefix: string = 'ba_' ;

    public constructor(dbname: string, infoname: string) {
        super(dbname, infoname) ;
    }

    public getColumns() : Promise<string[]> {
        return this.getColumnNames(MatchDataModel.MatchTableName, (a, b) => { return this.compareCols(a, b) ;}) ;
    }

    private static fixedcols = ['KEY', 'TYPE', 'MATCHNO', 'SETNO', 'RED1', 'RED2', 'RED3', 'BLUE1', 'BLUE2', 'BLUE3'] ;

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

    public getAllData() : Promise<any> {
        let ret = new Promise<any>((resolve, reject) => {
            let query = 'select * from ' + MatchDataModel.MatchTableName + ';' ;
            this.all(query)
                .then((rows) => {
                    resolve(rows as any) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;

        return ret ;
    }

    public init() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            super.init()
            .then(() => {
                this.createMatchTableIfNecessary()
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

    private createMatchTableIfNecessary() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            this.getTableNames()
                .then((tables : string[]) => {
                    if (!tables.includes(MatchDataModel.MatchTableName)) {
                        //
                        // create the table
                        //
                        this.runQuery(this.createTableQuery())
                            .then((result: sqlite3.RunResult) => {
                                resolve() ;
                            })
                            .catch((err) => {
                                reject(err) ;
                            });
                    }
                    else {
                        resolve() ;
                    }
                })
                .catch((err) => {
                    reject(err) ;
                })
            }) ;
        return ret ;
    }

    private createTableQuery() : string {
        let ret = 'create table matches (KEY TEXT NOT NULL);' ;
        return ret ;
    }

    private extractBAMatchResult(prefix: string, result: any, dr: DataRecord) {
        if (result instanceof Map) {
            for(let key of result.keys()) {
                let value = result.get(key) ;
                let type = typeof value ;

                if (type === 'string') {
                    dr.addfield(prefix + key, value) ;
                }
                else if (type === 'number') {
                    dr.addfield(prefix + key, value) ;
                }
                else if (type === 'boolean') {
                    dr.addfield(prefix + key, value) ;
                }
                else if (type === 'object') {
                    this.extractBAMatchResult(prefix, value, dr) ;
                }
            }
        }
        else {
            for(let key of Object.keys(result)) {
                let value = result[key] ;
                let type = typeof value ;

                if (type === 'string') {
                    dr.addfield(prefix + key, value) ;
                }
                else if (type === 'number') {
                    dr.addfield(prefix + key, value) ;
                }
                else if (type === 'boolean') {
                    dr.addfield(prefix + key, value) ;
                }
                else if (type === 'object') {
                    this.extractBAMatchResult(prefix, value, dr) ;
                }
            }
        }
    }

    // array
    // key_                         -> KEY
    // comp_level_                  -> TYPE
    // match_number                 -> MATCHNO
    // set_number                   -> SETNO
    // blue_alliance_.teams_[0]     -> BLUE1
    // blue_alliance_.teams_[1]     -> BLUE2
    // blue_alliance_.teams_[2]     -> BLUE3
    // red_alliance_.teams_[0]      -> RED1   
    // red_alliance_.teams_[1]      -> RED2  
    // red_alliance_.teams_[2]      -> RED3               
    //
    public processBAData(data: any[]) : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            let records: DataRecord[] = [] ;
            let reccolnames: Set<string> = new Set<string>() ;

            for(let one of data) {
                let dr = new DataRecord() ;
                records.push(dr) ;

                if (one.key_) {
                    dr.addfield('KEY', one.key_) ;
                }

                if (one.comp_level_) {
                    dr.addfield('TYPE', one.comp_level_) ;
                }

                if (one.match_number_ !== undefined) {
                    dr.addfield('MATCHNO', one.match_number_) ;
                }

                if (one.set_number_ !== undefined) {
                    dr.addfield('SETNO', one.set_number_) ;
                }

                if (one.blue_alliance_.teams_[0]) {
                    dr.addfield('BLUE1', one.blue_alliance_.teams_[0]) ;
                }

                if (one.blue_alliance_.teams_[1]) {
                    dr.addfield('BLUE2', one.blue_alliance_.teams_[1]) ;
                }

                if (one.blue_alliance_.teams_[2]) {
                    dr.addfield('BLUE3', one.blue_alliance_.teams_[2]) ;
                }

                if (one.red_alliance_.teams_[0]) {
                    dr.addfield('RED1', one.red_alliance_.teams_[0]) ;
                }

                if (one.red_alliance_.teams_[1]) {
                    dr.addfield('RED2', one.red_alliance_.teams_[1]) ;
                }

                if (one.red_alliance_.teams_[2]) {
                    dr.addfield('RED3', one.red_alliance_.teams_[2]) ;
                }

                this.extractBAMatchResult(MatchDataModel.BlueAlliancePrefix, one.results_, dr) ;

                for(let key of dr.keys()) {
                    reccolnames.add(key) ;
                }
            }

            let existing: string[] = [] ;
            
            try {
                existing = await this.getColumnNames(MatchDataModel.MatchTableName) ;
            }
            catch(err) {
                reject(err) ;
            }

            let toadd: string[][] = [] ;
            for(let key of reccolnames.keys()) {
                if (!existing.includes(key)) {
                    let type = this.extractType(key, records) ;
                    let pair = [key, type] ;
                    toadd.push(pair) ;
                }
            }

            if (toadd.length > 0) {
                try {
                    await this.createColumns(MatchDataModel.MatchTableName, toadd) ;
                }
                catch(err) {
                    reject(err) ;
                }
            }

            for(let record of records) {
                try {
                    await this.insertOrUpdate(MatchDataModel.MatchTableName, ['TYPE', 'MATCHNO', 'SETNO'], record) ;
                }
                catch(err) {
                    reject(err) ;
                }
            }

            resolve() ;
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
                TYPE: 'qm',
                SETNO: +match[2],
                MATCHNO: +match[3],
                TEAM: +match[4]
            } ;
        }

        return ret ;
    }

    public processScoutingResults(results: any) {
        let i = 0 ;
        let records: DataRecord[] = [] ;

        while (i < results.length) {
            let which = results[i++] ;
            let data = results[i++] ;
            let keys = this.parseMatchString(which) ;
            if (keys) {
                let dr = new DataRecord() ;
            }
        }
    }
}