import { XeroWidget } from "../xerowidget";
import { XeroTableColumn } from "./xerotablecol";
import { XeroTableDataModel } from "./xerodatamodel";

export interface XeroTableColumnDef {
    width?: number ;
    field: string ;
    title: string ;
}

export interface XeroTableOptions {
    data?: any[] ;
    columns: XeroTableColumnDef[] ;
}

export class XeroTable extends XeroWidget {
    private model_ : XeroTableDataModel ;
    private data_ : any[] ;
    private columns_ : XeroTableColumn[] = [] ;
    private headers_ : HTMLDivElement[] = [] ;

    constructor(options: XeroTableOptions) {
        super('div', 'xero-table') ;
        this.columns_ = [] ;

        if (!options.data) {
            throw new Error('XeroTable: No data provided') ;
        }
        this.data_ = options.data ;

        if (!options.columns) {
            throw new Error('XeroTable: No columns provided') ;
        }
        
        this.model_ = new XeroTableDataModel(this.data_) ;

        this.createColumns(options.columns) ;
        this.updateLayout() ;
    }

    public getColumns() : XeroTableColumn[] {
        return this.columns_ ;
    }

    public updateLayout() : void {
        //
        // Find the width of the colums and table
        // and set the width of the table to the sum of the columns
        //
    }

    processData() {

    }

    private createColumns(columns: XeroTableColumnDef[]) : void {
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i] ;
            const col = new XeroTableColumn(this, i, column.field, column.title, column.width) ;
            this.columns_.push(col) ;

            const header = document.createElement('div') ;
            header.className = 'xero-table-header' ;
            header.style.width = column.width ? column.width + 'px' : 'auto' ;
            header.innerText = column.title ;
            this.headers_.push(header) ;
            this.elem.appendChild(header) ;
        }
    }
}
