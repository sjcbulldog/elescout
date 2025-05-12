import { IPCTimerItem } from "../../../../shared/ipcinterfaces";
import { XeroRect } from "../../../widgets/xerogeom";
import { EditFormControlDialog } from "../dialogs/editformctrldialog";
import { EditTimerDialog } from "../dialogs/edittimerdialog";
import { FormControl } from "./formctrl";

export class TimerControl extends FormControl {
    private static item_desc_ : IPCTimerItem = {
        type: 'timer',
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
        datatype: 'integer',
        transparent: true,
    }

    private start_stop_button_? : HTMLButtonElement ;
    private current_time_? : HTMLSpanElement ;
    private time_value_ : number = 0 ;
    private running_ : boolean = false ;
    private timer_? : NodeJS.Timeout ;

    constructor(tag: string, bounds: XeroRect) {
        super(TimerControl.item_desc_) ;
        this.setTag(tag) ;
        this.setBounds(bounds) ;
    }

    public copyObject() : FormControl {
        return new TimerControl(this.item.tag, this.bounds()) ;
    }

    public updateFromItem(editing: boolean) : void {
        if (this.ctrl) {
            let item = this.item as IPCTimerItem ;
            this.ctrl.style.left = item.x + 'px' ;
            this.ctrl.style.top = item.y + 'px' ;
            this.ctrl.style.width = item.width + 'px' ;
            this.ctrl.style.height = item.height + 'px' ;
            this.ctrl.style.position = 'absolute' ;
            this.ctrl.style.zIndex = '100' ;
            this.ctrl.style.margin = '4px' ;

            this.start_stop_button_!.style.backgroundColor = item.background ;
            this.start_stop_button_!.style.color = item.color ;
            this.start_stop_button_!.style.fontFamily = item.fontFamily ;
            this.start_stop_button_!.style.fontSize = item.fontSize + 'px' ;
            this.start_stop_button_!.style.fontWeight = item.fontWeight ;
            this.start_stop_button_!.style.fontStyle = item.fontStyle ;

            this.current_time_!.style.backgroundColor = item.background ;
            this.current_time_!.style.color = item.color ;
            this.current_time_!.style.fontFamily = item.fontFamily ;
            this.current_time_!.style.fontSize = item.fontSize + 'px' ;
            this.current_time_!.style.fontWeight = item.fontWeight ;
            this.current_time_!.style.fontStyle = item.fontStyle ;
        }
    }

    private timerTick() : void {
        if (this.running_) {
            this.time_value_ += 0.1 ;
            this.displayTimer() ;
        }
    }

    private startStopTimer() : void {
        if (this.running_) {
            clearInterval(this.timer_) ;
            this.running_ = false ;
            this.start_stop_button_!.innerText = 'Start' ;
        }
        else {
            this.running_ = true ;
            this.timer_ = setInterval(() => this.timerTick(), 100) ;
            this.start_stop_button_!.innerText = 'Stop' ;
        }
    }

    private displayTimer() : void {
        if (this.current_time_) {
            let minutes = Math.floor(this.time_value_ / 60) ;
            let seconds = Math.floor(this.time_value_ % 60) ;
            let tenths = Math.floor((this.time_value_ - Math.floor(this.time_value_)) * 10) ;
            this.current_time_!.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}` ;
        }
    }

    public createForEdit(parent: HTMLElement): void {
        let item = this.item as IPCTimerItem ;
        this.ctrl = document.createElement('div') ;
        this.setClassList(this.ctrl, 'edit') ;

        this.current_time_ = document.createElement('span') ;
        this.setClassList(this.current_time_, 'edit', 'timer') ;
        this.current_time_!.innerText = '00:00.0' ;
        this.ctrl.appendChild(this.current_time_!) ;

        this.start_stop_button_ = document.createElement('button') ;
        this.setClassList(this.start_stop_button_, 'edit', 'button') ;
        this.start_stop_button_!.innerText = 'Start' ;
        this.start_stop_button_!.disabled = true ;
        this.ctrl.appendChild(this.start_stop_button_!) ;

        this.updateFromItem(true) ;

        parent.appendChild(this.ctrl) ;
    }

    public createForScouting(parent: HTMLElement): void {
        let item = this.item as IPCTimerItem ;
        this.ctrl = document.createElement('div') ;
        this.setClassList(this.ctrl, 'scout') ;

        this.current_time_ = document.createElement('span') ;
        this.setClassList(this.current_time_, 'scout', 'timer') ;
        this.current_time_!.innerText = '00:00.0' ;
        this.ctrl.appendChild(this.current_time_!) ;

        this.start_stop_button_ = document.createElement('button') ;
        this.setClassList(this.start_stop_button_, 'scout', 'button') ;
        this.start_stop_button_!.innerText = 'Start' ;
        this.start_stop_button_!.addEventListener('click', this.startStopTimer.bind(this)) ;
        this.ctrl.appendChild(this.start_stop_button_!) ;

        this.updateFromItem(false) ;

        parent.appendChild(this.ctrl) ;
    }

    public createEditDialog() : EditFormControlDialog {
        return new EditTimerDialog(this) ;
    }

    public getData() : any {
        return this.time_value_ ;
    }

    public setData(data: any) : void {
        if (this.current_time_) {
            this.time_value_ = data as number ;
            this.displayTimer() ;
        }
    }  
}
    