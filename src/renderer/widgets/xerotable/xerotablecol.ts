import { XeroTable } from "./xerotable";

export class XeroTableColumn {
    private table_ : XeroTable ;
    private index_ : number ;
    private field_ : string ;
    private title_ : string ;
    private width_ : number | undefined ;

    constructor(table: XeroTable, index: number, field: string, title: string, width?: number) {
        this.table_ = table ;
        this.index_ = index ;
        this.field_ = field ;
        this.title_ = title ;
        this.width_ = width ;
    }

    field() : string {
        return this.field_ ;
    }

    title() : string {
        return this.title_ ;
    }

    width() : number | undefined {
        return this.width_ ;
    }

    setWidth(width? : number) : void {
        if (width === undefined) {
            width = 0 ;
        }
        else {
            this.width_ = width ;
        }
        this.table_.updateLayout() ;
    }
}