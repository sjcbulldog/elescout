
import { IPCSelectItem } from "../../../../shared/ipcinterfaces";
import { XeroRect } from "../../../widgets/xerogeom";
import { EditFormControlDialog } from "../dialogs/editformctrldialog";
import { EditSelectDialog } from "../dialogs/editselectdialog";
import { FormControl } from "./formctrl";


export class SelectControl extends FormControl {
    private static item_desc_ : IPCSelectItem = {
        type: 'select',
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
        datatype: 'string',
        transparent: true,
        choices: [
            { text: 'Choice 1', value: 'choice1' },
            { text: 'Choice 2', value: 'choice2' },
            { text: 'Choice 3', value: 'choice3' },
        ],
    } ;

    constructor(tag: string, bounds: XeroRect) {
        super(SelectControl.item_desc_) ;
        this.setTag(tag) ;
        this.setBounds(bounds) ;
    }

    public copyObject() : FormControl {
        return new SelectControl(this.item.tag, this.bounds()) ;
    }

    public updateFromItem(editing: boolean) : void {
        if (this.ctrl) {
            let item = this.item as IPCSelectItem ;
            let ctrl = this.ctrl as HTMLDivElement
            
            ctrl.style.position = 'absolute' ;
            ctrl.style.left = this.item.x + 'px' ;
            ctrl.style.top = this.item.y + 'px' ;
            ctrl.style.width = this.item.width + 'px' ;
            ctrl.style.height = this.item.height + 'px' ;
            ctrl.style.margin = '4px' ;

            ctrl.style.color = item.color ;
            ctrl.style.backgroundColor = item.background ;
            ctrl.style.fontFamily = item.fontFamily ;
            ctrl.style.fontSize = item.fontSize + 'px' ;
            ctrl.style.fontWeight = item.fontWeight ;
            ctrl.style.fontStyle = item.fontStyle ;

            this.updateChoices(editing) ;
        }
    }

    private updateChoices(editing: boolean) : void {
        let item = this.item as IPCSelectItem ;
        let ctrl = this.ctrl as HTMLSelectElement ;

        ctrl.innerHTML = '' ;

        for (const choice of item.choices) {
            let opt = document.createElement('option') ;
            opt.value = choice.value.toString() ;
            opt.textContent = choice.text ;
            ctrl.appendChild(opt) ;
        }
    }

    public createForEdit(parent: HTMLElement) : void  {
        let item = this.item as IPCSelectItem ;

        let sel = document.createElement('select') ;
        this.setClassList(sel, 'edit') ;
        sel.disabled = true ;
        this.ctrl = sel ;
        this.setClassList(this.ctrl, 'edit') ;
        this.updateFromItem(true) ;
        parent.appendChild(this.ctrl) ;
    }

    public createForScouting(parent: HTMLElement): void {
        let item = this.item as IPCSelectItem ;

        this.ctrl = document.createElement('select') ;
        this.setClassList(this.ctrl, 'scout') ;
        this.updateFromItem(true) ;
        parent.appendChild(this.ctrl) ;
    }

    public createEditDialog() : EditFormControlDialog   {
        return new EditSelectDialog(this) ;
    }
    
    public getData() : any {
        let ctrl = this.ctrl as HTMLSelectElement ;
        return ctrl?.value ;
    }

    public setData(data: any) : void {
        let ctrl = this.ctrl as HTMLSelectElement ;
        if (ctrl) {
            ctrl.value = data ;
        }
    }
}