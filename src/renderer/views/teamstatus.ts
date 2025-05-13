import { XeroApp } from "../apps/xeroapp";
import { XeroTable } from "../widgets/xerotable/xerotable";
import { XeroView } from "./xeroview";

export class XeroTeamStatus extends XeroView {
    private main_div_? : HTMLDivElement ;
    private table_? : XeroTable ;
    
    public constructor(app: XeroApp, args: any[]) {
        super(app, 'xero-team-status') ;

        this.registerCallback('send-team-status', this.receivedTeamStatus.bind(this)) ;
        this.request('get-team-status', args) ;
    }

    private receivedTeamStatus( args: any) {
        this.main_div_ = document.createElement('div') ;
        this.main_div_.classList.add('xero-teamstatus-view') ;
        this.elem.appendChild(this.main_div_) ;

        this.table_ = new XeroTable({
            data: args,
            rowHeight: 30,
            initialSortColumn: 0,
            columns: [
                { title: 'Number', field: 'number', sortable: true },
                { title: 'Name', field: 'teamname', sortable: true },
                { title: 'Tablet', field: 'tablet' },
                { title: 'Status', field: 'status' , cellFormatter: this.cellFormatter.bind(this) },
            ],
            cellPadding: 5,
            columnPadding: 5,
            headerFont: {
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                fontColor: '#000000',
                fontStyle: 'normal',
            },
            cellFont: {
                fontSize: 12,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                fontColor: '#000000',
                fontStyle: 'normal',
            },
        }) ;

        this.table_.setParent(this.main_div_) ;
    }

    private cellFormatter(cell: HTMLElement) {
        if (cell.innerText === 'Y') {
            cell.style.backgroundColor = 'lightgreen' ;
        }
        else {
            cell.style.backgroundColor = 'lightcoral' ;
        }
    }
}