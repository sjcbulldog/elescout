import { IPCSection } from '../../../../shared/ipcinterfaces';
import { EditDialog } from './editdialog' ;

export class EditSectionNameDialog extends EditDialog {
    private section_: IPCSection ;
    private section_name_?: HTMLInputElement ;

    constructor(close: (changed: boolean) => void, section: IPCSection) {
        super('Edit Section Name', close) ;
        this.section_ = section ;
    }

    async populateDialog(pdiv: HTMLDivElement) {
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.section_name_ = document.createElement('input') ;
        this.section_name_.type = 'text' ;
        this.section_name_.className = 'popup-form-edit-dialog-input' ;
        this.section_name_.value = this.section_.name ;

        let label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Section Name' ;
        label.appendChild(this.section_name_) ;
        div.appendChild(label) ;

        pdiv.appendChild(div) ;
    }

    onInit() {
        if (this.section_name_) {
            this.section_name_.focus() ;
            this.section_name_.select() ;
        }
    }

    okButton(event: Event) {
        if (this.section_name_) {
            let name = this.section_name_.value.trim() ;
            if (name !== this.section_.name) {
                this.section_.name = this.section_name_.value.trim() ;
            }
            super.okButton(event) ;
        }
    }
}
