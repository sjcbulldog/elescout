import { IPCLabelItem } from "../../../../shared/ipcinterfaces";
import { EditFormControlDialog } from "./editformctrldialog";
import { FormControl } from "../controls/formctrl";

export class EditLabelDialog extends EditFormControlDialog {
    private text_string_? : HTMLInputElement ;

    constructor(formctrl: FormControl, closecb: (changed: boolean) => void) {
        super('Edit Label', formctrl, closecb) ;
    }

    protected async populateDialog(pdiv: HTMLElement) : Promise<void> {
        let item = this.formctrl_.item as IPCLabelItem ;

        let label ;
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.text_string_ = document.createElement('input') ;
        this.text_string_.type = 'text' ;
        this.text_string_.className = 'popup-form-edit-dialog-input' ;
        this.text_string_.value = item.text ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Text' ;
        label.appendChild(this.text_string_) ;
        div.appendChild(label) ;

        this.populateColors(div) ;
        await this.populateFontSelector(div) ;
    }

    protected extractData() : void {
        let item = this.formctrl_.item as IPCLabelItem ;
        item.text = this.text_string_!.value ;
        item.fontFamily = this.font_name_!.value ;
        item.fontSize = parseInt(this.font_size_!.value) ;
        item.fontStyle = this.font_style_!.value ;
        item.fontWeight = this.font_weight_!.value ;
        item.color = this.text_color_!.value ;
    }
}