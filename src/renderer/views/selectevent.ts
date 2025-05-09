import { XeroApp } from "../apps/xeroapp";
import { XeroTable, XeroTableColumnDef } from "../widgets/xerotable/xerotable";
import { XeroWidget } from "../widgets/xerowidget";
import { XeroView } from "./xeroview";

export class XeroSelectEvent extends XeroView {

    private loading_ : boolean = false ;
    private search_div_? : HTMLDivElement ;
    private search_input_? : HTMLInputElement ;
    private table_div_? : HTMLDivElement ;
    private table_? : XeroTable ;

    constructor(app: XeroApp) {
        super(app, 'xero-select-event') ;

        this.registerCallback('send-event-data', this.receivedEventData.bind(this));    
        this.request('get-event-data') ;
    }

    private receivedEventData(args: any) {
        this.search_div_ = document.createElement('div') ;
        this.search_div_.className = 'xero-select-event-search' ;
        this.elem.appendChild(this.search_div_) ;

        this.search_input_ = document.createElement('input') ;
        this.search_input_.className ='xero-select-event-search-box' ;
        this.search_input_.type = 'text' ;
        this.search_input_.placeholder = 'Enter text to search' ;
        this.search_input_.addEventListener('input', (ev) => {
            let filter = this.search_input_!.value ;
            if (filter.length > 0) {
                this.table_!.setFilter((data: any) => {
                    return data.name.toLowerCase().includes(filter.toLowerCase()) ;
                }) ;
            }
            else {
                this.table_!.setFilter((data: any) => {
                    return true ;
                }) ;
            }
        }) ;

        this.search_div_.append(this.search_input_) ;

        this.table_div_ = document.createElement('div') ;
        this.table_div_.className = 'xero-select-event-table' ;
        this.elem.appendChild(this.table_div_) ;

        let cols : XeroTableColumnDef[] = [] ;
        cols.push({
            width: 100,
            field: 'key',
            title: 'Event Key',
            sortable: true,
        }) ;
    
        cols.push({
            width: 100,
            field: 'name',
            title: 'Name',
            dblClick: true,
            sortable: true,
        }) ;
    
        cols.push({
            width: 100,
            field: 'district.display_name',
            title: 'District',
            sortable: true,
        }) ;
    
        cols.push({
            width: 100,
            field: 'start_date',
            title: 'Date',
            sortable: true
        }) ;

        this.table_ = new XeroTable(
            {
                data:args,
                columns:cols,
                rowHeight: 20,
                headerHeight: 30,
                columnPadding: 2,
                cellPadding: 2,
                cellFont: {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fontColor: 'black',
                    fontWeight: 'normal',
                    fontStyle: 'normal'
                },
                headerFont: {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fontColor: 'black',
                    fontWeight: 'bold',
                    fontStyle: 'normal'
                },
            });
        this.table_.on('table-ready', this.tableReady.bind(this)) ;
        this.table_.on('cell-dblclick', this.loadBAEvent.bind(this)) ;

        this.table_.setParent(this.table_div_) ;
    }

    private tableReady() : void {
        for(let col of this.table_!.getColumns()) {
            col.setWidth() ;
        }
    }

    private loadBAEvent(evdata: any) : void {
        if (this.loading_) {
            return ;
        }

        this.loading_ = true ;
        let data = this.table_!.model.getRowData(evdata.row) ;
        this.request("load-ba-event-data", data.key) ;
    }
}