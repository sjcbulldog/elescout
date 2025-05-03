import { DataValue } from "./datavalue";

export class DataRecord {
    private data_ : Map<string, DataValue> ;


    public constructor() {
        this.data_ = new Map<string, DataValue>() ;
    }

    public addfield(name: string, value : DataValue) {
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

    public value(key: string) : DataValue | undefined {
        return this.data_.get(key) ;
    }
}
