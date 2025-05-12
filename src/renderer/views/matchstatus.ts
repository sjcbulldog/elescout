import { XeroApp } from "../apps/xeroapp";
import { XeroTable } from "../widgets/xerotable/xerotable";
import { XeroView } from "./xeroview";

export class XeroMatchStatus extends XeroView {
    private main_div_? : HTMLDivElement ;
    private table_? : XeroTable ;
    
    public constructor(app: XeroApp, args: any[]) {
        super(app, 'xero-match-status') ;

        this.registerCallback('send-match-status', this.receivedMatchStatus.bind(this)) ;
        this.request('get-match-status', args) ;
    }

    private mapMatchType(mtype: string) : number {
        let ret= -1 ;

        if (mtype === 'f') {
            ret = 3 ;
        }
        else if (mtype === 'sf') {
            ret = 2 ;
        }
        else {
            ret = 1 ;
        }

        return ret;
    }

    private sortMatchFunc(a: any, b: any): number {
        let ret = 0;

        let atype = this.mapMatchType(a.comp_level);
        let btype = this.mapMatchType(b.comp_level);

        if (atype < btype) {
            ret = -1;
        }
        else if (atype > btype) {
            ret = 1;
        }
        else {
            if (a.match_number < b.match_number) {
                ret = -1;
            }
            else if (a.match_number > b.match_number) {
                ret = 1;
            }
            else {
                if (a.set_number < b.set_number) {
                    ret = -1;
                }
                else if (a.set_number > b.set_number) {
                    ret = 1;
                }
                else {
                    ret = 0;
                }
            }
        }
        return ret;
    }

    private receivedMatchStatus( args: any) {
        this.main_div_ = document.createElement('div') ;
        this.main_div_.classList.add('xero-teamstatus-view') ;
        this.elem.appendChild(this.main_div_) ;

        this.table_ = new XeroTable({
            data: args,
            rowHeight: 30,
            columns: [
                { title: 'Type', field: 'comp_level', sortable: true, sortFunc: this.sortMatchFunc.bind(this) },
                { title: 'Match', field: 'match_number'},
                { title: 'Set', field: 'set_number'},

                { title: 'Blue 1', field: 'blue1'},
                { title: 'Blue Tablet 1', field: 'bluetab1'},
                { title: 'Blue 1 Status', field: 'bluest1', cellformatter: this.cellFormatter.bind(this)},

                { title: 'Blue 2', field: 'blue2'},
                { title: 'Blue Tablet 2', field: 'bluetab2'},
                { title: 'Blue 2 Status', field: 'bluest2', cellformatter: this.cellFormatter.bind(this)},

                { title: 'Blue 3', field: 'blue3'},
                { title: 'Blue Tablet 3', field: 'bluetab3'},
                { title: 'Blue 3 Status', field: 'bludst3', cellformatter: this.cellFormatter.bind(this)},

                { title: 'Red 1', field: 'red1'},
                { title: 'Red Tablet 1', field: 'redtab1'},
                { title: 'Red 1 Status', field: 'redst1', cellformatter: this.cellFormatter.bind(this)},

                { title: 'Red 2', field: 'red2'},
                { title: 'Red Tablet 2', field: 'redtab2'},
                { title: 'Red 2 Status', field: 'redst2', cellformatter: this.cellFormatter.bind(this)},

                { title: 'Red 3', field: 'red3'},
                { title: 'Red Tablet 3', field: 'redtab3'},
                { title: 'Red 3 Status', field: 'redst3', cellformatter: this.cellFormatter.bind(this)},
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
        this.table_.on('table-ready', this.tableReady.bind(this)) ;
    }

    private tableReady() {
        this.table_!.sort('comp_level', true) ;
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