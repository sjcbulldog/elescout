import { XeroApp } from "../apps/xeroapp";
import { XeroView } from "./xeroview";
import { Tabulator } from "tabulator-tables" ;

export class XeroSelectEvent extends XeroView {

    private loading_ : boolean = false ;
    private search_div_? : HTMLDivElement ;
    private search_input_? : HTMLInputElement ;
    private table_div_? : HTMLDivElement ;
    private table_? : Tabulator ;

    constructor(app: XeroApp) {
        super(app, 'xero-select-event') ;

        this.registerCallback('send-event-data', this.receivedEventData.bind(this));    
        this.request('get-event-data') ;
    }

    private receivedEventData(args: any) {
        this.search_div_ = document.createElement('div') ;
        this.search_div_.className = 'xero-select-event-search' ;
        this.elem.appendChild(this.search_div_) ;

        this.table_div_ = document.createElement('div') ;
        this.table_div_.className = 'xero-select-event-table' ;
        this.elem.appendChild(this.table_div_) ;

        this.search_input_ = document.createElement('input') ;
        this.search_input_.className ='xero-select-event-search-box' ;
        this.search_input_.type = 'text' ;
        this.search_input_.placeholder = 'Enter text to search' ;
        this.search_input_.addEventListener("keyup", this.updateFilter.bind(this));
        this.search_div_.append(this.search_input_) ;

        let cols = [] ;
        cols.push({
            width: 100,
            field: 'key',
            title: 'Event Key',
        }) ;
    
        cols.push({
            width: 100,
            field: 'name',
            title: 'Name',
        }) ;
    
        cols.push({
            width: 100,
            field: 'district.display_name',
            title: 'District',
            mutator: this.evDistMutator.bind(this),
        }) ;
    
        cols.push({
            width: 100,
            field: 'start_date',
            title: 'Date'
        }) ;

        this.table_ = new Tabulator(this.table_div_,
            {
                data:args[0],
                layout:"fitData",
                resizableColumnFit:true,
                resizableColumnGuide:true,
                columns:cols
            });

            this.table_!.on("cellDblClick", this.loadBAEvent.bind(this)) ;
            this.table_!.on("tableBuilt", this.tableComplete.bind(this)) ;            
    }

    private evDistMutator(value: string, data: any, type: any, params: any, component: any) : string{
        return (value === null) ? '' : value ;
    }

    private loadBAEvent(ev: Event, cell: any) {
        if (this.loading_) {
            return ;
        }

        this.loading_ = true ;

        let row = cell.getRow() ;
        let key = row.getData().key ;

        this.request("load-ba-event-data", key);
    }


    private tableComplete() {   
        for(let col of this.table_!.getColumns()) {
            col.setWidth(true) ;
        }
    }

    private updateFilter() {
    }
}