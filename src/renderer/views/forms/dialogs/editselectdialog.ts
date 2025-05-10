import { IPCSelectItem } from "../../../../shared/ipcinterfaces";
import { EditFormControlDialog } from "./editformctrldialog";
import { FormControl } from "../controls/formctrl";

export class EditSelectDialog extends EditFormControlDialog {
    constructor(formctrl: FormControl) {
        super('Edit Boolean', formctrl) ;
    }

    protected async populateDialog(pdiv: HTMLElement) : Promise<void> {
    }

    protected extractData() : void {
    }
}