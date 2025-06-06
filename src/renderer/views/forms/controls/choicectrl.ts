import { IPCChoiceValue, IPCMultipleChoiceItem } from "../../../../shared/ipcinterfaces";
import { XeroRect } from "../../../widgets/xerogeom";
import { XeroView } from "../../xeroview";
import { EditChoiceDialog } from "../dialogs/editchoicedialog";
import { EditFormControlDialog } from "../dialogs/editformctrldialog";
import { FormControl } from "./formctrl";

export class MultipleChoiceControl extends FormControl {
    private static item_desc_ : IPCMultipleChoiceItem = {
        type: 'choice',
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
        radiosize : 20,
        orientation: 'vertical',
        choices: [
            { text: 'Choice 1', value: 'choice1' },
            { text: 'Choice 2', value: 'choice2' },
            { text: 'Choice 3', value: 'choice3' },
        ],
    } ;

    private choice_table_? : HTMLTableElement ;
    private choice_ctrls_ : HTMLInputElement[] = [] ;
    private choice_ctrl_to_value_ : Map<HTMLInputElement, IPCChoiceValue> = new Map() ;

    constructor(view: XeroView, tag: string, bounds: XeroRect) {
        super(view, MultipleChoiceControl.item_desc_) ;
        this.setTag(tag) ;
        this.setBounds(bounds) ;
    }

    public copyObject() : FormControl {
        return new MultipleChoiceControl(this.view, this.item.tag, this.bounds()) ;
    }

    public updateFromItem(editing: boolean) : void {
        if (this.ctrl) {
            let item = this.item as IPCMultipleChoiceItem ;
            let ctrl = this.ctrl as HTMLDivElement
            
            ctrl.style.position = 'absolute' ;
            ctrl.style.left = this.item.x + 'px' ;
            ctrl.style.top = this.item.y + 'px' ;
            ctrl.style.width = this.item.width + 'px' ;
            ctrl.style.height = this.item.height + 'px' ;
            ctrl.style.margin = '4px' ;
            
            this.choice_table_!.innerHTML = '' ;
            this.updateChoices(editing) ;
        }
    }

    private createVerticalChoices(item: IPCMultipleChoiceItem, editing: boolean) : void {
        let oper = editing ? 'edit' : 'view' ;

        for(let choice of item.choices) {
            let tabrow = document.createElement('tr') ;
            this.setClassList(tabrow, oper, 'vertrow') ;

            let label = document.createElement('td') ;
            this.setClassList(label, oper, 'label') ;
            label.innerHTML = choice.text ;
            label.style.fontFamily = item.fontFamily ;
            label.style.fontSize = item.fontSize + 'px' ;
            label.style.fontWeight = item.fontWeight ;
            label.style.fontStyle = item.fontStyle ;
            label.style.backgroundColor = item.background ;
            label.style.color = item.color ;
            tabrow.appendChild(label) ;

            let iwrap = document.createElement('td') ;
            this.setClassList(iwrap, oper, 'wrapper') ;
            tabrow.appendChild(iwrap) ;

            let input = document.createElement('input') ;
            this.setClassList(input, oper, 'radio') ;
            this.choice_ctrl_to_value_.set(input, choice.value) ;
            input.type = 'radio' ;
            input.disabled = editing ;
            input.checked = true ;
            input.name = item.tag ;
            input.id = item.tag + '_' + choice.value ;
            input.style.fontFamily = item.fontFamily ;
            input.style.fontSize = item.fontSize + 'px' ;
            input.style.color = item.color ;
            label.style.backgroundColor = item.background 
            input.style.width = item.radiosize + 'px' ;
            input.style.height = item.radiosize + 'px' ;
            this.choice_ctrls_.push(input) ;
            iwrap.appendChild(input) ;
            this.choice_table_!.appendChild(tabrow) ;        
        }
    }

