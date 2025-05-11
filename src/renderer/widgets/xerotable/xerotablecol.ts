import { XeroTable, XeroTableColumnDef, XeroTableFont } from "./xerotable";

export class XeroTableColumn {
    private static canvas_ : HTMLCanvasElement = document.createElement('canvas') ;

    private table_ : XeroTable ;
    private index_ : number ;
    private def_ : XeroTableColumnDef ;
    private width_ : number = 0 ;
    private minWidth_ : number = 0 ;
    private maxWidth_ : number = 0 ;
    private formatter_? : (data: any) => string ;
    private sortup_: boolean = true ;

    constructor(table: XeroTable, index: number, def: XeroTableColumnDef) {
        this.table_ = table ;
        this.index_ = index ;
        this.def_ = def ;
    }

    public get editable() : boolean {
        return this.def_.editable ? this.def_.editable : false ;
    }
    
    public get sortable() : boolean {
        return this.def_.sortable ? this.def_.sortable : false ;
    }

    public get sortFunc() : ((a: any, b: any) => number) | undefined {
        return this.def_.sortFunc ? this.def_.sortFunc : undefined ;
    }

    public get sortUp() : boolean {
        return this.sortup_ ;
    }

    public resetSort() : void { 
        this.sortup_ = true ;
    }

    public toggleSort() : void {
        this.sortup_ = !this.sortup_ ;
    }

    public get field() : string {
        return this.def_.field ;
    }

    public get width() : number {
        return this.width_ ;
    }

    public get padding() : number {
        return this.table_.options.columnPadding! ;
    }

    public get dblClick() : boolean {
        return this.def_.dblClick ? this.def_.dblClick : false ;
    }

    public get singleClick() : boolean {
        return this.def_.singleClick ? this.def_.singleClick : false ;  
    }

    public setWidth(width? : number) : void {
        if (width === undefined) {
            this.width_ = this.findColumnWidth() ;
        }
        else {
            this.width_ = width ;
        }
        this.table_.updateLayout() ;
    }

    public get index() : number {
        return this.index_ ;
    }

    public get table() : XeroTable {
        return this.table_ ;
    }

    public setFormatter(formatter: (data: any) => string) : void {
        this.formatter_ = formatter ;
    }

    public get formatter() : ((data: any) => string) | undefined {
        return this.formatter_ ;
    }

    public get title() : string {
        let ret = this.def_.title ? this.def_.title : this.def_.field ;
        if (this.def_.sortable) {
            if (this.sortUp) {
                ret += '&#x25B2;' ;
            }
            else {
                ret += '&#x25BC;' ;
            }
        }

        return ret;
    }

    private findStringWidth(text: string, font: XeroTableFont) : number {
        let ctx = XeroTableColumn.canvas_.getContext('2d') ;
        if (!ctx) {
            throw new Error('XeroTableColumn: No canvas context') ;
        }

        ctx.font = `${font.fontWeight} ${font.fontStyle} ${font.fontSize}px ${font.fontFamily}` ;
        let tm = ctx.measureText(text) ;
        return tm.width ;
    }

    private findColumnWidth() : number {
        let ret = this.findStringWidth(this.title, this.table_.options.headerFont!) ;

        for(let row = 0; row < this.table_.model.rowCount(); row++) {
            let text = this.table_.getCellText(row, this.index_) ;
            ret = Math.max(ret, this.findStringWidth(text, this.table_.options.cellFont!)) ;
        }
        return ret + this.padding * 2 ;
    }
}
