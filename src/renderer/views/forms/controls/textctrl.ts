import { IPCTextItem } from "../../../../shared/ipcinterfaces";
import { XeroRect } from "../../../widgets/xerogeom";
import { EditFormControlDialog } from "../dialogs/editformctrldialog";
import { EditLabelDialog } from "../dialogs/editlabeldialog";
import { EditTextDialog } from "../dialogs/edittextdialog";
import { FormControl } from "./formctrl";

export class TextControl extends FormControl {
    private static item_desc_ : IPCTextItem = 
    {
        type: 'label',
        placeholder: 'Enter Text Here',
        tag: '',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: 'black',
        background: 'white',
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'none',
        transparent: true,
    } ;

    constructor(tag: string, bounds: XeroRect, donecb: (changed: boolean) => void) {
        super(TextControl.item_desc_, donecb) ;
        this.setTag(tag) ;
        this.setBounds(bounds) ;
    }

    public updateFromItem() : void {
        if (this.ctrl) {
            let item = this.item as IPCTextItem ;
            let ctrl = this.ctrl as HTMLInputElement ;

            ctrl.placeholder = item.placeholder ;
            ctrl.className = 'xero-form-edit-label' ;
            ctrl.style.left = item.x + 'px' ;
            ctrl.style.top = item.y + 'px' ;
            ctrl.style.width = item.width + 'px' ;
            ctrl.style.height = item.height + 'px' ;
            ctrl.style.position = 'absolute' ;
            ctrl.style.fontFamily = item.fontFamily ;
            ctrl.style.fontSize = item.fontSize + 'px' ;
            ctrl.style.fontWeight = item.fontWeight ;
            ctrl.style.fontStyle = item.fontStyle ;
            ctrl.style.color = item.color ;
            ctrl.style.backgroundColor = item.background ;
            ctrl.style.margin = '4px' ;
        }
    }

    public createForEdit(parent: HTMLElement) : void  {
        let input = document.createElement('input') ;
        input.disabled = true ;

        this.ctrl = input ;
        this.updateFromItem() ;
        parent.appendChild(this.ctrl) ;
    }

    public createForScouting(parent: HTMLElement) : void {
        let input = document.createElement('input') ;
        this.ctrl = input ;
        this.updateFromItem() ;

        if (this.item.datatype === 'integer') {
            input.type = 'number' ;
            input.step = '1' ;
        }
        else if (this.item.datatype === 'real') {
            input.type = 'number' ;
            input.step = 'any' ;
        }
        else if (this.item.datatype === 'string') {
            input.type = 'text' ;
        }

        parent.appendChild(this.ctrl);
    }

    public createEditDialog() : EditFormControlDialog  {
        return new EditTextDialog(this, this.callback.bind(this)) ;
    }

    public getData() : any {
        let input = this.ctrl as HTMLInputElement ;
        return input.value ;
    }

    public setData(data: any) : void {
        let input = this.ctrl as HTMLInputElement ;
        input.value = data ;
    }
}