    private createHorizontalChoices(item: IPCMultipleChoiceItem, editing: boolean) : void {
        let oper = editing ? 'edit' : 'view' ;

        let tabrow = document.createElement('tr') ;
        this.setClassList(tabrow, oper, 'horizrow') ;
        tabrow.style.width = '100%' ;
        this.choice_table_!.appendChild(tabrow) ;
        let first = true ;

        for(let choice of item.choices) {
            if (!first) {
                let sep = document.createElement('td') ;
                this.setClassList(sep, oper, 'separator') ;
                sep.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;' ;
                tabrow.appendChild(sep) ;
            }

            let label = document.createElement('td') ;
            this.setClassList(label, oper, 'label') ;
            label.innerHTML = choice.text ;
            label.style.fontFamily = item.fontFamily ;
            label.style.fontSize = item.fontSize+ 'px' ;
            label.style.fontWeight = item.fontWeight ;
            label.style.fontStyle = item.fontStyle ;
            label.style.backgroundColor = item.background ;
            label.style.color = item.color ;
            tabrow.appendChild(label) ;

            let iwrap = document.createElement('td') ;
            this.setClassList(iwrap, oper, 'wrapper') ;
            tabrow.appendChild(iwrap) ;

            let input = document.createElement('input') ;
            this.setClassList(input, oper, 'radio') 
            this.choice_ctrl_to_value_.set(input, choice.value) ;
            input.type = 'radio' ;
            input.style.accentColor = item.color ;
            input.disabled = editing ;
            input.checked = true ;
            input.name = item.tag ;
            input.id = item.tag + '_' + choice.value ;
            input.style.fontFamily = item.fontFamily ;
            input.style.fontSize = item.fontSize + 'px' ;
            input.style.color = item.color ;
            input.style.width = item.radiosize + 'px' ;
            input.style.height = item.radiosize + 'px' ;
            this.choice_ctrls_.push(input) ;
            iwrap.appendChild(input) ;

            first = false ;        
        }
    }

    private updateChoices(editing: boolean) : void {
        let item = this.item as IPCMultipleChoiceItem ;
        this.choice_table_!.innerHTML = '' ;

        if (item.orientation === 'vertical') {
            this.createVerticalChoices(item, editing) ; 
        }
        else {
            this.createHorizontalChoices(item, editing) ;
        }
    }

    public createForEdit(parent: HTMLElement) : void  {
        let item = this.item as IPCMultipleChoiceItem ;
        this.choice_ctrls_ = [] ;

        this.ctrl = document.createElement('div') ;
        this.setClassList(this.ctrl, 'edit') ;

        this.choice_table_ = document.createElement('table') ;
        this.setClassList(this.choice_table_, 'edit', item.orientation + '-table') ;
        this.ctrl.appendChild(this.choice_table_) ;

        this.updateFromItem(true) ;
        parent.appendChild(this.ctrl) ;
    }

    public createForScouting(parent: HTMLElement): void {
        let item = this.item as IPCMultipleChoiceItem ;
        this.choice_ctrls_ = [] ;

        this.ctrl = document.createElement('div') ;
        this.setClassList(this.ctrl, 'scout') ;

        this.choice_table_ = document.createElement('table') ;
        this.setClassList(this.choice_table_, 'scout', item.orientation + '-table') ;
        this.ctrl.appendChild(this.choice_table_) ;

        this.updateFromItem(false) ;
        parent.appendChild(this.ctrl) ;
    }

    public createEditDialog() : EditFormControlDialog   {
        return new EditChoiceDialog(this) ;
    }
    
    public getData() : any {
        for(let ctrl of this.choice_ctrls_) {
            if (ctrl.checked) {
                return this.choice_ctrl_to_value_.get(ctrl) ;
            }
        }
        return undefined ;
    }

    public setData(data: any) : void {
        if (this.choice_ctrls_) {
            for(let ctrl of this.choice_ctrls_) {
                if (this.choice_ctrl_to_value_.get(ctrl) === data) {
                    ctrl.checked = true ;
                }
                else {
                    ctrl.checked = false ;
                }
            }
        }
    }
}