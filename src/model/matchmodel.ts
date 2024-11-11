import * as sqlite3 from 'sqlite3' ;
import { DataModel, DataRecord } from "./datamodel";
import { Match } from '../project/match';
import { MatchData } from '../project/matchdata';

export class MatchDataModel extends DataModel {
    static readonly MatchTableName: string = 'matches' ;

    private colnames_ : string[] ;

    public constructor(dbname: string, infoname: string) {
        super(dbname, infoname) ;
        this.colnames_ = [] ;
    }

    public init() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            super.init()
            .then(() => {
                this.createMatchTableIfNecessary()
                    .then(()=> {
                        this.getColumnNames(MatchDataModel.MatchTableName)
                            .then((cols: string[]) => {
                                this.colnames_ = cols ;
                                resolve() ;
                            })
                            .catch((err) => {
                                reject(err) ;
                            });
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

                if (one.match_number !== undefined) {
                    dr.addfield('MATCHNO', one.match_number) ;
                }

                if (one.set_number !== undefined) {
                    dr.addfield('SETNO', one.set_number) ;
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
                    await this.insertOrUpdate(MatchDataModel.MatchTableName, 'KEY', record) ;
                }
                catch(err) {
                    reject(err) ;
                }
            }

            resolve() ;
        }) ;

        return ret;
    }

    public processResults(results: any) {        
    }
}