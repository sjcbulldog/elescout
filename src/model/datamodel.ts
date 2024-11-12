import * as sqlite3 from 'sqlite3' ;

export type ValueType = string | number | boolean | null ;

export class DataRecord {
    private data_ : Map<string, ValueType> ;

    public constructor() {
        this.data_ = new Map<string, ValueType>() ;
    }

    public addfield(name: string, value : ValueType) {
        this.data_.set(name, value) ;
    }

    public keys() : string[] {
        let ret: string[] = [] ;

        for(let key of this.data_.keys()) {
            ret.push(key) ;
        }
        return ret ;
    }

    public has(key: string) : boolean {
        return this.data_.has(key) ;
    }

    public value(key: string) : ValueType | undefined {
        return this.data_.get(key) ;
    }
}

export class DataModel {
    private static readonly ColummTableName: string = 'cols' ;

    private dbname_ : string ;
    private infoname_ : string ;
    private db_? : sqlite3.Database ;

    constructor(dbname: string, infoname: string) {
        this.dbname_ = dbname ;
        this.infoname_ = infoname ;
    }

    public runQuery(query: string) : Promise<sqlite3.RunResult> {
        let ret = new Promise<sqlite3.RunResult>((resolve, reject) => {
            this.db_?.run(query, (res: sqlite3.RunResult, err: Error) => {
                if (err) {
                    reject(err) ;
                }
                else {
                    resolve(res) ;
                }
            }) ;
        }) ;
        return ret ;
    }

