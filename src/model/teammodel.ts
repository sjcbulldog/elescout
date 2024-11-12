import * as sqlite3 from 'sqlite3' ;
import { DataModel, DataRecord, ValueType } from "./datamodel";

export class TeamDataModel extends DataModel {
    static readonly TeamTableName: string = 'teams' ;

    public constructor(dbname: string, infoname: string) {
        super(dbname, infoname) ;
    }

    public getColumns() : Promise<string[]> {
        return this.getColumnNames(TeamDataModel.TeamTableName) ;
    }

    public getAllData() : Promise<any> {
        let ret = new Promise<any>((resolve, reject) => {
            let query = 'select * from ' + TeamDataModel.TeamTableName + ';' ;
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
                this.createTeamTableIfNecessary()
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

    private createTeamTableIfNecessary() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            this.getTableNames()
                .then((tables : string[]) => {
                    if (!tables.includes(TeamDataModel.TeamTableName)) {
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
        let ret = 'create table teams (' ;
        ret += 'KEY TEXT NOT NULL' ;
        ret += ');' ;

        return ret ;
    }

    public processBAData(data: any) : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            let records: DataRecord[] = [] ;
            let reccolnames: Set<string> = new Set<string>() ;

            for(let one of data) {
                let dr = new DataRecord() ;
                records.push(dr) ;

                for(let key of Object.keys(one)) {
                    if (key === 'key_') {
                        dr.addfield('KEY', one[key]) ;
                    }
                    else {
                        dr.addfield(key, one[key]) ;
                    }

                    for(let key of dr.keys()) {
                        reccolnames.add(key) ;
                    }
                }
            }

            let existing: string[] = [] ;
            
            try {
                existing = await this.getColumnNames(TeamDataModel.TeamTableName) ;
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
                    await this.createColumns(TeamDataModel.TeamTableName, toadd) ;
                }
                catch(err) {
                    reject(err) ;
                }
            }

            for(let record of records) {
                try {
                    await this.insertOrUpdate(TeamDataModel.TeamTableName, ['KEY'], record) ;
                }
                catch(err) {
                    reject(err) ;
                }
            }

            resolve() ;
        }) ;

        return ret;        
    }

    public processScoutingResults(results: any) {        
    }
}