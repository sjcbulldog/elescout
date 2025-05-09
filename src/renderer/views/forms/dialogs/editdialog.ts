
export abstract class EditDialog {
    private title_ : string ;
    private close_cb_: (changed: boolean) => void ;
    private moving_ : boolean ;
    private parent_? : HTMLElement ;
    private popup_? : HTMLDivElement ;
    private topbar_? : HTMLDivElement ;
    private client_area_? : HTMLDivElement ;
    private button_area_? : HTMLDivElement ;
    private keydownbind_? : any ;
    private startx_ : number = 0 ;
    private starty_ : number = 0 ;
    private startleft_ : number = 0 ;
    private starttop_ : number = 0 ;

    constructor(title: string, close: (changed: boolean) => void) {
        this.title_ = title ;
        this.close_cb_ = close ;
        this.moving_ = false ;
    }

    public showRelative(win: HTMLElement) {
        this.parent_ = win ;
        this.popup_ = document.createElement('div') ;
        this.popup_.className = 'xero-popup-form-edit-dialog' ;

        this.topbar_ = document.createElement('div') ;
        this.topbar_.className = 'xero-popup-form-edit-dialog-topbar' ;
        if (this.title_) {
            this.topbar_.innerHTML = this.title_ ;
        }
        this.popup_.appendChild(this.topbar_) ;

        this.client_area_ = document.createElement('div') ;
        this.client_area_.className = 'xero-popup-form-edit-dialog-client' ;
        this.popup_.appendChild(this.client_area_) ;

        this.button_area_ = document.createElement('div') ;
        this.button_area_.className = 'xero-popup-form-edit-dialog-buttons' ;
        this.popup_.appendChild(this.button_area_) ;

        this.populateDialog(this.client_area_) 
        this.populateButtons(this.button_area_) ;

        let prect = win.getBoundingClientRect() ;
        let drect = this.popup_.getBoundingClientRect() ;
        let x = (prect.width - drect.width) / 2 ;
        let y = (prect.height - drect.height) / 8 ;

        this.popup_.style.left = x + 'px' ;
        this.popup_.style.top = y + 'px' ;

        this.parent_.appendChild(this.popup_) ;
        this.onInit() ;

        this.keydownbind_ = this.keyDown.bind(this) ;
        document.addEventListener('keydown', this.keydownbind_) ;
        this.topbar_.addEventListener('mousedown', this.mouseDown.bind(this)) ;
    }

    protected abstract populateDialog(div: HTMLDivElement) : void ;

    protected onInit() : void {
        //
        // Can be used by derived classes to do any initialization
        // after the dialog is shown, like setting focus on a specific
        // control.
        //
    }

    private mouseDown(event: MouseEvent ) {
        if (event.button === 0 && this.popup_) {
            this.moving_ = true ;
            this.startx_ = event.clientX ;
            this.starty_ = event.clientY ;

            this.startleft_ = parseInt(this.popup_.style.left) ;
            this.starttop_ = parseInt(this.popup_.style.top) ;

            document.addEventListener('mousemove', this.mouseMove.bind(this)) ;
            document.addEventListener('mouseup', this.mouseUp.bind(this)) ;
        }
    }

    private mouseMove(event: MouseEvent) {
        if (this.moving_ && this.popup_ ) {
            let dx = event.clientX - this.startx_ ;
            let dy = event.clientY - this.starty_ ;
            let left = this.startleft_ + dx ;
            let top = this.starttop_ + dy ;
            this.popup_.style.left = left + 'px' ;
            this.popup_.style.top = top + 'px' ;
        }
    }

    private mouseUp(event: MouseEvent) {
        if (this.moving_) {
            this.moving_ = false ;
            document.removeEventListener('mousemove', this.mouseMove.bind(this)) ;
            document.removeEventListener('mouseup', this.mouseUp.bind(this)) ;
        }
    }

    private keyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.cancelButton(event) ;
        }
        else if (event.key === 'Enter') {
            this.okButton(event) ;
        }
    }

    public okButton(event: Event) {
        this.close(true) ;
    }

    public cancelButton(event: Event) {
        this.close(false) ;
    }

    public populateButtons(div: HTMLDivElement) {
        let okbutton = document.createElement('button') ;
        okbutton.innerText = 'OK' ;
        okbutton.className = 'xero-popup-form-edit-dialog-button' ;
        okbutton.addEventListener('click', this.okButton.bind(this)) ;
        div.appendChild(okbutton) ;

        let cancelbutton = document.createElement('button') ;
        cancelbutton.innerText = 'Cancel' ;
        cancelbutton.className = 'xero-popup-form-edit-dialog-button' ;
        cancelbutton.addEventListener('click', this.cancelButton.bind(this)) ;
        div.appendChild(cancelbutton) ;
    }

    close(changed: boolean) {
        document.removeEventListener('keydown', this.keydownbind_) ;

        if (this.popup_ && this.parent_ && this.parent_.contains(this.popup_)) {
            this.parent_.removeChild(this.popup_) ;
            this.popup_ = undefined ;
        }

        if (this.close_cb_) {
            this.close_cb_(changed) ;
        }
    }
}