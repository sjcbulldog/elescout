import { IPCMultipleChoiceItem } from "../../../../shared/ipcinterfaces";
import { EditFormControlDialog } from "./editformctrldialog";
import { FormControl } from "../controls/formctrl";

export class EditChoiceDialog extends EditFormControlDialog {
    constructor(formctrl: FormControl) {
        super('Edit Multiple Choice', formctrl) ;
    }

    protected async populateDialog(pdiv: HTMLElement) : Promise<void> {
    }

    protected extractData() : void {
    }
}