    public getTableNames() : Promise<string[]> {
        let ret = new Promise<string[]>((resolve, reject) => {
            let query = 'SELECT name FROM sqlite_schema WHERE type =\'table\' AND name NOT LIKE \'sqlite_%\';' ;
            this.all(query)
                .then((rows) => {
                    let tables: string[] = [] ;
                    for(let row of rows) {
                        let rowobj = row as any ;
                        tables.push(rowobj.name) ;
                    }
                    resolve(tables) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;
        return ret ;
    }

    public getColumnNames(table: string, comparefn? : ((a: string, b: string) => number)) : Promise<string[]> {
        let ret = new Promise<string[]>((resolve, reject) => {
            let query = 'SELECT * FROM sqlite_schema where name=\'' + table + '\';' ;
            this.all(query)
                .then((rows) => {
                    let one = rows[0] as any ;
                    let cols = this.parseSql(one.sql) ;
                    if (comparefn) {
                        cols.sort(comparefn) ;
                    }
                    resolve(cols) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;
        return ret ;
    }

    public all(query: string) : Promise<unknown[]> {
        let ret = new Promise<unknown[]>((resolve, reject) => {
            this.db_?.all(query, (err, rows) => {
                if (err) {
                    reject(err) ;
                }
                else {
                    resolve(rows) ;
                }
            }) ;
        }) ;
        return ret ;
    }

    public init() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            this.db_ = new sqlite3.Database(this.dbname_, (err) => {
                if (err) {
                    reject(err) ;
                }
                else {
                    resolve() ;
                }
            }) ;
        }) ;

        return ret ;
    }

    protected extractType(key: string, records: DataRecord[]) {
        let type: string = '' ;

        for(let record of records) {
            if (record.has(key)) {
                let v = record.value(key) ;

                if (v === null) {
                    type = 'TEXT' ;
                }
                else if (typeof v === 'string') {
                    type = 'TEXT' ;
                }
                else if (typeof v === 'number') {
                    type = 'REAL' ;
                }
                else if (typeof v === 'boolean') {
                    type = 'INTEGER'
                }
                break ;
            }
        }

        return type ;
    }

    private parseSql(sql: string) : string [] {
        let ret: string[] = [] ;
        let index: number ;

        index = sql.indexOf('(') ;
        if (index !== -1) {
            index++ ;
            while (index < sql.length) {
                let colname = '' ;

                while (index < sql.length) {
                    let ch = sql.charAt(index) ;
                    if (!ch.match(/[a-z_0-9]/i)) {
                        break ;
                    }
                    colname += ch ;
                    index++ ;
                }
                ret.push(colname) ;

                index = sql.indexOf(',', index) ;
                if (index === -1) {
                    break ;
                }
                index++ ;

                while (index < sql.length) {
                    let ch = sql.charAt(index) ;
                    if (ch !== ' ') {
                        break ;
                    }
                    index++ ;
                }
            }
        }

        return ret ;
    }
    
    private valueToString(v: ValueType) {
        let ret: string ;

        if (typeof v === 'string') {
            ret = '\'' + v + '\'' ;
        }
        else if (v === null) {
            ret = 'NULL' ;
        }
        else {
            ret = v!.toString() ;
        }

        return ret ;
    }

    private generateWhereClause(keys: string[], dr: DataRecord) : string {
        let query = ' WHERE ' ;
        let first = true ;

        for(let i = 0 ; i < keys.length ; i++) {
            if (!first) {
                query += ' AND ' ;
            }
            query += keys[i] ;
            query += ' = ' ;
            query += this.valueToString(dr.value(keys[i])!) ;

            first = false ;
        }

        return query ;
    }

    public updateRecord(table: string, keys: string[], dr: DataRecord) : Promise<void> {
        let ret = new Promise<void>((resolve,reject) => {
            let query = 'update ' + table + ' SET ' ;
            let first = true ;
            for(let key of dr.keys()) {
                let v = dr.value(key) ;

                if (!first) {
                    query += ', ' ;
                }

                query += key + '=' + this.valueToString(v!) ;
                first = false ;
            }

            query += ') ' + this.generateWhereClause(keys, dr) ;
            this.runQuery(query).then(()=> resolve()).catch((err) =>reject(err)) ;

        }) ;
        
        return ret;
    }

    public insertRecord(table: string, dr: DataRecord) : Promise<void> {
        let ret = new Promise<void>((resolve,reject) => {
            let query = 'insert into ' + table + ' (' ;
            let valstr = 'VALUES (' ;
            let first = true ;
            for(let key of dr.keys()) {
                let v = dr.value(key) ;

                if (!first) {
                    query += ',';
                    valstr += ',' ;
                }

                query += key ;
                valstr += this.valueToString(v!) ;
                first = false ;
            }

            query += ') ' + valstr + ');' ;
            this.runQuery(query).then(()=> resolve()).catch((err) =>reject(err)) ;
        }) ;
        
        return ret;
    }

    public insertOrUpdate(table: string, keys: string[], dr: DataRecord) : Promise<void> {
        let ret = new Promise<void>((resolve,reject) => {
            for(let key of keys) {
                if (!dr.has(key)) {
                    let err = new Error('The data record is missing a value for the key \'' + key + '\'') ;
                    reject(err) ; 
                }
            }

            let query: string = 'select * from ' + table + this.generateWhereClause(keys, dr) ;

            this.all(query)
                .then((rows: unknown[])=> {
                    if (rows.length) {
                        // Update the record in the database
                        this.updateRecord(table, keys, dr)
                            .then(() => {
                                resolve() ;
                            })
                            .catch((err) => {
                                reject(err) ;
                            }) ;
                    }
                    else {
                        // Insert the record into the database
                        this.insertRecord(table, dr)
                            .then(() => {
                                resolve() ;
                            })
                            .catch((err) => {
                                reject(err) ;
                            }) ;                        
                    }
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;
        return ret;
    }

    public createColumns(table: string, toadd:string[][]) : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            let allpromises = [] ;

            for(let one of toadd) {
                let query: string = 'alter table ' + table + ' add column ' + one[0] + ' ' + one[1] + ';' ;
                let pr = this.runQuery(query) ;
                allpromises.push(pr) ;
            }

            Promise.all(allpromises).then(() => resolve()).catch((err) => reject(err)) ;
        }) ;

        return ret ;
    }
}
