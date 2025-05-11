import { IPCMultipleChoiceItem, IPCUpDownItem } from "../../../../shared/ipcinterfaces";
import { EditFormControlDialog } from "./editformctrldialog";
import { FormControl } from "../controls/formctrl";

export class EditUpDownControlDialog extends EditFormControlDialog {
    constructor(formctrl: FormControl) {
        super('Edit UpDown', formctrl) ;
    }

    protected async populateDialog(pdiv: HTMLElement) : Promise<void> {
        let item = this.formctrl_.item as IPCUpDownItem ;
        let label ;
        let option: HTMLOptionElement ;

        let div = document.createElement('div') ;
        div.className = 'xero-popup-form-edit-dialog-rowdiv' ;

        this.populateTag(div) ;
        this.populateOrientation(div, item.orientation) ;
        this.populateColors(div) ;
        await this.populateFontSelector(div) ;

        pdiv.appendChild(div) ;
    }

    protected extractData() : void {
        let item = this.formctrl_.item as IPCUpDownItem ;

        item.tag = this.tag_!.value ;
        item.color = this.text_color_!.value ;
        item.background = this.background_color_!.value ;
        item.fontFamily = this.font_name_!.value ;
        item.fontSize = parseInt(this.font_size_!.value) ;
        item.fontWeight = this.font_weight_!.value ;
        item.fontStyle = this.font_style_!.value ;
        item.transparent = this.transparent_!.checked ;
        item.orientation = this.orientation_!.value as 'horizontal' | 'vertical' ;
    }
}