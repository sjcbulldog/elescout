import * as sqlite3 from 'sqlite3' ;
import { DataModel } from "./datamodel";

export class TeamDataModel extends DataModel {
    static readonly TeamTableName: string = 'teams' ;

    public constructor(dbname: string, infoname: string) {
        super(dbname, infoname) ;
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
        let ret = 'create table matches (' ;
        ret += 'KEY TEXT NOT NULL' ;
        ret += ', NICKNAME TEXT NOT NULL' ;
        ret += ', NAME TEXT NOT NULL' ;
        ret += ');' ;

        return ret ;
    }

    public processBAData(data: any) {
        console.log(data) ;
    }

    public processResults(results: any) {        
    }
}