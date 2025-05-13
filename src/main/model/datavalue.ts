export type DataValueType = "integer" | "real" | "string" | "boolean" | "array" | "null" | "error"  ;

export class DataValue {
    private value_: unknown ;
    public type: DataValueType ;

    public constructor(value: unknown, type: DataValueType) {
        this.value_ = value;
        this.type = type;
    }

    public get value() : any {
        return this.value_ ;
    }

    public equals(other: DataValue): boolean {  
        if (this.type !== other.type) {
            return false;
        }

        if (this.value_ === null && other.value_ === null) {
            return true;
        }

        if (this.value_ === null || other.value_ === null) {
            return false;
        }

        if (this.type === 'array') {
            const arr1 = this.toArray();
            const arr2 = other.toArray();
            if (arr1.length !== arr2.length) {
                return false;
            }
            for (let i = 0; i < arr1.length; i++) {
                if (!arr1[i].equals(arr2[i])) {
                    return false;
                }
            }
            return true;
        }

        return this.value_ === other.value_;
    }

    static isValidType(type: DataValueType): boolean {
        return ['integer', 'real', 'string', 'boolean', 'error', 'array'].includes(type);
    }

    static nullValue() {
        return new DataValue(null, 'null') ;
    }

    static fromArray(value: Array<DataValue>): DataValue {
        return new DataValue(value, 'array');
    }

    static fromError(err: Error) {
        return new DataValue(err, 'error');
    }

    static fromString(value: string): DataValue {
        return new DataValue(value, 'string');
    }

    static fromReal(value: number): DataValue {
        return new DataValue(value, 'real');
    }

    static fromInteger(value: number): DataValue {
        if (!Number.isInteger(value)) {
            throw new Error(`Value ${value} is not an integer`);
        }
        if (value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
            throw new Error(`Value ${value} is out of safe integer range`);
        }

        return new DataValue(value, 'integer');
    }

    static fromBoolean(value: boolean): DataValue {
        return new DataValue(value, 'boolean');
    }

    public isNull() : boolean {
        return this.type === 'null' ;
    }

    public isInteger() : boolean {
        return this.type === 'integer';
    }

    public isReal() : boolean {
        return this.type === 'real';
    }

    public isNumber() : boolean {
        return this.type === 'integer' || this.type === 'real';
    }   

    public isString() : boolean {
        return this.type === 'string';
    }

    public isBoolean() : boolean {
        return this.type === 'boolean';
    }

    public isArray() : boolean {
        return this.type === 'array';
    }

    public isError() : boolean {
        return this.type === 'error';
    }

    public toBoolean() : boolean {
        if (this.type !== 'boolean') {
            throw new Error(`Cannot convert ${this.type} to boolean`);
        }
        return this.value_ as boolean;
    }

    public toString() : string {
        if (this.type !== 'string') {
            throw new Error(`Cannot convert ${this.type} to string`);
        }
        return this.value_ as string;
    }

    public toReal() : number {
        if (this.type !== 'real' && this.type !== 'integer') {
            throw new Error(`Cannot convert ${this.type} to number`);
        }
        return this.value_ as number;
    }

    public toInteger() : number {
        if (this.type !== 'integer') {
            throw new Error(`Cannot convert ${this.type} to integer`);
        }
        return this.value_ as number;
    }

    public toArray() : Array<DataValue> {
        if (this.type !== 'array') {
            throw new Error(`Cannot convert ${this.type} to array`);
        }
        return this.value_ as Array<DataValue>;
    }

    public toDisplayString() : string {
        let ret = '' ;

        if (this.value_ === null) {
            ret = 'null' ; 
        }
        else if (this.type === 'string') {
            ret = this.toString() ;
        }
        else if (this.type === 'boolean') {
            ret = this.toBoolean() ? 'true' : 'false' ;
        }
        else if (this.type === 'integer') {
            ret = this.toInteger().toString() ;
        }
        else if (this.type === 'real') {
            ret = this.toReal().toString() ;
        }
        else if (this.type === 'array') {
            ret = '[' ;
            for(const v of this.toArray()) {
                ret += `${v.toDisplayString()},` ;
            }
            if (ret.length > 1) {
                ret = ret.slice(0, -1) ; // remove last comma
            }
            ret += ']' ;
        }
        else if (this.type === 'error') {
            ret = `Error: ${this.toString()}`;
        }
        else {
            ret = `Unknown type: ${this.type}`;
        }

        return ret;
    }

    public toValueString() {
        let ret = '' ;

        if (this.value_ === null) {
           ret = 'null' ; 
        }
        else if (this.type === 'string') {
            ret = `'` ;
            for(const c of this.toString()) {
                if (c === "'") {
                    ret += `''` ;
                }
                else {
                    ret += c ;
                }
            }
            ret += `'` ;
        }
        else if (this.type === 'boolean') {
            ret = this.toBoolean() ? '1' : '0' ;
        }
        else if (this.type === 'integer') {
            ret = this.toInteger().toString() ;
        }
        else if (this.type === 'real') {
            ret = this.toReal().toString() ;
        }
        else if (this.type === 'array') {
            ret = '[' ;
            for(const v of this.toArray()) {
                ret += `${v.toValueString()},` ;
            }
            if (ret.length > 1) {
                ret = ret.slice(0, -1) ; // remove last comma
            }
            ret += ']' ;
        }
        else if (this.type === 'error') {
            ret = `Error: ${this.toString()}`;
        }
        else {
            ret = `Unknown type: ${this.type}`;
        }

        return ret;
    }
}
