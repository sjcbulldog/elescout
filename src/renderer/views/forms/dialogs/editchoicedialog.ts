import { IPCMultipleChoiceItem } from "../../../../shared/ipcinterfaces";
import { EditFormControlDialog } from "./editformctrldialog";
import { FormControl } from "../controls/formctrl";
import { XeroTable, XeroTableColumnDef } from "../../../widgets/xerotable/xerotable";

export class EditChoiceDialog extends EditFormControlDialog {
    private table_? : XeroTable ;

    constructor(formctrl: FormControl) {
        super('Edit Multiple Choice', formctrl) ;
    }

    protected async populateDialog(pdiv: HTMLElement) : Promise<void> {
        let item = this.formctrl_.item as IPCMultipleChoiceItem ;
        let label ;
        let option: HTMLOptionElement ;

        let div = document.createElement('div') ;
        div.className = 'xero-popup-form-edit-dialog-rowdiv' ;
        pdiv.appendChild(div) ;

        this.populateTag(div) ;
        this.populateOrientation(div, item.orientation) ;
        this.populateColors(div) ;
        await this.populateFontSelector(div) ;
        this.populateChoices(div) ;
    }

    private populateChoices(div: HTMLElement) : void {
        let item = this.formctrl_.item as IPCMultipleChoiceItem ;

        let bigdiv = document.createElement('div') ;
        bigdiv.className = 'xero-popup-form-edit-dialog-bigdiv' ;
        div.appendChild(bigdiv) ;

        let tdiv = document.createElement('div') ;
        tdiv.className = 'xero-popup-form-edit-dialog-table-div' ;
        bigdiv.appendChild(tdiv) ;

        let cols : XeroTableColumnDef[] = [] ;
        cols.push({
            width: 100,
            field: 'text',
            title: 'Display',
            editable: true,
        }) ;
    
        cols.push({
            width: 100,
            field: 'value',
            title: 'Value',
            editable: true,
        }) ;

        this.table_ = new XeroTable(
            {
                data:item.choices,
                columns:cols,
                rowHeight: 28,
                headerHeight: 48,
                rowsSelectable: true,
                columnPadding: 2,
                cellPadding: 2,
                cellFont: {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fontColor: 'black',
                    fontWeight: 'normal',
                    fontStyle: 'normal'
                },
                headerFont: {
                    fontFamily: 'Arial',
                    fontSize: 22,
                    fontColor: 'black',
                    fontWeight: 'bold',
                    fontStyle: 'normal'
                },
            });

        this.table_.setParent(tdiv) ;
        this.table_.on('table-ready', this.tableReady.bind(this)) ;

        let btndiv = document.createElement('div') ;
        btndiv.className = 'xero-popup-form-edit-dialog-choice-button-div' ;
        bigdiv.appendChild(btndiv) ;

        let addbtn = document.createElement('button') ;
        addbtn.className = 'xero-popup-form-edit-dialog-choice-button' ;
        addbtn.innerHTML = '&#x2795;' ;
        addbtn.addEventListener('click', this.addChoice.bind(this)) ;
        btndiv.appendChild(addbtn) ;

        let delbtn = document.createElement('button') ;
        delbtn.className = 'xero-popup-form-edit-dialog-choice-button' ;
        delbtn.innerHTML = '&#x2796;' ;
        delbtn.addEventListener('click', this.deleteChoice.bind(this)) ;
        btndiv.appendChild(delbtn) ;
    }

    private tableReady() : void {
        this.table_!.fitColumns() ;
    }

    private deleteChoice() : void {
        let row = this.table_!.getSelectedRow() ;
        this.table_!.deleteRow(row) ;
    }

    private addChoice() : void {
        this.table_!.addRow(
            {
                text: 'New Choice',
                value: 'new_value',
            }
        ) ;
    }

    protected extractData() : void {
        let item = this.formctrl_.item as IPCMultipleChoiceItem ;
        item.tag = this.tag_!.value ;
        item.color = this.text_color_!.value ;
        item.background = this.background_color_!.value ;
        item.fontFamily = this.font_name_!.value ;
        item.fontSize = parseInt(this.font_size_!.value) ;
        item.fontWeight = this.font_weight_!.value ;
        item.fontStyle = this.font_style_!.value ;
        item.orientation = this.orientation_!.value as 'horizontal' | 'vertical' ;

        item.choices = [] ;
        for (let i = 0 ; i < this.table_!.getRowCount(); ++i) {
            let row = this.table_!.getRowData(i) ;
            item.choices.push({
                text: row.text,
                value: row.value,
            }) ;
        }
    }
}