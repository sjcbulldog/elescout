import { IPCLabelItem } from "../../../../shared/ipcinterfaces";
import { XeroRect } from "../../../widgets/xerogeom";
import { EditFormControlDialog } from "../dialogs/editformctrldialog";
import { EditLabelDialog } from "../dialogs/editlabeldialog";
import { FormControl } from "./formctrl";

export class LabelControl extends FormControl {
    private static item_desc_ : IPCLabelItem = 
    {
        type: 'label',
        text: 'MyLabel',
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
        transparent: true
    } ;

    constructor(tag: string, bounds: XeroRect, donecb: (changed: boolean) => void) {
        super(LabelControl.item_desc_, donecb) ;
        this.setTag(tag) ;
        this.setBounds(bounds) ;
    }

    public updateFromItem() : void {
        if (this.ctrl) {
            let item = this.item as IPCLabelItem ;
            this.ctrl.innerText = item.text ;
            this.ctrl.className = 'xero-form-edit-label' ;
            this.ctrl.style.left = item.x + 'px' ;
            this.ctrl.style.top = item.y + 'px' ;
            this.ctrl.style.width = item.width + 'px' ;
            this.ctrl.style.height = item.height + 'px' ;
            this.ctrl.style.position = 'absolute' ;
            this.ctrl.style.fontFamily = item.fontFamily ;
            this.ctrl.style.fontSize = item.fontSize + 'px' ;
            this.ctrl.style.fontWeight = item.fontWeight ;
            this.ctrl.style.fontStyle = item.fontStyle ;
            this.ctrl.style.color = item.color ;
            if (item.transparent) {
                this.ctrl.style.backgroundColor = 'transparent' ;
            }
            else {
                this.ctrl.style.backgroundColor = item.background ;
            }
            this.ctrl.style.margin = '4px' ;
            this.ctrl.style.zIndex = '100' ;
        }
    }

    public createForEdit(parent: HTMLElement) : void  {
        this.ctrl = document.createElement('span') ;
        this.updateFromItem() ;
        parent.appendChild(this.ctrl) ;
    }

    public createForScouting(parent: HTMLElement) : void {
        this.ctrl = document.createElement('span') ;
        this.updateFromItem() ;
        parent.appendChild(this.ctrl);
    }

    public createEditDialog() : EditFormControlDialog  {
        return new EditLabelDialog(this, this.callback.bind(this)) ;
    }

    public getData() : any {
        return undefined ;
    }

    public setData(data: any) : void {
    }
}