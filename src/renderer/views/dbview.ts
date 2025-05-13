import { DataValue, DataValueType } from "../../main/model/datavalue";
import { IPCProjColumnsConfig } from "../../shared/ipcinterfaces";
import { XeroApp } from "../apps/xeroapp";
import { XeroTable, XeroTableColumnDef } from "../widgets/xerotable/xerotable";
import { XeroTableColumn } from "../widgets/xerotable/xerotablecol";
import { XeroView } from "./xeroview";

export class DatabaseView extends XeroView {
    private col_cfgs_? : IPCProjColumnsConfig ;
    private table_? : XeroTable ;
    private div_ : HTMLElement ;

    protected constructor(app: XeroApp, clname: string, type: string) {
        super(app, clname);

        this.div_ = document.createElement('div') ;
        this.div_.className = 'xero-db-view' ;
        this.elem.appendChild(this.div_) ;

        this.registerCallback('send-' + type + '-db', this.receiveData.bind(this));
        this.registerCallback('send-' + type + '-col-config', this.receiveColConfig.bind(this));
        this.request('get-' + type + '-db') ;
    }

    private convertData(data: any[]) : any[] {
        let ret : any[] = [] ;
        for(let one of data) {
            let onemap = (one.data_) as Map<string, any> ;
            let obj : { [ key: string ] : any } = {} ;
            for(let key of onemap.keys()) {
                let val = new DataValue(onemap.get(key).value_, onemap.get(key).type_) ;
                if (val.isArray()) {
                    obj[key] = val.toValueString() ;
                }
                else {
                    obj[key] = val.value ;
                }
            }
            ret.push(obj) ;
        }
        return ret ;
    }

    private createColumnDescs() : XeroTableColumnDef[] {
        let cols: XeroTableColumnDef[] = [] ;

        for (let i = 0; i < this.col_cfgs_!.columns.length; i++) {
            let col = this.col_cfgs_!.columns[i] ;
            let col_desc: XeroTableColumnDef = {
                title: col.name,
                field: col.name,
            } ;
            cols.push(col_desc) ;
        }

        return cols ;
    }

    private receiveData(data: any) {
        this.table_ = new XeroTable({
            data: this.convertData(data.data),
            rowHeight: 30,
            initialSortColumn: 0,
            columns: this.createColumnDescs(),
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

        this.table_.setParent(this.div_) ;
    }

    private receiveColConfig(data: IPCProjColumnsConfig) {
        this.col_cfgs_ = data;
    }
}