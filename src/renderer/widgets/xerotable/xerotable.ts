import { XeroWidget } from "../xerowidget";
import { XeroTableColumn } from "./xerotablecol";
import { XeroTableDataModel } from "./xerodatamodel";
import { XeroLogger } from "../../utils/xerologger";

export interface XeroTableFont {
    fontFamily?: string ;
    fontSize?: number ;
    fontColor?: string ;
    fontWeight?: string ;
    fontStyle?: string ;
}

export interface XeroTableColumnDef {
    width?: number ;
    field: string ;
    title: string ;
    minwidth?: number ;
    formatter?: (data: any) => string ;
    dblClick? : boolean ;
    singleClick? : boolean ;
    sortable? : boolean ;
    sortFunc? : (a: any, b: any) => number ;
    editable?: boolean ;
}

export interface XeroTableOptions {
    data: any[] ;
    columns: XeroTableColumnDef[] ;
    rowHeight? : number ;
    headerHeight? : number ;
    borderWidth? : number ;
    cellFont?: XeroTableFont ;
    headerFont?: XeroTableFont ;
    columnPadding?: number ;
    cellPadding: number ;
    rowsSelectable?: boolean ;
}

export class XeroTable extends XeroWidget {
    private model_ : XeroTableDataModel ;
    private columns_ : XeroTableColumn[] = [] ;
    private options_: XeroTableOptions ;
    private table_container_ : HTMLDivElement ;
    private table_headers_ : HTMLDivElement ;
    private table_rows_ : HTMLDivElement ;
    private sort_col_ : number = -1 ;
    private selected_row_ : number = -1 ;
    private editing_cell_ : boolean = false ;
 
    constructor(options: XeroTableOptions) {
        super('div', 'xero-table') ;
        this.columns_ = [] ;

        this.table_container_ = document.createElement('div') ;
        this.table_container_.className = 'xero-table-container' ;
        this.elem.appendChild(this.table_container_) ;

        this.table_headers_ = document.createElement('div') ;
        this.table_headers_.className = 'xero-table-headers' ;
        this.table_container_.appendChild(this.table_headers_) ;

        this.table_rows_ = document.createElement('div') ;
        this.table_rows_.className = 'xero-table-rows' ;
        this.table_container_.appendChild(this.table_rows_) ;

        if (!options) {
            throw new Error('XeroTable: No options provided') ;
        }
        this.options_ = this.normalizeOptions(options) ;
        this.model_ = new XeroTableDataModel(options.data) ;
      
        this.createColumns(options.columns)
            .then(() => {
                this.updateTable() ;
            })
            .then(() => {
                this.initialColumnWidths() ;
                this.emit('table-ready') ;
            })
            .catch((err) => {
                this.emit('table-error', err) ;
                let logger = XeroLogger.getInstance() ;
                logger.error(`XeroTable: Error creating table: ${err.message}`) ;
                logger.error(err.stack.toString()) ;
            }) ;
    }

    public getSelectedRow() : number {
        return this.selected_row_ ;
    }

    public getRowCount() : number {
        return this.model_.rowCount() ;
    }

    public getRowData(row: number) : any {
        if (row < 0 || row >= this.model_.rowCount()) {
            throw new Error('XeroTable: Row out of range') ;
        }
        return this.model_.getRowData(row) ;
    }

    public addRow(data: any) : void {
        this.model_.addRow(data) ;

        // TODO: make this more efficient
        this.updateTable()
        .then(() => {
            this.emit('table-updated') ;
        })
        .catch((err) => {
            let logger = XeroLogger.getInstance() ;
            logger.error(`XeroTable: Error adding row: ${err.message}`) ;
            logger.error(err.stack.toString()) ;
        }) ;
    }

