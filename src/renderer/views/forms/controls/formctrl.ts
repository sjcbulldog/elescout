import { IPCFormItem } from "../../../../shared/ipcinterfaces";
import { XeroRect } from "../../../widgets/xerogeom";
import { EditFormControlDialog } from "../dialogs/editformctrldialog";

export abstract class FormControl {
    private item_ : IPCFormItem ;
    private ctrl_? : HTMLElement ;
    protected edit_done_cb_ : (changed: boolean) => void ;

    constructor(item: IPCFormItem, donecb: (changed: boolean) => void) {
        this.item_ = item ;
        this.edit_done_cb_ = donecb ;
    }

    public bounds() : XeroRect {
        return new XeroRect(this.item_.x, this.item_.y, this.item_.width, this.item_.height) ;
    }

    public get item() : IPCFormItem {
        return this.item_ ;
    }

    public get ctrl() : HTMLElement | undefined {
        return this.ctrl_ ;
    }

    public set ctrl(ctrl: HTMLElement) {
        this.ctrl_ = ctrl ;
    }

    public clone(tag: string) : FormControl {
        let clone = structuredClone(this) ;
        clone.item_.tag = tag ;
        return clone ;
    }

    public update(item: IPCFormItem) {
        this.item_ = item ;
    }

    public abstract updateFromItem() : void ;
    public abstract createForEdit(parent: HTMLElement) : void ;
    public abstract createForScouting(parent: HTMLElement) : void ;
    public abstract createEditDialog() : EditFormControlDialog ;
    public abstract getData() : void ;
    public abstract setData(data: any) : void ;

    public callback(changed: boolean) {
        if (this.edit_done_cb_) {
            this.edit_done_cb_(changed) ;
        }
    }

    protected setTag(tag: string) {
        this.item_.tag = tag ;
    }

    protected setBounds(bounds: XeroRect) {
        this.item_.x = bounds.x ;
        this.item_.y = bounds.y ;
        this.item_.width = bounds.width ;
        this.item_.height = bounds.height ;
    }
}