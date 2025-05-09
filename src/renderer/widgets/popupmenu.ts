import { XeroPoint } from "./xerogeom";

export class PopMenuItem {
    private text_: string ;
    private callback_?: () => void ;
    private submenu_? : PopupMenu ;

    constructor(text: string, callback: (() => void) | undefined, submenu?: PopupMenu) {
        this.text_ = text ;
        this.callback_ = callback ;
        this.submenu_ = submenu ;
    }

    public get text() : string {
        return this.text_ ;
    }

    public get action() : (() => void) | undefined {
        return this.callback_ ;
    }

    public get submenu() : PopupMenu | undefined {
        return this.submenu_ ;
    }
}

export class PopupMenu {
    private parent_? : HTMLElement ;
    private items_ : PopMenuItem[] ;
    private child_menu_? : PopupMenu ;
    private item_map_ : Map<HTMLElement, PopMenuItem> = new Map() ;
    private popup_? : HTMLElement ;

    constructor(items: PopMenuItem[]) {
        this.items_ = items ;
    }

    onClick(item: PopMenuItem, event: MouseEvent) {
        if (item.action) {
            item.action() ;
        }
    }

    onSubmenuClick(item: PopMenuItem, event: MouseEvent) {
        if (item.submenu && this.parent_) {
            this.child_menu_ = item.submenu ;
            this.child_menu_.showRelative(this.parent_, new XeroPoint(event.clientX, event.clientY)) ;
        }
    }

    onGlobalClick(event: MouseEvent) {
        if (event.target && event.target && this.item_map_.has(event.target as HTMLElement)) {
            let item = this.item_map_.get(event.target as HTMLElement) ;
            if (item && !item.submenu) {
                this.closeMenu() ;
            }
        }
    }

    onGlobalKey(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.closeMenu() ;
        }
    }

    closeMenu() {
        if (this.child_menu_) {
            this.child_menu_.closeMenu() ;
            this.child_menu_ = undefined ;
        }

        if (this.popup_ && this.parent_ && this.parent_.contains(this.popup_)) {
            this.parent_.removeChild(this.popup_) ;
            this.popup_ = undefined ;
        }
        document.removeEventListener('click', this.onGlobalClick.bind(this)) ;
        document.removeEventListener('keydown', this.onGlobalKey.bind(this)) ;
    }

    showRelative(win: HTMLElement, pt: XeroPoint) {
        this.parent_ = win ;
        this.popup_ = document.createElement('div') ;
        this.popup_.className = 'xero-popup-menu' ;
        this.popup_.style.left = pt.x + 'px' ;
        this.popup_.style.top = pt.y + 'px' ;
        this.popup_.style.zIndex = '1000' ;

        for(let item of this.items_) {
            let div = document.createElement('div') ;
            div.className = 'xero-popup-menu-item' ;

            this.item_map_.set(div, item) ;
            if (item.submenu) {
                div.onclick = this.onSubmenuClick.bind(this, item) ;
                div.innerHTML += item.text + '&nbsp;&nbsp;&nbsp;&nbsp;&#x27A4;' ;
            } else {
                div.innerText = item.text ;
                div.onclick = this.onClick.bind(this, item) ;
            }
            this.popup_.appendChild(div) ;
        }

        document.addEventListener('click', this.onGlobalClick.bind(this)) ;
        document.addEventListener('keydown', this.onGlobalKey.bind(this)) ;
        this.parent_.appendChild(this.popup_) ; 
    }    
}