    public deleteRow(row: number) : void {
        if (row < 0 || row >= this.model_.rowCount()) {
            throw new Error('XeroTable: Row out of range') ;
        }

        if (this.selected_row_ === row) {
            for(let i = 0; i < this.columns_.length; i++) {
                const cell = this.table_rows_.children[this.selected_row_].children[i] as HTMLDivElement ;
                cell.classList.remove('xero-table-cell-rowselected') ;
            }
            this.selected_row_ = -1 ;
        }
        this.model_.removeRow(row) ;
        this.table_rows_.removeChild(this.table_rows_.children[row]) ;
    } ;

    public setFilter(filter: (data: any) => boolean) : void {
        this.table_rows_.innerHTML = '' ;
        this.model_.filter(filter) ;
        this.updateTable()
        .then(() => {
            this.emit('table-filtered') ;
        })
        .catch((err) => {
            let logger = XeroLogger.getInstance() ;
            logger.error(`XeroTable: Error filtering table: ${err.message}`) ;
            logger.error(err.stack.toString()) ;
        }) ;
    }

    public updateTable() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            this.createCells()
            .then(() => {
                this.putAllData() ;
            })
            .then(() => {
                this.updateLayout() ;
            })
            .then(() => {
                resolve() ;
            })
            .catch((err) => {
                reject(err) ;
            }) ;
        }) ;
        return ret ;
    }        

    public get options() : XeroTableOptions {
        return this.options_ ;
    }

    public get model() : XeroTableDataModel {
        return this.model_ ;
    }

    public getColumns() : XeroTableColumn[] {
        return this.columns_ ;
    }

    public fitColumns() : void {
        let totalWidth = 0 ;
        for(let col of this.columns_) {
            totalWidth += col.width ;
        }
        let containerWidth = this.table_container_.clientWidth ;
        let scale = containerWidth / totalWidth ;
        for(let col of this.columns_) {
            col.setWidth(Math.floor(col.width * scale)) ;
        }
        this.updateLayout() ;
    }

    public selectRow(row: number) : void {
        if (row < 0 || row >= this.model_.rowCount()) {
            throw new Error('XeroTable: Row out of range') ;
        }

        if (this.selected_row_ >= 0) {
            for(let i = 0; i < this.columns_.length; i++) {
                const cell = this.table_rows_.children[this.selected_row_].children[i] as HTMLDivElement ;
                cell.classList.remove('xero-table-cell-rowselected') ;
            }
            this.selected_row_ = -1 ;
        }

        this.selected_row_ = row ;
        if (this.selected_row_ >= 0) {
            for(let i = 0; i < this.columns_.length; i++) {
                const cell = this.table_rows_.children[this.selected_row_].children[i] as HTMLDivElement ;
                cell.classList.add('xero-table-cell-rowselected') ;
            }
        }
    }

    private async putAllData(skipHeaders?: boolean) : Promise<void> {
        for (let i = 0; i < this.model_.rowCount(); i++) {
            for (let j = 0; j < this.columns_.length; j++) {
                this.putData(i, j) ;
            }
        }

        if (!skipHeaders) {
            for(let col = 0; col < this.columns_.length; col++) {
                this.updateColumnHeader(col) ;
            }
        }
    }

    private updateColumnHeader(col: number) : void {
        const colobj = this.columns_[col] ;
        let cell = this.table_headers_.children[col] as HTMLElement ;
        cell.innerHTML = colobj.title ;
        cell.style.fontFamily = this.options_.headerFont!.fontFamily! ;
        cell.style.fontSize = this.options_.headerFont!.fontSize! + 'px' ;
        cell.style.color = this.options_.headerFont!.fontColor! ;
        cell.style.fontWeight = this.options_.headerFont!.fontWeight! ;
        cell.style.fontStyle = this.options_.headerFont!.fontStyle! ;
    }

    private sortColumn(col: number) : void {
        if (this.sort_col_ == col) {
            this.columns_[col].toggleSort() ;
            this.updateColumnHeader(col) ;
        }
        else {
            if (this.sort_col_ >= 0) {
                this.columns_[this.sort_col_].resetSort() ;
                this.table_headers_.children[this.sort_col_].className = 'xero-table-header-cell-sortable' ;
            }
            this.sort_col_ = col ;
            this.table_headers_.children[this.sort_col_].className = 'xero-table-header-cell-sortable-selected' ;
        }
        this.model_.sort(this.columns_[col].field, this.columns_[col].sortUp, this.columns_[col].sortFunc) ;
        this.putAllData(true) ;
    }

    public getCellText(row: number, col: number) : string {
        const colobj = this.columns_[col] ;
        let rowdata : any = this.model_.getData(row, colobj.field) ;
        return this.formatData(rowdata, colobj) ;
    }

    private putData(row: number, col: number) {
        const cell = this.table_rows_.children[row].children[col] as HTMLDivElement ;
        const colobj = this.columns_[col] ;
        cell.innerText = this.getCellText(row, col) ;
    }

    private dblClickCell(row: number, col: number, ev: Event) : void {
        this.emit('cell-dblclick', 
            {
                row: row, 
                col: col, 
                cell: ev.target
            }) ;
    } ;

    private clickCell(row: number, col: number, ev: Event) : void {
        if (this.columns_[col].singleClick) {
            this.emit('cell-click', {
                row: row, 
                col: col, 
                cell: ev.target
            }) ;
        }

        if (this.options_.rowsSelectable) {
            this.selectRow(row) ;
        }
    }

    public updateLayout() : void {
        //
        // Find the width of the colums and table
        // and set the width of the table to the sum of the columns
        //
        for(let col = 0; col < this.columns_.length; col++) {
            const colobj = this.columns_[col] ;

            let elem = this.table_headers_.children[col] as HTMLDivElement ;
            elem.style.width = colobj.width + 'px' ;

            for(let row = 0; row < this.table_rows_.children.length; row++) {
                const cell = this.table_rows_.children[row].children[col] as HTMLDivElement ;
                cell.style.width = colobj.width + 'px' ;
            }
        }
    }

    private formatData(data: any, col: XeroTableColumn) : string {
        if (!data) {
            return '' ;
        }

        if (col.formatter) {
            return col.formatter(data) ;
        }
        return data.toString() ;

    }

    private normalizeOptions(options: XeroTableOptions) : XeroTableOptions {
        const opts = options ;
        if (!opts.rowHeight) {
            opts.rowHeight = 20 ;
        }
        if (!opts.headerHeight) {
            opts.headerHeight = 30 ;
        }

        if (!opts.borderWidth) {
            opts.borderWidth = 1 ;
        }

        if (!opts.columnPadding) {
            opts.columnPadding = 2 ;
        }

        if (!opts.cellPadding) {
            opts.cellPadding = 2 ;
        }

        if (!opts.cellFont) {
            opts.cellFont = {
                fontFamily: 'Arial',
                fontSize: 12,
                fontColor: '#000000',
                fontWeight: 'normal',
                fontStyle: 'normal',
            } ;
        }

        if (!opts.data) {
            opts.data = [] ;
        }

        if (!opts.columns) {
            opts.columns = [] ;
        }
        return opts ;
    }

    private async createHeadersCells() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            let left : number = this.table_container_.clientLeft || 0 ;
            this.table_headers_.innerHTML = '' ;
            for(let col = 0 ; col < this.columns_.length; col++) {
                const colobj = this.columns_[col] ;
                const cell = document.createElement('div') ;
                let rowelem = this.table_headers_ ;
                cell.style.paddingLeft = this.options_.columnPadding! + 'px' ;
                cell.style.paddingRight = this.options_.columnPadding! + 'px' ;
                if (colobj.sortable) {
                    cell.addEventListener('click', this.sortColumn.bind(this, col)) ;
                    cell.className = 'xero-table-header-cell-sortable' ;
                }
                else {
                    cell.className = 'xero-table-header-cell' ;
                }

                cell.style.width = colobj.width + 'px' ;
                cell.style.height = this.options_.rowHeight! + 'px' ;
                cell.style.fontFamily = this.options_.cellFont!.fontFamily! ;
                cell.style.fontSize = this.options_.cellFont!.fontSize! + 'px' ;
                cell.style.color = this.options_.cellFont!.fontColor! ;
                cell.style.fontWeight = this.options_.cellFont!.fontWeight! ;
                cell.style.fontStyle = this.options_.cellFont!.fontStyle! ;
                this.table_headers_.appendChild(cell) ;

                left += colobj.width ;                
            }
            resolve() ;
        }) ;
        return ret ;
    }

    private async creatRowCells() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            let y = this.table_container_.clientTop || 0 ;
            this.table_rows_.innerHTML = '' ;
            for(let row = 0 ; row < this.model_.rowCount(); row++) {
                let left : number = this.table_container_.clientLeft || 0 ;
                let rowelem = document.createElement('div') ;
                rowelem.className = 'xero-table-row' ;
                this.table_rows_.appendChild(rowelem) ;

                for(let col = 0 ; col < this.columns_.length; col++) {
                    const colobj = this.columns_[col] ;
                    const cell = document.createElement('div') ;
                    cell.className = 'xero-table-cell' ;
                    cell.style.paddingLeft = this.options_.cellPadding! + 'px' ;
                    cell.style.paddingRight = this.options_.cellPadding! + 'px' ;                    

                    if (colobj.editable) {
                        cell.classList.add('xero-table-cell-editable') ;
                        cell.contentEditable = 'true' ;
                        cell.addEventListener('input', this.startContentEdit.bind(this, row, col)) ;
                        cell.addEventListener('focusout', this.endContentEdit.bind(this, row, col)) ;
                    }

                    if (colobj.dblClick) {
                        cell.classList.add('xero-table-cell-clickable') ;
                        cell.addEventListener('dblclick', this.dblClickCell.bind(this, row, col)) ;
                    }

                    if (this.options_.rowsSelectable || colobj.singleClick) {
                        cell.addEventListener('click', this.clickCell.bind(this, row, col)) ;
                        if (this.options_.rowsSelectable) {
                            cell.classList.add('xero-table-cell-selectable') ;
                        }                   

                        if (colobj.singleClick) {
                            cell.classList.add('xero-table-cell-clickable') ;
                        }
                    }

                    cell.style.width = colobj.width + 'px' ;
                    cell.style.height = this.options_.rowHeight! + 'px' ;
                    cell.style.fontFamily = this.options_.cellFont!.fontFamily! ;
                    cell.style.fontSize = this.options_.cellFont!.fontSize! + 'px' ;
                    cell.style.color = this.options_.cellFont!.fontColor! ;
                    cell.style.fontWeight = this.options_.cellFont!.fontWeight! ;
                    cell.style.fontStyle = this.options_.cellFont!.fontStyle! ;
                    rowelem.appendChild(cell) ;

                    left += colobj.width ;
                }

                this.table_rows_.appendChild(rowelem) ;
                y += this.options_.rowHeight! ;
            }

            resolve() ;
        }) ;
        return ret ;
    }

    private startContentEdit(row: number, col: number, ev: Event) : void {
        this.editing_cell_ = true ;
    }

    private endContentEdit(row: number, col: number, ev: Event) : void {
        if (this.editing_cell_) {
            this.editing_cell_ = false ;
            const cell = this.table_rows_.children[row].children[col] as HTMLDivElement ;
            this.model_.setData(row, this.columns_[col].field, cell.innerText) ;
        }
    }

    private async createCells() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            this.createHeadersCells()
            .then(() => {
                this.creatRowCells()
                .then(() => {
                    resolve() ;
                })
            })
            .catch((err) => {
                reject(err) ;
            }) ;
        }) ;
        return ret ;
    }

    private async createColumns(columns: XeroTableColumnDef[]) : Promise<void> {
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i] ;
            const col = new XeroTableColumn(this, i, column) ;
            if (column.formatter) {
                col.setFormatter(column.formatter) ;
            }
            this.columns_.push(col) ;
        }
    }

    private initialColumnWidths() : void {
        for(let col of this.columns_) {
            col.setWidth() ;
        }
    }    
}
